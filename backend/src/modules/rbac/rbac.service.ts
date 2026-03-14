import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';

@Injectable()
export class RbacService {
    constructor(
        @InjectRepository(Role)
        private readonly roleRepository: Repository<Role>,
        @InjectRepository(Permission)
        private readonly permissionRepository: Repository<Permission>,
    ) { }

    async createPermission(name: string, category: string, description?: string): Promise<Permission> {
        const existing = await this.permissionRepository.findOne({ where: { name } });
        if (existing) {
            throw new ConflictException(`Permission ${name} already exists`);
        }
        const permission = this.permissionRepository.create({ name, category, description });
        return this.permissionRepository.save(permission);
    }

    async createRole(name: string, organizationId: string, permissionNames: string[], isSystemRole = false): Promise<Role> {
        const existing = await this.roleRepository.findOne({
            where: { name, organizationId },
        });
        if (existing) {
            throw new ConflictException(`Role "${name}" already exists in this organization`);
        }

        const permissions = await this.permissionRepository.find({
            where: { name: In(permissionNames) },
        });

        const role = this.roleRepository.create({
            name,
            organizationId,
            permissions,
            isSystemRole,
        });

        return this.roleRepository.save(role);
    }

    async updateRole(
        roleId: string,
        organizationId: string,
        data: { name?: string; description?: string; permissionNames?: string[] },
    ): Promise<Role> {
        const role = await this.roleRepository.findOne({
            where: { id: roleId, organizationId },
            relations: ['permissions'],
        });
        if (!role) {
            throw new NotFoundException(`Role not found`);
        }
        if (role.isSystemRole && data.name && data.name !== role.name) {
            throw new BadRequestException('Cannot rename system roles');
        }

        if (data.name) role.name = data.name;
        if (data.description !== undefined) role.description = data.description;

        if (data.permissionNames) {
            role.permissions = await this.permissionRepository.find({
                where: { name: In(data.permissionNames) },
            });
        }

        return this.roleRepository.save(role);
    }

    async deleteRole(roleId: string, organizationId: string): Promise<void> {
        const role = await this.roleRepository.findOne({
            where: { id: roleId, organizationId },
        });
        if (!role) {
            throw new NotFoundException(`Role not found`);
        }
        if (role.isSystemRole) {
            throw new BadRequestException('Cannot delete system roles');
        }
        await this.roleRepository.remove(role);
    }

    async getRoleWithPermissions(roleId: string): Promise<Role> {
        const role = await this.roleRepository.findOne({
            where: { id: roleId },
            relations: ['permissions'],
        });

        if (!role) {
            throw new NotFoundException(`Role with ID ${roleId} not found`);
        }

        return role;
    }

    async getAllPermissions(): Promise<Permission[]> {
        return this.permissionRepository.find({ order: { category: 'ASC', name: 'ASC' } });
    }

    async getOrganizationRoles(organizationId: string): Promise<Role[]> {
        return this.roleRepository.find({
            where: { organizationId },
            relations: ['permissions'],
            order: { isSystemRole: 'DESC', name: 'ASC' },
        });
    }

    async getPermissionsForRoles(roleNames: string[], organizationId: string): Promise<string[]> {
        const roles = await this.roleRepository.find({
            where: {
                name: In(roleNames),
                organizationId,
            },
            relations: ['permissions'],
        });

        const permissions = new Set<string>();
        roles.forEach(role => {
            role.permissions.forEach(permission => {
                permissions.add(permission.name);
            });
        });

        return Array.from(permissions);
    }
}
