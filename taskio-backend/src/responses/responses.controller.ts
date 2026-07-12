import {
  Controller,
  Post,
  Put,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ResponsesService } from './responses.service';
import { HeaderAuthGuard } from '../auth/header-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@UseGuards(HeaderAuthGuard)
@Controller('responses')
export class ResponsesController {
  constructor(private readonly responsesService: ResponsesService) {}

  @Get('my-submissions')
  findMySubmissions(@CurrentUser() user: any) {
    return this.responsesService.findMySubmissions(user);
  }

  @Post('forms/:formId')
  createDraft(
    @Param('formId', ParseIntPipe) formId: number,
    @Body('gps') gps: { latitude?: number; longitude?: number; lat?: number; lng?: number } | undefined,
    @CurrentUser() user: any,
  ) {
    return this.responsesService.createDraft(formId, gps, user);
  }

  @Put(':id/answers/bulk')
  saveAnswers(
    @Param('id', ParseIntPipe) id: number,
    @Body('answers') answers: any,
    @CurrentUser() user: any,
  ) {
    return this.responsesService.saveAnswers(id, answers, user);
  }

  @Get(':id/full')
  findOneFull(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    return this.responsesService.findOneFull(id, user);
  }

  @Post(':id/submit')
  submitResponse(
    @Param('id', ParseIntPipe) id: number,
    @Body('gps') gps: { latitude?: number; longitude?: number; lat?: number; lng?: number } | undefined,
    @CurrentUser() user: any,
  ) {
    return this.responsesService.submitResponse(id, gps, user);
  }

  @Get()
  findAll(
    @Query('formId') formId: string | undefined,
    @CurrentUser() user: any,
  ) {
    const parsedFormId = formId ? parseInt(formId, 10) : undefined;
    return this.responsesService.findAll(parsedFormId, user);
  }
}
