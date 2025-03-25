import { Controller, Post, Body, Headers, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
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
  ) {
    try {
      this.logger.log(`Received GitHub webhook event: ${event}, delivery: ${delivery}`);
      
      // Verify the webhook signature first
      const isValid = await this.webhooksService.verifyWebhookSignature(payload, signature);
      if (!isValid) {
        this.logger.error('Invalid webhook signature');
        throw new BadRequestException('Invalid webhook signature');
      }
      
      // Handle different event types
      switch (event) {
        case 'push':
          // Process push events for auto-deployments
          const result = await this.webhooksService.processGithubWebhook(payload);
          this.logger.log(`Successfully processed GitHub push webhook: ${JSON.stringify(result)}`);
          return result;
          
        case 'installation':
        case 'installation_repositories':
          // Handle GitHub App installation events
          this.logger.log(`Received GitHub App installation event: ${payload.action}`);
          // TODO: Handle installation events if needed
          return { message: `Processed installation event: ${payload.action}` };
          
        case 'ping':
          // Respond to ping events (sent when webhook is first configured)
          this.logger.log('Received ping event from GitHub');
          return { message: 'pong', success: true };
          
        default:
          // Log but ignore other event types
          this.logger.log(`Ignoring unsupported event type: ${event}`);
          return { message: `Ignoring event: ${event}` };
      }
    } catch (error) {
      this.logger.error(`Failed to process webhook: ${error.message}`, error.stack);
      throw new BadRequestException(error.message || 'Failed to process webhook');
    }
  }
}