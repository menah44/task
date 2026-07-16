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
    const limitNumber = limit ? parseInt(limit, 10) : 0;
    return this.formsService.findAll(
      user,
      pageNumber,
      limitNumber,
      status,
      search,
    );
  }

  @Get(':id/structure')
  async getStructure(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ) {
    const form = await this.formsService.findOne(id, user);
    const settings =
      (form.settings as {
        showProgress?: boolean;
        hasBoundary?: boolean;
        restrictByLocation?: boolean;
        [key: string]: unknown;
      }) || {};
    return {
      id: form.id,
      title: form.title,
      description: form.description,
      showProgress: settings.showProgress ?? true,
      hasBoundary: settings.hasBoundary ?? false,
      restrictByLocation: settings.restrictByLocation ?? false,
      sections: form.sections || [],
    };
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User) {
    return this.formsService.findOne(id, user);
  }

  @Post(':id/versions')
  createVersion(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ): Promise<{ newFormId: number; versionNumber: number }> {
    return this.formsService.createVersion(id, user);
  }

  @Get(':id/versions')
  getVersions(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ): Promise<any[]> {
    return this.formsService.getVersions(id, user);
  }

  @Get(':id/versions/:versionNumber')
  getVersionSnapshot(
    @Param('id', ParseIntPipe) id: number,
    @Param('versionNumber', ParseIntPipe) versionNumber: number,
    @CurrentUser() user: User,
  ): Promise<Record<string, unknown>> {
    return this.formsService.getVersionSnapshot(id, versionNumber, user);
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
    @Body()
    settingsPayload:
      Record<string, unknown> | { settings: Record<string, unknown> },
    @CurrentUser() user: User,
  ) {
    // Support both direct settings or nested settings structure
    const isNested =
      'settings' in settingsPayload &&
      typeof settingsPayload.settings === 'object' &&
      settingsPayload.settings !== null;
    const settings = isNested
      ? (settingsPayload as { settings: Record<string, unknown> }).settings
      : settingsPayload;

    return this.formsService.updateSettings(id, settings, user);
  }

  @Get(':id/boundary')
  getBoundary(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ): Promise<Record<string, unknown> | null> {
    return this.formsService.getBoundary(id, user);
  }

  @Put(':id/boundary')
  updateBoundary(
    @Param('id', ParseIntPipe) id: number,
    @Body() boundary: Record<string, unknown>,
    @CurrentUser() user: User,
  ) {
    return this.formsService.updateBoundary(id, boundary, user);
  }
}
