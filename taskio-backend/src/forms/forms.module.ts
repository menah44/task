import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FormsService } from './forms.service';
import { FormsController } from './forms.controller';
import { Form } from './entities/form.entity';
import { Section } from './entities/section.entity';
import { Question } from './entities/question.entity';
import { FormVersion } from './entities/form-version.entity';
import { Template } from './entities/template.entity';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Form, Section, Question, FormVersion, Template]),
    AuditModule,
    AuthModule,
  ],
  controllers: [FormsController],
  providers: [FormsService],
  exports: [FormsService],
})
export class FormsModule {}
