import { Module } from '@nestjs/common';
import { AppController, SwaggerController } from './app.controller';
import { AppService } from './app.service';
import { JwtModule } from '@nestjs/jwt';
import { GatewayAuthGuard } from './auth/gateway-auth.guard';
import { APP_FILTER } from '@nestjs/core';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET || 'super-secret-key',
    }),
  ],
  controllers: [AppController, SwaggerController],
  providers: [
    AppService,
    GatewayAuthGuard,
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule {}
