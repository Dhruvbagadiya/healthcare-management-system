import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Doctor } from './entities/doctor.entity';
import { PaginationQueryDto, PaginatedResponse } from '../../common/dto/pagination.dto';

@Injectable()
export class DoctorsService {
  constructor(
    @InjectRepository(Doctor)
    private readonly doctorRepo: Repository<Doctor>,
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
}
