import { Controller, Get, Patch, Post, Put, Param, Query, Body, UseGuards, ParseIntPipe, ForbiddenException } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { UsersService } from './users.service';
import { User } from '../auth/entities/user.entity';
import { CreateUserAdminDto } from './dto/create-user-admin.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getMe(@CurrentUser() user: User) {
    return this.usersService.findMe(user.id);
  }

  @Get()
  async getAllUsers(
    @CurrentUser() user: User,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    if (user.role?.toUpperCase() !== 'ADMIN') {
      throw new ForbiddenException('Only administrators can access this resource.');
    }
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.usersService.findAll(pageNum, limitNum, search || '');
  }

  @Get(':id')
  async getUserById(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
  ) {
    if (user.role?.toUpperCase() !== 'ADMIN') {
      throw new ForbiddenException('Only administrators can access this resource.');
    }
    return this.usersService.findById(id);
  }

  @Post()
  async createUser(
    @CurrentUser() user: User,
    @Body() dto: CreateUserAdminDto,
  ) {
    if (user.role?.toUpperCase() !== 'ADMIN') {
      throw new ForbiddenException('Only administrators can perform this action.');
    }
    return this.usersService.create(dto);
  }

  @Put(':id')
  async updateUser(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
  ) {
    if (user.role?.toUpperCase() !== 'ADMIN') {
      throw new ForbiddenException('Only administrators can perform this action.');
    }
    return this.usersService.updateUser(id, dto);
  }

  @Patch(':id/deactivate')
  async deactivateUser(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
  ) {
    if (user.role?.toUpperCase() !== 'ADMIN') {
      throw new ForbiddenException('Only administrators can perform this action.');
    }
    return this.usersService.deactivate(id);
  }

  @Patch(':id/activate')
  async activateUser(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
  ) {
    if (user.role?.toUpperCase() !== 'ADMIN') {
      throw new ForbiddenException('Only administrators can perform this action.');
    }
    return this.usersService.activate(id);
  }
}
