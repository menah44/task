import { Injectable, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { User } from './auth/entities/user.entity';
import { Role } from './roles/entities/role.entity';

@Injectable()
export class AppService implements OnModuleInit {
  constructor(private dataSource: DataSource) {}

  async onModuleInit() {
    const roleRepository = this.dataSource.getRepository(Role);
    const userRepository = this.dataSource.getRepository(User);

    // Seed default roles
    const rolesToSeed = ['ADMIN', 'USER', 'SUPER_ADMIN'];
    for (const roleName of rolesToSeed) {
      const exists = await roleRepository.findOne({
        where: { name: roleName },
      });
      if (!exists) {
        const newRole = roleRepository.create({ name: roleName });
        await roleRepository.save(newRole);
        console.log(`✅ Role seeded: ${roleName}`);
      }
    }

    // Seed default admin
    const adminExists = await userRepository.findOne({
      where: { email: 'admin@taskio.com' },
    });

    if (!adminExists) {
      const defaultAdmin = userRepository.create({
        email: 'admin@taskio.com',
        // Correct bcrypt hash of '123456'
        password:
          '$2b$10$qCVz09lo4SwOYUmkxEdf.unz.CEmw6yZDOcKiJ2c.rDtmxcJ6clD.',
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
