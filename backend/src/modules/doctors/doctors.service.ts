import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Doctor } from './entities/doctor.entity';
import { User, UserRole, UserStatus } from '../users/entities/user.entity';
import { PaginationQueryDto, PaginatedResponse } from '../../common/dto/pagination.dto';
import { CreateDoctorDto, UpdateDoctorDto } from './dto/create-doctor.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class DoctorsService {
  constructor(
    @InjectRepository(Doctor)
    private readonly doctorRepo: Repository<Doctor>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) { }

  async findAll(query: PaginationQueryDto): Promise<PaginatedResponse<Doctor>> {
    const { page = 1, limit = 10, search } = query;
    const skip = (page - 1) * limit;

    const where = search
      ? [
        { specialization: Like(`%${search}%`) },
        { user: { firstName: Like(`%${search}%`) } },
        { user: { lastName: Like(`%${search}%`) } },
      ]
      : {};

    const [data, total] = await this.doctorRepo.findAndCount({
      where,
      relations: ['user'],
      order: { rating: 'DESC' },
      take: limit,
      skip,
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

  async findOne(id: string) {
    const doctor = await this.doctorRepo.findOne({
      where: { id },
      relations: ['user', 'appointments', 'prescriptions'],
    });

    if (!doctor) {
      throw new NotFoundException(`Doctor with ID ${id} not found`);
    }

    return doctor;
  }

  async create(createDoctorDto: CreateDoctorDto) {
    const { email, firstName, lastName, phoneNumber, ...doctorData } = createDoctorDto;

    const existingUser = await this.userRepo.findOne({ where: { email } });
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash('Doctor@123', 10);
    const user = this.userRepo.create({
      email,
      firstName,
      lastName,
      phoneNumber,
      password: hashedPassword,
      roles: [UserRole.DOCTOR],
      status: UserStatus.ACTIVE,
      userId: doctorData.doctorId,
      emailVerified: true,
    });

    const savedUser = await this.userRepo.save(user);

    const doctor = this.doctorRepo.create({
      ...doctorData,
      user: savedUser,
      customUserId: savedUser.userId,
    });

    return this.doctorRepo.save(doctor);
  }

  async update(id: string, updateDoctorDto: UpdateDoctorDto) {
    const doctor = await this.findOne(id);
    const { firstName, lastName, phoneNumber, ...doctorData } = updateDoctorDto;

    if (firstName || lastName || phoneNumber) {
      Object.assign(doctor.user, { firstName, lastName, phoneNumber });
      await this.userRepo.save(doctor.user);
    }

    Object.assign(doctor, doctorData);
    return this.doctorRepo.save(doctor);
  }

  async remove(id: string) {
    const doctor = await this.findOne(id);
    return this.doctorRepo.remove(doctor);
  }
}
