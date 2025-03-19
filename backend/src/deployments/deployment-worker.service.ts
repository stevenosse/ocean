import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { DeploymentLogsService } from './deployment-logs.service';
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
  // Using the dedicated logging service instead of local logger

  constructor(
    private prisma: PrismaService,
    private githubService: GithubService,
    @Inject(forwardRef(() => EnvironmentsService))
    private environmentsService: EnvironmentsService,
    private logsService: DeploymentLogsService,
  ) { }

  async startDeployment(deployment: Deployment): Promise<void> {
    try {
      // Update status to in progress
      await this.prisma.deployment.update({
        where: { id: deployment.id },
        data: { status: DeploymentStatus.in_progress }
      });

      // Retrieve the project with all fields, especially build commands
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

      // Log the project details for debugging
      this.logsService.debug(`Project details: ${JSON.stringify(project, null, 2)}`, 'Deployment');
      this.logsService.debug(`Build commands - Install: ${project.installCommand}, Build: ${project.buildCommand}, Start: ${project.startCommand}`, 'Deployment');

      if (!project) {
        throw new Error(`Project with ID ${deployment.projectId} not found`);
      }

      const repoDir = path.join(process.cwd(), '../repos', `project-${project.id}`);
      let logs = '';

      // For all deployments, delete the existing repository first to ensure a clean state
      if (fs.existsSync(repoDir)) {
        logs = `Deleting existing repository for clean deployment...\n`;
        await this.updateDeploymentLogs(deployment.id, logs);
        
        try {
          // Use rimraf-like approach with fs.rmSync for recursive directory removal
          fs.rmSync(repoDir, { recursive: true, force: true });
          logs += `Successfully deleted existing repository.\n`;
        } catch (error) {
          logs += `Warning: Failed to delete repository: ${error.message}\n`;
          // Continue with deployment even if deletion fails
        }
        await this.updateDeploymentLogs(deployment.id, logs);
      }

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
        logs += `Cloning repository: ${project.repositoryUrl}\n`;
        await this.updateDeploymentLogs(deployment.id, logs);

        const { stdout, stderr } = await execAsync(cloneCommand);
        logs += stdout + stderr;
        await this.updateDeploymentLogs(deployment.id, logs);
      } else {
        // Pull latest changes
        logs += `Pulling latest changes from ${project.repositoryUrl}\n`;
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

      // Get the deployment details to include in the completion status
      const completedDeployment = await this.prisma.deployment.findUnique({
        where: { id: deployment.id },
        select: { containerPort: true }
      });
      
      // Update status to completed with port information in the logs
      const successMessage = completedDeployment?.containerPort
        ? `Deployment completed successfully. Application is running on port ${completedDeployment.containerPort}.`
        : 'Deployment completed successfully.';
        
      // Get current logs
      const currentDeployment = await this.prisma.deployment.findUnique({
        where: { id: deployment.id },
        select: { logs: true }
      });
      
      const updatedLogs = `${currentDeployment?.logs || ''}\n\n${successMessage}`;
      
      // Update the deployment
      await this.prisma.deployment.update({
        where: { id: deployment.id },
        data: {
          status: DeploymentStatus.completed,
          completedAt: new Date(),
          logs: updatedLogs
        }
      });
      
      this.logsService.logDeployment(`Deployment ${deployment.id} completed successfully. Port: ${completedDeployment?.containerPort || 'unknown'}`);
    } catch (error) {
      this.logsService.error(`Deployment failed: ${error.message}`, error, 'Deployment');

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
    // Use the dedicated logs service to update deployment logs
    await this.logsService.updateDeploymentLogs(deploymentId, logs);
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

    // Always create a new Dockerfile for each deployment to ensure it reflects current configuration
    const dockerfilePath = path.join(workingDir, 'Dockerfile');

    // Remove existing Dockerfile if it exists
    if (fs.existsSync(dockerfilePath)) {
      logs += '\nRemoving existing Dockerfile to create a fresh one with current configuration\n';
      fs.unlinkSync(dockerfilePath);
      await this.updateDeploymentLogs(deploymentId, logs);
    }

    logs += '\nChecking project type to generate appropriate Dockerfile\n';
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

      // Log the project commands that will be used in the Dockerfile
      logs += `\nProject configuration:\n`;
      logs += `- Install command: ${project.installCommand || 'npm install (default)'}\n`;
      logs += `- Build command: ${project.buildCommand || 'None (default)'}\n`;
      logs += `- Start command: ${project.startCommand || 'npm start (default)'}\n`;
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


    // Create .env file with project environment variables
    const envFilePath = path.join(workingDir, '.env');
    
    // Process environment variables to replace localhost with host.docker.internal in database connection strings
    let dbConnectionsUpdated = false;
    
    Object.keys(envVars).forEach(key => {
      const value = envVars[key];
      
      // Check if this is a database connection string (common patterns)
      if (
        (key === 'DATABASE_URL' || key.includes('DB_') || key.includes('DATABASE')) &&
        typeof value === 'string' && 
        (value.includes('localhost') || value.includes('127.0.0.1'))
      ) {
        const originalValue = value;
        // Replace both localhost and 127.0.0.1 with host.docker.internal
        const updatedValue = value
          .replace(/localhost/g, 'host.docker.internal')
          .replace(/127\.0\.0\.1/g, 'host.docker.internal');
        
        envVars[key] = updatedValue;
        
        logs += `\nDetected database connection in ${key}. Modified to use host.docker.internal.\n`;
        logs += `Original: ${originalValue}\n`;
        logs += `Modified: ${updatedValue}\n`;
        
        dbConnectionsUpdated = true;
      }
    });
    
    // Create the .env file content with the updated variables
    const envFileContent = Object.entries(envVars)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    fs.writeFileSync(envFilePath, envFileContent);
    
    if (dbConnectionsUpdated) {
      logs += `\nCreated .env file with ${Object.keys(envVars).length} environment variables (database connections updated to use host.docker.internal)\n`;
    } else {
      logs += `\nCreated .env file with ${Object.keys(envVars).length} environment variables\n`;
    }
    
    await this.updateDeploymentLogs(deploymentId, logs);

    // Build the Docker image
    const containerName = `ocean-project-${project.id}`;
    const imageName = `ocean-project-${project.id}:latest`;

    logs += `\nBuilding Docker image: ${imageName}\n`;
    await this.updateDeploymentLogs(deploymentId, logs);

    try {
      // Build the Docker image
      // If we have a root folder specified, we need to build from that subdirectory
      const rootFolder = project.rootFolder || '/';
      const isSubDir = rootFolder && rootFolder !== '/';

      let buildCommand;
      if (isSubDir) {
        // If we have a subdirectory, we need to build from that directory
        // This ensures the Docker context is correct
        buildCommand = `cd ${workingDir} && docker build -t ${imageName} .`;
        logs += `\nBuilding Docker image from subdirectory: ${workingDir}\n`;
      } else {
        // Otherwise, build from the working directory
        buildCommand = `cd ${workingDir} && docker build -t ${imageName} .`;
        logs += `\nBuilding Docker image from directory: ${workingDir}\n`;
      }

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

      // Find an available port to expose
      const port = await this.findAvailablePort(3000, 4000);
      
      // Add the port to the environment variables for the application
      envVars['PORT'] = port.toString();
      envVars['OCEAN_ASSIGNED_PORT'] = port.toString();
      envVars['OCEAN_APP_URL'] = `http://localhost:${port}`;
      envVars['HOST'] = '0.0.0.0';  // Ensure the app binds to all interfaces
      
      // Update the .env file with the new port
      const updatedEnvFileContent = Object.entries(envVars)
        .map(([key, value]) => `${key}=${value}`)
        .join('\n');
      
      fs.writeFileSync(envFilePath, updatedEnvFileContent);
      logs += `\nUpdated .env file with assigned port: ${port}\n`;
      await this.updateDeploymentLogs(deploymentId, logs);
      
      // Save the port to the database for future reference
      await this.prisma.deployment.update({
        where: { id: deploymentId },
        data: { containerPort: port }
      });

      // Process all environment variables to replace localhost with host.docker.internal for database connections
      let dbConnectionUpdated = false;
      
      // Process all environment variables
      Object.keys(envVars).forEach(key => {
        const value = envVars[key];
        
        // Check if this is a database connection string (common patterns)
        if (
          (key === 'DATABASE_URL' || key.includes('DB_') || key.includes('DATABASE')) &&
          typeof value === 'string' && 
          (value.includes('localhost') || value.includes('127.0.0.1'))
        ) {
          const originalValue = value;
          // Replace both localhost and 127.0.0.1 with host.docker.internal
          const updatedValue = value
            .replace(/localhost/g, 'host.docker.internal')
            .replace(/127\.0\.0\.1/g, 'host.docker.internal');
          
          envVars[key] = updatedValue;
          
          logs += `\nDetected database connection in ${key}. Modified to use host.docker.internal.\n`;
          logs += `Original: ${originalValue}\n`;
          logs += `Modified: ${updatedValue}\n`;
          
          dbConnectionUpdated = true;
        }
      });
      
      // If any database connections were updated, update the environment file
      if (dbConnectionUpdated) {
        // Rebuild the environment variables arguments for docker run
        const updatedEnvArgs = Object.entries(envVars)
          .map(([key, value]) => `-e ${key}=${value}`)
          .join(' ');
        
        // Update the .env file with the modified values
        const updatedEnvFileContent = Object.entries(envVars)
          .map(([key, value]) => `${key}=${value}`)
          .join('\n');
        
        fs.writeFileSync(envFilePath, updatedEnvFileContent);
        logs += `Updated .env file with modified database connection strings.\n`;
        await this.updateDeploymentLogs(deploymentId, logs);
      }
      
      // Run the container with resource limits and restart policy for isolation and recovery
      // Using --add-host to map host.docker.internal to the host machine's IP
      // This ensures the container can connect to services running on the host
      const { stdout: runStdout, stderr: runStderr } = await execAsync(
        `docker run -d --name ${containerName} \
        --restart unless-stopped \
        --memory=512m \
        --memory-swap=1g \
        --cpus=0.5 \
        --pids-limit=100 \
        --security-opt=no-new-privileges \
        --cap-drop=ALL \
        --add-host=host.docker.internal:host-gateway \
        -p ${port}:${port} \
        --health-cmd="wget --no-verbose --tries=3 --timeout=5 --spider http://localhost:${port} || curl -s --head http://localhost:${port} || exit 1" \
        --health-interval=30s \
        --health-timeout=10s \
        --health-retries=3 \
        -e PORT=${port} \
        -e OCEAN_ASSIGNED_PORT=${port} \
        -e HOST=0.0.0.0 \
        ${envArgs} ${imageName}`
      );

      logs += runStdout + runStderr;
      logs += `\nContainer ${containerName} is now running on port ${port} with resource limits and health monitoring\n`;
      logs += `\nYour application is accessible at: http://localhost:${port}/\n`;
      
      // Add detailed information about connecting to PostgreSQL and accessing the app
      logs += `\n=== IMPORTANT DEPLOYMENT INFORMATION ===\n`;
      logs += `\n1. ACCESSING YOUR APPLICATION:\n`;
      logs += `   - Your application is exposed on port ${port}`;
      logs += `\n   - Access it at: http://localhost:${port}/\n`;
      
      logs += `\n2. DATABASE CONNECTIONS FROM CONTAINER:\n`;
      logs += `   - For PostgreSQL running on your host machine, use 'host.docker.internal' instead of 'localhost'`;
      logs += `\n   - Example: postgresql://username:password@host.docker.internal:5432/database`;
      logs += `\n   - We've automatically updated any DATABASE_URL environment variables to use host.docker.internal\n`;
      
      logs += `\n3. LISTENING CONFIGURATION:\n`;
      logs += `   - Make sure your application listens on 0.0.0.0 (all interfaces) and not just localhost`;
      logs += `\n   - For Express.js apps: app.listen(process.env.PORT, '0.0.0.0', () => {...})`;
      logs += `\n   - For Next.js apps: add to next.config.js: { server: { host: '0.0.0.0' } }\n`;
      
      logs += `\n4. TROUBLESHOOTING CONNECTION ISSUES:\n`;
      logs += `   - If database connections fail, check your PostgreSQL configuration to allow remote connections`;
      logs += `\n   - For Linux hosts, you may need to update pg_hba.conf and postgresql.conf`;
      logs += `\n   - Verify that your database is running and accessible from your host machine\n`;
      
      logs += `\n=== END DEPLOYMENT INFORMATION ===\n`;
      
      // Verify that the container is running correctly
      logs += `\nVerifying container status...\n`;
      await this.updateDeploymentLogs(deploymentId, logs);
      
      // Wait a moment for the container to initialize
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check container status
      try {
        const { stdout: statusOutput } = await execAsync(`docker inspect --format='{{.State.Status}}' ${containerName}`);
        const containerStatus = statusOutput.trim();
        
        logs += `\nContainer status: ${containerStatus}\n`;
        
        if (containerStatus === 'running') {
          logs += `\nContainer is running successfully!\n`;
          
          // Wait a bit longer and check if the container is still running (to catch quick crashes)
          await new Promise(resolve => setTimeout(resolve, 3000));
          const { stdout: statusAfterWait } = await execAsync(`docker inspect --format='{{.State.Status}}' ${containerName}`);
          
          if (statusAfterWait.trim() !== 'running') {
            logs += `\nWARNING: Container status changed to ${statusAfterWait.trim()} after initialization\n`;
            logs += `\nChecking container logs for errors...\n`;
            
            // Get container logs to help diagnose the issue
            const { stdout: containerLogs } = await execAsync(`docker logs ${containerName}`);
            logs += `\nContainer logs:\n${containerLogs}\n`;
          }
        } else {
          logs += `\nWARNING: Container is not running. Status: ${containerStatus}\n`;
          logs += `\nChecking container logs for errors...\n`;
          
          // Get container logs to help diagnose the issue
          const { stdout: containerLogs } = await execAsync(`docker logs ${containerName}`);
          logs += `\nContainer logs:\n${containerLogs}\n`;
        }
      } catch (error) {
        logs += `\nError checking container status: ${error.message}\n`;
      }
      
      // Check if the port is accessible
      logs += `\nChecking if port ${port} is accessible...\n`;
      await this.updateDeploymentLogs(deploymentId, logs);
      
      try {
        // Try to connect to the port
        await this.checkPortAccessible('localhost', port, 5000); // 5 second timeout
        logs += `\nPort ${port} is accessible! Your application should be available.\n`;
      } catch (error) {
        logs += `\nWARNING: Could not connect to port ${port}: ${error.message}\n`;
        logs += `\nThis may indicate that your application is not listening on the correct port.\n`;
        logs += `\nMake sure your application listens on the port specified by the PORT environment variable.\n`;
        
        // Add example code for common frameworks
        logs += `\nExample code for Express.js:\n`;
        logs += `const port = process.env.PORT || 3000;\n`;
        logs += `app.listen(port, () => console.log(\`Server running on port \${port}\`));\n\n`;
        
        logs += `Example code for Next.js (in next.config.js):\n`;
        logs += `module.exports = {\n`;
        logs += `  env: {\n`;
        logs += `    PORT: process.env.PORT || 3000\n`;
        logs += `  }\n`;
        logs += `};\n`;
      }

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
      logs += `\n=== TROUBLESHOOTING TIPS ===\n`;
      logs += `\n1. APPLICATION CONFIGURATION:\n`;
      logs += `   - Check your application code for errors`;
      logs += `\n   - Verify that your application listens on the correct port (default: 3000)`;
      logs += `\n   - Ensure your application listens on 0.0.0.0 (all interfaces) and not just localhost`;
      logs += `\n   - For Express.js: app.listen(process.env.PORT, '0.0.0.0', () => {})`;
      logs += `\n   - For Next.js: In next.config.js add { server: { host: '0.0.0.0' } }\n`;
      
      logs += `\n2. DATABASE CONNECTION ISSUES:\n`;
      logs += `   - If using a database on your host machine, ensure connection strings use 'host.docker.internal'`;
      logs += `\n   - Example: postgresql://username:password@host.docker.internal:5432/database`;
      logs += `\n   - Check that your database server is running and accessible from your host`;
      logs += `\n   - Verify PostgreSQL is configured to accept connections (pg_hba.conf)\n`;
      
      logs += `\n3. DOCKER CONFIGURATION:\n`;
      logs += `   - Make sure your Dockerfile is correctly configured`;
      logs += `\n   - Check that your start command is correct`;
      logs += `\n   - Verify that all required environment variables are set`;
      logs += `\n   - Check Docker logs: docker logs ${containerName}\n`;
      
      logs += `\n4. NETWORKING ISSUES:\n`;
      logs += `   - If your app needs to connect to other services, ensure proper network configuration`;
      logs += `\n   - For services on your host machine, use 'host.docker.internal' as the hostname`;
      logs += `\n   - For Linux hosts, you may need to add the host IP to your /etc/hosts file\n`;
      
      logs += `\n=== END TROUBLESHOOTING TIPS ===\n`;

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
    const nodeVersion = '23';

    // Use project's specified commands or fallback to defaults
    // Log the commands we're using to help with debugging
    this.logsService.debug(`Project commands - Install: ${project.installCommand}, Build: ${project.buildCommand}, Start: ${project.startCommand}`, 'Docker Container');

    const installCommand = project.installCommand || 'npm install';
    const buildCommand = project.buildCommand || '';
    const startCommand = project.startCommand || 'npm start';

    // Generate a simple Dockerfile
    let dockerfile = `FROM node:${nodeVersion}-alpine

WORKDIR /app

`;

    // Copy package files first (for better layer caching)
    // When building from a subdirectory, we're already in that context
    // so we don't need to specify the subdirectory path in the COPY command
    dockerfile += `# Copy package.json and package-lock.json
COPY package*.json ./

`;

    // Install dependencies
    dockerfile += `# Install dependencies
RUN ${installCommand}

`;

    // Copy the rest of the application
    // When building from a subdirectory, we're already in that context
    dockerfile += `# Copy the rest of the application
COPY . .

`;

    // Add build command if specified
    if (buildCommand) {
      dockerfile += `# Build the application
RUN ${buildCommand}

`;
    }

    // Expose the port the app runs on (using PORT environment variable)
    dockerfile += `# Expose the port the app runs on
EXPOSE \${PORT:-3000}

`;

    // Add environment variables with HOST set to 0.0.0.0 to ensure the app listens on all interfaces
    // Also add a special script to handle database connection strings during build time
    dockerfile += `# Set environment variables
ENV NODE_ENV=production
ENV PORT=\${PORT:-3000}
ENV HOST=0.0.0.0

# Add script to handle database connection strings
RUN echo '#!/bin/sh' > /tmp/fix-db-connections.sh && \
    echo 'echo "[DB Connection] Fixing database connection strings in all files..."' >> /tmp/fix-db-connections.sh && \
    echo '' >> /tmp/fix-db-connections.sh && \
    echo '# Fix .env files (handles any port number)' >> /tmp/fix-db-connections.sh && \
    echo 'for file in $(find /app -type f -name ".env*"); do' >> /tmp/fix-db-connections.sh && \
    echo '  echo "[DB Connection] Checking $file for database connections"' >> /tmp/fix-db-connections.sh && \
    echo '  # PostgreSQL format' >> /tmp/fix-db-connections.sh && \
    echo '  sed -i -E "s/(postgresql|postgres):\/\/([^:]+:[^@]+@)localhost([:]?[0-9]*)/\\1:\/\/\\2host.docker.internal\\3/g" $file' >> /tmp/fix-db-connections.sh && \
    echo '  sed -i -E "s/(postgresql|postgres):\/\/([^:]+:[^@]+@)127\.0\.0\.1([:]?[0-9]*)/\\1:\/\/\\2host.docker.internal\\3/g" $file' >> /tmp/fix-db-connections.sh && \
    echo '  # MySQL format' >> /tmp/fix-db-connections.sh && \
    echo '  sed -i -E "s/(mysql):\/\/([^:]+:[^@]+@)localhost([:]?[0-9]*)/\\1:\/\/\\2host.docker.internal\\3/g" $file' >> /tmp/fix-db-connections.sh && \
    echo '  sed -i -E "s/(mysql):\/\/([^:]+:[^@]+@)127\.0\.0\.1([:]?[0-9]*)/\\1:\/\/\\2host.docker.internal\\3/g" $file' >> /tmp/fix-db-connections.sh && \
    echo '  # MongoDB format' >> /tmp/fix-db-connections.sh && \
    echo '  sed -i -E "s/(mongodb|mongodb\+srv):\/\/([^:]+:[^@]+@)localhost([:]?[0-9]*)/\\1:\/\/\\2host.docker.internal\\3/g" $file' >> /tmp/fix-db-connections.sh && \
    echo '  sed -i -E "s/(mongodb|mongodb\+srv):\/\/([^:]+:[^@]+@)127\.0\.0\.1([:]?[0-9]*)/\\1:\/\/\\2host.docker.internal\\3/g" $file' >> /tmp/fix-db-connections.sh && \
    echo '  # Simple localhost replacement (for all formats)' >> /tmp/fix-db-connections.sh && \
    echo '  sed -i "s/localhost/host.docker.internal/g" $file' >> /tmp/fix-db-connections.sh && \
    echo '  sed -i "s/127\.0\.0\.1/host.docker.internal/g" $file' >> /tmp/fix-db-connections.sh && \
    echo 'done' >> /tmp/fix-db-connections.sh && \
    echo '' >> /tmp/fix-db-connections.sh && \
    echo '# Fix code files with hardcoded connection strings' >> /tmp/fix-db-connections.sh && \
    echo 'for file in $(find /app -type f -name "*.js" -o -name "*.ts" -o -name "*.json" -o -name "*.cjs" -o -name "*.mjs"); do' >> /tmp/fix-db-connections.sh && \
    echo '  if grep -q "localhost\|127\.0\.0\.1" $file; then' >> /tmp/fix-db-connections.sh && \
    echo '    echo "[DB Connection] Fixing database connections in $file"' >> /tmp/fix-db-connections.sh && \
    echo '    # Fix various connection string formats' >> /tmp/fix-db-connections.sh && \
    echo '    sed -i -E "s/(postgresql|postgres|mysql|mongodb|mongodb\+srv):\/\/([^:]+:[^@]+@)localhost([:]?[0-9]*)/\\1:\/\/\\2host.docker.internal\\3/g" $file' >> /tmp/fix-db-connections.sh && \
    echo '    sed -i -E "s/(postgresql|postgres|mysql|mongodb|mongodb\+srv):\/\/([^:]+:[^@]+@)127\.0\.0\.1([:]?[0-9]*)/\\1:\/\/\\2host.docker.internal\\3/g" $file' >> /tmp/fix-db-connections.sh && \
    echo '    # Fix connection objects and replace all localhost occurrences' >> /tmp/fix-db-connections.sh && \
    echo '    sed -i "s/host[\"\']?\s*:\s*[\"\']localhost[\"\']?/host: \"host.docker.internal\"/g" $file' >> /tmp/fix-db-connections.sh && \
    echo '    sed -i "s/host[\"\']?\s*:\s*[\"\']127\.0\.0\.1[\"\']?/host: \"host.docker.internal\"/g" $file' >> /tmp/fix-db-connections.sh && \
    echo '    # Replace all other localhost occurrences' >> /tmp/fix-db-connections.sh && \    echo '    sed -i "s/localhost/host.docker.internal/g" $file' >> /tmp/fix-db-connections.sh && \    echo '    sed -i "s/127\.0\.0\.1/host.docker.internal/g" $file' >> /tmp/fix-db-connections.sh && \    echo '  fi' >> /tmp/fix-db-connections.sh && \
    echo 'done' >> /tmp/fix-db-connections.sh && \
    echo '' >> /tmp/fix-db-connections.sh && \
    echo 'echo "[DB Connection] Database connection strings fixed successfully"' >> /tmp/fix-db-connections.sh && \
    chmod +x /tmp/fix-db-connections.sh

# Run the database connection fix script
RUN /tmp/fix-db-connections.sh && rm /tmp/fix-db-connections.sh

# Create a script to ensure the app listens on all interfaces
RUN echo '#!/bin/sh' > /tmp/fix-host-binding.sh && \
    echo '' >> /tmp/fix-host-binding.sh && \
    echo 'echo "[Host Binding] Configuring application to listen on all interfaces..."' >> /tmp/fix-host-binding.sh && \
    echo '# Modify Express.js apps to listen on all interfaces' >> /tmp/fix-host-binding.sh && \
    echo 'find . -type f -name "*.js" -exec sed -i "s/listen(\\s*\\(process\\.env\\.PORT\\|[0-9]\\+\\))/listen(\\1, \"0.0.0.0\")/g" {} \\;' >> /tmp/fix-host-binding.sh && \
    echo '' >> /tmp/fix-host-binding.sh && \
    echo '# Modify Next.js config if it exists' >> /tmp/fix-host-binding.sh && \
    echo 'if [ -f next.config.js ]; then' >> /tmp/fix-host-binding.sh && \
    echo '  if grep -q "server" next.config.js; then' >> /tmp/fix-host-binding.sh && \
    echo '    sed -i "s/server:\\s*{/server: { host: \"0.0.0.0\",/g" next.config.js' >> /tmp/fix-host-binding.sh && \
    echo '    echo "[Host Binding] Configuring Next.js to listen on all interfaces"' >> /tmp/fix-host-binding.sh && \
    echo '  else' >> /tmp/fix-host-binding.sh && \
    echo '    sed -i "s/module.exports\\s*=\\s*{/module.exports = { server: { host: \"0.0.0.0\" },/g" next.config.js' >> /tmp/fix-host-binding.sh && \
    echo '  fi' >> /tmp/fix-host-binding.sh && \
    echo 'fi' >> /tmp/fix-host-binding.sh && \
    echo '' >> /tmp/fix-host-binding.sh && \
    echo '# Create Next.js config if needed' >> /tmp/fix-host-binding.sh && \
    echo 'if [ ! -f next.config.js ] && grep -q "\"next\"" package.json; then' >> /tmp/fix-host-binding.sh && \
    echo '  echo "module.exports = { server: { host: \"0.0.0.0\" } };" > next.config.js' >> /tmp/fix-host-binding.sh && \
    echo 'fi' >> /tmp/fix-host-binding.sh && \
    echo 'echo "[Host Binding] Configuration completed successfully"' >> /tmp/fix-host-binding.sh && \
    chmod +x /tmp/fix-host-binding.sh && \
    /tmp/fix-host-binding.sh && \
    rm /tmp/fix-host-binding.sh

`;

    // Add start command
    dockerfile += `# Start the application
CMD ${startCommand.startsWith('[') ? startCommand : `["sh", "-c", "${startCommand}"]`}
`;

    return dockerfile;
  }


  /**
   * Find an available port in the specified range
   * @param startPort - The port to start checking from
   * @param endPort - The port to end checking at
   * @returns An available port number
   */
  private async findAvailablePort(startPort: number, endPort: number): Promise<number> {
    this.logsService.debug(`Finding available port between ${startPort} and ${endPort}`, 'Port Allocation');
    
    // First check if any existing deployments are using ports in our range
    const existingDeployments = await this.prisma.deployment.findMany({
      where: {
        status: 'completed',
        containerPort: {
          gte: startPort,
          lte: endPort
        }
      },
      select: {
        containerPort: true
      }
    });
    
    // Create a set of ports that are already in use
    const usedPorts = new Set(existingDeployments.map(d => d.containerPort));
    this.logsService.debug(`Ports already in use by deployments: ${Array.from(usedPorts).join(', ')}`, 'Port Allocation');
    
    // Try each port in the range
    for (let port = startPort; port <= endPort; port++) {
      // Skip ports that are already used by deployments
      if (usedPorts.has(port)) {
        this.logsService.debug(`Skipping port ${port} as it's used by an existing deployment`, 'Port Allocation');
        continue;
      }
      
      try {
        // Check if port is in use using lsof
        const { stdout } = await execAsync(`lsof -i:${port} || echo 'PORT_FREE'`);
        
        if (stdout.includes('PORT_FREE')) {
          this.logsService.logPortAllocation(`Found available port: ${port}`);
          return port;
        } else {
          this.logsService.debug(`Port ${port} is in use according to lsof`, 'Port Allocation');
        }
      } catch (error) {
        // If command fails, the port is likely available
        this.logsService.debug(`Port ${port} appears to be available (lsof command failed)`, 'Port Allocation');
        return port;
      }
    }
    
    // If no ports are available in the range, try to find a port outside the range
    const extendedEndPort = endPort + 1000; // Try 1000 more ports
    this.logsService.warn(`No available ports found between ${startPort} and ${endPort}, trying extended range up to ${extendedEndPort}`, 'Port Allocation');
    
    for (let port = endPort + 1; port <= extendedEndPort; port++) {
      try {
        const { stdout } = await execAsync(`lsof -i:${port} || echo 'PORT_FREE'`);
        
        if (stdout.includes('PORT_FREE')) {
          this.logsService.logPortAllocation(`Found available port in extended range: ${port}`);
          return port;
        }
      } catch (error) {
        this.logsService.debug(`Port ${port} in extended range appears to be available`, 'Port Allocation');
        return port;
      }
    }
    
    // If still no ports are available, generate a random port as last resort
    const randomPort = Math.floor(Math.random() * 10000) + 10000; // Random port between 10000-20000
    this.logsService.warn(`No available ports found in extended range, using random port: ${randomPort}`, 'Port Allocation');
    return randomPort;
  }

  /**
   * Check if a port is accessible by attempting to connect to it
   * @param host - The host to connect to
   * @param port - The port to connect to
   * @param timeout - Timeout in milliseconds
   */
  private checkPortAccessible(host: string, port: number, timeout: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const net = require('net');
      const socket = new net.Socket();
      
      // Set timeout
      socket.setTimeout(timeout);
      
      // Attempt to connect
      socket.connect(port, host, () => {
        socket.end();
        resolve();
      });
      
      // Handle timeout
      socket.on('timeout', () => {
        socket.destroy();
        reject(new Error(`Connection timeout after ${timeout}ms`));
      });
      
      // Handle errors
      socket.on('error', (err) => {
        socket.destroy();
        reject(err);
      });
    });
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

    this.logsService.logDeployment(`Started detached process for deployment ${deploymentId}, logs at: ${logFile}`);
  }
}
