import {
  Controller,
  Post,
  Param,
  Body,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { TemplatesService } from './templates.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { User } from '../auth/entities/user.entity';

@UseGuards(JwtAuthGuard)
@Controller('templates')
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Post()
  createTemplate(
    @Body('formId', ParseIntPipe) formId: number,
    @Body('title') title: string | undefined,
    @Body('description') description: string | undefined,
    @CurrentUser() user: User,
  ) {
    return this.templatesService.createTemplateFromForm(
      formId,
      title,
      description,
      user,
    );
  }

  @Post(':id/create-form')
  createFormFromTemplate(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ) {
    return this.templatesService.createFormFromTemplate(id, user);
  }
}
