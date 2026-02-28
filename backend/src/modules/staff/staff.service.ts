import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Staff, StaffRole } from './entities/staff.entity';
import { User, UserRole, UserStatus } from '../users/entities/user.entity';
import { PaginationQueryDto, PaginatedResponse } from '../../common/dto/pagination.dto';
import { CreateStaffDto, UpdateStaffDto } from './dto/create-staff.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class StaffService {
  constructor(
    @InjectRepository(Staff)
    private readonly staffRepo: Repository<Staff>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) { }

  async findAll(query: PaginationQueryDto): Promise<PaginatedResponse<Staff>> {
    const { page = 1, limit = 10, search } = query;
    const skip = (page - 1) * limit;

    const where = search
      ? [
        { staffId: Like(`%${search}%`) },
        { user: { firstName: Like(`%${search}%`) } },
        { user: { lastName: Like(`%${search}%`) } },
      ]
      : {};

    const [data, total] = await this.staffRepo.findAndCount({
      where,
      relations: ['user'],
      order: { createdAt: 'DESC' },
      take: limit,
      skip,
    });

    return {
      data,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const staff = await this.staffRepo.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!staff) {
      throw new NotFoundException(`Staff with ID ${id} not found`);
    }

    return staff;
  }

  async create(createStaffDto: CreateStaffDto) {
    const { email, firstName, lastName, phoneNumber, ...staffData } = createStaffDto;

    const existingUser = await this.userRepo.findOne({ where: { email } });
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Map StaffRole to UserRole if needed, here they are the same strings
    const hashedPassword = await bcrypt.hash('Staff@123', 10);
    const user = this.userRepo.create({
      email,
      firstName,
      lastName,
      phoneNumber,
      password: hashedPassword,
      roles: [] as any,
      status: UserStatus.ACTIVE,
      userId: staffData.staffId,
      emailVerified: true,
    });

    const savedUser = await this.userRepo.save(user);

    const staff = this.staffRepo.create({
      ...staffData,
      user: savedUser,
      userId: savedUser.id,
    });

    return this.staffRepo.save(staff);
  }

  async update(id: string, updateStaffDto: UpdateStaffDto) {
    const staff = await this.findOne(id);
    const { firstName, lastName, phoneNumber, ...staffData } = updateStaffDto;

    if (firstName || lastName || phoneNumber) {
      Object.assign(staff.user, { firstName, lastName, phoneNumber });
      await this.userRepo.save(staff.user);
    }

    Object.assign(staff, staffData);
    return this.staffRepo.save(staff);
  }

  async remove(id: string) {
    const staff = await this.findOne(id);
    return this.staffRepo.remove(staff);
  }

  // Keep existing methods for compatibility if needed, but refactored to use new patterns
  async getAllStaff(skip = 0, take = 10) {
    const [staff, total] = await this.staffRepo.findAndCount({
      relations: ['user'],
      skip,
      take,
    });
    return { data: staff, total, count: staff.length };
  }

  async getStaffById(id: string) {
    return this.findOne(id);
  }

  async getStaffByRole(role: any) {
    return this.staffRepo.find({
      where: { role },
      relations: ['user'],
    });
  }
}
