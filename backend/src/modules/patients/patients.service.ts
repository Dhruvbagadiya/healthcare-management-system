import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Patient } from './entities/patient.entity';
import { User, UserStatus } from '../users/entities/user.entity';
import { PaginationQueryDto, PaginatedResponse } from '../../common/dto/pagination.dto';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { CreateMedicalRecordDto } from './dto/create-medical-record.dto';
import { PatientRepository } from './repositories/patient.repository';
import { MedicalRecordRepository } from './repositories/medical-record.repository';
import * as bcrypt from 'bcrypt';
import { TenantService } from '../../common/services/tenant.service';

@Injectable()
export class PatientsService {
  constructor(
    private readonly patientRepository: PatientRepository,
    private readonly medicalRecordRepo: MedicalRecordRepository,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly tenantService: TenantService,
  ) { }

  async findAll(query: PaginationQueryDto): Promise<PaginatedResponse<Patient>> {
    const searchFields = ['patientId', 'customUserId'];
    return this.patientRepository.findPaginated(query, ['user'], searchFields);
  }

  async findOne(id: string) {
    const patient = await this.patientRepository.findById(id);

    if (!patient) {
      throw new NotFoundException(`Patient with ID ${id} not found`);
    }

    return patient;
  }

  async create(createPatientDto: CreatePatientDto) {
    const { email, firstName, lastName, phoneNumber, dateOfBirth, gender, ...patientData } = createPatientDto;
    const organizationId = this.tenantService.getTenantId();

    const existingUser = await this.userRepo.findOne({ where: { email, organizationId } });
    if (existingUser) {
      throw new ConflictException('Email already registered for this organization');
    }

    const hashedPassword = await bcrypt.hash('Patient@123', 10);
    const userEntity = this.userRepo.create({
      email,
      firstName,
      lastName,
      phoneNumber,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      gender: gender ? gender.toLowerCase() as any : null,
      password: hashedPassword,
      roles: [] as any,
      status: UserStatus.ACTIVE,
      userId: `PAT-${Date.now().toString().slice(-6)}`,
      emailVerified: true,
      organizationId,
    });

    const savedUser = await this.userRepo.save(userEntity);

    const patient = this.patientRepository.create({
      ...(patientData as any),
      user: savedUser as any,
      customUserId: (savedUser as any).userId,
      organizationId,
    });

    return this.patientRepository.save(patient);
  }

  async update(id: string, updatePatientDto: UpdatePatientDto) {
    const patient = await this.findOne(id);
    Object.assign(patient, updatePatientDto);
    return this.patientRepository.save(patient);
  }

  async remove(id: string) {
    const patient = await this.findOne(id);
    await this.patientRepository.softDelete(patient.id);
    return { message: 'Patient successfully deleted' };
  }

  async addMedicalRecord(patientId: string, recordData: CreateMedicalRecordDto) {
    const organizationId = this.tenantService.getTenantId();
    const patient = await this.findOne(patientId);

    const record = this.medicalRecordRepo.create({
      ...recordData,
      patient,
      patientId: patient.id,
      organizationId,
    });

    return this.medicalRecordRepo.save(record);
  }

  async getMedicalRecords(patientId: string, query: PaginationQueryDto) {
    // Add patientId filter to the query
    const patientQuery = {
      ...query,
    };

    // We can use a custom findPaginated setup if needed, but since BaseRepository 
    // findPaginated doesn't easily support dynamic where clauses beyond organizationId,
    // let's do a custom paginated query using queryBuilder on medicalRecordRepo.

    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'DESC' } = query;
    const skip = (page - 1) * limit;
    const organizationId = this.tenantService.getTenantId();

    const qb = this.medicalRecordRepo.createQueryBuilder('record')
      .where('record.organizationId = :organizationId', { organizationId })
      .andWhere('record.patientId = :patientId', { patientId })
      .orderBy(`record.${sortBy}`, sortOrder)
      .skip(skip)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();

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
}
