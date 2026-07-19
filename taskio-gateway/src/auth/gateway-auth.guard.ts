import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

export const IS_PUBLIC_KEY = 'isPublic';

export interface JwtPayload {
  sub: number;
  email?: string;
  role?: string;
  orgId?: number;
  iat?: number;
  exp?: number;
}

@Injectable()
export class GatewayAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: JwtPayload }>();
    console.log(
      `[PROD-DEBUG] GatewayAuthGuard executed for URL: ${request.url}`,
    );

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException();
    }
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: process.env.JWT_SECRET || 'super-secret-key',
      });

      console.log('Gateway Role:', payload.role);

      // Mutate the request to add X-User-Id and X-Org-Id headers for proxy
      request.headers['x-user-id'] = String(payload.sub);
      if (payload.orgId !== undefined) {
        request.headers['x-org-id'] = String(payload.orgId);
      }
      if (payload.role) {
        request.headers['x-user-role'] = payload.role;
      }

      request.user = payload;
    } catch {
      throw new UnauthorizedException();
    }
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      return undefined;
    }
    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' ? token : undefined;
  }
}
