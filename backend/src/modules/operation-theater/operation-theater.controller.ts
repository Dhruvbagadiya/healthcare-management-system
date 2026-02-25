import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { OperationTheaterService } from './operation-theater.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { CreateSurgeryDto, UpdateSurgeryDto } from './dto/create-surgery.dto';

@ApiTags('Operation Theater')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('operation-theater')
export class OperationTheaterController {
  constructor(private readonly theaterService: OperationTheaterService) { }

  @Post('surgeries')
  @ApiOperation({ summary: 'Schedule a new surgery' })
  async createSurgery(@Body() createSurgeryDto: CreateSurgeryDto) {
    return this.theaterService.createSurgery(createSurgeryDto);
  }

  @Get('surgeries')
  @ApiOperation({ summary: 'Get all scheduled surgeries' })
  async findAllSurgeries(@Query() query: PaginationQueryDto) {
    return this.theaterService.findAllSurgeries(query);
  }

  @Get('surgeries/:id')
  @ApiOperation({ summary: 'Get surgery by ID' })
  async findOneSurgery(@Param('id') id: string) {
    return this.theaterService.findOneSurgery(id);
  }

  @Patch('surgeries/:id')
  @ApiOperation({ summary: 'Update a surgery' })
  async updateSurgery(@Param('id') id: string, @Body() updateSurgeryDto: UpdateSurgeryDto) {
    return this.theaterService.updateSurgery(id, updateSurgeryDto);
  }

  @Delete('surgeries/:id')
  @ApiOperation({ summary: 'Cancel/Delete a surgery' })
  async removeSurgery(@Param('id') id: string) {
    return this.theaterService.removeSurgery(id);
  }

  @Get('available')
  @ApiOperation({ summary: 'Get available theaters' })
  async getAvailableTheaters() {
    return this.theaterService.getAvailableTheaters();
  }
}
