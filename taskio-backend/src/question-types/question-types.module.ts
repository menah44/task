import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuestionTypesController } from './question-types.controller';
import { QuestionTypesService } from './question-types.service';
import { QuestionType } from './entities/question-type.entity';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([QuestionType]), UsersModule, AuthModule],
  controllers: [QuestionTypesController],
  providers: [QuestionTypesService],
  exports: [QuestionTypesService],
})
export class QuestionTypesModule {}
