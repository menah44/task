import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Group } from './entities/group.entity';
import { User } from '../auth/entities/user.entity';

@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(Group)
    private readonly groupRepository: Repository<Group>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findAll() {
    const groups = await this.groupRepository.find({
      relations: ['users'],
    });
    return groups.map(g => ({
      id: g.id,
      name: g.name,
      createdAt: g.createdAt,
      updatedAt: g.updatedAt,
      membersCount: g.users ? g.users.length : 0,
    }));
  }

  async create(name: string) {
    const existing = await this.groupRepository.findOne({ where: { name } });
    if (existing) {
      throw new ConflictException('Group name already exists');
    }
    const newGroup = this.groupRepository.create({ name });
    return this.groupRepository.save(newGroup);
  }

  async update(id: number, name: string) {
    const group = await this.groupRepository.findOne({ where: { id } });
    if (!group) {
      throw new NotFoundException('Group not found');
    }
    const existing = await this.groupRepository.findOne({ where: { name } });
    if (existing && existing.id !== id) {
      throw new ConflictException('Group name already exists');
    }
    group.name = name;
    return this.groupRepository.save(group);
  }

  async delete(id: number) {
    const group = await this.groupRepository.findOne({ where: { id } });
    if (!group) {
      throw new NotFoundException('Group not found');
    }
    await this.groupRepository.remove(group);
    return { success: true };
  }
}
