import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { LaboratoryService } from './laboratory.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

@ApiTags('Laboratory')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('laboratory')
export class LaboratoryController {
    constructor(private readonly laboratoryService: LaboratoryService) { }

    @Get('lab-tests')
    @ApiOperation({ summary: 'Get all lab tests' })
    async findAll(@Query() query: PaginationQueryDto) {
        return this.laboratoryService.findAll(query);
    }
}
