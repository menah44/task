import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from './public.decorator';

/** Shape of the verified JWT payload produced by AuthService.generateTokens(). */
export interface JwtPayload {
  sub: number;
  email: string;
  role: string;
  orgId?: number;
  iat?: number;
  exp?: number;
}

/** Shape attached to request.user after successful JWT verification. */
export interface AuthenticatedUser {
  id: number;
  sub: number;
  email: string;
  role: string;
  orgId?: number;
  organization?: { id: number };
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private jwtService: JwtService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('Missing Authorization header');
    }

    if (!authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Malformed Authorization header');
    }

    const token = authHeader.slice(7);
    if (!token) {
      throw new UnauthorizedException('Missing Bearer token');
    }

    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify<JwtPayload>(token);
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Token has expired');
      }
      throw new UnauthorizedException('Invalid token');
    }

    // Construct the user object from the verified JWT payload,
    // preserving the same shape that the rest of the codebase expects.
    const userId = payload.sub;
    const orgId = payload.orgId;

    const authenticatedUser: AuthenticatedUser = {
      id: userId,
      sub: userId,
      email: payload.email,
      role: payload.role,
      orgId: orgId,
      organization: orgId ? { id: orgId } : undefined,
    };

    (request as Request & { user: AuthenticatedUser }).user = authenticatedUser;

    return true;
  }
}
