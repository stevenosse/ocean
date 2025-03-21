import { Injectable, Logger } from '@nestjs/common';
import { promisify } from 'util';
import { exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { DeploymentLogsService } from './deployment-logs.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { ContainerHealthService } from './container-health.service';
import { TunnelingService } from '../tunneling/tunneling.service';
import { Project } from '@prisma/client';

const execAsync = promisify(exec);

@Injectable()
export class DockerService {
    constructor(
        private logsService: DeploymentLogsService,
        private containerHealthService: ContainerHealthService,
        private prisma: PrismaService,
        private tunnelingService: TunnelingService,
    ) { }

    /**
     * Run Docker Compose deployment
     */
    async runDockerComposeDeployment(
        deploymentId: number,
        project: any,
        workingDir: string,
        updateLogs: (logs: string) => Promise<void>
    ): Promise<void> {
        const composeFile = project.dockerComposeFile || 'docker-compose.yml';
        const serviceName = project.dockerServiceName || '';

        let logs = `\nDeploying with Docker Compose: ${composeFile}\n`;
        await updateLogs(logs);

        const deployCommand = `cd ${workingDir} && docker-compose -f ${composeFile} up -d ${serviceName}`;
        const { stdout, stderr } = await execAsync(deployCommand);
        logs = stdout + stderr;
        await updateLogs(logs);
    }

    /**
     * Run Docker container deployment
     */
    async runDockerContainerDeployment(
        deploymentId: number,
        project: any,
        workingDir: string,
        envVars: Record<string, string>,
        updateLogs: (logs: string) => Promise<void>,
        updateDeployment: (data: any) => Promise<any>
    ): Promise<void> {
        let logs = '';

        const dockerfilePath = path.join(workingDir, 'Dockerfile');

        if (fs.existsSync(dockerfilePath)) {
            logs = '\nRemoving existing Dockerfile to create a fresh one with current configuration\n';
            fs.unlinkSync(dockerfilePath);
            await updateLogs(logs);
        }

        logs = '\nChecking project type to generate appropriate Dockerfile\n';
        await updateLogs(logs);

        // Check if this is a Node.js project by looking for package.json
        const rootFolder = project.rootFolder || '';
        const repoDir = path.join(process.cwd(), process.env.DEPLOYED_APPS_DIR, `project-${project.id}`);

        // Check if package.json exists in the specified root folder
        let packageJsonPath = path.join(repoDir, rootFolder, 'package.json');

        if (fs.existsSync(packageJsonPath)) {
            logs = `\nFound package.json in specified root folder: ${rootFolder}\n`;
            await updateLogs(logs);
        } else {
            logs = `\nNo package.json found in specified root folder: ${rootFolder}\n`;
            logs += 'Please make sure your root folder is set correctly in the project settings.\n';
            logs += 'The root folder should point to the directory containing package.json.\n';
            await updateLogs(logs);

            // If the root folder is not specified or is the default, try to find package.json
            if (!rootFolder || rootFolder === '/') {
                logs += '\nAttempting to find package.json in the repository...\n';
                await updateLogs(logs);

                // Find all package.json files in the repository
                const { stdout } = await execAsync(`find ${repoDir} -name "package.json" -type f`);
                const packageJsonFiles = stdout.trim().split('\n').filter(Boolean);

                if (packageJsonFiles.length > 0) {
                    // Use the first package.json found
                    packageJsonPath = packageJsonFiles[0];
                    // Extract the relative directory from the repo root
                    const packageJsonDir = path.dirname(packageJsonPath).replace(repoDir, '').replace(/^\//, '');

                    logs += `\nFound package.json in subdirectory: ${packageJsonDir}\n`;
                    await updateLogs(logs);

                    // Update the project's root folder
                    project.rootFolder = '/' + packageJsonDir;
                    logs += `\nUpdating project root folder to: ${project.rootFolder}\n`;
                    await updateLogs(logs);

                    // Return the updated root folder to be saved to the database
                    await updateDeployment({
                        rootFolder: project.rootFolder
                    });
                } else {
                    logs += '\nNo package.json found in the repository.\n';
                    await updateLogs(logs);
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
            await updateLogs(logs);

            // Create a basic Dockerfile for Node.js projects
            const dockerfile = this.generateNodejsDockerfile(project);
            fs.writeFileSync(dockerfilePath, dockerfile);

            logs += `Created Dockerfile for Node.js project\n`;
            await updateLogs(logs);
        } else {
            logs += '\nNo package.json found. Cannot automatically create Dockerfile.\n';
            logs += 'Please add a Dockerfile to your repository.\n';
            await updateLogs(logs);
            throw new Error('No package.json found and no Dockerfile provided. Cannot deploy this project.');
        }

        // Create .env file with project environment variables
        const envFilePath = path.join(workingDir, '.env');

        // Process environment variables to replace localhost with host.docker.internal in database connection strings
        const processedEnvVars = this.processEnvironmentVariables(envVars, logs, updateLogs);

        // Create the .env file content with the updated variables
        const envFileContent = Object.entries(processedEnvVars.envVars)
            .map(([key, value]) => `${key}=${value}`)
            .join('\n');

        fs.writeFileSync(envFilePath, envFileContent);

        logs = `\nCreated .env file with ${Object.keys(processedEnvVars.envVars).length} environment variables\n`;

        await updateLogs(logs);

        // Build and run the Docker container
        await this.buildAndRunContainer(project, deploymentId, workingDir, processedEnvVars.envVars, updateLogs, updateDeployment);
    }

    /**
     * Process environment variables to replace localhost with host.docker.internal
     */
    private processEnvironmentVariables(
        envVars: Record<string, string>,
        logs: string,
        updateLogs: (logs: string) => Promise<void>
    ): { envVars: Record<string, string>, dbConnectionsUpdated: boolean } {
        const processedEnvVars = { ...envVars };
        let dbConnectionsUpdated = false;

        Object.keys(processedEnvVars).forEach(key => {
            const value = processedEnvVars[key];

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

                processedEnvVars[key] = updatedValue;

                logs += `\nDetected database connection in ${key}. Modified to use host.docker.internal.\n`;
                logs += `Original: ${originalValue}\n`;
                logs += `Modified: ${updatedValue}\n`;

                dbConnectionsUpdated = true;
            }
        });

        return { envVars: processedEnvVars, dbConnectionsUpdated };
    }

    /**
     * Find an available port on the host machine
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

    /**
     * Build and run Docker container
     */
    /**
     * Generate a Dockerfile for Node.js projects
     */
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

# Start the application
CMD ${startCommand}`;

        return dockerfile;
    }

    private async buildAndRunContainer(
        project: Project,
        deploymentId: number,
        workingDir: string,
        envVars: Record<string, string>,
        updateLogs: (logs: string) => Promise<void>,
        updateDeployment: (data: any) => Promise<any>
    ): Promise<void> {
        let logs = '';
        const containerName = `ocean-project-${project.id}`;
        const imageName = `ocean-project-${project.id}:latest`;

        try {
            // Stop any existing SSH tunnel for this project
            logs += '\nStopping any existing SSH tunnels for this project...\n';
            try {
                await this.tunnelingService.stopTunnel(project.id);
                logs += 'Successfully stopped existing tunnel\n';
            } catch (error) {
                logs += `Warning: Failed to stop SSH tunnel: ${error.message}\n`;
            }
            await updateLogs(logs);

            // Clean up existing container
            await execAsync(`docker stop ${containerName} || true`);
            await execAsync(`docker rm ${containerName} || true`);
            logs += '\nCleaned up existing container\n';
            await updateLogs(logs);

            // Build Docker image
            const rootFolder = project.rootFolder || '/';
            const isSubDir = rootFolder && rootFolder !== '/';
            logs += `\nBuilding Docker image: ${imageName} from ${workingDir}\n`;
            if (isSubDir) {
                logs += `(Using subdirectory specified by rootFolder: ${rootFolder})\n`;
            }
            await updateLogs(logs);

            const buildCommand = `cd ${workingDir} && docker build -t ${imageName} .`;
            const { stdout: buildStdout, stderr: buildStderr } = await execAsync(buildCommand);
            logs += buildStdout + buildStderr;
            await updateLogs(logs);

            // Find available port
            const port = await this.findAvailablePort(3000, 3999);
            logs += `\nAssigned port ${port} to container\n`;
            await updateLogs(logs);

            // Prepare environment variables
            const containerEnv = {
                ...envVars,
                PORT: port.toString(),
                HOST: '0.0.0.0',
                OCEAN_CONTAINER_NAME: containerName,
                OCEAN_ASSIGNED_PORT: port.toString(),
                OCEAN_APP_URL: `http://localhost:${port}`
            };

            const envArgs = Object.entries(containerEnv)
                .map(([key, value]) => `-e ${key}=${value}`)
                .join(' ');

            // Run container with improved health check
            const runCommand = `docker run -d --name ${containerName} \
                --restart unless-stopped \
                --memory=512m \
                --cpus=0.5 \
                --add-host=host.docker.internal:host-gateway \
                -p ${port}:${port} \
                --health-cmd="curl --fail --silent http://localhost:${port}/health || curl --fail --silent http://localhost:${port} || exit 1" \
                --health-interval=10s \
                --health-timeout=5s \
                --health-retries=6 \
                --health-start-period=30s \
                ${envArgs} ${imageName}`;

            const { stdout: runStdout } = await execAsync(runCommand);
            logs += runStdout;
            await updateLogs(logs);

            // Wait for container to be healthy
            logs += '\nWaiting for container to be healthy...\n';
            await updateLogs(logs);

            // Update deployment status
            await updateDeployment({
                status: 'completed',
                containerName,
                containerPort: port
            });

            try {
                await new Promise(resolve => setTimeout(resolve, 5000));

                await this.containerHealthService.checkContainerHealth(deploymentId);

                logs += `\nContainer health check passed\n`;
                await updateLogs(logs);
            } catch (error) {
                logs += `\nContainer health check failed: ${error.message}\n`;
                await updateLogs(logs);
                throw new Error(`Container health check failed: ${error.message}`);
            }

            // Update deployment info
            await updateDeployment({
                containerName,
                containerPort: port,
                monitoringEnabled: true
            });

            // Set up SSH tunnel for the container
            logs += '\nSetting up SSH tunnel for the application...\n';
            await updateLogs(logs);

            try {
                const tunnelUrl = await this.tunnelingService.createTunnel(project.id, port);
                logs += `Application is accessible at: ${tunnelUrl}\n`;
                logs += 'Successfully updated application URL in database\n';
            } catch (error) {
                logs += `Warning: Failed to set up SSH tunnel: ${error.message}\n`;
                // Continue deployment even if SSH tunnel setup fails
            }

            await updateLogs(logs);

            // Update .env file
            const envFileContent = Object.entries(containerEnv)
                .map(([key, value]) => `${key}=${value}`)
                .join('\n');
            fs.writeFileSync(path.join(workingDir, '.env'), envFileContent);
            logs += `\nUpdated .env file with container configuration\n`;
            await updateLogs(logs);

        } catch (error) {
            this.logsService.error(`Docker deployment failed: ${error.message}`, error, 'Docker Container');
            logs += `\nError: ${error.message}\n`;
            await updateLogs(logs);
            throw error;
        }
    }
}