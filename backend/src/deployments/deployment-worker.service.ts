import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { DeploymentLogsService } from './deployment-logs.service';
import { PrismaService } from '../prisma/prisma.service';
import { GithubService } from '../github/github.service';
import { EnvironmentsService } from '../environments/environments.service';
import { DockerService } from './docker.service';
import { ContainerMonitorService } from './container-monitor.service';
import { DeploymentStatus, Deployment } from '@prisma/client';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

@Injectable()
export class DeploymentWorkerService {
  constructor(
    private prisma: PrismaService,
    private githubService: GithubService,
    @Inject(forwardRef(() => EnvironmentsService))
    private environmentsService: EnvironmentsService,
    private logsService: DeploymentLogsService,
    private dockerService: DockerService,
  ) { }

  async startDeployment(deployment: Deployment): Promise<void> {
    try {
      await this.prisma.$transaction([
        this.prisma.deployment.updateMany({
          where: {
            projectId: deployment.projectId,
            id: { not: deployment.id },
            monitoringEnabled: true
          },
          data: { monitoringEnabled: false }
        }),
        this.prisma.deployment.update({
          where: { id: deployment.id },
          data: { status: DeploymentStatus.in_progress }
        })
      ]);

      const project = await this.prisma.project.findUnique({
        where: { id: deployment.projectId },
        select: {
          id: true,
          name: true,
          repositoryUrl: true,
          branch: true,
          rootFolder: true,
          buildCommand: true,
          startCommand: true,
          installCommand: true,
          outputDirectory: true,
          active: true,
          dockerComposeFile: true,
          dockerServiceName: true
        }
      });

      this.logsService.debug(`Project details: ${JSON.stringify(project, null, 2)}`, 'Deployment');
      this.logsService.debug(`Build commands - Install: ${project.installCommand}, Build: ${project.buildCommand}, Start: ${project.startCommand}`, 'Deployment');

      if (!project) {
        throw new Error(`Project with ID ${deployment.projectId} not found`);
      }

      const repoDir = path.join(process.cwd(), process.env.DEPLOYED_APPS_DIR, `project-${project.id}`);
      let logs = '';

      if (fs.existsSync(repoDir)) {
        logs = `Deleting existing repository for clean deployment...\n`;
        await this.updateDeploymentLogs(deployment.id, logs);

        try {
          fs.rmSync(repoDir, { recursive: true, force: true });
          logs += `Successfully deleted existing repository.\n`;
        } catch (error) {
          logs += `Warning: Failed to delete repository: ${error.message}\n`;
        }
        await this.updateDeploymentLogs(deployment.id, logs);
      }

      if (!fs.existsSync(repoDir)) {
        fs.mkdirSync(repoDir, { recursive: true });
        let repoUrl = project.repositoryUrl;

        if (repoUrl.includes('github.com')) {
          const { owner, repo } = this.githubService.extractOwnerAndRepo(repoUrl);
          const token = await this.githubService.getInstallationToken(owner, repo);
          if (repoUrl.startsWith('https://')) {
            repoUrl = repoUrl.replace('https://', `https://x-access-token:${token}@`);
          }
        }

        const cloneCommand = `git clone ${repoUrl} ${repoDir}`;
        logs += `Cloning repository: ${project.repositoryUrl}\n`;
        await this.updateDeploymentLogs(deployment.id, logs);

        const { stdout, stderr } = await execAsync(cloneCommand);
        logs += stdout + stderr;
        await this.updateDeploymentLogs(deployment.id, logs);
      } else {
        logs += `Pulling latest changes from ${project.repositoryUrl}\n`;
        await this.updateDeploymentLogs(deployment.id, logs);

        let pullCommand = `cd ${repoDir} && git pull`;

        if (project.repositoryUrl.includes('github.com')) {
          const { owner, repo } = this.githubService.extractOwnerAndRepo(project.repositoryUrl);
          const token = await this.githubService.getInstallationToken(owner, repo);
          pullCommand = `cd ${repoDir} && git config --local credential.helper '!f() { echo "password=${token}"; echo "username=x-access-token"; }; f' && git pull`;
        }
        const { stdout, stderr } = await execAsync(pullCommand);
        logs += stdout + stderr;
        await this.updateDeploymentLogs(deployment.id, logs);
      }

      if (project.branch) {
        const currentDeployment = await this.prisma.deployment.findUnique({ where: { id: deployment.id } });
        let logs = currentDeployment?.logs || '';
        logs += `\nChecking out branch: ${project.branch}\n`;
        await this.updateDeploymentLogs(deployment.id, logs);

        const checkoutCommand = `cd ${repoDir} && git checkout ${project.branch}`;
        const { stdout, stderr } = await execAsync(checkoutCommand);
        logs += stdout + stderr;
        await this.updateDeploymentLogs(deployment.id, logs);
      }

      const { stdout: commitInfo } = await execAsync(`cd ${repoDir} && git log -1 --pretty=format:"%H %s"`);
      const [commitHash, commitMessage] = commitInfo.split(' ', 2);
      await this.prisma.deployment.update({
        where: { id: deployment.id },
        data: {
          commitHash,
          commitMessage
        }
      });

      const envVars = await this.environmentsService.getEnvironmentVariablesForDeployment(project.id);
      const workingDir = path.join(repoDir, project.rootFolder || '');
      await this.runCustomDeploymentSteps(deployment.id, project, workingDir, envVars);

      const completedDeployment = await this.prisma.deployment.findUnique({
        where: { id: deployment.id },
        select: { containerPort: true }
      });

      const successMessage = completedDeployment?.containerPort
        ? `Deployment completed successfully. Application is running on port ${completedDeployment.containerPort}.`
        : 'Deployment completed successfully.';


      const currentDeployment = await this.prisma.deployment.findUnique({
        where: { id: deployment.id },
        select: { logs: true }
      });

      const updatedLogs = `${currentDeployment?.logs || ''}\n${successMessage}`;

      await this.prisma.deployment.update({
        where: { id: deployment.id },
        data: {
          status: DeploymentStatus.completed,
          completedAt: new Date(),
          logs: updatedLogs,
          monitoringEnabled: true
        }
      });

      this.logsService.logDeployment(`Deployment ${deployment.id} completed successfully. Port: ${completedDeployment?.containerPort || 'unknown'}`);
    } catch (error) {
      this.logsService.error(`Deployment failed: ${error.message}`, error, 'Deployment');

      const currentDeployment = await this.prisma.deployment.findUnique({ where: { id: deployment.id } });
      let logs = currentDeployment?.logs || '';
      logs += `\nError: ${error.message}`;

      await this.prisma.deployment.update({
        where: { id: deployment.id },
        data: {
          status: DeploymentStatus.failed,
          logs,
          completedAt: new Date()
        }
      });
    }
  }

  private async updateDeploymentLogs(deploymentId: number, logs: string): Promise<void> {
    await this.logsService.updateDeploymentLogs(deploymentId, logs);
  }

  private async runCustomDeploymentSteps(
    deploymentId: number,
    project: any,
    workingDir: string,
    envVars: Record<string, string>
  ): Promise<void> {
    await this.dockerService.runDockerContainerDeployment(
      deploymentId,
      project,
      workingDir,
      envVars,
      (logs: string) => this.updateDeploymentLogs(deploymentId, logs),
      (data: any) => this.prisma.deployment.update({
        where: { id: deploymentId },
        data
      })
    );
  }
}
