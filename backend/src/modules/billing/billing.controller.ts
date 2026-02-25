import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { BillingService } from './billing.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CreateInvoiceDto, UpdateInvoiceDto } from './dto/create-invoice.dto';

@ApiTags('Billing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('billing')
export class BillingController {
    constructor(private readonly billingService: BillingService) { }

    @Post('invoices')
    @ApiOperation({ summary: 'Create a new invoice' })
    async create(@Body() createInvoiceDto: CreateInvoiceDto) {
        return this.billingService.create(createInvoiceDto);
    }

    @Get('invoices')
    @ApiOperation({ summary: 'Get all invoices' })
    async findAll(@Query() query: PaginationQueryDto) {
        return this.billingService.findAll(query);
    }

    @Get('invoices/:id')
    @ApiOperation({ summary: 'Get invoice by ID' })
    async findOne(@Param('id') id: string) {
        return this.billingService.findOne(id);
    }

    @Patch('invoices/:id')
    @ApiOperation({ summary: 'Update an invoice' })
    async update(@Param('id') id: string, @Body() updateInvoiceDto: UpdateInvoiceDto) {
        return this.billingService.update(id, updateInvoiceDto);
    }

    @Delete('invoices/:id')
    @ApiOperation({ summary: 'Delete an invoice' })
    async remove(@Param('id') id: string) {
        return this.billingService.remove(id);
    }
}
