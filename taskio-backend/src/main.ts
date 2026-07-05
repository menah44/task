import 'reflect-metadata';
import * as dotenv from 'dotenv';
dotenv.config();
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  if (!process.env.JWT_SECRET) {
    console.error(' FATAL ERROR: JWT_SECRET environment variable is missing.');
    process.exit(1);
  }

  const app = await NestFactory.create(AppModule);

  console.log('DB_HOST:', process.env.DB_HOST);
  console.log('DB_NAME:', process.env.DB_NAME);

  // Enable global validation pipe for request validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const options = new DocumentBuilder()
    .setTitle('Form API')
    .setDescription('Form API documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('api', app, document);

  // Enable CORS
  let allowedOrigins: string[];
  if (process.env.CORS_ORIGINS) {
    allowedOrigins = process.env.CORS_ORIGINS.split(',').map((origin) =>
      origin.trim(),
    );
  } else {
    if (process.env.NODE_ENV === 'production') {
      console.error(
        ' FATAL ERROR: CORS_ORIGINS environment variable is required in production.',
      );
      process.exit(1);
    }
    console.warn(
      ' WARNING: CORS_ORIGINS environment variable is missing. Defaulting to local development origins: http://localhost:3000, http://localhost:3001',
    );
    allowedOrigins = ['http://localhost:3000', 'http://localhost:3001'];
  }

  app.enableCors({
    origin: allowedOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });
  const port = process.env.PORT || 5000;

  await app.listen(port, '0.0.0.0');
  console.log(`Backend running on ${port}`);
}
bootstrap();
