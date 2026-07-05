import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { User } from './auth/entities/user.entity';
import { Role } from './roles/entities/role.entity';
import { Group } from './groups/entities/group.entity';
import { AuditLog } from './audit/entities/audit-log.entity';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { GroupsModule } from './groups/groups.module';
import { AuditModule } from './audit/audit.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { OrganizationsModule } from './organizations/organizations.module';
import { Organization } from './organizations/entities/organization.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || '1234',
      database: process.env.DB_NAME,
      entities: [User, Role, Group, AuditLog, Organization],
      synchronize: true,
    }),
    AuthModule,
    UsersModule,
    RolesModule,
    GroupsModule,
    AuditModule,
    EventEmitterModule.forRoot(),
    OrganizationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
