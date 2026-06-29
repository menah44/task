import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const options = new DocumentBuilder()
    .setTitle('Taskio API')
    .setDescription('Taskio API documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('api', app, document);

  // تفعيل الـ CORS لتسمح للفرونت إند بالاتصال
  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:3001'], // البورتات اللي شغال عليها الفرونت إند عندك
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true, // لو هتبعت الـ Cookies أو الـ Headers لاحقاً
  });

  await app.listen(3002);
  console.log('Backend running on 3002');
}
bootstrap();
