import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DataSource } from 'typeorm';
import { Role } from './roles/entities/role.entity';
import { User } from './auth/entities/user.entity';

async function bootstrap() {
  if (!process.env.JWT_SECRET) {
    console.error(
      '❌ FATAL ERROR: JWT_SECRET environment variable is missing.',
    );
    process.exit(1);
  }

  console.log('Seeding database starting...');
  const app = await NestFactory.createApplicationContext(AppModule);

  const dataSource = app.get(DataSource);
  const roleRepository = dataSource.getRepository(Role);
  const userRepository = dataSource.getRepository(User);

  // Seed default roles
  const rolesToSeed = ['ADMIN', 'USER', 'SUPER_ADMIN'];
  for (const roleName of rolesToSeed) {
    const exists = await roleRepository.findOne({ where: { name: roleName } });
    if (!exists) {
      const newRole = roleRepository.create({ name: roleName });
      await roleRepository.save(newRole);
      console.log(`✅ Role seeded: ${roleName}`);
    } else {
      console.log(`ℹ️ Role already exists: ${roleName}`);
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
      password: '$2b$10$qCVz09lo4SwOYUmkxEdf.unz.CEmw6yZDOcKiJ2c.rDtmxcJ6clD.',
      role: 'SUPER_ADMIN',
    });
    await userRepository.save(defaultAdmin);
    console.log('✅ Default Admin created successfully via Seed Script!');
  } else {
    // If admin exists, ensure their password is correct hash of '123456'
    adminExists.password =
      '$2b$10$qCVz09lo4SwOYUmkxEdf.unz.CEmw6yZDOcKiJ2c.rDtmxcJ6clD.';
    adminExists.role = 'SUPER_ADMIN';
    await userRepository.save(adminExists);
    console.log(
      '✅ Default Admin password/role verified & updated successfully!',
    );
  }

  await app.close();
  console.log('Database seeding finished successfully!');
}

bootstrap().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
