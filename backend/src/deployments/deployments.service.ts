import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateDeploymentDto } from './dto/create-deployment.dto';
import { DeploymentStatus } from '@prisma/client';
import { ProjectsService } from '../projects/projects.service';
import { PrismaService } from '../prisma/prisma.service';
import { GithubService } from '../github/github.service';
import { DeploymentWorkerService } from './deployment-worker.service';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import { Deployment } from '@prisma/client';

const execAsync = promisify(exec);

@Injectable()
export class DeploymentsService {
  constructor(
    private prisma: PrismaService,
    private projectsService: ProjectsService,
    private githubService: GithubService,
    private deploymentWorkerService: DeploymentWorkerService,
  ) {}

  async create(createDeploymentDto: CreateDeploymentDto): Promise<Deployment> {
    // Verify project exists
    await this.projectsService.findOne(createDeploymentDto.projectId);
    
    const deployment = await this.prisma.deployment.create({
      data: {
        projectId: createDeploymentDto.projectId,
        commitHash: createDeploymentDto.commitHash || '',
        commitMessage: createDeploymentDto.commitMessage,
        status: DeploymentStatus.pending,
      },
      include: { project: true },
    });

    // Start the deployment process asynchronously in a separate process
    this.deploymentWorkerService.startDeployment(deployment);
    
    return deployment;
  }

  async findAll(): Promise<Deployment[]> {
    return await this.prisma.deployment.findMany({
      include: { project: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number): Promise<Deployment> {
    const deployment = await this.prisma.deployment.findUnique({
      where: { id },
      include: { project: true },
    });
    
    if (!deployment) {
      throw new NotFoundException(`Deployment with ID ${id} not found`);
    }
    
    return deployment;
  }

  async findByProject(projectId: number): Promise<Deployment[]> {
    return await this.prisma.deployment.findMany({
      where: { projectId },
      include: { project: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  private async startDeployment(deployment: Deployment): Promise<void> {
    try {
      // Update status to in progress
      await this.prisma.deployment.update({
        where: { id: deployment.id },
        data: { status: DeploymentStatus.in_progress }
      });

      const project = await this.projectsService.findOne(deployment.projectId);
      const repoDir = path.join(process.cwd(), process.env.DEPLOYED_APPS_DIR, `project-${project.id}`);
      
      // Create repo directory if it doesn't exist
      if (!fs.existsSync(repoDir)) {
        fs.mkdirSync(repoDir, { recursive: true });
        
        // Clone the repository with authentication
        let repoUrl = project.repositoryUrl;
        
        // If it's a GitHub repository, use GitHub App authentication
        if (repoUrl.includes('github.com')) {
          const { owner, repo } = this.githubService.extractOwnerAndRepo(repoUrl);
          const token = await this.githubService.getInstallationToken(owner, repo);
          if (repoUrl.startsWith('https://')) {
            repoUrl = repoUrl.replace('https://', `https://x-access-token:${token}@`);
          }
        }
        
        const cloneCommand = `git clone ${repoUrl} ${repoDir}`;
        let logs = `Cloning repository: ${project.repositoryUrl}\n`;
        await this.prisma.deployment.update({
          where: { id: deployment.id },
          data: { logs }
        });
        
        const { stdout, stderr } = await execAsync(cloneCommand);
        logs += stdout + stderr;
        await this.prisma.deployment.update({
          where: { id: deployment.id },
          data: { logs }
        });
      } else {
        // Pull latest changes
        let logs = `Pulling latest changes from ${project.repositoryUrl}\n`;
        await this.prisma.deployment.update({
          where: { id: deployment.id },
          data: { logs }
        });
        
        let pullCommand = `cd ${repoDir} && git pull`;
        
        // If it's a GitHub repository, use GitHub App authentication
        if (project.repositoryUrl.includes('github.com')) {
          const { owner, repo } = this.githubService.extractOwnerAndRepo(project.repositoryUrl);
          const token = await this.githubService.getInstallationToken(owner, repo);
          // Set Git credentials for this operation only
          pullCommand = `cd ${repoDir} && git config --local credential.helper '!f() { echo "password=${token}"; echo "username=x-access-token"; }; f' && git pull`;
        }
        const { stdout, stderr } = await execAsync(pullCommand);
        logs += stdout + stderr;
        await this.prisma.deployment.update({
          where: { id: deployment.id },
          data: { logs }
        });
      }

      // Checkout specific branch if specified
      if (project.branch) {
        const currentDeployment = await this.prisma.deployment.findUnique({ where: { id: deployment.id } });
        let logs = currentDeployment?.logs || '';
        logs += `\nChecking out branch: ${project.branch}\n`;
        await this.prisma.deployment.update({
          where: { id: deployment.id },
          data: { logs }
        });
        
        const checkoutCommand = `cd ${repoDir} && git checkout ${project.branch}`;
        const { stdout, stderr } = await execAsync(checkoutCommand);
        logs += stdout + stderr;
        await this.prisma.deployment.update({
          where: { id: deployment.id },
          data: { logs }
        });
      }

      // Get commit information
      const { stdout: commitInfo } = await execAsync(`cd ${repoDir} && git log -1 --pretty=format:"%H %s"`);
      const [commitHash, commitMessage] = commitInfo.split(' ', 2);
      await this.prisma.deployment.update({
        where: { id: deployment.id },
        data: { 
          commitHash,
          commitMessage
        }
      });

      // Deploy using Docker Compose
      if (project.dockerComposeFile) {
        const composeFile = project.dockerComposeFile || 'docker-compose.yml';
        const serviceName = project.dockerServiceName || '';
        
        const currentDeployment = await this.prisma.deployment.findUnique({ where: { id: deployment.id } });
        let logs = currentDeployment?.logs || '';
        logs += `\nDeploying with Docker Compose: ${composeFile}\n`;
        await this.prisma.deployment.update({
          where: { id: deployment.id },
          data: { logs }
        });
        
        const deployCommand = `cd ${repoDir} && docker-compose -f ${composeFile} up -d ${serviceName}`;
        const { stdout, stderr } = await execAsync(deployCommand);
        logs += stdout + stderr;
        await this.prisma.deployment.update({
          where: { id: deployment.id },
          data: { logs }
        });
      }

      // Update status to completed
      await this.prisma.deployment.update({
        where: { id: deployment.id },
        data: {
          status: DeploymentStatus.completed,
          completedAt: new Date()
        }
      });
    } catch (error) {
      // Update status to failed
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
}