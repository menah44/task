import { Injectable, NotFoundException, ForbiddenException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';
import { User } from '../auth/entities/user.entity';

@Injectable()
export class AuditService implements OnModuleInit {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepository: Repository<AuditLog>,
  ) {}

  async onModuleInit() {
    if (process.env.NODE_ENV === 'production') {
      return;
    }
    const count = await this.auditRepository.count();
    if (count === 0) {
      console.log('Seeding mock audit logs...');
      const logs: AuditLog[] = [];
      const resourceTypes = ['USER', 'GROUP', 'ROLE', 'FORM'];
      const actions = {
        USER: ['CREATE_USER', 'UPDATE_USER', 'DEACTIVATE_USER', 'ACTIVATE_USER', 'USER_LOGIN'],
        GROUP: ['CREATE_GROUP', 'UPDATE_GROUP', 'DELETE_GROUP', 'ADD_MEMBER', 'REMOVE_MEMBER'],
        ROLE: ['CREATE_ROLE', 'UPDATE_ROLE', 'DELETE_ROLE', 'ASSIGN_ROLE'],
        FORM: ['CREATE_FORM', 'UPDATE_FORM', 'DELETE_FORM', 'SUBMIT_RESPONSE'],
      };
      
      const actors = [
        { id: 1, email: 'admin@taskio.com' },
        { id: 2, email: 'user@taskio.com' },
        { id: 6, email: 'osame@taskio.com' },
        { id: 13, email: 'eman@taskio.com' }
      ];

      for (let i = 0; i < 50; i++) {
        const resourceType = resourceTypes[Math.floor(Math.random() * resourceTypes.length)] as 'USER' | 'GROUP' | 'ROLE' | 'FORM';
        const resourceActions = actions[resourceType];
        const action = resourceActions[Math.floor(Math.random() * resourceActions.length)];
        const actor = actors[Math.floor(Math.random() * actors.length)];
        
        // Random date in the last 30 days
        const date = new Date();
        date.setDate(date.getDate() - Math.floor(Math.random() * 30));
        date.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));

        logs.push(this.auditRepository.create({
          actorId: actor.id,
          actorEmail: actor.email,
          action,
          resourceType,
          resourceId: String(100 + Math.floor(Math.random() * 900)),
          ipAddress: `192.168.1.${10 + Math.floor(Math.random() * 50)}`,
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
          details: {
            requestPayload: { id: i, notes: `Mock audit details for action ${action}` },
            changes: { before: { status: 'OLD' }, after: { status: 'NEW' } }
          },
          createdAt: date,
        }));
      }

      // Sort logs by date ascending so it saves cleanly, but findAll orders descending
      logs.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      await this.auditRepository.save(logs);
      console.log('Seeded 50 mock audit logs successfully.');
    }
  }

  async findAll(filters: {
    page: number;
    limit: number;
    actorId?: number;
    resourceType?: string;
    startDate?: string;
    endDate?: string;
  }, user?: User) {
    const { page, limit, actorId, resourceType, startDate, endDate } = filters;
    const skip = (page - 1) * limit;

    const query = this.auditRepository.createQueryBuilder('audit');

    query.leftJoinAndSelect('audit.organization', 'organization');

    const isAdmin = user?.role?.toUpperCase() === 'ADMIN';
    const orgId = user?.organization?.id || user?.orgId;

    if (isAdmin && orgId) {
      query.andWhere('audit.organizationId = :orgId', { orgId });
    }

    if (actorId !== undefined) {
      query.andWhere('audit.actorId = :actorId', { actorId });
    }

    if (resourceType && resourceType !== 'ALL') {
      query.andWhere('audit.resourceType = :resourceType', { resourceType });
    }

    if (startDate) {
      // Set start date to start of the day
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      query.andWhere('audit.createdAt >= :startDate', { startDate: start });
    }

    if (endDate) {
      // Set end date to end of the day
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.andWhere('audit.createdAt <= :endDate', { endDate: end });
    }

    query.orderBy('audit.createdAt', 'DESC');

    const [items, total] = await query
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number, currentUser?: User) {
    const isAdmin = currentUser?.role?.toUpperCase() === 'ADMIN';
    const orgId = currentUser?.organization?.id || currentUser?.orgId;

    const where: any = { id };
    if (isAdmin && orgId) {
      where.organizationId = orgId;
    }
    const log = await this.auditRepository.findOne({ where });
    if (!log) {
      throw new NotFoundException('Audit log not found');
    }
    return log;
  }

  async logAction(
    user: User | undefined,
    action: string,
    resourceType: string,
    resourceId: string,
    details?: any,
    ipAddress?: string,
  ) {
    try {
      const log = this.auditRepository.create({
        actorId: user?.id,
        actorEmail: user?.email || 'system',
        action,
        resourceType,
        resourceId,
        ipAddress: ipAddress || '127.0.0.1',
        userAgent: 'system',
        details,
        organizationId: user?.organization?.id || user?.orgId || null,
        createdAt: new Date(),
      });
      await this.auditRepository.save(log);
    } catch (error) {
      console.error('Failed to save audit log:', error);
    }
  }
}
