import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
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
      parentId: g.parentId,
      createdAt: g.createdAt,
      updatedAt: g.updatedAt,
      membersCount: g.users ? g.users.length : 0,
    }));
  }

  async create(name: string, parentId?: number | null) {
    const existing = await this.groupRepository.findOne({ where: { name } });
    if (existing) {
      throw new ConflictException('Group name already exists');
    }
    
    let resolvedParentId: number | null = null;
    if (parentId !== undefined && parentId !== null) {
      const parent = await this.groupRepository.findOne({ where: { id: parentId } });
      if (!parent) {
        throw new NotFoundException('Parent group not found');
      }
      resolvedParentId = parentId;
    }

    const newGroup = this.groupRepository.create({ name, parentId: resolvedParentId });
    return this.groupRepository.save(newGroup);
  }

  async update(id: number, name: string, parentId?: number | null) {
    const group = await this.groupRepository.findOne({ where: { id } });
    if (!group) {
      throw new NotFoundException('Group not found');
    }
    const existing = await this.groupRepository.findOne({ where: { name } });
    if (existing && existing.id !== id) {
      throw new ConflictException('Group name already exists');
    }
    group.name = name;

    if (parentId !== undefined) {
      if (parentId !== null) {
        if (parentId === id) {
          throw new BadRequestException('A group cannot be its own parent');
        }
        const parent = await this.groupRepository.findOne({ where: { id: parentId } });
        if (!parent) {
          throw new NotFoundException('Parent group not found');
        }
        const isDescendant = await this.isDescendantOf(parentId, id);
        if (isDescendant) {
          throw new BadRequestException('Circular dependency detected: Parent group is a descendant of this group');
        }
      }
      group.parentId = parentId;
    }

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

  async getChildren(id: number) {
    const group = await this.groupRepository.findOne({ where: { id } });
    if (!group) {
      throw new NotFoundException('Group not found');
    }
    return this.groupRepository.find({ where: { parentId: id } });
  }

  async getMembers(id: number) {
    const group = await this.groupRepository.findOne({ where: { id }, relations: ['users'] });
    if (!group) {
      throw new NotFoundException('Group not found');
    }
    return group.users;
  }

  async addMember(id: number, userId: number) {
    const group = await this.groupRepository.findOne({ where: { id }, relations: ['users'] });
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!group || !user) {
      throw new NotFoundException('Group or User not found');
    }
    if (!group.users.find(u => u.id === userId)) {
      group.users.push(user);
      await this.groupRepository.save(group);
    }
    return group;
  }

  async removeMember(id: number, userId: number) {
    const group = await this.groupRepository.findOne({ where: { id }, relations: ['users'] });
    if (!group) {
      throw new NotFoundException('Group not found');
    }
    group.users = group.users.filter(user => user.id !== userId);
    return this.groupRepository.save(group);
  }

  async updateParent(id: number, parentId: number | null) {
    const group = await this.groupRepository.findOne({ where: { id } });
    if (!group) {
      throw new NotFoundException('Group not found');
    }
    if (parentId !== null) {
      if (parentId === id) {
        throw new BadRequestException('A group cannot be its own parent');
      }
      const parent = await this.groupRepository.findOne({ where: { id: parentId } });
      if (!parent) {
        throw new NotFoundException('Parent group not found');
      }
      const isDescendant = await this.isDescendantOf(parentId, id);
      if (isDescendant) {
        throw new BadRequestException('Circular dependency detected: Parent group is a descendant of this group');
      }
    }
    group.parentId = parentId;
    return this.groupRepository.save(group);
  }

  private async isDescendantOf(possibleDescendantId: number, ancestorId: number): Promise<boolean> {
    const group = await this.groupRepository.findOne({ where: { id: possibleDescendantId } });
    if (!group || group.parentId === null || group.parentId === undefined) {
      return false;
    }
    if (group.parentId === ancestorId) {
      return true;
    }
    return this.isDescendantOf(group.parentId, ancestorId);
  }
}
