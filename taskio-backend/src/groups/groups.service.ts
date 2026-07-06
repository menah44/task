import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Group } from './entities/group.entity';
import { User } from '../auth/entities/user.entity';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(Group)
    private readonly groupRepository: Repository<Group>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly auditService: AuditService,
  ) {}

  async findAll(user: User) {
    const whereClause: any = {};
    if (user.role?.toUpperCase() === 'ADMIN' && user.organization) {
      whereClause.organizationId = user.organization.id;
    }

    const groups = await this.groupRepository.find({
      where: whereClause,
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

  async create(name: string, parentId?: number | null, user?: User) {
    const whereClause: any = { name };
    if (user?.role?.toUpperCase() === 'ADMIN' && user.organization) {
      whereClause.organizationId = user.organization.id;
    } else {
      whereClause.organizationId = null; // or handle super admin
    }

    const existing = await this.groupRepository.findOne({ where: whereClause });
    if (existing) {
      throw new ConflictException('Group name already exists in this organization');
    }
    
    let resolvedParentId: number | null = null;
    if (parentId !== undefined && parentId !== null) {
      const parent = await this.groupRepository.findOne({ where: { id: parentId } });
      if (!parent) {
        throw new NotFoundException('Parent group not found');
      }
      resolvedParentId = parentId;
    }

    const newGroup = this.groupRepository.create({ 
      name, 
      parentId: resolvedParentId,
      ...(user?.role?.toUpperCase() === 'ADMIN' && user.organization ? { organization: user.organization } : {})
    });
    const savedGroup = await this.groupRepository.save(newGroup);

    await this.auditService.logAction(
      user,
      'CREATE_GROUP',
      'GROUP',
      String(savedGroup.id),
      { name: savedGroup.name, parentId: savedGroup.parentId }
    );

    return savedGroup;
  }

  async update(id: number, name: string, parentId?: number | null, currentUser?: User) {
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

    const savedGroup = await this.groupRepository.save(group);

    await this.auditService.logAction(
      currentUser,
      'UPDATE_GROUP',
      'GROUP',
      String(savedGroup.id),
      { name, parentId }
    );

    return savedGroup;
  }

  async delete(id: number, currentUser?: User) {
    const group = await this.groupRepository.findOne({ where: { id } });
    if (!group) {
      throw new NotFoundException('Group not found');
    }
    await this.groupRepository.remove(group);

    await this.auditService.logAction(
      currentUser,
      'DELETE_GROUP',
      'GROUP',
      String(id),
      { name: group.name }
    );

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

  async addMember(id: number, userId: number, currentUser?: User) {
    const group = await this.groupRepository.findOne({ where: { id }, relations: ['users'] });
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!group || !user) {
      throw new NotFoundException('Group or User not found');
    }
    if (!group.users.find(u => u.id === userId)) {
      group.users.push(user);
      await this.groupRepository.save(group);

      await this.auditService.logAction(
        currentUser,
        'ADD_MEMBER',
        'GROUP',
        String(group.id),
        { userId, groupName: group.name }
      );
    }
    return group;
  }

  async removeMember(id: number, userId: number, currentUser?: User) {
    const group = await this.groupRepository.findOne({ where: { id }, relations: ['users'] });
    if (!group) {
      throw new NotFoundException('Group not found');
    }
    group.users = group.users.filter(user => user.id !== userId);
    const savedGroup = await this.groupRepository.save(group);

    await this.auditService.logAction(
      currentUser,
      'REMOVE_MEMBER',
      'GROUP',
      String(savedGroup.id),
      { userId, groupName: savedGroup.name }
    );

    return savedGroup;
  }

  async updateParent(id: number, parentId: number | null, currentUser?: User) {
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
    const savedGroup = await this.groupRepository.save(group);

    await this.auditService.logAction(
      currentUser,
      'UPDATE_GROUP',
      'GROUP',
      String(savedGroup.id),
      { parentId }
    );

    return savedGroup;
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
