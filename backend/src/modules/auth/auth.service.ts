import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserStatus, UserRole } from '../users/entities/user.entity';
import { RbacService } from '../rbac/rbac.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private jwtService: JwtService,
    private configService: ConfigService,
    private rbacService: RbacService,
  ) { }

  async register(registerDto: RegisterDto) {
    const existingUser = await this.usersRepository.findOne({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new UnauthorizedException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    const userId = await this.generateUserId(registerDto.role);

    const user = new User({
      userId,
      email: registerDto.email,
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
      password: hashedPassword,
    });

    // For now, in registration, we might need a default organization or handle it from DTO
    // Assuming registerDto might be updated to include organizationId soon
    const orgId = registerDto.organizationId || 'default-org-id';
    const roles = await this.rbacService.getOrganizationRoles(orgId);
    const role = roles.find(r => r.name === (registerDto.role || UserRole.PATIENT));

    user.roles = role ? [role] : [];
    user.status = UserStatus.PENDING_VERIFICATION;
    user.organizationId = orgId;

    await this.usersRepository.save(user);

    return {
      message: 'User registered successfully',
      userId: user.id,
    };
  }

  async login(loginDto: LoginDto) {
    console.log(`Login attempt for email: ${loginDto.email}`);
    const user = await this.usersRepository.findOne({
      where: { email: loginDto.email },
      relations: ['roles'],
    });

    if (!user) {
      console.warn(`User not found for email: ${loginDto.email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);

    if (!isPasswordValid) {
      console.warn(`Invalid password for email: ${loginDto.email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status !== UserStatus.ACTIVE) {
      console.warn(`User account is not active: ${loginDto.email}, status: ${user.status}`);
      throw new UnauthorizedException('Account is not active or pending verification');
    }

    const { accessToken, refreshToken } = this.generateTokens(user);

    user.refreshToken = refreshToken;
    user.lastLoginAt = new Date();
    await this.usersRepository.save(user);

    console.log(`User logged in successfully: ${loginDto.email}, ID: ${user.id}`);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        userId: user.userId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: user.roles?.map((r: any) => r.name ?? r) ?? [],
        organizationId: user.organizationId,
      },
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      if (!refreshToken) {
        console.warn('Refresh token is null or undefined');
        throw new UnauthorizedException('Refresh token is required');
      }

      console.log('Verifying refresh token...');
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      console.log(`Payload sub: ${payload.sub}`);
      const user = await this.usersRepository.findOne({
        where: { id: payload.sub },
      });

      if (!user) {
        console.warn(`User not found for sub: ${payload.sub}`);
        throw new UnauthorizedException('Invalid refresh token');
      }

      if (user.refreshToken !== refreshToken) {
        console.warn(`Refresh token mismatch for user: ${user.email}`);
        throw new UnauthorizedException('Invalid refresh token');
      }

      const tokens = this.generateTokens(user);
      user.refreshToken = tokens.refreshToken;
      await this.usersRepository.save(user);

      console.log(`Tokens refreshed for user: ${user.email}`);
      return tokens;
    } catch (error) {
      console.error(`Refresh token error: ${error.message}`);
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async logout(userId: string) {
    await this.usersRepository.update(userId, { refreshToken: null });
    return { message: 'Logged out successfully' };
  }

  async getProfile(userId: string) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['roles', 'roles.permissions'],
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const { password, refreshToken, ...userWithoutSensitiveData } = user;
    return userWithoutSensitiveData;
  }

  private generateTokens(user: User) {
    const payload = {
      sub: user.id,
      email: user.email,
      userId: user.userId,
      roles: (user.roles ?? []).map((r: any) => r.name ?? r),
      organizationId: user.organizationId,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: parseInt(this.configService.get<string>('JWT_EXPIRATION') || '86400'),
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: parseInt(this.configService.get<string>('JWT_REFRESH_EXPIRATION') || '604800'),
    });

    return { accessToken, refreshToken };
  }

  private async generateUserId(role: UserRole): Promise<string> {
    const rolePrefix = {
      [UserRole.DOCTOR]: 'DOC',
      [UserRole.NURSE]: 'NUR',
      [UserRole.RECEPTIONIST]: 'REC',
      [UserRole.PATIENT]: 'PAT',
      [UserRole.PHARMACIST]: 'PHA',
      [UserRole.LAB_TECHNICIAN]: 'LAB',
      [UserRole.ADMIN]: 'ADM',
    };

    const prefix = rolePrefix[role] || 'USR';
    const count = await this.usersRepository.count();
    return `${prefix}-${String(count + 1).padStart(6, '0')}`;
  }
}
