import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Patient } from './entities/patient.entity';
import { PaginationQueryDto, PaginatedResponse } from '../../common/dto/pagination.dto';

@Injectable()
export class PatientsService {
  constructor(
    @InjectRepository(Patient)
    private readonly patientRepo: Repository<Patient>,
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
}
