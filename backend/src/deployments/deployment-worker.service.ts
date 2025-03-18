import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GithubService } from '../github/github.service';
import { EnvironmentsService } from '../environments/environments.service';
import { DeploymentStatus, Deployment } from '@prisma/client';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const execAsync = promisify(exec);

@Injectable()
export class DeploymentWorkerService {
  private readonly logger = new Logger(DeploymentWorkerService.name);

  constructor(
    private prisma: PrismaService,
    private githubService: GithubService,
    @Inject(forwardRef(() => EnvironmentsService))
    private environmentsService: EnvironmentsService,
  ) {}

  async startDeployment(deployment: Deployment): Promise<void> {
    try {
      // Update status to in progress
      await this.prisma.deployment.update({
        where: { id: deployment.id },
        data: { status: DeploymentStatus.in_progress }
      });

      const project = await this.prisma.project.findUnique({
        where: { id: deployment.projectId },
      });

      if (!project) {
        throw new Error(`Project with ID ${deployment.projectId} not found`);
      }

      const repoDir = path.join(process.cwd(), '../repos', `project-${project.id}`);
      
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
        await this.updateDeploymentLogs(deployment.id, logs);
        
        const { stdout, stderr } = await execAsync(cloneCommand);
        logs += stdout + stderr;
        await this.updateDeploymentLogs(deployment.id, logs);
      } else {
        // Pull latest changes
        let logs = `Pulling latest changes from ${project.repositoryUrl}\n`;
        await this.updateDeploymentLogs(deployment.id, logs);
        
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
        await this.updateDeploymentLogs(deployment.id, logs);
      }

      // Checkout specific branch if specified
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

      // Get environment variables for the project
      const envVars = await this.environmentsService.getEnvironmentVariablesForDeployment(project.id);
      
      // Create a working directory for the project (if using root folder)
      const workingDir = path.join(repoDir, project.rootFolder || '');
      
      // Run custom deployment steps based on project configuration
      await this.runCustomDeploymentSteps(deployment.id, project, workingDir, envVars);

      // Update status to completed
      await this.prisma.deployment.update({
        where: { id: deployment.id },
        data: {
          status: DeploymentStatus.completed,
          completedAt: new Date()
        }
      });
    } catch (error) {
      this.logger.error(`Deployment failed: ${error.message}`, error.stack);
      
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

  private async updateDeploymentLogs(deploymentId: number, logs: string): Promise<void> {
    await this.prisma.deployment.update({
      where: { id: deploymentId },
      data: { logs }
    });
  }

  private async runCustomDeploymentSteps(
    deploymentId: number, 
    project: any, 
    workingDir: string, 
    envVars: Record<string, string>
  ): Promise<void> {
    // If Docker Compose is specified, use that
    if (project.dockerComposeFile) {
      await this.runDockerComposeDeployment(deploymentId, project, workingDir);
      return;
    }

    // Otherwise, deploy as a Docker container
    await this.runDockerContainerDeployment(deploymentId, project, workingDir, envVars);
  }

  private async runDockerComposeDeployment(
    deploymentId: number, 
    project: any, 
    workingDir: string
  ): Promise<void> {
    const composeFile = project.dockerComposeFile || 'docker-compose.yml';
    const serviceName = project.dockerServiceName || '';
    
    const currentDeployment = await this.prisma.deployment.findUnique({ where: { id: deploymentId } });
    let logs = currentDeployment?.logs || '';
    logs += `\nDeploying with Docker Compose: ${composeFile}\n`;
    await this.updateDeploymentLogs(deploymentId, logs);
    
    const deployCommand = `cd ${workingDir} && docker-compose -f ${composeFile} up -d ${serviceName}`;
    const { stdout, stderr } = await execAsync(deployCommand);
    logs += stdout + stderr;
    await this.updateDeploymentLogs(deploymentId, logs);
  }

  private async runDockerContainerDeployment(
    deploymentId: number, 
    project: any, 
    workingDir: string, 
    envVars: Record<string, string>
  ): Promise<void> {
    const currentDeployment = await this.prisma.deployment.findUnique({ where: { id: deploymentId } });
    let logs = currentDeployment?.logs || '';
    
    // Create a Dockerfile if it doesn't exist
    const dockerfilePath = path.join(workingDir, 'Dockerfile');
    if (!fs.existsSync(dockerfilePath)) {
      logs += '\nNo Dockerfile found, creating one for Node.js project\n';
      await this.updateDeploymentLogs(deploymentId, logs);
      
      // Create a basic Dockerfile for Node.js projects
      const dockerfile = this.generateNodejsDockerfile(project);
      fs.writeFileSync(dockerfilePath, dockerfile);
      
      logs += `Created Dockerfile for Node.js project\n`;
      await this.updateDeploymentLogs(deploymentId, logs);
    } else {
      logs += '\nUsing existing Dockerfile\n';
      await this.updateDeploymentLogs(deploymentId, logs);
    }
    
    // Create .env file with project environment variables
    const envFilePath = path.join(workingDir, '.env');
    const envFileContent = Object.entries(envVars)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');
    
    fs.writeFileSync(envFilePath, envFileContent);
    logs += `\nCreated .env file with ${Object.keys(envVars).length} environment variables\n`;
    await this.updateDeploymentLogs(deploymentId, logs);
    
    // Build the Docker image
    const containerName = `ocean-project-${project.id}`;
    const imageName = `ocean-project-${project.id}:latest`;
    
    logs += `\nBuilding Docker image: ${imageName}\n`;
    await this.updateDeploymentLogs(deploymentId, logs);
    
    try {
      // Build the Docker image
      const { stdout: buildStdout, stderr: buildStderr } = await execAsync(
        `cd ${workingDir} && docker build -t ${imageName} .`
      );
      
      logs += buildStdout + buildStderr;
      await this.updateDeploymentLogs(deploymentId, logs);
      
      // Stop and remove any existing container
      logs += '\nStopping and removing any existing container\n';
      await this.updateDeploymentLogs(deploymentId, logs);
      
      try {
        await execAsync(`docker stop ${containerName} && docker rm ${containerName}`);
      } catch (error) {
        // Ignore errors if container doesn't exist
        logs += 'No existing container found or could not be removed\n';
        await this.updateDeploymentLogs(deploymentId, logs);
      }
      
      // Run the Docker container
      logs += `\nStarting Docker container: ${containerName}\n`;
      await this.updateDeploymentLogs(deploymentId, logs);
      
      // Create environment variables arguments for docker run
      const envArgs = Object.entries(envVars)
        .map(([key, value]) => `-e ${key}=${value}`)
        .join(' ');
      
      // Determine the port to expose (default to 3000 for Node.js)
      const port = 3000;
      
      // Run the container
      const { stdout: runStdout, stderr: runStderr } = await execAsync(
        `docker run -d --name ${containerName} -p ${port}:${port} ${envArgs} ${imageName}`
      );
      
      logs += runStdout + runStderr;
      logs += `\nContainer ${containerName} is now running on port ${port}\n`;
      await this.updateDeploymentLogs(deploymentId, logs);
      
    } catch (error) {
      logs += `\nError deploying Docker container: ${error.message}\n`;
      await this.updateDeploymentLogs(deploymentId, logs);
      throw error;
    }
  }
  
  private generateNodejsDockerfile(project: any): string {
    // Default Node.js version
    const nodeVersion = '18';
    
    // Default commands if not specified
    const installCommand = project.installCommand || 'npm install';
    const buildCommand = project.buildCommand || '';
    const startCommand = project.startCommand || 'npm start';
    const outputDirectory = project.outputDirectory || '';
    
    // Generate the Dockerfile content
    let dockerfile = `FROM node:${nodeVersion}-alpine

`;
    dockerfile += `WORKDIR /app

`;
    dockerfile += `# Copy package.json and package-lock.json
`;
    dockerfile += `COPY package*.json ./

`;
    dockerfile += `# Install dependencies
`;
    dockerfile += `RUN ${installCommand}

`;
    dockerfile += `# Copy the rest of the application
`;
    dockerfile += `COPY . .

`;
    
    // Add build command if specified
    if (buildCommand) {
      dockerfile += `# Build the application
`;
      dockerfile += `RUN ${buildCommand}

`;
    }
    
    // Expose port 3000 by default for Node.js applications
    dockerfile += `# Expose the port the app runs on
`;
    dockerfile += `EXPOSE 3000

`;
    
    // Add start command
    dockerfile += `# Start the application
`;
    dockerfile += `CMD ${startCommand.startsWith('[') ? startCommand : `["sh", "-c", "${startCommand}"]`}
`;
    
    return dockerfile;
  }
  
  private async runCustomBuildSteps(
    deploymentId: number, 
    project: any, 
    workingDir: string, 
    envVars: Record<string, string>
  ): Promise<void> {
    const currentDeployment = await this.prisma.deployment.findUnique({ where: { id: deploymentId } });
    let logs = currentDeployment?.logs || '';
    
    // Create .env file with project environment variables
    const envFilePath = path.join(workingDir, '.env');
    const envFileContent = Object.entries(envVars)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');
    
    fs.writeFileSync(envFilePath, envFileContent);
    logs += `\nCreated .env file with ${Object.keys(envVars).length} environment variables\n`;
    await this.updateDeploymentLogs(deploymentId, logs);

    // Run install command if specified
    if (project.installCommand) {
      logs += `\nRunning install command: ${project.installCommand}\n`;
      await this.updateDeploymentLogs(deploymentId, logs);
      
      const { stdout: installStdout, stderr: installStderr } = await this.runCommandWithEnv(
        project.installCommand, 
        workingDir, 
        envVars
      );
      
      logs += installStdout + installStderr;
      await this.updateDeploymentLogs(deploymentId, logs);
    }

    // Run build command if specified
    if (project.buildCommand) {
      logs += `\nRunning build command: ${project.buildCommand}\n`;
      await this.updateDeploymentLogs(deploymentId, logs);
      
      const { stdout: buildStdout, stderr: buildStderr } = await this.runCommandWithEnv(
        project.buildCommand, 
        workingDir, 
        envVars
      );
      
      logs += buildStdout + buildStderr;
      await this.updateDeploymentLogs(deploymentId, logs);
    }

    // Run start command if specified
    if (project.startCommand) {
      logs += `\nRunning start command: ${project.startCommand}\n`;
      await this.updateDeploymentLogs(deploymentId, logs);
      
      // For start commands, we run them in the background as a detached process
      this.runDetachedCommand(project.startCommand, workingDir, envVars, deploymentId);
      
      logs += `Start command is running in the background\n`;
      await this.updateDeploymentLogs(deploymentId, logs);
    }
  }

  private async runCommandWithEnv(
    command: string, 
    cwd: string, 
    env: Record<string, string>
  ): Promise<{ stdout: string; stderr: string }> {
    return new Promise((resolve, reject) => {
      exec(command, {
        cwd,
        env: { ...process.env, ...env },
      }, (error, stdout, stderr) => {
        if (error) {
          reject(error);
          return;
        }
        resolve({ stdout, stderr });
      });
    });
  }

  private runDetachedCommand(
    command: string, 
    cwd: string, 
    env: Record<string, string>,
    deploymentId: number
  ): void {
    // Create a log file for the detached process
    const logDir = path.join(process.cwd(), '../logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    const logFile = path.join(logDir, `deployment-${deploymentId}.log`);
    const logStream = fs.createWriteStream(logFile, { flags: 'a' });
    
    // Split the command into parts
    const [cmd, ...args] = command.split(' ');
    
    // Spawn the process detached from the parent
    const childProcess = spawn(cmd, args, {
      cwd,
      env: { ...process.env, ...env },
      detached: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    
    // Pipe stdout and stderr to the log file
    childProcess.stdout.pipe(logStream);
    childProcess.stderr.pipe(logStream);
    
    // Unref the child process so it can run independently
    childProcess.unref();
    
    this.logger.log(`Started detached process for deployment ${deploymentId}, logs at: ${logFile}`);
  }
}
