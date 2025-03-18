import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { EnvironmentsService } from './environments.service';
import { CreateEnvironmentDto } from './dto/create-environment.dto';
import { UpdateEnvironmentDto } from './dto/update-environment.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('environments')
@Controller('environments')
export class EnvironmentsController {
  constructor(private readonly environmentsService: EnvironmentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new environment variable' })
  @ApiResponse({ status: 201, description: 'Environment variable created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 409, description: 'Environment variable with this key already exists' })
  create(@Body() createEnvironmentDto: CreateEnvironmentDto) {
    return this.environmentsService.create(createEnvironmentDto);
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
  update(@Param('id') id: string, @Body() updateEnvironmentDto: UpdateEnvironmentDto) {
    return this.environmentsService.update(+id, updateEnvironmentDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an environment variable' })
  @ApiResponse({ status: 200, description: 'Environment variable deleted successfully' })
  @ApiResponse({ status: 404, description: 'Environment variable not found' })
  remove(@Param('id') id: string) {
    return this.environmentsService.remove(+id);
  }
}
