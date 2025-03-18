import { Controller, Get, Post, Body, Patch, Param, Delete, HttpStatus, HttpException } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { DeploymentsService } from '../deployments/deployments.service';

@Controller('projects')
export class ProjectsController {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly deploymentsService: DeploymentsService
  ) {}

  @Post()
  async create(@Body() createProjectDto: CreateProjectDto) {
    try {
      return await this.projectsService.create(createProjectDto);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to create project',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get()
  async findAll() {
    return await this.projectsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const project = await this.projectsService.findOne(+id);
    if (!project) {
      throw new HttpException('Project not found', HttpStatus.NOT_FOUND);
    }
    return project;
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateProjectDto: UpdateProjectDto) {
    try {
      return await this.projectsService.update(+id, updateProjectDto);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to update project',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      return await this.projectsService.remove(+id);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to delete project',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post(':id/deploy')
  async triggerDeploy(@Param('id') id: string) {
    try {
      // Verify project exists
      const project = await this.projectsService.findOne(+id);
      
      // Create a deployment for this project
      return await this.deploymentsService.create({
        projectId: project.id,
        commitHash: '',
        commitMessage: 'Manual deployment'
      });
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to trigger deployment',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}