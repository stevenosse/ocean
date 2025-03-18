import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { EnvironmentsService } from './environments.service';
import { CreateEnvironmentDto } from './dto/create-environment.dto';
import { UpdateEnvironmentDto } from './dto/update-environment.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DeploymentsService } from '../deployments/deployments.service';

@ApiTags('environments')
@Controller('environments')
export class EnvironmentsController {
  constructor(
    private readonly environmentsService: EnvironmentsService,
    private readonly deploymentsService: DeploymentsService
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new environment variable' })
  @ApiResponse({ status: 201, description: 'Environment variable created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 409, description: 'Environment variable with this key already exists' })
  async create(@Body() createEnvironmentDto: CreateEnvironmentDto) {
    const env = await this.environmentsService.create(createEnvironmentDto);
    
    // Trigger a deployment for the project
    await this.triggerDeployment(env.projectId, 'Environment variable added');
    
    return env;
  }

  @Get()
  @ApiOperation({ summary: 'Get all environment variables' })
  @ApiResponse({ status: 200, description: 'Return all environment variables' })
  findAll() {
    return this.environmentsService.findAll();
  }

  @Get('project/:projectId')
  @ApiOperation({ summary: 'Get all environment variables for a project' })
  @ApiResponse({ status: 200, description: 'Return all environment variables for a project' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  findByProject(@Param('projectId') projectId: string) {
    return this.environmentsService.findByProject(+projectId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an environment variable by ID' })
  @ApiResponse({ status: 200, description: 'Return the environment variable' })
  @ApiResponse({ status: 404, description: 'Environment variable not found' })
  findOne(@Param('id') id: string) {
    return this.environmentsService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an environment variable' })
  @ApiResponse({ status: 200, description: 'Environment variable updated successfully' })
  @ApiResponse({ status: 404, description: 'Environment variable not found' })
  @ApiResponse({ status: 409, description: 'Environment variable with this key already exists' })
  async update(@Param('id') id: string, @Body() updateEnvironmentDto: UpdateEnvironmentDto) {
    // Get the environment variable to get the project ID
    const env = await this.environmentsService.findOne(+id);
    const updatedEnv = await this.environmentsService.update(+id, updateEnvironmentDto);
    
    // Trigger a deployment for the project
    await this.triggerDeployment(env.projectId, 'Environment variable updated');
    
    return updatedEnv;
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an environment variable' })
  @ApiResponse({ status: 200, description: 'Environment variable deleted successfully' })
  @ApiResponse({ status: 404, description: 'Environment variable not found' })
  async remove(@Param('id') id: string) {
    // Get the environment variable to get the project ID
    const env = await this.environmentsService.findOne(+id);
    const projectId = env.projectId;
    
    // Delete the environment variable
    await this.environmentsService.remove(+id);
    
    // Trigger a deployment for the project
    await this.triggerDeployment(projectId, 'Environment variable removed');
    
    return { success: true };
  }

  /**
   * Helper method to trigger a deployment for a project
   */
  private async triggerDeployment(projectId: number, commitMessage: string) {
    try {
      await this.deploymentsService.create({
        projectId,
        commitHash: '',
        commitMessage
      });
    } catch (error) {
      console.error(`Failed to trigger deployment for project ${projectId}:`, error);
      // Don't throw the error as we don't want to fail the environment variable operation
    }
  }
}
