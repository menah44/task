import { Injectable, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { User } from './auth/entities/user.entity';

@Injectable()
export class AppService implements OnModuleInit {
  constructor(private dataSource: DataSource) {}

  async onModuleInit() {
    const userRepository = this.dataSource.getRepository(User);

    // التأكد إذا كان هناك مستخدمين أم لا
    const adminExists = await userRepository.findOne({
      where: { email: 'admin@taskio.com' },
    });

    if (!adminExists) {
      const defaultAdmin = userRepository.create({
        email: 'admin@taskio.com',
        // الباسورد المتشفر لـ 123456
        password:
          '$2a$10$X7mBLCgfS.eT69Bv67VpleLzV9LIdrWz8XpExfJskG2X8tY00GvOG',
        role: 'ADMIN',
      });
      await userRepository.save(defaultAdmin);
      console.log('✅ Default Admin created successfully via Code!');
    }
  }

  getHello(): string {
    return 'Hello World!';
  }
}
