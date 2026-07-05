import { Controller, UseGuards, Get, Query, Param, ParseIntPipe, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { User } from '../auth/entities/user.entity';

@ApiTags('audit')
@ApiBearerAuth()
@Controller('audit')
@UseGuards(JwtAuthGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  async findAll(
    @CurrentUser() user: User,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('actorId') actorId?: string,
    @Query('resourceType') resourceType?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    if (user.role?.toUpperCase() !== 'ADMIN') {
      throw new ForbiddenException('Only administrators can view audit logs.');
    }
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.auditService.findAll({
      page: pageNum,
      limit: limitNum,
      actorId: actorId ? parseInt(actorId, 10) : undefined,
      resourceType,
      startDate,
      endDate,
    });
  }

  @Get(':id')
  async findOne(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
  ) {
    if (user.role?.toUpperCase() !== 'ADMIN') {
      throw new ForbiddenException('Only administrators can view audit logs.');
    }
    return this.auditService.findOne(id);
  }
}
