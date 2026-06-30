import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { User } from './auth/entities/user.entity';
import { Role } from './roles/entities/role.entity';
import { Group } from './groups/entities/group.entity';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { GroupsModule } from './groups/groups.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'taskio-postgres',
      port: 5432,
      username: 'postgres',
      password: '1234',
      database: 'taskio_db',
      entities: [User, Role, Group],
      synchronize: true,
    }),
    AuthModule,
    UsersModule,
    RolesModule,
    GroupsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
