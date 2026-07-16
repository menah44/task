import { isElevatedRole } from '../auth/auth.utils';
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  ParseIntPipe,
  UseGuards,
  ForbiddenException,
  Body,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { HeaderAuthGuard } from '../auth/header-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { User } from '../auth/entities/user.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@ApiTags('roles')
@ApiBearerAuth()
@Controller('roles')
@UseGuards(HeaderAuthGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  async findAll(@CurrentUser() currentUser: User) {
    if (
      !isElevatedRole(currentUser?.role)
    ) {
      throw new ForbiddenException(
        'Only administrators can access this resource.',
      );
    }
    return this.rolesService.findAll(currentUser);
  }

  @Post()
  async createRole(
    @CurrentUser() currentUser: User,
    @Body() dto: CreateRoleDto,
  ) {
    if (
      !isElevatedRole(currentUser?.role)
    ) {
      throw new ForbiddenException(
        'Only administrators can perform this action.',
      );
    }
    return this.rolesService.createRole(dto, currentUser);
  }

  @Delete(':id')
  async deleteRole(
    @CurrentUser() currentUser: User,
    @Param('id', ParseIntPipe) id: number,
  ) {
    if (
      !isElevatedRole(currentUser?.role)
    ) {
      throw new ForbiddenException(
        'Only administrators can perform this action.',
      );
    }
    return this.rolesService.deleteRole(id, currentUser);
  }

  @Put(':id')
  async updateRole(
    @CurrentUser() currentUser: User,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRoleDto,
  ) {
    if (
      !isElevatedRole(currentUser?.role)
    ) {
      throw new ForbiddenException(
        'Only administrators can perform this action.',
      );
    }
    return this.rolesService.updateRole(id, dto, currentUser);
  }

  @Post(':roleId/users/:userId')
  async assignRole(
    @CurrentUser() currentUser: User,
    @Param('roleId', ParseIntPipe) roleId: number,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    if (
      !isElevatedRole(currentUser?.role)
    ) {
      throw new ForbiddenException(
        'Only administrators can perform this action.',
      );
    }
    return this.rolesService.assignUserToRole(roleId, userId, currentUser);
  }

  @Delete(':roleId/users/:userId')
  async removeRole(
    @CurrentUser() currentUser: User,
    @Param('roleId', ParseIntPipe) roleId: number,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    if (
      !isElevatedRole(currentUser?.role)
    ) {
      throw new ForbiddenException(
        'Only administrators can perform this action.',
      );
    }
    return this.rolesService.removeUserFromRole(roleId, userId, currentUser);
  }

  @Get(':roleId/users')
  async getUsersForRole(
    @CurrentUser() currentUser: User,
    @Param('roleId', ParseIntPipe) roleId: number,
  ) {
    if (
      !isElevatedRole(currentUser?.role)
    ) {
      throw new ForbiddenException(
        'Only administrators can access this resource.',
      );
    }
    return this.rolesService.getUsersForRole(roleId, currentUser);
  }
}
