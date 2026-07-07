import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { QuestionTypesService } from './question-types.service';
import { CreateQuestionTypeDto } from './dto/create-question-type.dto';
import { HeaderAuthGuard } from '../auth/header-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('question-types')
@ApiBearerAuth()
@Controller('question-types')
@UseGuards(HeaderAuthGuard, RolesGuard)
export class QuestionTypesController {
  constructor(private readonly questionTypesService: QuestionTypesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all available question types' })
  findAll() {
    return this.questionTypesService.findAll();
  }

  @Post()
  @Roles('SUPER_ADMIN', 'ADMIN') // Assuming admin only
  @ApiOperation({ summary: 'Register a new question type (Admin only)' })
  create(@Body() createQuestionTypeDto: CreateQuestionTypeDto) {
    return this.questionTypesService.create(createQuestionTypeDto);
  }
}
