import { Controller, UseGuards, Get, Post, Put, Delete, Body, Param, ParseIntPipe, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { GroupsService } from './groups.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('groups')
@ApiBearerAuth()
@Controller('groups')
@UseGuards(JwtAuthGuard)
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Get()
  async findAll() {
    return this.groupsService.findAll();
  }

  @Post()
  async create(
    @Body('name') name: string,
    @Body('parentId') parentId?: number | null,
  ) {
    return this.groupsService.create(name, parentId);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body('name') name: string,
    @Body('parentId') parentId?: number | null,
  ) {
    return this.groupsService.update(id, name, parentId);
  }

  @Put(':id/parent/:parentId')
  async updateParent(
    @Param('id', ParseIntPipe) id: number,
    @Param('parentId') parentIdParam: string,
  ) {
    const parentId = (parentIdParam === 'null' || parentIdParam === 'root') ? null : Number(parentIdParam);
    if (parentId !== null && isNaN(parentId)) {
      throw new BadRequestException('Invalid parentId parameter');
    }
    return this.groupsService.updateParent(id, parentId);
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number) {
    return this.groupsService.delete(id);
  }

  @Get(':id/children')
  async getChildren(@Param('id', ParseIntPipe) id: number) {
    return this.groupsService.getChildren(id);
  }

  @Get(':id/members')
  async getMembers(@Param('id', ParseIntPipe) id: number) {
    return this.groupsService.getMembers(id);
  }

  @Post(':id/members')
  async addMember(
    @Param('id', ParseIntPipe) id: number,
    @Body('userId', ParseIntPipe) userId: number,
  ) {
    return this.groupsService.addMember(id, userId);
  }

  @Delete(':id/members/:userId')
  async removeMember(
    @Param('id', ParseIntPipe) id: number,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    return this.groupsService.removeMember(id, userId);
  }
}
