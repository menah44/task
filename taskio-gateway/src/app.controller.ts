import { Controller, All, Req, Res, Next, UseGuards } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { GatewayAuthGuard } from './auth/gateway-auth.guard';
import { Public } from './auth/public.decorator';

const backendProxy = createProxyMiddleware({
  target: process.env.BACKEND_URL || 'http://taskio-backend:5000',
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

  @All('*')
  proxyAll(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    backendProxy(req, res, next);
  }
}
