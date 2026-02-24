import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { StaffService } from './staff.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Staff')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('staff')
export class StaffController {
  constructor(private staffService: StaffService) {}

  @Get()
  async getAllStaff(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    const skip = (parseInt(page) - 1) * parseInt(limit);
    return this.staffService.getAllStaff(skip, parseInt(limit));
  }

  @Get('by-role')
  async getStaffByRole(@Query('role') role: string) {
    return this.staffService.getStaffByRole(role);
  }
}
