import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
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
    const role = request.headers['x-user-role'];

    console.log(`[PROD-DEBUG] Backend HeaderAuthGuard received headers: x-user-id=${userId}, url=${request.url}`);

    if (!userId) {
      console.error(`[PROD-DEBUG] Throwing Missing X-User-Id header from Gateway`);
      throw new UnauthorizedException('Missing X-User-Id header from Gateway');
    }

    const parsedOrgId = orgId ? parseInt(orgId as string, 10) : undefined;
    // Construct the user object from the injected headers
    request.user = {
      id: parseInt(userId as string, 10),
      sub: parseInt(userId as string, 10),
      orgId: parsedOrgId,
      organization: parsedOrgId ? { id: parsedOrgId } : undefined,
      role: role as string,
    };

    return true;
  }
}
