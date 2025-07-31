import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.enableCors({
    origin: process.env.NODE_ENV === 'development' ? true : process.env.FRONTEND_URL,
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle('MemoryTree API')
    .setDescription('Private life archive for meaningful self-reflection')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('fragments', 'Life fragments - thoughts, dreams, reflections')
    .addTag('users', 'User management and profiles')
    .addTag('auth', 'Authentication and authorization')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    customSiteTitle: 'MemoryTree API Documentation',
    customfavIcon: '/favicon.ico',
    customCss: '.swagger-ui .topbar { display: none }',
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  logger.log(`MemoryTree API is running on: http://localhost:${port}`);
  logger.log(`API Documentation available at: http://localhost:${port}/api`);
}

bootstrap().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});
