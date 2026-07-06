import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export const IS_PUBLIC_KEY = 'isPublic';

@Injectable()
export class HeaderAuthGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const userId = request.headers['x-user-id'];
    const orgId = request.headers['x-org-id'];

    if (!userId) {
      throw new UnauthorizedException('Missing X-User-Id header from Gateway');
    }

    // Construct the user object from the injected headers
    request.user = {
      sub: parseInt(userId, 10),
      orgId: orgId ? parseInt(orgId, 10) : undefined,
    };

    return true;
  }
}
