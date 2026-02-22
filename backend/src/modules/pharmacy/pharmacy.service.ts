import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Medicine } from './entities/medicine.entity';
import { PaginationQueryDto, PaginatedResponse } from '../../common/dto/pagination.dto';

@Injectable()
export class PharmacyService {
    constructor(
        @InjectRepository(Medicine)
        private readonly medicineRepo: Repository<Medicine>,
    ) { }

    async findAll(query: PaginationQueryDto): Promise<PaginatedResponse<Medicine>> {
        const { page = 1, limit = 10 } = query;
        const skip = (page - 1) * limit;

        const [data, total] = await this.medicineRepo.findAndCount({
            order: { name: 'ASC' },
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
