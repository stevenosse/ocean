import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateDeploymentDto } from './dto/create-deployment.dto';
import { DeploymentStatus } from '@prisma/client';
import { ProjectsService } from '../projects/projects.service';
import { PrismaService } from '../prisma/prisma.service';
import { DeploymentWorkerService } from './deployment-worker.service';
import { Deployment } from '@prisma/client';

@Injectable()
export class DeploymentsService {
  constructor(
    private prisma: PrismaService,
    private projectsService: ProjectsService,
    private deploymentWorkerService: DeploymentWorkerService,
  ) { }

  async create(createDeploymentDto: CreateDeploymentDto): Promise<Deployment> {
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
}