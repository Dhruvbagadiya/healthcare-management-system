import { Controller, Get, Post, Body, Param, UseGuards, Query } from '@nestjs/common';
import { PatientsService } from './patients.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CreatePatientDto } from './dto/create-patient.dto';

@ApiTags('Patients')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) { }

  @Get()
  @ApiOperation({ summary: 'Get all patients' })
  async findAll(@Query() query: PaginationQueryDto) {
    return this.patientsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get patient by ID' })
  async findOne(@Param('id') id: string) {
    return this.patientsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new patient' })
  async create(@Body() createPatientDto: CreatePatientDto) {
    return this.patientsService.create(createPatientDto);
  }
}
