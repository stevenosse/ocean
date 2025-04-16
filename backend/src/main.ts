import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import * as express from 'express';
import { EventEmitter } from 'events';

async function bootstrap() {
  // Increase max listeners to prevent warnings
  EventEmitter.defaultMaxListeners = 20;
  process.setMaxListeners(20);

  const app = await NestFactory.create(AppModule);

  app.use(helmet());
  app.use(
    helmet({
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: {
        directives: {
          defaultSrc: [`'self'`],
          styleSrc: [`'self'`, `'unsafe-inline'`],
          imgSrc: [`'self'`, 'data:', 'validator.swagger.io'],
          scriptSrc: [`'self'`, `https: 'unsafe-inline'`],
        },
      },
    })
  );

  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3030'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Ocean API')
    .setDescription('The Ocean API documentation')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, document);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Preserve raw body for webhook verification
  app.use(
    express.json({
      verify: (req: any, res, buf) => {
        req.rawBody = buf;
      },
    })
  );

  // Listen for shutdown signals
  const signals = ['SIGTERM', 'SIGINT', 'beforeExit'];
  signals.forEach(signal => {
    let isShuttingDown = false;
    process.on(signal, async () => {
      if (isShuttingDown) return;
      isShuttingDown = true;

      console.log(`Received ${signal}, starting graceful shutdown...`);
      await app.close();
      process.exit(0);
    });
  });

  await app.listen(process.env.PORT || 3000);
}
bootstrap();