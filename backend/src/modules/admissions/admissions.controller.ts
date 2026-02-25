import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Query,
    UseGuards,
    Patch,
} from '@nestjs/common';
import { AdmissionsService } from './admissions.service';
import { CreateAdmissionDto, UpdateVitalsDto, AddNursingNoteDto, DischargeAdmissionDto } from './dto/create-admission.dto';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

@Controller('admissions')
@UseGuards(JwtAuthGuard)
export class AdmissionsController {
    constructor(private readonly admissionsService: AdmissionsService) { }

    @Get()
    findAll(@Query() query: PaginationQueryDto) {
        return this.admissionsService.findAll(query);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.admissionsService.findOne(id);
    }

    @Post()
    create(@Body() createAdmissionDto: CreateAdmissionDto) {
        return this.admissionsService.create(createAdmissionDto);
    }

    @Patch(':id/vitals')
    updateVitals(@Param('id') id: string, @Body() updateVitalsDto: UpdateVitalsDto) {
        return this.admissionsService.updateVitals(id, updateVitalsDto);
    }

    @Patch(':id/notes')
    addNursingNote(@Param('id') id: string, @Body() addNursingNoteDto: AddNursingNoteDto) {
        return this.admissionsService.addNursingNote(id, addNursingNoteDto);
    }

    @Post(':id/discharge')
    discharge(@Param('id') id: string, @Body() dischargeDto: DischargeAdmissionDto) {
        return this.admissionsService.discharge(id, dischargeDto);
    }
}
