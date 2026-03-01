import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { OperationTheater, Surgery } from './entities/operation-theater.entity';
import { PaginationQueryDto, PaginatedResponse } from '../../common/dto/pagination.dto';
import { CreateSurgeryDto, UpdateSurgeryDto } from './dto/create-surgery.dto';

@Injectable()
export class OperationTheaterService {
  constructor(
    @InjectRepository(OperationTheater)
    private readonly theaterRepo: Repository<OperationTheater>,
    @InjectRepository(Surgery)
    private readonly surgeryRepo: Repository<Surgery>,
  ) { }

  async findAllSurgeries(query: PaginationQueryDto): Promise<PaginatedResponse<Surgery>> {
    const { page = 1, limit = 20, search } = query;
    const skip = (page - 1) * limit;

    const where = search
      ? [
        { surgeryId: Like(`%${search}%`) },
        { surgeryType: Like(`%${search}%`) },
      ]
      : {};

    const [data, total] = await this.surgeryRepo.findAndCount({
      where,
      order: { scheduledDate: 'DESC' },
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

  async findOneSurgery(id: string) {
    const surgery = await this.surgeryRepo.findOne({
      where: { id },
    });

    if (!surgery) {
      throw new NotFoundException(`Surgery with ID ${id} not found`);
    }

    return surgery;
  }

  async createSurgery(createSurgeryDto: CreateSurgeryDto) {
    const surgery = this.surgeryRepo.create(createSurgeryDto);
    return this.surgeryRepo.save(surgery);
  }

  async updateSurgery(id: string, updateSurgeryDto: UpdateSurgeryDto) {
    const surgery = await this.findOneSurgery(id);
    Object.assign(surgery, updateSurgeryDto);
    return this.surgeryRepo.save(surgery);
  }

  async removeSurgery(id: string) {
    const surgery = await this.findOneSurgery(id);
    return this.surgeryRepo.remove(surgery);
  }

  // Keep existing methods for compatibility
  async getAvailableTheaters() {
    return this.theaterRepo.find({ where: { isAvailable: true } });
  }

  async getScheduledSurgeries(skip = 0, take = 10) {
    const [surgeries, total] = await this.surgeryRepo.findAndCount({
      skip,
      take,
    });
    return { data: surgeries, total, count: surgeries.length };
  }

  async getSurgeriesByPatient(patientId: string) {
    return this.surgeryRepo.find({ where: { patientId } });
  }

  async getSurgeriesBySurgeon(surgeonId: string) {
    return this.surgeryRepo.find({ where: { surgeonId } });
  }
}
