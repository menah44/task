import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
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
    const whereClause: any[] = [];
    
    if (user.role?.toUpperCase() === 'ADMIN' && user.organization) {
      whereClause.push(
        { organizationId: user.organization.id }
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
      const usersCount = await this.userRepository.count({
        where: { role: role.name }
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
    
    const whereClause: any[] = [];
    if (user?.role?.toUpperCase() === 'ADMIN' && user.organization) {
      whereClause.push(
        { name: roleName, organizationId: user.organization.id }
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
      ...(user?.role?.toUpperCase() === 'ADMIN' && user.organization ? { organization: user.organization } : {})
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
    const role = await this.roleRepository.findOne({ where: { id } });
    if (!role) {
      throw new NotFoundException('Role not found');
    }

    // Block deletion if any users are assigned to this role
    const usersCount = await this.userRepository.count({
      where: { role: role.name }
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
    const role = await this.roleRepository.findOne({ where: { id } });
    if (!role) {
      throw new NotFoundException('Role not found');
    }
    if (dto.name) {
      const roleName = dto.name.toUpperCase();
      if (roleName !== role.name) {
        const existing = await this.roleRepository.findOne({ where: { name: roleName } });
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
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['roles'],
    });
    if (!user) throw new NotFoundException('User not found');

    const role = await this.roleRepository.findOne({ where: { id: roleId } });
    if (!role) throw new NotFoundException('Role not found');

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
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['roles'],
    });
    if (!user) throw new NotFoundException('User not found');

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

  async getUsersForRole(roleId: number) {
    const role = await this.roleRepository.findOne({ where: { id: roleId } });
    if (!role) {
      throw new NotFoundException('Role not found');
    }

    return this.userRepository.find({
      where: { role: role.name },
      select: ['id', 'email', 'username', 'firstName', 'lastName', 'isActive', 'createdAt'],
    });
  }
}
