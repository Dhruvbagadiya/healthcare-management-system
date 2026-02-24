import { Controller, Get, UseGuards } from '@nestjs/common';
import { WardsService } from './wards.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Wards')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('wards')
export class WardsController {
  constructor(private wardsService: WardsService) {}

  @Get()
  async getAllWards() {
    return this.wardsService.getAllWards();
  }

  @Get('available-beds')
  async getAvailableBeds() {
    return this.wardsService.getAvailableBeds();
  }

  @Get('stats')
  async getStats() {
    return this.wardsService.getWardStats();
  }
}
