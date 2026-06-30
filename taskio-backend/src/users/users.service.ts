import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../auth/entities/user.entity';
import { Role } from '../roles/entities/role.entity';
import { CreateUserAdminDto } from './dto/create-user-admin.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  async findMe(id: number) {
    return this.findById(id);
  }

  async findById(id: number) {
    const user = await this.userRepository.findOne({
      where: { id },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Exclude password field
    const { password: _password, ...result } = user;
    return result;
  }

  async getUserRoles(id: number) {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['roles'],
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.roles.length === 0 && user.role) {
      const existingRole = await this.roleRepository.findOne({ where: { name: user.role } });
      if (existingRole) {
        user.roles.push(existingRole);
        await this.userRepository.save(user);
        return [existingRole];
      }
    }

    return user.roles;
  }

  async getUserGroups(id: number) {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['groups'],
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user.groups;
  }

  async findAll(page = 1, limit = 10, search = '') {
    const skip = (page - 1) * limit;

    const queryBuilder = this.userRepository.createQueryBuilder('user');

    if (search) {
      // Use ILIKE for case-insensitive search on PostgreSQL
      queryBuilder.where(
        'user.username ILIKE :search OR user.firstName ILIKE :search OR user.lastName ILIKE :search OR user.email ILIKE :search',
        { search: `%${search}%` },
      );
    }

    // Explicitly exclude passwords from selected query results
    queryBuilder.select([
      'user.id',
      'user.email',
      'user.role',
      'user.username',
      'user.firstName',
      'user.lastName',
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
      where: [
        { email: dto.email.toLowerCase() },
        { username: dto.username }
      ],
    });

    if (existingUser) {
      if (existingUser.email === dto.email.toLowerCase()) {
        throw new ConflictException('Email already registered.');
      }
      if (existingUser.username === dto.username) {
        throw new ConflictException('Username already registered.');
      }
      throw new ConflictException('User already exists.');
    }

    const roleName = dto.role.toUpperCase();
    const existingRole = await this.roleRepository.findOne({ where: { name: roleName } });
    if (!existingRole) {
      throw new BadRequestException("Role does not exist");
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const newUser = this.userRepository.create({
      username: dto.username,
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email.toLowerCase(),
      password: hashedPassword,
      role: dto.role.toUpperCase(),
      isActive: true,
    });

    await this.userRepository.save(newUser);

    const { password: _password, ...result } = newUser;
    return result;
  }

  async deactivate(id: number) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.isActive = false;
    await this.userRepository.save(user);
    
    const { password: _password, ...result } = user;
    return result;
  }

  async activate(id: number) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.isActive = true;
    await this.userRepository.save(user);
    
    const { password: _password, ...result } = user;
    return result;
  }

  async updateUser(id: number, dto: UpdateUserDto) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (dto.email && dto.email.toLowerCase() !== user.email) {
      const existingEmail = await this.userRepository.findOne({
        where: { email: dto.email.toLowerCase() },
      });
      if (existingEmail) {
        throw new ConflictException('Email already registered.');
      }
      user.email = dto.email.toLowerCase();
    }

    if (dto.username && dto.username !== user.username) {
      const existingUsername = await this.userRepository.findOne({
        where: { username: dto.username },
      });
      if (existingUsername) {
        throw new ConflictException('Username already registered.');
      }
      user.username = dto.username;
    }

    if (dto.firstName !== undefined) user.firstName = dto.firstName;
    if (dto.lastName !== undefined) user.lastName = dto.lastName;
    if (dto.role) {
      const roleName = dto.role.toUpperCase();
      const existingRole = await this.roleRepository.findOne({ where: { name: roleName } });
      if (!existingRole) {
        throw new BadRequestException("Role does not exist");
      }
      user.role = roleName;
    }

    await this.userRepository.save(user);

    const { password: _password, ...result } = user;
    return result;
  }
}
