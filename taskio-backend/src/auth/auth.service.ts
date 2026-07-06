import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly auditService: AuditService,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
      relations: ['organization'],
    });
  }

  generateTokens(user: User) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      ...(user.organization ? { orgId: user.organization.id } : {}),
    };

    console.log('DB Role:', user.role);
    console.log('JWT Payload:', payload);

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: '7d',
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  async updateRefreshToken(userId: number, refreshToken: string) {
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await this.userRepository.update(userId, {
      hashedRefreshToken,
    });
    
    // Attempt to log login action
    try {
      const user = await this.userRepository.findOne({ where: { id: userId }, relations: ['organization'] });
      if (user) {
        await this.auditService.logAction(
          user,
          'USER_LOGIN',
          'USER',
          String(user.id),
          { email: user.email }
        );
      }
    } catch (e) {
      console.error('Failed to log login action:', e);
    }
  }

  async refreshTokens(userId: number, refreshToken: string) {
    const user = await this.userRepository.findOne({ 
      where: { id: userId },
      relations: ['organization'],
    });
    if (!user || !user.hashedRefreshToken) {
      throw new UnauthorizedException('Access Denied');
    }

    const refreshTokenMatches = await bcrypt.compare(
      refreshToken,
      user.hashedRefreshToken,
    );
    if (!refreshTokenMatches) {
      throw new UnauthorizedException('Access Denied');
    }

    const tokens = this.generateTokens(user);
    await this.updateRefreshToken(user.id, tokens.refreshToken);
    return tokens;
  }

  async validateAndRefreshTokens(refreshToken: string) {
    let payload;
    try {
      payload = this.jwtService.verify(refreshToken);
    } catch (e) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
    return this.refreshTokens(payload.sub, refreshToken);
  }

  async logout(userId: number) {
    await this.userRepository.update(userId, {
      hashedRefreshToken: null,
    });
  }
}
