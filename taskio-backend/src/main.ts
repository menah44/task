import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // تفعيل الـ CORS لتسمح للفرونت إند بالاتصال
  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:3001'], // البورتات اللي شغال عليها الفرونت إند عندك
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true, // لو هتبعت الـ Cookies أو الـ Headers لاحقاً
  });

  await app.listen(3002); // البورت الجديد اللي شغلته عليه بنجاح
}
bootstrap();
