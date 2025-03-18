import { Injectable, NotFoundException, ConflictException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEnvironmentDto } from './dto/create-environment.dto';
import { UpdateEnvironmentDto } from './dto/update-environment.dto';
import { Environment } from '@prisma/client';
import { ProjectsService } from '../projects/projects.service';

@Injectable()
export class EnvironmentsService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => ProjectsService))
    private projectsService: ProjectsService,
  ) {}

  async create(createEnvironmentDto: CreateEnvironmentDto): Promise<Environment> {
    // Verify project exists
    await this.projectsService.findOne(createEnvironmentDto.projectId);

    try {
      return await this.prisma.environment.create({
        data: createEnvironmentDto,
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException(`Environment variable with key '${createEnvironmentDto.key}' already exists for this project`);
      }
      throw error;
    }
  }

  async findAll(): Promise<Environment[]> {
    return await this.prisma.environment.findMany();
  }

  async findByProject(projectId: number): Promise<Environment[]> {
    // Verify project exists
    await this.projectsService.findOne(projectId);

    return await this.prisma.environment.findMany({
      where: { projectId },
    });
  }

  async findOne(id: number): Promise<Environment> {
    const environment = await this.prisma.environment.findUnique({
      where: { id },
    });

    if (!environment) {
      throw new NotFoundException(`Environment variable with ID ${id} not found`);
    }

    return environment;
  }

  async update(id: number, updateEnvironmentDto: UpdateEnvironmentDto): Promise<Environment> {
    await this.findOne(id); // Check if environment exists

    try {
      return await this.prisma.environment.update({
        where: { id },
        data: updateEnvironmentDto,
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException(`Environment variable with this key already exists for this project`);
      }
      throw error;
    }
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id); // Check if environment exists
    await this.prisma.environment.delete({
      where: { id },
    });
  }

  async getEnvironmentVariablesForDeployment(projectId: number): Promise<Record<string, string>> {
    const envVars = await this.prisma.environment.findMany({
      where: { projectId },
      select: { key: true, value: true },
    });

    return envVars.reduce((acc, env) => {
      acc[env.key] = env.value;
      return acc;
    }, {} as Record<string, string>);
  }
}
