import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { User } from './auth/entities/user.entity';
import { AuthModule } from './auth/auth.module'; // 1. تأكد من استيراد الـ UserModule هنا

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: '1234',
      database: 'taskio_db',
      entities: [User],
      synchronize: true,
    }),
    AuthModule, // 2. تأكد من إضافة الـ AuthModule هنا جوه الـ imports!
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
