import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../auth/entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findMe(id: number) {
    const user = await this.userRepository.findOne({
      where: { id },
    });
    
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Exclude password field
    const { password, ...result } = user;
    return result;
  }
}
