import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice } from './entities/invoice.entity';
import { PaginationQueryDto, PaginatedResponse } from '../../common/dto/pagination.dto';
import { CreateInvoiceDto, UpdateInvoiceDto } from './dto/create-invoice.dto';

@Injectable()
export class BillingService {
    constructor(
        @InjectRepository(Invoice)
        private readonly invoiceRepo: Repository<Invoice>,
    ) { }

    async findAll(query: PaginationQueryDto): Promise<PaginatedResponse<Invoice>> {
        const { page = 1, limit = 10 } = query;
        const skip = (page - 1) * limit;

        const [data, total] = await this.invoiceRepo.findAndCount({
            relations: ['patient', 'patient.user'],
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
        const invoice = await this.invoiceRepo.findOne({
            where: { id },
            relations: ['patient', 'patient.user'],
        });

        if (!invoice) {
            throw new NotFoundException(`Invoice with ID ${id} not found`);
        }

        return invoice;
    }

    async create(createInvoiceDto: CreateInvoiceDto) {
        const invoice = this.invoiceRepo.create({
            ...createInvoiceDto,
            dueAmount: createInvoiceDto.totalAmount, // Initially, full amount is due
        });
        return this.invoiceRepo.save(invoice);
    }

    async update(id: string, updateInvoiceDto: UpdateInvoiceDto) {
        const invoice = await this.findOne(id);
        Object.assign(invoice, updateInvoiceDto);
        return this.invoiceRepo.save(invoice);
    }

    async remove(id: string) {
        const invoice = await this.findOne(id);
        return this.invoiceRepo.remove(invoice);
    }
}
