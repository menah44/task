import * as dotenv from 'dotenv';
dotenv.config();

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

  // Validate SUPER_ADMIN environment variables
  const superAdminName = process.env.SUPER_ADMIN_NAME;
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL;
  const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD;

  if (!superAdminName || !superAdminEmail || !superAdminPassword) {
    console.error(
      '❌ FATAL ERROR: Missing SUPER_ADMIN_NAME, SUPER_ADMIN_EMAIL, or SUPER_ADMIN_PASSWORD environment variables.',
    );
    process.exit(1);
  }

  console.log('Seeding database starting...');
  console.log('Checking roles...');
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
  console.log('Roles completed.');

  console.log('Checking Super Admin...');
  // Check if any SUPER_ADMIN already exists
  const superAdminExists = await userRepository.findOne({
    where: { role: 'SUPER_ADMIN' },
    relations: ['roles'],
  });

  if (superAdminExists) {
    console.log('ℹ️ Super Admin already exists.');

    // One-time synchronization of the roles relation
    const hasRoleRelation = superAdminExists.roles?.some(
      (r) => r.name === 'SUPER_ADMIN',
    );
    if (!hasRoleRelation) {
      console.log('Synchronizing roles relation for existing Super Admin...');
      const superAdminRole = await roleRepository.findOne({
        where: { name: 'SUPER_ADMIN' },
      });
      if (superAdminRole) {
        superAdminExists.roles = superAdminExists.roles
          ? [...superAdminExists.roles, superAdminRole]
          : [superAdminRole];
        await userRepository.save(superAdminExists);
        console.log('✅ Roles relation synchronized successfully.');
      }
    }
  } else {
    console.log('Creating Super Admin...');

    // Hash password dynamically
    const bcrypt = await import('bcrypt');
    const hashedPassword = await bcrypt.hash(superAdminPassword, 10);

    // Split name for firstName and lastName
    const nameParts = superAdminName.split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || undefined;

    const superAdminRole = await roleRepository.findOne({
      where: { name: 'SUPER_ADMIN' },
    });

    const defaultAdmin = userRepository.create({
      email: superAdminEmail,
      password: hashedPassword,
      role: 'SUPER_ADMIN',
      roles: superAdminRole ? [superAdminRole] : [],
      firstName,
      lastName,
    });

    await userRepository.save(defaultAdmin);
    console.log('✅ Super Admin created successfully.');
    console.log(`Email: ${superAdminEmail}`);
    console.log('Password loaded from environment variables.');
  }

  await app.close();
  console.log('Database seeding finished successfully!');
}

bootstrap().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
