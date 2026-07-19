import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ResponsesService } from './responses.service';
import { ResponsesController } from './responses.controller';
import { Response } from '../forms/entities/response.entity';
import { Form } from '../forms/entities/form.entity';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [TypeOrmModule.forFeature([Response, Form]), AuditModule],
  controllers: [ResponsesController],
  providers: [ResponsesService],
  exports: [ResponsesService],
})
export class ResponsesModule {}
