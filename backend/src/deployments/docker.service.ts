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
    private readonly logger = new Logger(DockerService.name);

    constructor(
        private logsService: DeploymentLogsService,
        private containerHealthService: ContainerHealthService,
        private prisma: PrismaService,
        private tunnelingService: TunnelingService,
    ) { }

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
        try {
            const { stdout, stderr } = await execAsync(deployCommand, { timeout: 60000 });
            logs = stdout + stderr;
            await updateLogs(logs);
        } catch (error) {
            logs += `\nError during Docker Compose deployment: ${error.message}\n`;
            this.logger.error(`Docker Compose deployment failed: ${error.message}`, error.stack);
            await updateLogs(logs);
            throw error;
        }
    }

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

        const rootFolder = project.rootFolder || '';
        const repoDir = path.join(process.cwd(), process.env.DEPLOYED_APPS_DIR, `project-${project.id}`);
        let packageJsonPath = path.join(repoDir, rootFolder, 'package.json');

        if (fs.existsSync(packageJsonPath)) {
            logs = `\nFound package.json in specified root folder: ${rootFolder}\n`;
            await updateLogs(logs);
        } else {
            logs = `\nNo package.json found in specified root folder: ${rootFolder}\n`;
            logs += 'Please make sure your root folder is set correctly in the project settings.\n';
            logs += 'The root folder should point to the directory containing package.json.\n';
            await updateLogs(logs);

            if (!rootFolder || rootFolder === '/') {
                logs += '\nAttempting to find package.json in the repository...\n';
                await updateLogs(logs);

                const { stdout } = await execAsync(`find ${repoDir} -name "package.json" -type f`, { timeout: 10000 });
                const packageJsonFiles = stdout.trim().split('\n').filter(Boolean);

                if (packageJsonFiles.length > 0) {
                    packageJsonPath = packageJsonFiles[0];
                    const packageJsonDir = path.dirname(packageJsonPath).replace(repoDir, '').replace(/^\//, '');

                    logs += `\nFound package.json in subdirectory: ${packageJsonDir}\n`;
                    await updateLogs(logs);

                    project.rootFolder = '/' + packageJsonDir;
                    logs += `\nUpdating project root folder to: ${project.rootFolder}\n`;
                    await updateLogs(logs);

                    await updateDeployment({
                        rootFolder: project.rootFolder,
                    });
                } else {
                    logs += '\nNo package.json found in the repository.\n';
                    await updateLogs(logs);
                }
            }
        }

        if (fs.existsSync(packageJsonPath)) {
            logs += '\nFound package.json, creating Dockerfile for Node.js project\n';

            logs += `\nProject configuration:\n`;
            logs += `- Install command: ${project.installCommand || 'npm install (default)'}\n`;
            logs += `- Build command: ${project.buildCommand || 'None (default)'}\n`;
            logs += `- Start command: ${project.startCommand || 'npm start (default)'}\n`;
            await updateLogs(logs);

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

        const envFilePath = path.join(workingDir, '.env');
        const processedEnvVars = this.processEnvironmentVariables(envVars, logs, updateLogs);
        const envFileContent = Object.entries(processedEnvVars.envVars)
            .map(([key, value]) => `${key}=${value}`)
            .join('\n');

        fs.writeFileSync(envFilePath, envFileContent);

        logs = `\nCreated .env file with ${Object.keys(processedEnvVars.envVars).length} environment variables\n`;
        await updateLogs(logs);

        await this.buildAndRunContainer(project, deploymentId, workingDir, processedEnvVars.envVars, updateLogs, updateDeployment);
    }

    private processEnvironmentVariables(
        envVars: Record<string, string>,
        logs: string,
        updateLogs: (logs: string) => Promise<void>
    ): { envVars: Record<string, string>; dbConnectionsUpdated: boolean } {
        const processedEnvVars = { ...envVars };
        let dbConnectionsUpdated = false;

        Object.keys(processedEnvVars).forEach((key) => {
            const value = processedEnvVars[key];

            if (
                (key === 'DATABASE_URL' || key.includes('DB_') || key.includes('DATABASE')) &&
                typeof value === 'string' &&
                (value.includes('localhost') || value.includes('127.0.0.1'))
            ) {
                const originalValue = value;
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

    private async findAvailablePort(startPort: number, endPort: number): Promise<number> {
        this.logsService.debug(`Finding available port between ${startPort} and ${endPort}`, 'Port Allocation');

        for (let port = startPort; port <= endPort; port++) {
            try {
                const { stdout } = await execAsync(`lsof -i:${port} || echo 'PORT_FREE'`, { timeout: 5000 });

                if (stdout.includes('PORT_FREE')) {
                    this.logsService.logPortAllocation(`Found available port: ${port}`);
                    return port;
                } else {
                    this.logsService.debug(`Port ${port} is in use according to lsof`, 'Port Allocation');
                }
            } catch (error) {
                this.logsService.debug(`Port ${port} appears to be available (lsof command failed)`, 'Port Allocation');
                return port;
            }
        }

        const extendedEndPort = endPort + 1000;
        this.logsService.warn(
            `No available ports found between ${startPort} and ${endPort}, trying extended range up to ${extendedEndPort}`,
            'Port Allocation'
        );

        for (let port = endPort + 1; port <= extendedEndPort; port++) {
            try {
                const { stdout } = await execAsync(`lsof -i:${port} || echo 'PORT_FREE'`, { timeout: 5000 });

                if (stdout.includes('PORT_FREE')) {
                    this.logsService.logPortAllocation(`Found available port in extended range: ${port}`);
                    return port;
                }
            } catch (error) {
                this.logsService.debug(`Port ${port} in extended range appears to be available`, 'Port Allocation');
                return port;
            }
        }

        const randomPort = Math.floor(Math.random() * 10000) + 10000;
        this.logsService.warn(`No available ports found in extended range, using random port: ${randomPort}`, 'Port Allocation');
        return randomPort;
    }

    private generateNodejsDockerfile(project: any): string {
        const nodeVersion = '23';
        const installCommand = project.installCommand || 'npm install';
        const buildCommand = project.buildCommand || '';
        const startCommand = project.startCommand || 'npm start';

        this.logsService.debug(
            `Project commands - Install: ${installCommand}, Build: ${buildCommand}, Start: ${startCommand}`,
            'Docker Container'
        );

        let dockerfile = `FROM node:${nodeVersion}-alpine

WORKDIR /app

COPY package*.json ./

RUN ${installCommand}

COPY . .

`;

        if (buildCommand) {
            dockerfile += `RUN ${buildCommand}

`;
        }

        dockerfile += `EXPOSE \${PORT:-3000}

ENV NODE_ENV=production
ENV PORT=\${PORT:-3000}
ENV HOST=0.0.0.0

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
            logs += '\nStopping any existing SSH tunnels for this project...\n';
            try {
                await this.tunnelingService.stopTunnel(project.id);
                logs += 'Successfully stopped existing tunnel\n';
            } catch (error) {
                logs += `Warning: Failed to stop SSH tunnel: ${error.message}\n`;
            }
            await updateLogs(logs);

            await execAsync(`docker stop ${containerName} || true`, { timeout: 15000 });
            await execAsync(`docker rm ${containerName} || true`, { timeout: 15000 });
            logs += '\nCleaned up existing container\n';
            await updateLogs(logs);

            const rootFolder = project.rootFolder || '/';
            const isSubDir = rootFolder && rootFolder !== '/';
            logs += `\nBuilding Docker image: ${imageName} from ${workingDir}\n`;
            if (isSubDir) {
                logs += `(Using subdirectory specified by rootFolder: ${rootFolder})\n`;
            }
            await updateLogs(logs);

            const buildCommand = `cd ${workingDir} && docker build -t ${imageName} .`;
            const { stdout: buildStdout, stderr: buildStderr } = await execAsync(buildCommand, { timeout: 300000 }); // 5 minutes timeout for build
            logs += buildStdout + buildStderr;
            await updateLogs(logs);

            const port = await this.findAvailablePort(3000, 3999);
            logs += `\nAssigned port ${port} to container\n`;
            await updateLogs(logs);

            const containerEnv = {
                ...envVars,
                PORT: port.toString(),
                HOST: '0.0.0.0',
                OCEAN_CONTAINER_NAME: containerName,
                OCEAN_ASSIGNED_PORT: port.toString(),
                OCEAN_APP_URL: `http://localhost:${port}`,
            };

            const envArgs = Object.entries(containerEnv)
                .map(([key, value]) => `-e ${key}=${value}`)
                .join(' ');

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

            const { stdout: runStdout } = await execAsync(runCommand, { timeout: 30000 });
            logs += runStdout;
            await updateLogs(logs);

            logs += '\nWaiting for container to be healthy...\n';
            await updateLogs(logs);

            try {
                await new Promise((resolve) => setTimeout(resolve, 5000));
                await this.containerHealthService.checkContainerHealth(deploymentId);
                logs += `\nContainer health check passed\n`;
            } catch (error) {
                logs += `\nContainer health check failed: ${error.message}\n`;
                await updateLogs(logs);
                throw new Error(`Container health check failed: ${error.message}`);
            }
            await updateLogs(logs);

            await updateDeployment({
                containerName,
                containerPort: port,
                monitoringEnabled: true,
            });

            logs += '\nSetting up SSH tunnel for the application...\n';
            await updateLogs(logs);

            let tunnelUrl: string | null = null;
            try {
                tunnelUrl = await this.tunnelingService.createTunnel(project.id, port);
                logs += `Application is accessible at: ${tunnelUrl}\n`;
                logs += 'Successfully updated application URL in database\n';
            } catch (error) {
                logs += `Warning: Failed to set up SSH tunnel: ${error.message}\n`;
                this.logger.warn(`Failed to set up SSH tunnel for project ${project.id}: ${error.message}`, error.stack);
            }
            await updateLogs(logs);

            const envFileContent = Object.entries(containerEnv)
                .map(([key, value]) => `${key}=${value}`)
                .join('\n');
            fs.writeFileSync(path.join(workingDir, '.env'), envFileContent);
            logs += `\nUpdated .env file with container configuration\n`;
            await updateLogs(logs);

            await updateDeployment({
                status: 'completed',
                containerName,
                containerPort: port,
            });

            if (tunnelUrl) {
                logs += `\nDeployment completed successfully. Application URL: ${tunnelUrl}`;
            } else {
                logs += `\nDeployment completed, but SSH tunnel setup failed. Application is running locally on port ${port}.\n`;
            }
            await updateLogs(logs);
        } catch (error) {
            this.logsService.error(`Docker deployment failed: ${error.message}`, error, 'Docker Container');
            logs += `\nError: ${error.message}\n`;
            await updateLogs(logs);
            await updateDeployment({
                status: 'failed',
            });
            throw error;
        }
    }
}