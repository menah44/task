import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto'; // استيراد الـ DTO

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('login')
  login(@Body() body: CreateUserDto) {
    // غيرنا any للـ DTO هنا
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
