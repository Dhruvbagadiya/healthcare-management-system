import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { RadiologyService } from './radiology.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Radiology')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('radiology')
export class RadiologyController {
  constructor(private radiologyService: RadiologyService) {}

  @Get('requests')
  async getRadiologyRequests(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    const skip = (parseInt(page) - 1) * parseInt(limit);
    return this.radiologyService.getRadiologyRequests(skip, parseInt(limit));
  }

  @Get('pending')
  async getPendingReports() {
    return this.radiologyService.getPendingReports();
  }

  @Get('completed')
  async getCompletedReports() {
    return this.radiologyService.getCompletedReports();
  }
}
