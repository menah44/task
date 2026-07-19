import {
  Controller,
  UseGuards,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { GroupsService } from './groups.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { User } from '../auth/entities/user.entity';

@ApiTags('groups')
@ApiBearerAuth()
@Controller('groups')
@UseGuards(JwtAuthGuard)
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Get()
  async findAll(@CurrentUser() user: User) {
    return this.groupsService.findAll(user);
  }

  @Post()
  async create(
    @CurrentUser() user: User,
    @Body('name') name: string,
    @Body('parentId') parentId?: number | null,
  ) {
    return this.groupsService.create(name, parentId, user);
  }

  @Put(':id')
  async update(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Body('name') name: string,
    @Body('parentId') parentId?: number | null,
  ) {
    return this.groupsService.update(id, name, parentId, user);
  }

  @Put(':id/parent/:parentId')
  async updateParent(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Param('parentId') parentIdParam: string,
  ) {
    const parentId =
      parentIdParam === 'null' || parentIdParam === 'root'
        ? null
        : Number(parentIdParam);
    if (parentId !== null && isNaN(parentId)) {
      throw new BadRequestException('Invalid parentId parameter');
    }
    return this.groupsService.updateParent(id, parentId, user);
  }

  @Delete(':id')
  async delete(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.groupsService.delete(id, user);
  }

  @Get(':id/children')
  async getChildren(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.groupsService.getChildren(id, user);
  }

  @Get(':id/members')
  async getMembers(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.groupsService.getMembers(id, user);
  }

  @Post(':id/members')
  async addMember(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Body('userId', ParseIntPipe) userId: number,
  ) {
    return this.groupsService.addMember(id, userId, user);
  }

  @Delete(':id/members/:userId')
  async removeMember(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    return this.groupsService.removeMember(id, userId, user);
  }
}
