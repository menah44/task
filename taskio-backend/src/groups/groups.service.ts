import { Injectable, NotFoundException, ConflictException, BadRequestException, ForbiddenException } from '@nestjs/common';
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
    const isAdmin = user.role?.toUpperCase() === 'ADMIN';
    const orgId = user.organization?.id || user.orgId;

    if (isAdmin && orgId) {
      whereClause.organizationId = orgId;
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
    const isAdmin = user?.role?.toUpperCase() === 'ADMIN';
    const orgId = user?.organization?.id || user?.orgId;

    const whereClause: any = { name };
    if (isAdmin && orgId) {
      whereClause.organizationId = orgId;
    } else {
      whereClause.organizationId = null; 
    }

    const existing = await this.groupRepository.findOne({ where: whereClause });
    if (existing) {
      throw new ConflictException('Group name already exists in this organization');
    }
    
    let resolvedParentId: number | null = null;
    if (parentId !== undefined && parentId !== null) {
      const parentWhere: any = { id: parentId };
      if (isAdmin && orgId) {
        parentWhere.organizationId = orgId;
      }
      const parent = await this.groupRepository.findOne({ where: parentWhere });
      if (!parent) {
        throw new NotFoundException('Parent group not found');
      }
      resolvedParentId = parentId;
    }

    const newGroup = this.groupRepository.create({ 
      name, 
      parentId: resolvedParentId,
      ...(isAdmin && orgId ? { organizationId: orgId } : {})
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
    const isAdmin = currentUser?.role?.toUpperCase() === 'ADMIN';
    const orgId = currentUser?.organization?.id || currentUser?.orgId;

    const where: any = { id };
    if (isAdmin && orgId) {
      where.organizationId = orgId;
    }
    const group = await this.groupRepository.findOne({ where });
    if (!group) {
      throw new NotFoundException('Group not found');
    }

    const existingWhere: any = { name };
    if (isAdmin && orgId) {
      existingWhere.organizationId = orgId;
    } else {
      existingWhere.organizationId = null;
    }
    const existing = await this.groupRepository.findOne({ where: existingWhere });
    if (existing && existing.id !== id) {
      throw new ConflictException('Group name already exists');
    }
    group.name = name;

    if (parentId !== undefined) {
      if (parentId !== null) {
        if (parentId === id) {
          throw new BadRequestException('A group cannot be its own parent');
        }
        const parentWhere: any = { id: parentId };
        if (isAdmin && orgId) {
          parentWhere.organizationId = orgId;
        }
        const parent = await this.groupRepository.findOne({ where: parentWhere });
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
    const isAdmin = currentUser?.role?.toUpperCase() === 'ADMIN';
    const orgId = currentUser?.organization?.id || currentUser?.orgId;

    const where: any = { id };
    if (isAdmin && orgId) {
      where.organizationId = orgId;
    }
    const group = await this.groupRepository.findOne({ where });
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

  async getChildren(id: number, currentUser?: User) {
    const isAdmin = currentUser?.role?.toUpperCase() === 'ADMIN';
    const orgId = currentUser?.organization?.id || currentUser?.orgId;

    const where: any = { id };
    if (isAdmin && orgId) {
      where.organizationId = orgId;
    }
    const group = await this.groupRepository.findOne({ where });
    if (!group) {
      throw new NotFoundException('Group not found');
    }

    const childrenWhere: any = { parentId: id };
    if (isAdmin && orgId) {
      childrenWhere.organizationId = orgId;
    }
    return this.groupRepository.find({ where: childrenWhere });
  }

  async getMembers(id: number, currentUser?: User) {
    const isAdmin = currentUser?.role?.toUpperCase() === 'ADMIN';
    const orgId = currentUser?.organization?.id || currentUser?.orgId;

    const where: any = { id };
    if (isAdmin && orgId) {
      where.organizationId = orgId;
    }
    const group = await this.groupRepository.findOne({ where, relations: ['users'] });
    if (!group) {
      throw new NotFoundException('Group not found');
    }
    return group.users;
  }

  async addMember(id: number, userId: number, currentUser?: User) {
    const isAdmin = currentUser?.role?.toUpperCase() === 'ADMIN';
    const orgId = currentUser?.organization?.id || currentUser?.orgId;

    const whereGroup: any = { id };
    if (isAdmin && orgId) {
      whereGroup.organizationId = orgId;
    }
    const group = await this.groupRepository.findOne({ where: whereGroup, relations: ['users'] });

    const whereUser: any = { id: userId };
    if (isAdmin && orgId) {
      whereUser.organization = { id: orgId };
    }
    const user = await this.userRepository.findOne({ where: whereUser });

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
    const isAdmin = currentUser?.role?.toUpperCase() === 'ADMIN';
    const orgId = currentUser?.organization?.id || currentUser?.orgId;

    const whereGroup: any = { id };
    if (isAdmin && orgId) {
      whereGroup.organizationId = orgId;
    }
    const group = await this.groupRepository.findOne({ where: whereGroup, relations: ['users'] });
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
    const isAdmin = currentUser?.role?.toUpperCase() === 'ADMIN';
    const orgId = currentUser?.organization?.id || currentUser?.orgId;

    const whereGroup: any = { id };
    if (isAdmin && orgId) {
      whereGroup.organizationId = orgId;
    }
    const group = await this.groupRepository.findOne({ where: whereGroup });
    if (!group) {
      throw new NotFoundException('Group not found');
    }
    if (parentId !== null) {
      if (parentId === id) {
        throw new BadRequestException('A group cannot be its own parent');
      }
      const whereParent: any = { id: parentId };
      if (isAdmin && orgId) {
        whereParent.organizationId = orgId;
      }
      const parent = await this.groupRepository.findOne({ where: whereParent });
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
