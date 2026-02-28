import { Injectable, NotFoundException } from '@nestjs/common';
import { Invoice } from './entities/invoice.entity';
import { PaginationQueryDto, PaginatedResponse } from '../../common/dto/pagination.dto';
import { CreateInvoiceDto, UpdateInvoiceDto } from './dto/create-invoice.dto';
import { InvoiceRepository } from './repositories/invoice.repository';
import { TenantService } from '../../common/services/tenant.service';

@Injectable()
export class BillingService {
    constructor(
        private readonly invoiceRepository: InvoiceRepository,
        private readonly tenantService: TenantService,
    ) { }

    async findAll(query: PaginationQueryDto): Promise<PaginatedResponse<Invoice>> {
        const searchFields = ['invoiceNumber'];
        return this.invoiceRepository.findPaginated(query, ['patient', 'patient.user'], searchFields);
    }

    async findOne(id: string) {
        const invoice = await this.invoiceRepository.findById(id);

        if (!invoice) {
            throw new NotFoundException(`Invoice with ID ${id} not found`);
        }

        return invoice;
    }

    async create(createInvoiceDto: CreateInvoiceDto) {
        const organizationId = this.tenantService.getTenantId();
        const invoice = this.invoiceRepository.create({
            ...createInvoiceDto,
            dueAmount: createInvoiceDto.totalAmount, // Initially, full amount is due
            organizationId,
        });
        return this.invoiceRepository.save(invoice);
    }

    async update(id: string, updateInvoiceDto: UpdateInvoiceDto) {
        const invoice = await this.findOne(id);
        Object.assign(invoice, updateInvoiceDto);
        return this.invoiceRepository.save(invoice);
    }

    async remove(id: string) {
        const invoice = await this.findOne(id);
        return this.invoiceRepository.remove(invoice);
    }
}
