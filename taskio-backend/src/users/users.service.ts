import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../auth/entities/user.entity';
import { CreateUserAdminDto } from './dto/create-user-admin.dto';
import * as bcrypt from 'bcrypt';

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

  async findAll(page = 1, limit = 10, search = '') {
    const skip = (page - 1) * limit;

    const queryBuilder = this.userRepository.createQueryBuilder('user');

    if (search) {
      // Use ILIKE for case-insensitive search on PostgreSQL
      queryBuilder.where(
        'user.name ILIKE :search OR user.email ILIKE :search',
        { search: `%${search}%` }
      );
    }

    // Explicitly exclude passwords from selected query results
    queryBuilder.select([
      'user.id',
      'user.email',
      'user.role',
      'user.name',
      'user.isActive',
    ]);

    const [items, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async create(dto: CreateUserAdminDto) {
    if (!dto.email) {
      throw new BadRequestException('Email address is required.');
    }
    if (!dto.password) {
      throw new BadRequestException('Password is required.');
    }

    const existingUser = await this.userRepository.findOne({
      where: { email: dto.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered.');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const newUser = this.userRepository.create({
      name: dto.name,
      email: dto.email.toLowerCase(),
      password: hashedPassword,
      role: dto.role.toUpperCase(),
      isActive: true,
    });

    await this.userRepository.save(newUser);

    const { password, ...result } = newUser;
    return result;
  }

  async deactivate(id: number) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.isActive = false;
    await this.userRepository.save(user);
    
    const { password, ...result } = user;
    return result;
  }

  async activate(id: number) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.isActive = true;
    await this.userRepository.save(user);
    
    const { password, ...result } = user;
    return result;
  }
}
