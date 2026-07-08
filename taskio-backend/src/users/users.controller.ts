import {
  Controller,
  Get,
  Patch,
  Post,
  Put,
  Param,
  Query,
  Body,
  UseGuards,
  ParseIntPipe,
  ForbiddenException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { HeaderAuthGuard } from '../auth/header-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { UsersService } from './users.service';
import { User } from '../auth/entities/user.entity';
import { CreateUserAdminDto } from './dto/create-user-admin.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(HeaderAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getMe(@CurrentUser() user: User) {
    console.log('Users Me Role:', user.role);
    return this.usersService.findMe(user.id);
  }

  @Get()
  async getAllUsers(
    @CurrentUser() user: User,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const userRole = user.role?.toUpperCase();
    if (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
      throw new ForbiddenException(
        'Only administrators can access this resource.',
      );
    }
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;

    // Pass user.organization.id or user.orgId if user is an ADMIN (not SUPER_ADMIN)
    const orgId =
      userRole === 'ADMIN' ? user.organization?.id || user.orgId : undefined;
    return this.usersService.findAll(pageNum, limitNum, search || '', orgId);
  }

  @Get(':id')
  async getUserById(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const userRole = user.role?.toUpperCase();
    if (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
      throw new ForbiddenException(
        'Only administrators can access this resource.',
      );
    }
    return this.usersService.findById(id, user);
  }

  @Get(':id/roles')
  async getUserRoles(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const userRole = user.role?.toUpperCase();
    if (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
      throw new ForbiddenException(
        'Only administrators can access this resource.',
      );
    }
    return this.usersService.getUserRoles(id, user);
  }

  @Get(':id/groups')
  async getUserGroups(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const userRole = user.role?.toUpperCase();
    if (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
      throw new ForbiddenException(
        'Only administrators can access this resource.',
      );
    }
    return this.usersService.getUserGroups(id, user);
  }

  @Post()
  async createUser(@CurrentUser() user: User, @Body() dto: CreateUserAdminDto) {
    const userRole = user.role?.toUpperCase();
    if (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
      throw new ForbiddenException(
        'Only administrators can perform this action.',
      );
    }
    if (
      dto.role?.toUpperCase() === 'SUPER_ADMIN' &&
      userRole !== 'SUPER_ADMIN'
    ) {
      throw new ForbiddenException(
        'You do not have permission to assign the SUPER_ADMIN role.',
      );
    }

    // For ADMIN, we pass their organization to automatically bind the new user to it
    const org =
      userRole === 'ADMIN'
        ? user.organization || ({ id: user.orgId } as any)
        : undefined;
    return this.usersService.create(dto, org, user);
  }

  @Put(':id')
  async updateUser(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
  ) {
    const userRole = user.role?.toUpperCase();
    if (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
      throw new ForbiddenException(
        'Only administrators can perform this action.',
      );
    }
    if (
      dto.role?.toUpperCase() === 'SUPER_ADMIN' &&
      userRole !== 'SUPER_ADMIN'
    ) {
      throw new ForbiddenException(
        'You do not have permission to assign the SUPER_ADMIN role.',
      );
    }
    return this.usersService.updateUser(id, dto, user);
  }

  @Patch(':id/deactivate')
  async deactivateUser(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const userRole = user.role?.toUpperCase();
    if (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
      throw new ForbiddenException(
        'Only administrators can perform this action.',
      );
    }
    return this.usersService.deactivate(id, user);
  }

  @Patch(':id/activate')
  async activateUser(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const userRole = user.role?.toUpperCase();
    if (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
      throw new ForbiddenException(
        'Only administrators can perform this action.',
      );
    }
    return this.usersService.activate(id, user);
  }
}
