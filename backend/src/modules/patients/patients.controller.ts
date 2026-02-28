import { Controller, Get, Post, Body, Param, UseGuards, Query } from '@nestjs/common';
import { PatientsService } from './patients.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CreatePatientDto } from './dto/create-patient.dto';
import { PermissionsGuard } from '../rbac/guards/permissions.guard';
import { Permissions } from '../rbac/decorators/permissions.decorator';
import { Audit } from '../../common/decorators/audit.decorator';

@ApiTags('Patients')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) { }

  @Get()
  @ApiOperation({ summary: 'Get all patients' })
  @Permissions('patients:read')
  @Audit({ action: 'List Patients', entityType: 'Patient' })
  async findAll(@Query() query: PaginationQueryDto) {
    return this.patientsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get patient by ID' })
  @Permissions('patients:read')
  @Audit({ action: 'View Patient Details', entityType: 'Patient' })
  async findOne(@Param('id') id: string) {
    return this.patientsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new patient' })
  @Permissions('patients:create')
  @Audit({ action: 'Create Patient', entityType: 'Patient' })
  async create(@Body() createPatientDto: CreatePatientDto) {
    return this.patientsService.create(createPatientDto);
  }

  @Post(':id/medical-records')
  @ApiOperation({ summary: 'Add a medical record to a patient' })
  @Permissions('patients:update')
  @Audit({ action: 'Add Medical Record', entityType: 'MedicalRecord' })
  async addMedicalRecord(@Param('id') id: string, @Body() recordData: any) {
    return this.patientsService.addMedicalRecord(id, recordData);
  }

  @Get(':id/medical-records')
  @ApiOperation({ summary: 'Get all medical records for a patient' })
  @Permissions('patients:read')
  @Audit({ action: 'View Medical History', entityType: 'MedicalRecord' })
  async getMedicalRecords(@Param('id') id: string) {
    return this.patientsService.getMedicalRecords(id);
  }
}
