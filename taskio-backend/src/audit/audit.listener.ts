import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AuditService } from './audit.service';
import { User } from '../auth/entities/user.entity';

@Injectable()
export class AuditListener {
  constructor(private readonly auditService: AuditService) {}

  @OnEvent('user.login')
  async handleUserLoginEvent(user: User) {
    await this.auditService.logAction(
      user,
      'USER_LOGIN',
      'USER',
      String(user.id),
      { email: user.email },
    );
  }
}
