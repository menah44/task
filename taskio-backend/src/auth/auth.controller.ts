import {
  Controller,
  Post,
  Body,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() body: CreateUserDto) {
    const user = await this.authService.findByEmail(body.email);

    // email مش موجود
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // account deactivated
    if (!user.isActive) {
      throw new ForbiddenException('Account deactivated');
    }

    // password check
    const isPasswordValid = await bcrypt.compare(body.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = this.authService.generateTokens(user);

    return {
      ...tokens,
      role: user.role,
    };
  }
}
