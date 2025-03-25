import { Controller, Post, Body, Headers, BadRequestException, NotFoundException } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';

@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post('github')
  async handleGithubWebhook(
    @Headers('x-github-event') event: string,
    @Headers('x-hub-signature-256') signature: string,
    @Body() payload: any,
  ) {
    try {
      console.log('Received webhook event:', event);
      if (event !== 'push') {
        return { message: `Ignoring event: ${event}` };
      }

      const isValid = await this.webhooksService.verifyWebhookSignature(payload, signature);
      if (!isValid) {
        throw new NotFoundException('Invalid webhook signature');
      }

      const result = await this.webhooksService.processGithubWebhook(payload);
      return result;
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to process webhook');
    }
  }
}