import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Role } from './entities/role.entity';
import { User } from '../auth/entities/user.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly auditService: AuditService,
  ) {}

  async findAll(user: User) {
    console.log('[DEBUG Roles] user in findAll:', user);
    const whereClause: any[] = [];
    const isAdmin = user.role?.toUpperCase() === 'ADMIN';
    const orgId = user.organization?.id || user.orgId;
    
    if (isAdmin && orgId) {
      whereClause.push(
        { organizationId: orgId }
      );
    } else {
      whereClause.push({});
    }

    const roles = await this.roleRepository.find({
      where: whereClause.length > 0 ? whereClause : undefined,
      order: { id: 'ASC' }
    });
    const results: any[] = [];
    for (const role of roles) {
      const countWhere: any = { role: role.name };
      if (isAdmin && orgId) {
        countWhere.organization = { id: orgId };
      }
      const usersCount = await this.userRepository.count({
        where: countWhere
      });
      results.push({
        ...role,
        usersCount,
      });
    }
    return results;
  }

  async createRole(dto: CreateRoleDto, user?: User) {
    const roleName = dto.name.toUpperCase();
    const isAdmin = user?.role?.toUpperCase() === 'ADMIN';
    const orgId = user?.organization?.id || user?.orgId;
    
    const whereClause: any[] = [];
    if (isAdmin && orgId) {
      whereClause.push(
        { name: roleName, organizationId: orgId }
      );
    } else {
      whereClause.push({ name: roleName, organizationId: IsNull() });
    }

    const existing = await this.roleRepository.findOne({ where: whereClause });
    if (existing) {
      throw new ConflictException('Role already exists');
    }
    const newRole = this.roleRepository.create({ 
      name: roleName,
      ...(isAdmin && orgId ? { organizationId: orgId } : {})
    });
    const savedRole = await this.roleRepository.save(newRole);
    
    await this.auditService.logAction(
      user,
      'CREATE_ROLE',
      'ROLE',
      String(savedRole.id),
      { name: savedRole.name }
    );
    
    return savedRole;
  }

  async deleteRole(id: number, currentUser?: User) {
    const isAdmin = currentUser?.role?.toUpperCase() === 'ADMIN';
    const orgId = currentUser?.organization?.id || currentUser?.orgId;

    const where: any = { id };
    if (isAdmin && orgId) {
      where.organizationId = orgId;
    }
    const role = await this.roleRepository.findOne({ where });
    if (!role) {
      throw new NotFoundException('Role not found');
    }

    // Block deletion if any users are assigned to this role
    const countWhere: any = { role: role.name };
    if (isAdmin && orgId) {
      countWhere.organization = { id: orgId };
    }
    const usersCount = await this.userRepository.count({
      where: countWhere
    });
    if (usersCount > 0) {
      throw new ConflictException(`Cannot delete role '${role.name}' because it has ${usersCount} user(s) assigned to it.`);
    }

    await this.roleRepository.remove(role);
    
    await this.auditService.logAction(
      currentUser,
      'DELETE_ROLE',
      'ROLE',
      String(id),
      { name: role.name }
    );

    return { success: true, message: 'Role deleted successfully' };
  }

  async updateRole(id: number, dto: { name?: string }, currentUser?: User) {
    const isAdmin = currentUser?.role?.toUpperCase() === 'ADMIN';
    const orgId = currentUser?.organization?.id || currentUser?.orgId;

    const where: any = { id };
    if (isAdmin && orgId) {
      where.organizationId = orgId;
    }
    const role = await this.roleRepository.findOne({ where });
    if (!role) {
      throw new NotFoundException('Role not found');
    }
    if (dto.name) {
      const roleName = dto.name.toUpperCase();
      if (roleName !== role.name) {
        const existingWhere: any = { name: roleName };
        if (isAdmin && orgId) {
          existingWhere.organizationId = orgId;
        } else {
          existingWhere.organizationId = IsNull();
        }
        const existing = await this.roleRepository.findOne({ where: existingWhere });
        if (existing) {
          throw new ConflictException('Role already exists');
        }
        role.name = roleName;
      }
    }
    const savedRole = await this.roleRepository.save(role);

    await this.auditService.logAction(
      currentUser,
      'UPDATE_ROLE',
      'ROLE',
      String(savedRole.id),
      { changes: dto }
    );

    return savedRole;
  }

  async assignUserToRole(roleId: number, userId: number, currentUser?: User) {
    const isAdmin = currentUser?.role?.toUpperCase() === 'ADMIN';
    const orgId = currentUser?.organization?.id || currentUser?.orgId;

    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['roles', 'organization'],
    });
    if (!user) throw new NotFoundException('User not found');

    const roleWhere: any = { id: roleId };
    if (isAdmin && orgId) {
      roleWhere.organizationId = orgId;
    }
    const role = await this.roleRepository.findOne({ where: roleWhere });
    if (!role) throw new NotFoundException('Role not found');

    if (isAdmin && orgId) {
      if (user.organization?.id !== orgId) {
        throw new ForbiddenException('Cannot assign role to user from another organization');
      }
    }

    // Add role if not already assigned
    if (!user.roles.find(r => r.id === roleId)) {
      user.roles.push(role);
    }
    user.role = role.name.toUpperCase();
    await this.userRepository.save(user);
    
    await this.auditService.logAction(
      currentUser,
      'ASSIGN_ROLE',
      'ROLE',
      String(roleId),
      { userId, roleName: role.name }
    );
    
    return { success: true, message: 'Role assigned successfully' };
  }

  async removeUserFromRole(roleId: number, userId: number, currentUser?: User) {
    const isAdmin = currentUser?.role?.toUpperCase() === 'ADMIN';
    const orgId = currentUser?.organization?.id || currentUser?.orgId;

    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['roles', 'organization'],
    });
    if (!user) throw new NotFoundException('User not found');

    if (isAdmin && orgId) {
      if (user.organization?.id !== orgId) {
        throw new ForbiddenException('Cannot modify user from another organization');
      }
    }

    user.roles = user.roles.filter(r => r.id !== roleId);
    user.role = 'USER';
    await this.userRepository.save(user);

    await this.auditService.logAction(
      currentUser,
      'REMOVE_ROLE',
      'ROLE',
      String(roleId),
      { userId }
    );

    return { success: true, message: 'Role removed successfully' };
  }

  async getUsersForRole(roleId: number, currentUser?: User) {
    const isAdmin = currentUser?.role?.toUpperCase() === 'ADMIN';
    const orgId = currentUser?.organization?.id || currentUser?.orgId;

    const roleWhere: any = { id: roleId };
    if (isAdmin && orgId) {
      roleWhere.organizationId = orgId;
    }
    const role = await this.roleRepository.findOne({ where: roleWhere });
    if (!role) {
      throw new NotFoundException('Role not found');
    }

    const usersWhere: any = { role: role.name };
    if (isAdmin && orgId) {
      usersWhere.organization = { id: orgId };
    }

    return this.userRepository.find({
      where: usersWhere,
      select: ['id', 'email', 'username', 'firstName', 'lastName', 'isActive', 'createdAt'],
    });
  }
}
