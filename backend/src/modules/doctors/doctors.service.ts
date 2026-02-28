import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Doctor } from './entities/doctor.entity';
import { User, UserRole, UserStatus } from '../users/entities/user.entity';
import { PaginationQueryDto, PaginatedResponse } from '../../common/dto/pagination.dto';
import { CreateDoctorDto, UpdateDoctorDto } from './dto/create-doctor.dto';
import { DoctorRepository } from './repositories/doctor.repository';
import * as bcrypt from 'bcrypt';
import { TenantService } from '../../common/services/tenant.service';

@Injectable()
export class DoctorsService {
  constructor(
    private readonly doctorRepository: DoctorRepository,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly tenantService: TenantService,
  ) { }

  async findAll(query: PaginationQueryDto): Promise<PaginatedResponse<Doctor>> {
    const searchFields = ['specialization', 'customUserId'];
    return this.doctorRepository.findPaginated(query, ['user'], searchFields);
  }

  async findOne(id: string) {
    const doctor = await this.doctorRepository.findById(id);

    if (!doctor) {
      throw new NotFoundException(`Doctor with ID ${id} not found`);
    }

    return doctor;
  }

  async create(createDoctorDto: CreateDoctorDto) {
    const { email, firstName, lastName, phoneNumber, ...doctorData } = createDoctorDto;
    const organizationId = this.tenantService.getTenantId();

    const existingUser = await this.userRepo.findOne({ where: { email, organizationId } });
    if (existingUser) {
      throw new ConflictException('Email already registered for this organization');
    }

    const hashedPassword = await bcrypt.hash('Doctor@123', 10);
    const userEntity = this.userRepo.create({
      email,
      firstName,
      lastName,
      phoneNumber,
      password: hashedPassword,
      roles: [] as any,
      status: UserStatus.ACTIVE,
      userId: doctorData.doctorId,
      emailVerified: true,
      organizationId,
    });

    const savedUser = await this.userRepo.save(userEntity);

    const doctor = this.doctorRepository.create({
      ...(doctorData as any),
      user: savedUser as any,
      customUserId: (savedUser as any).userId,
      organizationId,
    });

    return this.doctorRepository.save(doctor);
  }

  async update(id: string, updateDoctorDto: UpdateDoctorDto) {
    const doctor = await this.findOne(id);
    const { firstName, lastName, phoneNumber, ...doctorData } = updateDoctorDto;

    if (firstName || lastName || phoneNumber) {
      const user = doctor.user as any;
      Object.assign(user, { firstName, lastName, phoneNumber });
      await this.userRepo.save(user);
    }

    Object.assign(doctor, doctorData);
    return this.doctorRepository.save(doctor);
  }

  async remove(id: string) {
    const doctor = await this.findOne(id);
    return this.doctorRepository.remove(doctor);
  }
}
