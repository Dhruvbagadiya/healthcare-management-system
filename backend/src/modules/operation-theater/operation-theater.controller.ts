import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { OperationTheaterService } from './operation-theater.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Operation Theater')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('operation-theater')
export class OperationTheaterController {
  constructor(private theaterService: OperationTheaterService) {}

  @Get('available')
  async getAvailableTheaters() {
    return this.theaterService.getAvailableTheaters();
  }

  @Get('surgeries')
  async getScheduledSurgeries(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    const skip = (parseInt(page) - 1) * parseInt(limit);
    return this.theaterService.getScheduledSurgeries(skip, parseInt(limit));
  }
}
