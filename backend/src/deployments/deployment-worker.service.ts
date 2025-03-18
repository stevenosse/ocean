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
  ) { }

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
      logs += '\nNo Dockerfile found, checking project type\n';
      await this.updateDeploymentLogs(deploymentId, logs);

      // Check if this is a Node.js project by looking for package.json
      const rootFolder = project.rootFolder || '';
      const repoDir = path.join(process.cwd(), '../repos', `project-${project.id}`);

      // Check if package.json exists in the specified root folder
      let packageJsonPath = path.join(repoDir, rootFolder, 'package.json');

      if (fs.existsSync(packageJsonPath)) {
        logs += `\nFound package.json in specified root folder: ${rootFolder}\n`;
        await this.updateDeploymentLogs(deploymentId, logs);
      } else {
        logs += `\nNo package.json found in specified root folder: ${rootFolder}\n`;
        logs += 'Please make sure your root folder is set correctly in the project settings.\n';
        logs += 'The root folder should point to the directory containing package.json.\n';
        await this.updateDeploymentLogs(deploymentId, logs);

        // If the root folder is not specified or is the default, try to find package.json
        if (!rootFolder || rootFolder === '/') {
          logs += '\nAttempting to find package.json in the repository...\n';
          await this.updateDeploymentLogs(deploymentId, logs);

          // Find all package.json files in the repository
          const { stdout } = await execAsync(`find ${repoDir} -name "package.json" -type f`);
          const packageJsonFiles = stdout.trim().split('\n').filter(Boolean);

          if (packageJsonFiles.length > 0) {
            // Use the first package.json found
            packageJsonPath = packageJsonFiles[0];
            // Extract the relative directory from the repo root
            const packageJsonDir = path.dirname(packageJsonPath).replace(repoDir, '').replace(/^\//, '');

            logs += `\nFound package.json in subdirectory: ${packageJsonDir}\n`;
            await this.updateDeploymentLogs(deploymentId, logs);

            // Update the project's root folder
            project.rootFolder = '/' + packageJsonDir;
            logs += `\nUpdating project root folder to: ${project.rootFolder}\n`;
            await this.updateDeploymentLogs(deploymentId, logs);

            // Save the updated root folder to the database
            await this.prisma.project.update({
              where: { id: project.id },
              data: { rootFolder: project.rootFolder }
            });
          } else {
            logs += '\nNo package.json found in the repository.\n';
            await this.updateDeploymentLogs(deploymentId, logs);
          }
        }
      }

      if (fs.existsSync(packageJsonPath)) {
        logs += '\nFound package.json, creating Dockerfile for Node.js project\n';
        await this.updateDeploymentLogs(deploymentId, logs);

        // Create a basic Dockerfile for Node.js projects
        const dockerfile = this.generateNodejsDockerfile(project);
        fs.writeFileSync(dockerfilePath, dockerfile);

        logs += `Created Dockerfile for Node.js project\n`;
        await this.updateDeploymentLogs(deploymentId, logs);
      } else {
        logs += '\nNo package.json found. Cannot automatically create Dockerfile.\n';
        logs += 'Please add a Dockerfile to your repository.\n';
        await this.updateDeploymentLogs(deploymentId, logs);
        throw new Error('No package.json found and no Dockerfile provided. Cannot deploy this project.');
      }
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
      // Always build from the working directory which already includes the root folder
      const buildCommand = `cd ${workingDir} && docker build -t ${imageName} .`;

      logs += `\nBuilding Docker image from directory: ${workingDir}\n`;
      await this.updateDeploymentLogs(deploymentId, logs);

      logs += `\nRunning build command: ${buildCommand}\n`;
      await this.updateDeploymentLogs(deploymentId, logs);

      const { stdout: buildStdout, stderr: buildStderr } = await execAsync(buildCommand);

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

      // Run the container with resource limits and restart policy for isolation and recovery
      const { stdout: runStdout, stderr: runStderr } = await execAsync(
        `docker run -d --name ${containerName} \
        --restart unless-stopped \
        --memory=512m \
        --memory-swap=1g \
        --cpus=0.5 \
        --pids-limit=100 \
        --security-opt=no-new-privileges \
        --cap-drop=ALL \
        --network=bridge \
        --health-cmd="wget --no-verbose --tries=1 --spider http://localhost:${port} || exit 1" \
        --health-interval=30s \
        --health-timeout=10s \
        --health-retries=3 \
        -p ${port}:${port} ${envArgs} ${imageName}`
      );

      logs += runStdout + runStderr;
      logs += `\nContainer ${containerName} is now running on port ${port} with resource limits and health monitoring\n`;

      // Set up container monitoring
      logs += `\nSetting up container monitoring...\n`;
      await this.updateDeploymentLogs(deploymentId, logs);

      // Register container for monitoring
      await this.prisma.deployment.update({
        where: { id: deploymentId },
        data: {
          containerName: containerName,
          containerPort: port,
          monitoringEnabled: true,
          lastHealthCheck: new Date()
        }
      });

      logs += `\nContainer monitoring enabled. Ocean will automatically detect and handle container failures.\n`;
      await this.updateDeploymentLogs(deploymentId, logs);

    } catch (error) {
      logs += `\nError deploying Docker container: ${error.message}\n`;
      logs += `\nOcean has isolated this error and will continue running normally.\n`;
      logs += `\nTroubleshooting tips:\n`;
      logs += `1. Check your application code for errors\n`;
      logs += `2. Verify that your application listens on the correct port (default: 3000)\n`;
      logs += `3. Make sure your Dockerfile is correctly configured\n`;
      logs += `4. Check that your start command is correct\n`;

      await this.updateDeploymentLogs(deploymentId, logs);

      // Update deployment status to failed but don't throw the error
      // This prevents Ocean from crashing when a deployment fails
      await this.prisma.deployment.update({
        where: { id: deploymentId },
        data: {
          status: 'failed',
          errorMessage: error.message
        }
      });

      // Don't throw the error - this prevents Ocean from crashing
      // Instead, log it and continue
      console.error(`Deployment ${deploymentId} failed but Ocean continues running:`, error);
    }
  }

  private generateNodejsDockerfile(project: any): string {
    // Default Node.js version
    const nodeVersion = '18';

    // Default commands if not specified
    const installCommand = project.installCommand || 'npm install';
    const buildCommand = project.buildCommand || '';
    const startCommand = project.startCommand || 'npm start';

    // Get the root folder to determine if we need to use a subdirectory
    const rootFolder = project.rootFolder || '/';
    const isSubDir = rootFolder && rootFolder !== '/';

    // Extract the subdirectory path without leading slash
    const subDirPath = isSubDir ? rootFolder.replace(/^\//, '') : '';

    // Generate a simple Dockerfile
    let dockerfile = `FROM node:${nodeVersion}-alpine

WORKDIR /app

`;

    // Copy package files first (for better layer caching)
    if (isSubDir) {
      dockerfile += `# Copy package.json and package-lock.json from the correct subdirectory
COPY ${subDirPath}/package*.json ./

`;
    } else {
      dockerfile += `# Copy package.json and package-lock.json
COPY package*.json ./

`;
    }

    // Install dependencies
    dockerfile += `# Install dependencies
RUN ${installCommand}

`;

    // Copy the rest of the application
    if (isSubDir) {
      dockerfile += `# Copy the rest of the application from the correct subdirectory
COPY ${subDirPath}/. .

`;
    } else {
      dockerfile += `# Copy the rest of the application
COPY . .

`;
    }

    // Add build command if specified
    if (buildCommand) {
      dockerfile += `# Build the application
RUN ${buildCommand}

`;
    }

    // Expose port 3000 by default for Node.js applications
    dockerfile += `# Expose the port the app runs on
EXPOSE 3000

`;

    // Add environment variable
    dockerfile += `# Set environment to production
ENV NODE_ENV=production

`;

    // Add start command
    dockerfile += `# Start the application
CMD ${startCommand.startsWith('[') ? startCommand : `["sh", "-c", "${startCommand}"]`}
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
