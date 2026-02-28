import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Patient } from './entities/patient.entity';
import { MedicalRecord } from './entities/medical-record.entity';
import { User, UserStatus } from '../users/entities/user.entity';
import { PaginationQueryDto, PaginatedResponse } from '../../common/dto/pagination.dto';
import { CreatePatientDto } from './dto/create-patient.dto';
import { PatientRepository } from './repositories/patient.repository';
import * as bcrypt from 'bcrypt';
import { TenantService } from '../../common/services/tenant.service';

@Injectable()
export class PatientsService {
  constructor(
    private readonly patientRepository: PatientRepository,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(MedicalRecord)
    private readonly medicalRecordRepo: Repository<MedicalRecord>,
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

  async addMedicalRecord(patientId: string, recordData: any) {
    const organizationId = this.tenantService.getTenantId();
    const patient = await this.findOne(patientId);

    const record = this.medicalRecordRepo.create({
      ...recordData,
      patient,
      organizationId,
    });

    return this.medicalRecordRepo.save(record);
  }

  async getMedicalRecords(patientId: string) {
    const organizationId = this.tenantService.getTenantId();
    return this.medicalRecordRepo.find({
      where: { patient: { id: patientId } as any, organizationId },
      order: { createdAt: 'DESC' },
    });
  }
}
