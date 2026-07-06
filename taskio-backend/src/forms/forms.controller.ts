import { Controller, Get, Post, Body, Put, Param, Delete, UseGuards, Query, ParseIntPipe } from '@nestjs/common';
import { FormsService } from './forms.service';
import { CreateFormDto } from './dto/create-form.dto';
import { UpdateFormDto } from './dto/update-form.dto';
import { HeaderAuthGuard } from '../auth/header-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { User } from '../auth/entities/user.entity';

@Controller('forms')
@UseGuards(HeaderAuthGuard)
export class FormsController {
  constructor(private readonly formsService: FormsService) {}

  @Post()
  create(@Body() createFormDto: CreateFormDto, @CurrentUser() user: User) {
    return this.formsService.create(createFormDto, user);
  }

  @Get()
  findAll(
    @CurrentUser() user: User,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNumber = page ? parseInt(page, 10) : 1;
    const limitNumber = limit ? parseInt(limit, 10) : 10;
    return this.formsService.findAll(user, pageNumber, limitNumber);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User) {
    return this.formsService.findOne(id, user);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateFormDto: UpdateFormDto,
    @CurrentUser() user: User,
  ) {
    return this.formsService.update(id, updateFormDto, user);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User) {
    return this.formsService.delete(id, user);
  }
}
