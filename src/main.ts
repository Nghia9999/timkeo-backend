import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Increase request body size limits to avoid PayloadTooLargeError
  app.use(express.json({ limit: process.env.BODY_LIMIT || '50mb' }));
  app.use(
    express.urlencoded({
      limit: process.env.BODY_LIMIT || '50mb',
      extended: true,
    }),
  );

  // Enable CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    credentials: true,
  });

  // Cấu hình ValidationPipe toàn cục
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Loại bỏ các property không có trong DTO
      forbidNonWhitelisted: true, // Từ chối request nếu có property không hợp lệ
      transform: true, // Tự động transform types
      transformOptions: {
        enableImplicitConversion: true, // Cho phép implicit type conversion
      },
    }),
  );

  await app.listen(process.env.PORT ?? 4000);
}
bootstrap();
