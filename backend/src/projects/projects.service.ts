import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Project } from '@prisma/client';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import { TunnelingService } from '../tunneling/tunneling.service';

const execAsync = promisify(exec);

@Injectable()
export class ProjectsService {
  constructor(
    private prisma: PrismaService,
    private tunnelingService: TunnelingService
  ) { }

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
    await this.findOne(id);
    return await this.prisma.project.update({
      where: { id },
      data: updateProjectDto,
    });
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id);

    await this.prisma.$transaction(async (prisma) => {
      const containerName = `ocean-project-${id}`;

      try {
        await this.tunnelingService.stopTunnel(id);
      } catch (error) {
        console.warn(`Failed to stop SSH tunnel for project ${id}: ${error.message}`);
      }

      try {
        await execAsync(`docker stop ${containerName} || true`);
        await execAsync(`docker rm ${containerName} || true`);
      } catch (error) {
        console.warn(`Failed to stop/remove container for project ${id}: ${error.message}`);
      }

      try {
        const repoDir = path.join(process.cwd(), process.env.DEPLOYED_APPS_DIR, `project-${id}`);

        if (fs.existsSync(repoDir)) {
          fs.rmSync(repoDir, { recursive: true, force: true });
        }
      } catch (error) {
        console.warn(`Failed to delete project files for project ${id}: ${error.message}`);
      }

      await prisma.deployment.deleteMany({
        where: { projectId: id }
      });

      const databases = await prisma.managedDatabase.findMany({
        where: { projectId: id }
      });
      for (const db of databases) {
        try {
          await execAsync(`dropdb ${db.name} || true`);
          await execAsync(`psql -c "DROP USER ${db.username}" || true`);
        } catch (error) {
          console.warn(`Failed to delete database ${db.name} for project ${id}: ${error.message}`);
        }
      }

      await prisma.managedDatabase.deleteMany({
        where: { projectId: id }
      });
      await prisma.project.delete({
        where: { id }
      });
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