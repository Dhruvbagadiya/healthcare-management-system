import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Prescription } from './entities/prescription.entity';
import { PaginationQueryDto, PaginatedResponse } from '../../common/dto/pagination.dto';
import { CreatePrescriptionDto, UpdatePrescriptionDto } from './dto/create-prescription.dto';

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

  async findOne(id: string) {
    const prescription = await this.prescriptionRepo.findOne({
      where: { id },
      relations: ['patient', 'patient.user', 'doctor', 'doctor.user'],
    });

    if (!prescription) {
      throw new NotFoundException(`Prescription with ID ${id} not found`);
    }

    return prescription;
  }

  async create(createPrescriptionDto: CreatePrescriptionDto) {
    const prescription = this.prescriptionRepo.create(createPrescriptionDto);
    return this.prescriptionRepo.save(prescription);
  }

  async update(id: string, updatePrescriptionDto: UpdatePrescriptionDto) {
    const prescription = await this.findOne(id);
    Object.assign(prescription, updatePrescriptionDto);
    return this.prescriptionRepo.save(prescription);
  }

  async remove(id: string) {
    const prescription = await this.findOne(id);
    return this.prescriptionRepo.remove(prescription);
  }
}
