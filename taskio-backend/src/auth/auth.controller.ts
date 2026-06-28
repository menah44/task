import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('user') // أو 'auth' لو غيرت المسار لـ auth
export class UserController {
  // الـ Controller بيستدعي الـ Service فقط، ومبيحتاجش يحقن الـ Repository هنا
  constructor() {}

  @Post('login')
  login(@Body() body: CreateUserDto) {
    if (body.email === 'admin@taskio.com' && body.password === '123456') {
      return {
        accessToken: 'mock_access_token_abc123',
        refreshToken: 'mock_refresh_token_xyz789',
        role: 'ADMIN',
      };
    }
    throw new UnauthorizedException('Invalid credentials');
  }
}
