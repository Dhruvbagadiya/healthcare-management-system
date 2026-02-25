import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { StaffService } from './staff.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { StaffRole } from './entities/staff.entity';
import { CreateStaffDto, UpdateStaffDto } from './dto/create-staff.dto';

@ApiTags('Staff')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('staff')
export class StaffController {
  constructor(private readonly staffService: StaffService) { }

  @Post()
  @ApiOperation({ summary: 'Create a new staff member' })
  async create(@Body() createStaffDto: CreateStaffDto) {
    return this.staffService.create(createStaffDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all staff' })
  async findAll(@Query() query: PaginationQueryDto) {
    return this.staffService.findAll(query);
  }

  @Get('by-role')
  @ApiOperation({ summary: 'Get staff by role' })
  async getStaffByRole(@Query('role') role: string) {
    return this.staffService.getStaffByRole(role as StaffRole);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get staff member by ID' })
  async findOne(@Param('id') id: string) {
    return this.staffService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a staff member' })
  async update(@Param('id') id: string, @Body() updateStaffDto: UpdateStaffDto) {
    return this.staffService.update(id, updateStaffDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a staff member' })
  async remove(@Param('id') id: string) {
    return this.staffService.remove(id);
  }
}
