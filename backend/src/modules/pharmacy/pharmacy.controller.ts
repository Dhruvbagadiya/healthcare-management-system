import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Query } from '@nestjs/common';
import { PharmacyService } from './pharmacy.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { CreateMedicineDto } from './dto/create-medicine.dto';
import { UpdateMedicineDto } from './dto/update-medicine.dto';

@ApiTags('Pharmacy')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('pharmacy')
export class PharmacyController {
    constructor(private readonly pharmacyService: PharmacyService) { }

    @Get('medicines')
    @ApiOperation({ summary: 'Get all medicines' })
    async findAll(@Query() query: PaginationQueryDto) {
        return this.pharmacyService.findAll(query);
    }

    @Get('medicines/:id')
    @ApiOperation({ summary: 'Get medicine by ID' })
    async findOne(@Param('id') id: string) {
        return this.pharmacyService.findOne(id);
    }

    @Post('medicines')
    @ApiOperation({ summary: 'Create a new medicine' })
    async create(@Body() createMedicineDto: CreateMedicineDto) {
        return this.pharmacyService.create(createMedicineDto);
    }

    @Patch('medicines/:id')
    @ApiOperation({ summary: 'Update a medicine' })
    async update(@Param('id') id: string, @Body() updateMedicineDto: UpdateMedicineDto) {
        return this.pharmacyService.update(id, updateMedicineDto);
    }

    @Delete('medicines/:id')
    @ApiOperation({ summary: 'Delete a medicine' })
    async remove(@Param('id') id: string) {
        return this.pharmacyService.remove(id);
    }
}
