import { Module } from '@nestjs/common';
import { FilesController } from './files.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [FilesController],
})
export class FilesModule {}
