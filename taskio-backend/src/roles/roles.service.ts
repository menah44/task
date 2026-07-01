import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './entities/role.entity';
import { User } from '../auth/entities/user.entity';
import { CreateRoleDto } from './dto/create-role.dto';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findAll() {
    const roles = await this.roleRepository.find({
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

  async createRole(dto: CreateRoleDto) {
    const roleName = dto.name.toUpperCase();
    const existing = await this.roleRepository.findOne({ where: { name: roleName } });
    if (existing) {
      throw new ConflictException('Role already exists');
    }
    const newRole = this.roleRepository.create({ name: roleName });
    return this.roleRepository.save(newRole);
  }

  async deleteRole(id: number) {
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
    return { success: true, message: 'Role deleted successfully' };
  }

  async updateRole(id: number, dto: { name?: string }) {
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
    return this.roleRepository.save(role);
  }

  async assignUserToRole(roleId: number, userId: number) {
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
    
    return { success: true, message: 'Role assigned successfully' };
  }

  async removeUserFromRole(roleId: number, userId: number) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['roles'],
    });
    if (!user) throw new NotFoundException('User not found');

    user.roles = user.roles.filter(r => r.id !== roleId);
    user.role = 'USER';
    await this.userRepository.save(user);

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
