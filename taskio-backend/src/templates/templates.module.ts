import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TemplatesService } from './templates.service';
import { TemplatesController } from './templates.controller';
import { Template } from '../forms/entities/template.entity';
import { Form } from '../forms/entities/form.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Template, Form])],
  controllers: [TemplatesController],
  providers: [TemplatesService],
})
export class TemplatesModule {}
