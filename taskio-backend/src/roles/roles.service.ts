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
    return this.roleRepository.find({
      select: ['id', 'name'],
    });
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
}
