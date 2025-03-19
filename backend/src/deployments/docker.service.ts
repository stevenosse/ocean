import { Injectable, Logger } from '@nestjs/common';
import { promisify } from 'util';
import { exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { DeploymentLogsService } from './deployment-logs.service';
import { PrismaService } from 'src/prisma/prisma.service';

const execAsync = promisify(exec);

@Injectable()
export class DockerService {
    constructor(
        private logsService: DeploymentLogsService,
        private prisma: PrismaService,
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

        // Always create a new Dockerfile for each deployment to ensure it reflects current configuration
        const dockerfilePath = path.join(workingDir, 'Dockerfile');

        // Remove existing Dockerfile if it exists
        if (fs.existsSync(dockerfilePath)) {
            logs = '\nRemoving existing Dockerfile to create a fresh one with current configuration\n';
            fs.unlinkSync(dockerfilePath);
            await updateLogs(logs);
        }

        logs = '\nChecking project type to generate appropriate Dockerfile\n';
        await updateLogs(logs);

        // Check if this is a Node.js project by looking for package.json
        const rootFolder = project.rootFolder || '';
        const repoDir = path.join(process.cwd(), '../repos', `project-${project.id}`);

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

        if (processedEnvVars.dbConnectionsUpdated) {
            logs = `\nCreated .env file with ${Object.keys(processedEnvVars.envVars).length} environment variables (database connections updated to use host.docker.internal)\n`;
        } else {
            logs = `\nCreated .env file with ${Object.keys(processedEnvVars.envVars).length} environment variables\n`;
        }

        await updateLogs(logs);

        // Build and run the Docker container
        await this.buildAndRunContainer(deploymentId, project, workingDir, processedEnvVars.envVars, updateLogs, updateDeployment);
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
        deploymentId: number,
        project: any,
        workingDir: string,
        envVars: Record<string, string>,
        updateLogs: (logs: string) => Promise<void>,
        updateDeployment: (data: any) => Promise<any>
    ): Promise<void> {
        let logs = '';
        let port: number;
        let containerEnv: Record<string, string>;
        const containerName = `ocean-project-${project.id}`;
        const imageName = `ocean-project-${project.id}:latest`;

        try {
            // Clean up any existing container
            try {
                await execAsync(`docker stop ${containerName} || true`);
                await execAsync(`docker rm ${containerName} || true`);
                logs += '\nCleaned up existing container\n';
            } catch (error) {
                this.logsService.warn(`Error cleaning up container: ${error.message}`, 'Docker Container');
            }
            await updateLogs(logs);

            logs += `\nBuilding Docker image: ${imageName}\n`;
            await updateLogs(logs);
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

            await updateLogs(logs);

            logs += `\nRunning build command: ${buildCommand}\n`;
            await updateLogs(logs);

            const { stdout: buildStdout, stderr: buildStderr } = await execAsync(buildCommand);

            logs += buildStdout + buildStderr;
            await updateLogs(logs);

            // Find an available port and configure environment
            const port = await this.findAvailablePort(3000, 3999);
            logs += `\nAssigned port ${port} to container\n`;
            await updateLogs(logs);

            // Update environment variables with container configuration
            const containerEnv = {
                ...envVars,
                PORT: port.toString(),
                HOST: '0.0.0.0',
                OCEAN_CONTAINER_NAME: containerName,
                OCEAN_ASSIGNED_PORT: port.toString(),
                OCEAN_APP_URL: `http://localhost:${port}`
            };

            // Create environment arguments for docker run
            const envArgs = Object.entries(containerEnv)
                .map(([key, value]) => `-e ${key}=${value}`)
                .join(' ');

            // Run container with resource limits and health monitoring
            const runCommand = `docker run -d --name ${containerName} \
        --restart unless-stopped \
        --memory=512m \
        --cpus=0.5 \
        --pids-limit=100 \
        --add-host=host.docker.internal:host-gateway \
        -p ${port}:${port} \
        --health-cmd="curl -f http://localhost:${port}/health || wget -q --spider http://localhost:${port}/health || exit 1" \
        --health-interval=30s \
        --health-timeout=10s \
        --health-retries=3 \
        ${envArgs} ${imageName}`;

            const { stdout: runStdout, stderr: runStderr } = await execAsync(runCommand);
            logs += runStdout + runStderr;
            await updateLogs(logs);

            // Wait for container to be healthy
            logs += '\nWaiting for container to be healthy...\n';
            await updateLogs(logs);

            // Wait for container to start and become healthy
            let healthy = false;
            const maxRetries = 10;
            const healthCheckInterval = 3000; // 3 seconds
            const startTime = Date.now();

            for (let i = 0; i < maxRetries; i++) {
                try {
                    // First check if container is running
                    const { stdout: statusStdout } = await execAsync(`docker inspect --format='{{.State.Status}}' ${containerName}`);
                    if (statusStdout.trim() !== 'running') {
                        logs += `\nContainer status: ${statusStdout.trim()}\n`;
                        await updateLogs(logs);
                        continue;
                    }

                    // Then check health status
                    const { stdout: healthStdout } = await execAsync(`docker inspect --format='{{.State.Health.Status}}' ${containerName}`);
                    const healthStatus = healthStdout.trim();
                    logs += `\nHealth check attempt ${i + 1}/${maxRetries}: ${healthStatus}\n`;
                    await updateLogs(logs);

                    if (healthStatus === 'healthy') {
                        healthy = true;
                        break;
                    } else if (healthStatus === 'unhealthy') {
                        // Get the last health check log
                        const { stdout: healthLog } = await execAsync(`docker inspect --format='{{json .State.Health.Log}}' ${containerName}`);
                        const healthLogs = JSON.parse(healthLog);
                        if (healthLogs.length > 0) {
                            const lastCheck = healthLogs[healthLogs.length - 1];
                            logs += `\nHealth check failed: ${lastCheck.Output}\n`;
                            await updateLogs(logs);
                        }
                    }
                } catch (error) {
                    this.logsService.warn(`Health check error: ${error.message}`, 'Docker Container');
                    logs += `\nHealth check error: ${error.message}\n`;
                    await updateLogs(logs);
                }

                await new Promise(resolve => setTimeout(resolve, healthCheckInterval));
            }

            if (!healthy) {
                const timeoutSeconds = ((Date.now() - startTime) / 1000).toFixed(1);
                throw new Error(`Container failed to become healthy within ${timeoutSeconds}s timeout. Check container logs for details.`);
            }

            // Update deployment with container port
            await updateDeployment({
                containerPort: port
            });

            logs += `\nContainer is healthy and running on port ${port}\n`;
            await updateLogs(logs);

        } catch (error) {
            this.logsService.error(`Docker deployment failed: ${error.message}`, error, 'Docker Container');
            throw error;
        }

        // Update deployment with container information
        await updateDeployment({
            containerName,
            containerPort: port,
            monitoringEnabled: true
        });

        // Update .env file with container configuration
        const envFileContent = Object.entries(containerEnv)
            .map(([key, value]) => `${key}=${value}`)
            .join('\n');

        fs.writeFileSync(path.join(workingDir, '.env'), envFileContent);
        logs += `\nUpdated .env file with container configuration\n`;

        // Add the port to the environment variables for the application
        envVars['PORT'] = port.toString();
        envVars['OCEAN_ASSIGNED_PORT'] = port.toString();
        envVars['OCEAN_APP_URL'] = `http://localhost:${port}`;
        envVars['HOST'] = '0.0.0.0';  // Ensure the app binds to all interfaces

        // Update the .env file with the new port
        const updatedEnvFileContent = Object.entries(envVars)
            .map(([key, value]) => `${key}=${value}`)
            .join('\n');

        fs.writeFileSync(path.join(workingDir, '.env'), updatedEnvFileContent);
        logs += `\nUpdated .env file with assigned port: ${port}\n`;
        await updateLogs(logs);

        // Save the port to the database for future reference
        await updateDeployment({
            containerPort: port
        });

        // Process all environment variables to replace localhost with host.docker.internal for database connections
        const processedEnvVars = this.processEnvironmentVariables(envVars, logs, updateLogs);

        // If any database connections were updated, update the environment file
        if (processedEnvVars.dbConnectionsUpdated) {
            // Update the .env file with the modified values
            const updatedEnvFileContent = Object.entries(processedEnvVars.envVars)
                .map(([key, value]) => `${key}=${value}`)
                .join('\n');

            fs.writeFileSync(path.join(workingDir, '.env'), updatedEnvFileContent);
            logs += `Updated .env file with modified database connection strings.\n`;
            await updateLogs(logs);
        }

        // Create environment variables arguments for docker run
        const envArgs = Object.entries(processedEnvVars.envVars)
            .map(([key, value]) => `-e ${key}=${value}`)
            .join(' ');

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
        ${envArgs} \
        ${imageName}`
        );

        logs += runStdout + runStderr;
        await updateLogs(logs);

        // Wait for container to be healthy
        logs += '\nWaiting for container to be healthy...\n';
        await updateLogs(logs);

        let isHealthy = false;
        let retries = 0;
        const maxRetries = 10;

        while (!isHealthy && retries < maxRetries) {
            try {
                const { stdout: healthStatus } = await execAsync(`docker inspect --format='{{.State.Health.Status}}' ${containerName}`);
                if (healthStatus.trim() === 'healthy') {
                    isHealthy = true;
                    logs += '\nContainer is healthy and ready to accept connections\n';
                } else {
                    retries++;
                    await new Promise(resolve => setTimeout(resolve, 3000));
                }
            } catch (error) {
                retries++;
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
        }

        if (!isHealthy) {
            throw new Error('Container failed to become healthy within the timeout period');
        }

        await updateLogs(logs);

        // Try to access the application
        try {
            await this.checkPortAccessible('localhost', port, 5000);
            logs += `\nApplication is accessible at http://localhost:${port}\n`;
            await updateLogs(logs);
        } catch (error) {
            logs += `\nWarning: Application port ${port} is not responding: ${error.message}\n`;
            await updateLogs(logs);
            // Don't throw error here, as the container might still be starting up
        }

    }
}