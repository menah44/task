import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Put,
  Patch,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { CreateOrganizationAdminDto } from './dto/create-organization-admin.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { User } from '../auth/entities/user.entity';

@Controller('organizations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Post()
  @Roles('SUPER_ADMIN')
  create(@CurrentUser() user: User, @Body() createOrganizationDto: CreateOrganizationDto) {
    return this.organizationsService.create(createOrganizationDto, user);
  }

  @Post(':id/admin')
  @Roles('SUPER_ADMIN')
  createAdmin(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Body() createOrganizationAdminDto: CreateOrganizationAdminDto,
  ) {
    return this.organizationsService.createAdmin(id, createOrganizationAdminDto, user);
  }

  @Get()
  @Roles('SUPER_ADMIN')
  findAll(@Query('page') page: string, @Query('limit') limit: string) {
    const pageNumber = page ? parseInt(page, 10) : 1;
    const limitNumber = limit ? parseInt(limit, 10) : 10;
    return this.organizationsService.findAll(pageNumber, limitNumber);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.organizationsService.findOne(id);
  }

  @Put(':id')
  update(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateOrganizationDto: UpdateOrganizationDto,
  ) {
    return this.organizationsService.update(id, updateOrganizationDto, user);
  }

  @Patch(':id/deactivate')
  deactivate(@CurrentUser() user: User, @Param('id', ParseIntPipe) id: number) {
    return this.organizationsService.deactivate(id, user);
  }
}
