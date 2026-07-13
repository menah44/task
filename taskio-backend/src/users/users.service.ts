import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../auth/entities/user.entity';
import { Role } from '../roles/entities/role.entity';
import { Group } from '../groups/entities/group.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { CreateUserAdminDto } from './dto/create-user-admin.dto';
import { CreateOrganizationAdminDto } from '../organizations/dto/create-organization-admin.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Group)
    private readonly groupRepository: Repository<Group>,
    private readonly auditService: AuditService,
  ) {}

  async findMe(id: number) {
    return this.findById(id);
  }

  async findById(id: number, currentUser?: User) {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['organization'],
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (currentUser && currentUser.role?.toUpperCase() === 'ADMIN') {
      const orgId = currentUser.organization?.id || currentUser.orgId;
      if (user.organization?.id !== orgId) {
        throw new ForbiddenException('Access denied');
      }
    }

    // Exclude password field
    const result = { ...user };
    delete (result as any).password;
    return result;
  }

  async getUserRoles(id: number, currentUser?: User) {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['roles', 'organization'],
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (currentUser && currentUser.role?.toUpperCase() === 'ADMIN') {
      const orgId = currentUser.organization?.id || currentUser.orgId;
      if (user.organization?.id !== orgId) {
        throw new ForbiddenException('Access denied');
      }
    }

    if (user.roles.length === 0 && user.role) {
      const existingRole = await this.roleRepository.findOne({
        where: { name: user.role },
      });
      if (existingRole) {
        user.roles.push(existingRole);
        await this.userRepository.save(user);
        return [existingRole];
      }
    }

    return user.roles;
  }

  async getUserGroups(id: number, currentUser?: User) {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['groups', 'organization'],
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (currentUser && currentUser.role?.toUpperCase() === 'ADMIN') {
      const orgId = currentUser.organization?.id || currentUser.orgId;
      if (user.organization?.id !== orgId) {
        throw new ForbiddenException('Access denied');
      }
    }
    return user.groups;
  }

  async findAll(page = 1, limit = 10, search = '', orgId?: number) {
    const skip = (page - 1) * limit;

    const queryBuilder = this.userRepository.createQueryBuilder('user');

    if (orgId) {
      queryBuilder.leftJoin('user.organization', 'organization');
      queryBuilder.andWhere('organization.id = :orgId', { orgId });
    }

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

  async create(
    dto: CreateUserAdminDto,
    org?: Organization,
    currentUser?: User,
  ) {
    if (!dto.email) {
      throw new BadRequestException('Email address is required.');
    }
    if (!dto.password) {
      throw new BadRequestException('Password is required.');
    }

    const existingUser = await this.userRepository.findOne({
      where: [{ email: dto.email.toLowerCase() }, { username: dto.username }],
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
    const existingRole = await this.roleRepository.findOne({
      where: { name: roleName },
    });
    if (!existingRole) {
      throw new BadRequestException('Role does not exist');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const userGroups: Group[] = [];
    if (dto.groupId) {
      const group = await this.groupRepository.findOne({
        where: { id: dto.groupId },
      });
      if (!group) {
        throw new BadRequestException('Group does not exist');
      }
      userGroups.push(group);
    }

    const newUser = this.userRepository.create({
      username: dto.username,
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email.toLowerCase(),
      password: hashedPassword,
      role: dto.role.toUpperCase(),
      isActive: true,
      groups: userGroups,
      ...(org ? { organization: org } : {}),
    });

    await this.userRepository.save(newUser);

    await this.auditService.logAction(
      currentUser,
      'CREATE_USER',
      'USER',
      String(newUser.id),
      { email: newUser.email, role: newUser.role },
    );

    const { password: _password, ...result } = newUser;
    return result;
  }

  async createOrganizationAdmin(
    org: Organization,
    dto: CreateOrganizationAdminDto,
  ) {
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

    const roleName = 'ADMIN';
    const existingRole = await this.roleRepository.findOne({
      where: { name: roleName },
    });
    if (!existingRole) {
      throw new BadRequestException('Role does not exist');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const newUser = this.userRepository.create({
      username: dto.email.toLowerCase(), // fallback username to email if needed
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email.toLowerCase(),
      password: hashedPassword,
      role: roleName,
      isActive: true,
      groups: [],
      roles: [existingRole],
      organization: org,
    });

    await this.userRepository.save(newUser);

    await this.auditService.logAction(
      undefined, // System action, but org is known
      'CREATE_ORGANIZATION_ADMIN',
      'USER',
      String(newUser.id),
      { email: newUser.email, role: newUser.role },
    );

    const { password: _password, ...result } = newUser;
    return result;
  }

  async deactivate(id: number, currentUser?: User) {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['organization'],
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (currentUser && currentUser.role?.toUpperCase() === 'ADMIN') {
      const orgId = currentUser.organization?.id || currentUser.orgId;
      if (user.organization?.id !== orgId) {
        throw new ForbiddenException('Access denied');
      }
    }
    user.isActive = false;
    await this.userRepository.save(user);

    await this.auditService.logAction(
      currentUser,
      'DEACTIVATE_USER',
      'USER',
      String(user.id),
      { email: user.email },
    );

    const { password: _password, ...result } = user;
    return result;
  }

  async activate(id: number, currentUser?: User) {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['organization'],
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (currentUser && currentUser.role?.toUpperCase() === 'ADMIN') {
      const orgId = currentUser.organization?.id || currentUser.orgId;
      if (user.organization?.id !== orgId) {
        throw new ForbiddenException('Access denied');
      }
    }
    user.isActive = true;
    await this.userRepository.save(user);

    await this.auditService.logAction(
      currentUser,
      'ACTIVATE_USER',
      'USER',
      String(user.id),
      { email: user.email },
    );

    const { password: _password, ...result } = user;
    return result;
  }

  async updateUser(id: number, dto: UpdateUserDto, currentUser?: User) {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['roles', 'organization'],
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (currentUser && currentUser.role?.toUpperCase() === 'ADMIN') {
      const orgId = currentUser.organization?.id || currentUser.orgId;
      if (user.organization?.id !== orgId) {
        throw new ForbiddenException('Access denied');
      }
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
      const existingRole = await this.roleRepository.findOne({
        where: { name: roleName },
      });
      if (!existingRole) {
        throw new BadRequestException('Role does not exist');
      }
      user.role = roleName;
      user.roles = [existingRole];
    }

    await this.userRepository.save(user);

    await this.auditService.logAction(
      currentUser,
      'UPDATE_USER',
      'USER',
      String(user.id),
      { changes: dto },
    );

    const { password: _password, ...result } = user;
    return result;
  }

  async updateTheme(id: number, theme: string) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.theme = theme;
    await this.userRepository.save(user);

    const { password: _password, ...result } = user;
    return result;
  }
}
