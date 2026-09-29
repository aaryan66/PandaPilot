import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { createCorsOriginCheck } from './config/cors-origin';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.enableCors({
    origin: createCorsOriginCheck(config.get<string[]>('frontendOrigin')!),
    methods: ['GET', 'POST'],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('RAG Backend API')
    .setDescription(
      'Boilerplate RAG API — chat, ingestion, and health endpoints for a Next.js chatbox frontend.',
    )
    .setVersion('1.0')
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, swaggerDocument);

  const port = config.get<number>('port') ?? 3001;
  // Render injects PORT and expects the app to bind on 0.0.0.0
  await app.listen(port, '0.0.0.0');
  // eslint-disable-next-line no-console
  console.log(`RAG backend listening on port ${port}`);
  // eslint-disable-next-line no-console
  console.log(`API docs available at http://localhost:${port}/api/docs`);
}

bootstrap();
