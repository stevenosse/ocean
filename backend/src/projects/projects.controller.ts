import { Controller, Get, Post, Body, Patch, Param, Delete, HttpStatus, HttpException, BadRequestException, Res, Header, UseGuards } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { DeploymentsService } from '../deployments/deployments.service';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('projects')
@ApiTags('projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly deploymentsService: DeploymentsService
  ) { }

  @Post()
  async create(@Body() createProjectDto: CreateProjectDto) {
    try {
      return await this.projectsService.create(createProjectDto);
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to create project');
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
      const project = await this.projectsService.findOne(+id);

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

  @Get(':id/logs')
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate, private')
  async getLogs(@Param('id') id: string): Promise<string[]> {
    try {
      return await this.projectsService.getLogs(+id);
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to fetch container logs');
    }
  }
}