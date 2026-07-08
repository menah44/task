import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SpatialController } from './spatial.controller';
import { SpatialService } from './spatial.service';
import { Response } from '../forms/entities/response.entity';
import { FormsModule } from '../forms/forms.module';

@Module({
  imports: [TypeOrmModule.forFeature([Response]), FormsModule],
  controllers: [SpatialController],
  providers: [SpatialService],
  exports: [SpatialService],
})
export class SpatialModule {}
