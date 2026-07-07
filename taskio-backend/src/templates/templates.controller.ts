import {
  Controller,
  Post,
  Param,
  Body,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { TemplatesService } from './templates.service';
import { HeaderAuthGuard } from '../auth/header-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { User } from '../auth/entities/user.entity';

@UseGuards(HeaderAuthGuard)
@Controller('templates')
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Post()
  createTemplate(
    @Body('formId', ParseIntPipe) formId: number,
    @Body('title') title: string,
    @CurrentUser() user: User,
  ) {
    return this.templatesService.createTemplateFromForm(formId, title, user);
  }

  @Post(':id/create-form')
  createFormFromTemplate(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ) {
    return this.templatesService.createFormFromTemplate(id, user);
  }
}
