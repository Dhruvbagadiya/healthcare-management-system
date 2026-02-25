import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Patient } from './entities/patient.entity';
import { User, UserRole, UserStatus } from '../users/entities/user.entity';
import { PaginationQueryDto, PaginatedResponse } from '../../common/dto/pagination.dto';
import { CreatePatientDto } from './dto/create-patient.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class PatientsService {
  constructor(
    @InjectRepository(Patient)
    private readonly patientRepo: Repository<Patient>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) { }

  async findAll(query: PaginationQueryDto): Promise<PaginatedResponse<Patient>> {
    const { page = 1, limit = 10, search } = query;
    const skip = (page - 1) * limit;

    const where = search
      ? [
        { patientId: Like(`%${search}%`) },
        { user: { firstName: Like(`%${search}%`) } },
        { user: { lastName: Like(`%${search}%`) } },
      ]
      : {};

    const [data, total] = await this.patientRepo.findAndCount({
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
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const patient = await this.patientRepo.findOne({
      where: { id },
      relations: ['user', 'medicalRecords', 'appointments', 'prescriptions'],
    });

    if (!patient) {
      throw new NotFoundException(`Patient with ID ${id} not found`);
    }

    return patient;
  }

  async create(createPatientDto: CreatePatientDto) {
    const { email, firstName, lastName, phoneNumber, dateOfBirth, gender, ...patientData } = createPatientDto;

    // Check if user already exists
    const existingUser = await this.userRepo.findOne({ where: { email } });
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Create User record
    const hashedPassword = await bcrypt.hash('Patient@123', 10); // Default password
    const user = this.userRepo.create({
      email,
      firstName,
      lastName,
      phoneNumber,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      gender: gender ? gender.toLowerCase() as any : null,
      password: hashedPassword,
      roles: [UserRole.PATIENT],
      status: UserStatus.ACTIVE,
      userId: `PAT-${Date.now().toString().slice(-6)}`,
      emailVerified: true,
    });

    const savedUser = await this.userRepo.save(user);

    // Create Patient record
    const patient = this.patientRepo.create({
      ...patientData,
      user: savedUser,
      customUserId: savedUser.userId,
    });

    return this.patientRepo.save(patient);
  }
}
