import {
  Controller,
  All,
  Get,
  Req,
  Res,
  Next,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware';
import { GatewayAuthGuard } from './auth/gateway-auth.guard';
import { Public } from './auth/public.decorator';

const backendProxy = createProxyMiddleware({
  target: process.env.BACKEND_URL || 'http://localhost:5000',
  changeOrigin: true,
  on: {
    proxyReq: (proxyReq, req: Request) => {
      console.log(`[PROD-DEBUG] Proxy callback executed for URL: ${req.url}`);
      console.log(
        `[PROD-DEBUG] req.headers['x-user-id'] = ${String(req.headers['x-user-id'])}`,
      );
      console.log(
        `[PROD-DEBUG] Before setHeader proxyReq.getHeader('X-User-Id') = ${String(proxyReq.getHeader('X-User-Id'))}`,
      );

      // Inject headers that were set by the GatewayAuthGuard
      const userId = req.headers['x-user-id'];
      if (userId !== undefined) {
        proxyReq.setHeader('X-User-Id', userId);
      }
      const orgId = req.headers['x-org-id'];
      if (orgId !== undefined) {
        proxyReq.setHeader('X-Org-Id', orgId);
      }
      const userRole = req.headers['x-user-role'];
      if (userRole !== undefined) {
        proxyReq.setHeader('X-User-Role', userRole);
      }

      console.log(
        `[PROD-DEBUG] After setHeader proxyReq.getHeader('X-User-Id') = ${String(proxyReq.getHeader('X-User-Id'))}`,
      );

      // Fix body parser hanging issue
      fixRequestBody(proxyReq, req);
    },
  },
});

@UseGuards(GatewayAuthGuard)
@Controller('api/v1')
export class AppController {
  @Public()
  @All('auth/login')
  authLogin(
    @Req() req: Request,
    @Res() res: Response,
    @Next() next: NextFunction,
  ) {
    console.log(
      `[PROD-DEBUG] AppController.authLogin executed for URL: ${req.url}`,
    );
    void backendProxy(req, res, next);
  }

  @Public()
  @All('auth/refresh')
  authRefresh(
    @Req() req: Request,
    @Res() res: Response,
    @Next() next: NextFunction,
  ) {
    void backendProxy(req, res, next);
  }

  @Public()
  @Get('files/:mediaId')
  proxyFiles(
    @Req() req: Request,
    @Res() res: Response,
    @Next() next: NextFunction,
  ) {
    void backendProxy(req, res, next);
  }

  @All('*path')
  proxyAll(
    @Req() req: Request,
    @Res() res: Response,
    @Next() next: NextFunction,
  ) {
    console.log(
      `[PROD-DEBUG] AppController.proxyAll executed for URL: ${req.url}`,
    );
    void backendProxy(req, res, next);
  }
}

@Controller('api')
export class SwaggerController {
  @Public()
  @All()
  proxySwaggerExact(
    @Req() req: Request,
    @Res() res: Response,
    @Next() next: NextFunction,
  ) {
    void backendProxy(req, res, next);
  }

  @Public()
  @All('*path')
  proxySwagger(
    @Req() req: Request,
    @Res() res: Response,
    @Next() next: NextFunction,
  ) {
    if (req.url.startsWith('/api/v1')) {
      return next();
    }
    void backendProxy(req, res, next);
  }
}
