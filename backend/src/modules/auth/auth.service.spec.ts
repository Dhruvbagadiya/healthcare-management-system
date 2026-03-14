import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { User, UserStatus, UserRole } from '../users/entities/user.entity';
import { RbacService } from '../rbac/rbac.service';
import { EmailVerificationService } from './email-verification.service';
import { MailService } from '../mail/mail.service';
import { Repository } from 'typeorm';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
  genSalt: jest.fn(),
}));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const bcrypt = require('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let usersRepository: jest.Mocked<Partial<Repository<User>>>;
  let jwtService: jest.Mocked<Partial<JwtService>>;
  let configService: jest.Mocked<Partial<ConfigService>>;

  const hashedPassword = '$2b$12$hashedpasswordplaceholder';

  const mockUser: Partial<User> = {
    id: 'user-uuid-1',
    userId: 'DOC-000001',
    email: 'doctor@example.com',
    firstName: 'John',
    lastName: 'Doe',
    password: hashedPassword,
    status: UserStatus.ACTIVE,
    organizationId: 'org-uuid-1',
    roles: [
      { id: 'role-1', name: 'doctor', organizationId: 'org-uuid-1', isSystemRole: true } as any,
    ],
    refreshTokenHash: null,
    lastLoginAt: null,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    usersRepository = {
      findOne: jest.fn(),
      save: jest.fn().mockImplementation((user) => Promise.resolve(user)),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
      createQueryBuilder: jest.fn(),
    };

    jwtService = {
      sign: jest.fn().mockReturnValue('mock-jwt-token'),
      verify: jest.fn(),
    };

    configService = {
      get: jest.fn().mockImplementation((key: string) => {
        const config: Record<string, string> = {
          JWT_EXPIRATION: '86400',
          JWT_REFRESH_SECRET: 'test-refresh-secret',
          JWT_REFRESH_EXPIRATION: '604800',
        };
        return config[key];
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: usersRepository,
        },
        {
          provide: JwtService,
          useValue: jwtService,
        },
        {
          provide: ConfigService,
          useValue: configService,
        },
        {
          provide: RbacService,
          useValue: { getOrganizationRoles: jest.fn() },
        },
        {
          provide: EmailVerificationService,
          useValue: { sendVerificationEmail: jest.fn().mockResolvedValue(undefined) },
        },
        {
          provide: MailService,
          useValue: { sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined) },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    it('should return accessToken and refreshToken for valid credentials', async () => {
      const loginDto = { email: 'doctor@example.com', password: 'ValidPass123!' };

      usersRepository.findOne.mockResolvedValue(mockUser as User);
      bcrypt.compare.mockResolvedValue(true);
      bcrypt.genSalt.mockResolvedValue('salt');
      bcrypt.hash.mockResolvedValue('hashed-refresh');

      // jwtService.sign is called twice: once for accessToken, once for refreshToken
      jwtService.sign
        .mockReturnValueOnce('mock-access-token')
        .mockReturnValueOnce('mock-refresh-token');

      const result = await service.login(loginDto);

      expect(result.accessToken).toBe('mock-access-token');
      expect(result.refreshToken).toBe('mock-refresh-token');
      expect(result.user).toBeDefined();
      expect(result.user.id).toBe(mockUser.id);
      expect(result.user.email).toBe(mockUser.email);
      expect(result.user.organizationId).toBe(mockUser.organizationId);
      expect(result.user.roles).toEqual(['doctor']);
    });

    it('should throw UnauthorizedException for invalid password', async () => {
      const loginDto = { email: 'doctor@example.com', password: 'WrongPassword!' };

      usersRepository.findOne.mockResolvedValue(mockUser as User);
      bcrypt.compare.mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
      await expect(service.login(loginDto)).rejects.toThrow('Invalid credentials');
    });

    it('should throw UnauthorizedException for non-existent email', async () => {
      const loginDto = { email: 'nonexistent@example.com', password: 'AnyPassword1!' };

      usersRepository.findOne.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
      await expect(service.login(loginDto)).rejects.toThrow('Invalid credentials');
    });

    it('should throw UnauthorizedException when account is not active', async () => {
      const pendingUser = {
        ...mockUser,
        status: UserStatus.PENDING_VERIFICATION,
      };
      const loginDto = { email: 'doctor@example.com', password: 'ValidPass123!' };

      usersRepository.findOne.mockResolvedValue(pendingUser as User);
      bcrypt.compare.mockResolvedValue(true);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
      await expect(service.login(loginDto)).rejects.toThrow('Account is not active');
    });

    it('should throw UnauthorizedException when user has no organizationId', async () => {
      const noOrgUser = {
        ...mockUser,
        organizationId: undefined as unknown as string,
      };
      const loginDto = { email: 'doctor@example.com', password: 'ValidPass123!' };

      usersRepository.findOne.mockResolvedValue(noOrgUser as User);
      bcrypt.compare.mockResolvedValue(true);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should save the refreshTokenHash and lastLoginAt after successful login', async () => {
      const loginDto = { email: 'doctor@example.com', password: 'ValidPass123!' };

      usersRepository.findOne.mockResolvedValue({ ...mockUser } as User);
      bcrypt.compare.mockResolvedValue(true);
      bcrypt.genSalt.mockResolvedValue('salt');
      bcrypt.hash.mockResolvedValue('hashed-refresh');

      jwtService.sign
        .mockReturnValueOnce('mock-access-token')
        .mockReturnValueOnce('mock-refresh-token');

      await service.login(loginDto);

      expect(usersRepository.save).toHaveBeenCalled();
      const savedUser = (usersRepository.save as jest.Mock).mock.calls[0][0];
      expect(savedUser.refreshTokenHash).toBe('hashed-refresh');
      expect(savedUser.lastLoginAt).toBeInstanceOf(Date);
    });
  });

  describe('logout', () => {
    it('should clear the refreshTokenHash', async () => {
      await service.logout('user-uuid-1');

      expect(usersRepository.update).toHaveBeenCalledWith('user-uuid-1', {
        refreshTokenHash: null,
      });
    });
  });

  describe('getProfile', () => {
    it('should return user without sensitive data', async () => {
      usersRepository.findOne.mockResolvedValue(mockUser as User);

      const result = await service.getProfile('user-uuid-1');

      expect(result).not.toHaveProperty('password');
      expect(result).not.toHaveProperty('refreshTokenHash');
    });

    it('should throw UnauthorizedException if user is not found', async () => {
      usersRepository.findOne.mockResolvedValue(null);

      await expect(service.getProfile('nonexistent-id')).rejects.toThrow(UnauthorizedException);
    });
  });
});
