import { Controller, Get, Query } from '@nestjs/common';
import { APP_NAME } from '@repo/constants';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';

@Controller()
export class AppController {
  @AllowAnonymous()
  @Get()
  getRoot(@Query('error') error?: string) {
    if (error === 'TOKEN_EXPIRED') {
      return {
        message: `${APP_NAME} backend is running!`,
        error: 'TOKEN_EXPIRED',
        description: 'The token has expired. Please try again.',
      };
    }

    return {
      message: `${APP_NAME} backend is running!`,
    };
  }
}
