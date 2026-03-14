import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In, ILike } from 'typeorm';
import { User, UserStatus } from '../users/entities/user.entity';
import { Role } from '../rbac/entities/role.entity';

@Injectable()
export class AdminService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(Role)
        private readonly roleRepository: Repository<Role>,
    ) { }

    async getUsers(
        organizationId: string,
        query: { search?: string; status?: string; role?: string; page?: number; limit?: number },
    ) {
        const page = query.page || 1;
        const limit = query.limit || 10;
        const skip = (page - 1) * limit;

        const qb = this.userRepository
            .createQueryBuilder('user')
            .leftJoinAndSelect('user.roles', 'role')
            .where('user.organizationId = :organizationId', { organizationId })
            .andWhere('user.deletedAt IS NULL');

        if (query.search) {
            qb.andWhere(
                '(user.firstName ILIKE :search OR user.lastName ILIKE :search OR user.email ILIKE :search OR user.userId ILIKE :search)',
                { search: `%${query.search}%` },
            );
        }

        if (query.status) {
            qb.andWhere('user.status = :status', { status: query.status });
        }

        if (query.role) {
            qb.andWhere('role.name = :roleName', { roleName: query.role });
        }

        qb.orderBy('user.createdAt', 'DESC');

        const [users, total] = await qb.skip(skip).take(limit).getManyAndCount();

        // Strip sensitive fields
        const data = users.map((u) => {
            const { password, refreshTokenHash, resetPasswordToken, mfaSecret, ...safe } = u as any;
            return {
                ...safe,
                roles: u.roles?.map((r) => ({ id: r.id, name: r.name, isSystemRole: r.isSystemRole })),
            };
        });

        return {
            data,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async getUser(userId: string, organizationId: string) {
        const user = await this.userRepository.findOne({
            where: { id: userId, organizationId },
            relations: ['roles', 'roles.permissions'],
        });
        if (!user) {
            throw new NotFoundException('User not found');
        }

        const { password, refreshTokenHash, resetPasswordToken, mfaSecret, ...safe } = user as any;
        return safe;
    }

    async updateUserStatus(
        userId: string,
        organizationId: string,
        status: UserStatus,
        currentUserId: string,
    ) {
        if (userId === currentUserId) {
            throw new ForbiddenException('You cannot change your own status');
        }

        const user = await this.userRepository.findOne({
            where: { id: userId, organizationId },
        });
        if (!user) {
            throw new NotFoundException('User not found');
        }

        user.status = status;
        await this.userRepository.save(user);

        return { message: `User status updated to ${status}` };
    }

    async updateUserRoles(
        userId: string,
        organizationId: string,
        roleIds: string[],
        currentUserId: string,
    ) {
        if (userId === currentUserId) {
            throw new ForbiddenException('You cannot change your own roles');
        }

        const user = await this.userRepository.findOne({
            where: { id: userId, organizationId },
            relations: ['roles'],
        });
        if (!user) {
            throw new NotFoundException('User not found');
        }

        // Verify all roles belong to this organization
        const roles = await this.roleRepository.find({
            where: { id: In(roleIds), organizationId },
        });
        if (roles.length !== roleIds.length) {
            throw new BadRequestException('One or more roles are invalid for this organization');
        }

        user.roles = roles;
        await this.userRepository.save(user);

        return {
            message: 'User roles updated successfully',
            roles: roles.map((r) => ({ id: r.id, name: r.name })),
        };
    }

    async deleteUser(userId: string, organizationId: string, currentUserId: string) {
        if (userId === currentUserId) {
            throw new ForbiddenException('You cannot delete your own account');
        }

        const user = await this.userRepository.findOne({
            where: { id: userId, organizationId },
        });
        if (!user) {
            throw new NotFoundException('User not found');
        }

        await this.userRepository.softRemove(user);
        return { message: 'User deleted successfully' };
    }

    async getOrganizationStats(organizationId: string) {
        const totalUsers = await this.userRepository.count({
            where: { organizationId },
        });

        const activeUsers = await this.userRepository.count({
            where: { organizationId, status: UserStatus.ACTIVE },
        });

        const pendingUsers = await this.userRepository.count({
            where: { organizationId, status: UserStatus.PENDING_VERIFICATION },
        });

        const suspendedUsers = await this.userRepository.count({
            where: { organizationId, status: UserStatus.SUSPENDED },
        });

        return { totalUsers, activeUsers, pendingUsers, suspendedUsers };
    }
}
