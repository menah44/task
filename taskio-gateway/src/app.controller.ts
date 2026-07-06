import { Controller, All, Req, Res, Next, UseGuards } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware';
import { GatewayAuthGuard } from './auth/gateway-auth.guard';
import { Public } from './auth/public.decorator';

const backendProxy = createProxyMiddleware({
  target: process.env.BACKEND_URL || 'http://localhost:5000',
  changeOrigin: true,
  on: {
    proxyReq: (proxyReq, req: any) => {
      // Inject headers that were set by the GatewayAuthGuard
      if (req.headers['x-user-id']) {
        proxyReq.setHeader('X-User-Id', req.headers['x-user-id']);
      }
      if (req.headers['x-org-id']) {
        proxyReq.setHeader('X-Org-Id', req.headers['x-org-id']);
      }
      if (req.headers['x-user-role']) {
        proxyReq.setHeader('X-User-Role', req.headers['x-user-role']);
      }
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
  authLogin(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    backendProxy(req, res, next);
  }

  @Public()
  @All('auth/refresh')
  authRefresh(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    backendProxy(req, res, next);
  }

  @All('*path')
  proxyAll(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    backendProxy(req, res, next);
  }
}

@Controller('api')
export class SwaggerController {
  @Public()
  @All()
  proxySwaggerExact(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    backendProxy(req, res, next);
  }

  @Public()
  @All('*path')
  proxySwagger(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    if (req.url.startsWith('/api/v1')) {
      return next();
    }
    backendProxy(req, res, next);
  }
}

