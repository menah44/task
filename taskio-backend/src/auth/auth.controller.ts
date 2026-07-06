import {
  Controller,
  Post,
  Body,
  UnauthorizedException,
  ForbiddenException,
  UseGuards,
  Req,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { AuthService } from './auth.service';
import { HeaderAuthGuard } from './header-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() body: CreateUserDto) {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[DEBUG Login] Received login payload:', body.email); // Only logging email for security
    }
    const user = await this.authService.findByEmail(body.email);

    if (process.env.NODE_ENV !== 'production') {
      console.log('[DEBUG Login] User found:', !!user);
    }

    // email مش موجود
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // account deactivated
    if (!user.isActive) {
      throw new ForbiddenException('Account deactivated');
    }

    // organization deactivated
    if (user.organization && !user.organization.isActive) {
      throw new ForbiddenException('Organization deactivated');
    }

    // password check
    const isPasswordValid = await bcrypt.compare(body.password, user.password);
    if (process.env.NODE_ENV !== 'production') {
      console.log('[DEBUG Login] Password comparison result:', isPasswordValid);
    }

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = this.authService.generateTokens(user);
    await this.authService.updateRefreshToken(user.id, tokens.refreshToken);

    return {
      ...tokens,
      role: user.role,
    };
  }

  @Post('refresh')
  async refresh(@Body() body: RefreshTokenDto) {
    return this.authService.validateAndRefreshTokens(body.refreshToken);
  }

  @UseGuards(HeaderAuthGuard)
  @Post('logout')
  async logout(@Req() req: any) {
    await this.authService.logout(req.user.id);
    return { message: 'Logged out successfully' };
  }
}
