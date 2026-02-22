import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Prescription } from './entities/prescription.entity';
import { PaginationQueryDto, PaginatedResponse } from '../../common/dto/pagination.dto';

@Injectable()
export class PrescriptionsService {
  constructor(
    @InjectRepository(Prescription)
    private readonly prescriptionRepo: Repository<Prescription>,
  ) { }

  async findAll(query: PaginationQueryDto): Promise<PaginatedResponse<Prescription>> {
    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const [data, total] = await this.prescriptionRepo.findAndCount({
      relations: ['patient', 'patient.user', 'doctor', 'doctor.user'],
      order: { issuedDate: 'DESC' },
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
}
