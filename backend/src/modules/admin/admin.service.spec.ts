import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { AdminService } from './admin.service';
import { User, UserStatus } from '../users/entities/user.entity';
import { Role } from '../rbac/entities/role.entity';

describe('AdminService', () => {
  let service: AdminService;
  let userRepository: Record<string, jest.Mock>;
  let roleRepository: Record<string, jest.Mock>;

  const orgId = 'org-uuid-1';
  const currentUserId = 'admin-uuid-1';
  const targetUserId = 'target-user-uuid-2';

  const mockUsers = [
    {
      id: targetUserId,
      userId: 'DOC-000001',
      email: 'doctor@example.com',
      firstName: 'Jane',
      lastName: 'Smith',
      status: UserStatus.ACTIVE,
      organizationId: orgId,
      password: 'hashed',
      refreshTokenHash: 'hash',
      resetPasswordToken: null as string | null,
      mfaSecret: null as string | null,
      roles: [{ id: 'role-1', name: 'doctor', isSystemRole: true }],
      createdAt: new Date('2025-01-01'),
    },
    {
      id: 'user-uuid-3',
      userId: 'NUR-000001',
      email: 'nurse@example.com',
      firstName: 'Bob',
      lastName: 'Jones',
      status: UserStatus.ACTIVE,
      organizationId: orgId,
      password: 'hashed',
      refreshTokenHash: null as string | null,
      resetPasswordToken: null as string | null,
      mfaSecret: null as string | null,
      roles: [{ id: 'role-2', name: 'nurse', isSystemRole: true }],
      createdAt: new Date('2025-02-01'),
    },
  ];

  const mockRoles: Partial<Role>[] = [
    { id: 'role-1', name: 'doctor', organizationId: orgId, isSystemRole: true },
    { id: 'role-2', name: 'nurse', organizationId: orgId, isSystemRole: true },
  ];

  // Helper to build a chainable query builder mock
  function createMockQueryBuilder(returnData: any[], returnTotal: number) {
    const qb: Record<string, jest.Mock> = {};
    qb.leftJoinAndSelect = jest.fn().mockReturnValue(qb);
    qb.where = jest.fn().mockReturnValue(qb);
    qb.andWhere = jest.fn().mockReturnValue(qb);
    qb.orderBy = jest.fn().mockReturnValue(qb);
    qb.skip = jest.fn().mockReturnValue(qb);
    qb.take = jest.fn().mockReturnValue(qb);
    qb.getManyAndCount = jest.fn().mockResolvedValue([returnData, returnTotal]);
    return qb;
  }

  beforeEach(async () => {
    userRepository = {
      findOne: jest.fn(),
      save: jest.fn().mockImplementation((user) => Promise.resolve(user)),
      softRemove: jest.fn().mockImplementation((user) => Promise.resolve(user)),
      count: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    roleRepository = {
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        {
          provide: getRepositoryToken(User),
          useValue: userRepository,
        },
        {
          provide: getRepositoryToken(Role),
          useValue: roleRepository,
        },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getUsers', () => {
    it('should return paginated results', async () => {
      const qb = createMockQueryBuilder(mockUsers, 2);
      userRepository.createQueryBuilder.mockReturnValue(qb);

      const result = await service.getUsers(orgId, { page: 1, limit: 10 });

      expect(result.data).toHaveLength(2);
      expect(result.meta).toEqual({
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
      // Verify sensitive fields are stripped
      result.data.forEach((user) => {
        expect(user).not.toHaveProperty('password');
        expect(user).not.toHaveProperty('refreshTokenHash');
        expect(user).not.toHaveProperty('resetPasswordToken');
        expect(user).not.toHaveProperty('mfaSecret');
      });
    });

    it('should use default pagination when page and limit are not provided', async () => {
      const qb = createMockQueryBuilder(mockUsers, 2);
      userRepository.createQueryBuilder.mockReturnValue(qb);

      const result = await service.getUsers(orgId, {});

      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(10);
      expect(qb.skip).toHaveBeenCalledWith(0);
      expect(qb.take).toHaveBeenCalledWith(10);
    });

    it('should calculate totalPages correctly', async () => {
      const qb = createMockQueryBuilder(mockUsers.slice(0, 1), 15);
      userRepository.createQueryBuilder.mockReturnValue(qb);

      const result = await service.getUsers(orgId, { page: 1, limit: 5 });

      expect(result.meta.totalPages).toBe(3);
    });

    it('should apply search filter when provided', async () => {
      const qb = createMockQueryBuilder([], 0);
      userRepository.createQueryBuilder.mockReturnValue(qb);

      await service.getUsers(orgId, { search: 'jane' });

      expect(qb.andWhere).toHaveBeenCalledWith(
        '(user.firstName ILIKE :search OR user.lastName ILIKE :search OR user.email ILIKE :search OR user.userId ILIKE :search)',
        { search: '%jane%' },
      );
    });
  });

  describe('updateUserStatus', () => {
    it('should throw ForbiddenException when trying to modify own status', async () => {
      await expect(
        service.updateUserStatus(currentUserId, orgId, UserStatus.SUSPENDED, currentUserId),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.updateUserStatus(currentUserId, orgId, UserStatus.SUSPENDED, currentUserId),
      ).rejects.toThrow('You cannot change your own status');
    });

    it('should throw NotFoundException when user does not exist', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateUserStatus('nonexistent-id', orgId, UserStatus.SUSPENDED, currentUserId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should update user status successfully', async () => {
      const user = { ...mockUsers[0] };
      userRepository.findOne.mockResolvedValue(user);

      const result = await service.updateUserStatus(
        targetUserId,
        orgId,
        UserStatus.SUSPENDED,
        currentUserId,
      );

      expect(result.message).toBe(`User status updated to ${UserStatus.SUSPENDED}`);
      expect(userRepository.save).toHaveBeenCalled();
      const savedUser = userRepository.save.mock.calls[0][0];
      expect(savedUser.status).toBe(UserStatus.SUSPENDED);
    });
  });

  describe('updateUserRoles', () => {
    it('should throw ForbiddenException when trying to modify own roles', async () => {
      await expect(
        service.updateUserRoles(currentUserId, orgId, ['role-1'], currentUserId),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.updateUserRoles(currentUserId, orgId, ['role-1'], currentUserId),
      ).rejects.toThrow('You cannot change your own roles');
    });

    it('should throw NotFoundException when user does not exist', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateUserRoles('nonexistent-id', orgId, ['role-1'], currentUserId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when role IDs are invalid for the organization', async () => {
      userRepository.findOne.mockResolvedValue({ ...mockUsers[0], roles: [] });
      // Return fewer roles than requested, indicating invalid role IDs
      roleRepository.find.mockResolvedValue([mockRoles[0]]);

      await expect(
        service.updateUserRoles(targetUserId, orgId, ['role-1', 'invalid-role-id'], currentUserId),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.updateUserRoles(targetUserId, orgId, ['role-1', 'invalid-role-id'], currentUserId),
      ).rejects.toThrow('One or more roles are invalid for this organization');
    });

    it('should update user roles successfully', async () => {
      userRepository.findOne.mockResolvedValue({ ...mockUsers[0], roles: [] });
      roleRepository.find.mockResolvedValue(mockRoles);

      const result = await service.updateUserRoles(
        targetUserId,
        orgId,
        ['role-1', 'role-2'],
        currentUserId,
      );

      expect(result.message).toBe('User roles updated successfully');
      expect(result.roles).toHaveLength(2);
      expect(result.roles).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: 'role-1', name: 'doctor' }),
          expect.objectContaining({ id: 'role-2', name: 'nurse' }),
        ]),
      );
      expect(userRepository.save).toHaveBeenCalled();
    });
  });

  describe('getOrganizationStats', () => {
    it('should return correct counts for all user statuses', async () => {
      userRepository.count
        .mockResolvedValueOnce(25) // totalUsers
        .mockResolvedValueOnce(18) // activeUsers
        .mockResolvedValueOnce(5)  // pendingUsers
        .mockResolvedValueOnce(2); // suspendedUsers

      const result = await service.getOrganizationStats(orgId);

      expect(result).toEqual({
        totalUsers: 25,
        activeUsers: 18,
        pendingUsers: 5,
        suspendedUsers: 2,
      });

      // Verify count was called with correct where clauses
      expect(userRepository.count).toHaveBeenCalledTimes(4);
      expect(userRepository.count).toHaveBeenNthCalledWith(1, {
        where: { organizationId: orgId },
      });
      expect(userRepository.count).toHaveBeenNthCalledWith(2, {
        where: { organizationId: orgId, status: UserStatus.ACTIVE },
      });
      expect(userRepository.count).toHaveBeenNthCalledWith(3, {
        where: { organizationId: orgId, status: UserStatus.PENDING_VERIFICATION },
      });
      expect(userRepository.count).toHaveBeenNthCalledWith(4, {
        where: { organizationId: orgId, status: UserStatus.SUSPENDED },
      });
    });

    it('should return zeros when organization has no users', async () => {
      userRepository.count.mockResolvedValue(0);

      const result = await service.getOrganizationStats(orgId);

      expect(result).toEqual({
        totalUsers: 0,
        activeUsers: 0,
        pendingUsers: 0,
        suspendedUsers: 0,
      });
    });
  });

  describe('deleteUser', () => {
    it('should throw ForbiddenException when trying to delete own account', async () => {
      await expect(
        service.deleteUser(currentUserId, orgId, currentUserId),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.deleteUser(currentUserId, orgId, currentUserId),
      ).rejects.toThrow('You cannot delete your own account');
    });

    it('should soft delete a user successfully', async () => {
      const user = { ...mockUsers[0] };
      userRepository.findOne.mockResolvedValue(user);

      const result = await service.deleteUser(targetUserId, orgId, currentUserId);

      expect(result.message).toBe('User deleted successfully');
      expect(userRepository.softRemove).toHaveBeenCalledWith(user);
    });
  });
});
