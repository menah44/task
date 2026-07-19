import { Controller, Post, Get, Param, Res, UseInterceptors, UploadedFile, UseGuards, BadRequestException, NotFoundException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import * as crypto from 'crypto';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { Response } from 'express';
import { Public } from '../auth/public.decorator';

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

@Controller('files')
export class FilesController {
  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: UPLOADS_DIR,
      filename: (req, file, cb) => {
        const mediaId = crypto.randomUUID();
        const ext = path.extname(file.originalname);
        cb(null, `${mediaId}${ext}`);
      }
    })
  }))
  uploadFile(@UploadedFile() file: any) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    
    const mediaId = path.parse(file.filename).name;
    return {
      mediaId,
      fileName: file.originalname,
      fileType: file.mimetype,
      fileSize: file.size,
    };
  }

  @Public()
  @Get(':mediaId')
  getFile(@Param('mediaId') mediaId: string, @Res() res: Response) {
    const files = fs.readdirSync(UPLOADS_DIR);
    const file = files.find(f => f.startsWith(mediaId));
    
    if (!file) {
      throw new NotFoundException('File not found');
    }
    
    const filePath = path.join(UPLOADS_DIR, file);
    return res.sendFile(filePath);
  }
}
