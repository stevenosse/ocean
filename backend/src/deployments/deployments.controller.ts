import { Controller, Get, Post, Body, Param, NotFoundException, BadRequestException, UseGuards } from '@nestjs/common';
import { DeploymentsService } from './deployments.service';
import { CreateDeploymentDto } from './dto/create-deployment.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('deployments')
@UseGuards(JwtAuthGuard)
export class DeploymentsController {
  constructor(private readonly deploymentsService: DeploymentsService) { }

  @Post()
  async create(@Body() createDeploymentDto: CreateDeploymentDto) {
    try {
      return await this.deploymentsService.create(createDeploymentDto);
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to create deployment');
    }
  }

  @Get()
  async findAll() {
    return await this.deploymentsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const deployment = await this.deploymentsService.findOne(+id);
    if (!deployment) {
      throw new NotFoundException('Deployment not found');
    }
    return deployment;
  }

  @Get('project/:projectId')
  async findByProject(@Param('projectId') projectId: string) {
    return await this.deploymentsService.findByProject(+projectId);
  }
}