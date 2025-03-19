import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Project } from '@prisma/client';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async create(createProjectDto: CreateProjectDto): Promise<Project> {
    return await this.prisma.project.create({
      data: createProjectDto,
    });
  }

  async findAll(): Promise<Project[]> {
    return await this.prisma.project.findMany();
  }

  async findOne(id: number): Promise<Project> {
    const project = await this.prisma.project.findUnique({
      where: { id },
    });
    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }
    return project;
  }

  async update(id: number, updateProjectDto: UpdateProjectDto): Promise<Project> {
    await this.findOne(id); // Check if project exists
    return await this.prisma.project.update({
      where: { id },
      data: updateProjectDto,
    });
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id); // Check if project exists
    await this.prisma.project.delete({
      where: { id },
    });
  }

  async getLogs(id: number): Promise<string[]> {
    const project = await this.findOne(id);
    if (!project) {
      throw new Error('Project not found');
    }

    try {
      const serviceName = `ocean-project-${project.id}`
      const { stdout } = await execAsync(`docker logs --tail 1000 ${serviceName}`);
      return stdout.split('\n').filter(line => line.length > 0);
    } catch (error) {
      console.error('Error fetching container logs:', error);
      throw new Error('Failed to fetch container logs');
    }
  }
}