import { Controller, Post, Body, Headers, BadRequestException, NotFoundException, Logger, Req } from '@nestjs/common';
import { Request } from 'express';
import { WebhooksService } from './webhooks.service';

@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);
  
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post('github')
  async handleGithubWebhook(
    @Headers('x-github-event') event: string,
    @Headers('x-hub-signature-256') signature: string,
    @Headers('x-github-delivery') delivery: string,
    @Body() payload: any,
    @Req() request: Request,
  ) {
    try {
      this.logger.log(`Received GitHub webhook event: ${event}, delivery: ${delivery}`);
      this.logger.debug(`Received signature: ${signature}`);
      
      const rawBody = (request as any).rawBody || JSON.stringify(payload);
      this.logger.debug(`Raw body length: ${rawBody.length}`);
      
      const isValid = await this.webhooksService.verifyWebhookSignature(rawBody, signature);
      if (!isValid) {
        this.logger.error('Invalid webhook signature');
        throw new BadRequestException('Invalid webhook signature');
      }
      
      switch (event) {
        case 'push':
          const result = await this.webhooksService.processGithubWebhook(payload);
          this.logger.log(`Successfully processed GitHub push webhook: ${JSON.stringify(result)}`);
          return result;
          
        case 'installation':
        case 'installation_repositories':
          this.logger.log(`Received GitHub App installation event: ${payload.action}`);
          return { message: `Processed installation event: ${payload.action}` };
          
        case 'ping':
          this.logger.log('Received ping event from GitHub');
          return { message: 'pong', success: true };
          
        default:
          this.logger.log(`Ignoring unsupported event type: ${event}`);
          return { message: `Ignoring event: ${event}` };
      }
    } catch (error) {
      this.logger.error(`Failed to process webhook: ${error.message}`, error.stack);
      throw new BadRequestException(error.message || 'Failed to process webhook');
    }
  }
}