import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Medicine } from './entities/medicine.entity';
import { PaginationQueryDto, PaginatedResponse } from '../../common/dto/pagination.dto';
import { CreateMedicineDto } from './dto/create-medicine.dto';
import { UpdateMedicineDto } from './dto/update-medicine.dto';
import { ILike } from 'typeorm';

@Injectable()
export class PharmacyService {
    constructor(
        @InjectRepository(Medicine)
        private readonly medicineRepo: Repository<Medicine>,
    ) { }

    async findAll(query: PaginationQueryDto): Promise<PaginatedResponse<Medicine>> {
        const { page = 1, limit = 20, search = '' } = query;
        const skip = (page - 1) * limit;

        const where: any = {};
        if (search) {
            where.name = ILike(`%${search}%`);
        }

        const [data, total] = await this.medicineRepo.findAndCount({
            where,
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

    async findOne(id: string): Promise<Medicine> {
        const medicine = await this.medicineRepo.findOne({ where: { id } });
        if (!medicine) {
            throw new NotFoundException(`Medicine with ID ${id} not found`);
        }
        return medicine;
    }

    async create(createMedicineDto: CreateMedicineDto): Promise<Medicine> {
        const medicine = this.medicineRepo.create(createMedicineDto);
        return this.medicineRepo.save(medicine);
    }

    async update(id: string, updateMedicineDto: UpdateMedicineDto): Promise<Medicine> {
        const medicine = await this.findOne(id);
        Object.assign(medicine, updateMedicineDto);
        return this.medicineRepo.save(medicine);
    }

    async remove(id: string): Promise<void> {
        const medicine = await this.findOne(id);
        await this.medicineRepo.remove(medicine);
    }
}
