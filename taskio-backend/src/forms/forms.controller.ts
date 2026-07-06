import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { FormsService } from './forms.service';
import { CreateFormDto } from './dto/create-form.dto';
import { UpdateFormDto } from './dto/update-form.dto';
import { HeaderAuthGuard } from '../auth/header-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { User } from '../auth/entities/user.entity';
import { Public } from '../auth/public.decorator';

@ApiTags('forms')
@ApiBearerAuth()
@Controller('forms')
@UseGuards(HeaderAuthGuard)
export class FormsController {
  constructor(private readonly formsService: FormsService) {}

  @Post()
  create(@Body() createFormDto: CreateFormDto, @CurrentUser() user: User) {
    return this.formsService.create(createFormDto, user);
  }

  // Public endpoint must be placed before /:id parameter to avoid route matching conflicts
  @Public()
  @Get('public')
  findPublic() {
    return this.formsService.findPublicForms();
  }

  @Get()
  findAll(
    @CurrentUser() user: User,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    const pageNumber = page ? parseInt(page, 10) : 1;
    const limitNumber = limit ? parseInt(limit, 10) : 10;
    return this.formsService.findAll(
      user,
      pageNumber,
      limitNumber,
      status,
      search,
    );
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

  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: string,
    @CurrentUser() user: User,
  ) {
    return this.formsService.updateStatus(id, status, user);
  }

  @Get(':id/status')
  getStatus(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User) {
    return this.formsService.getStatus(id, user);
  }

  @Put(':id/settings')
  updateSettings(
    @Param('id', ParseIntPipe) id: number,
    @Body() settingsPayload: any,
    @CurrentUser() user: User,
  ) {
    // Support both direct settings or nested settings structure
    const settings =
      settingsPayload.settings !== undefined
        ? settingsPayload.settings
        : settingsPayload;
    return this.formsService.updateSettings(id, settings, user);
  }
}
