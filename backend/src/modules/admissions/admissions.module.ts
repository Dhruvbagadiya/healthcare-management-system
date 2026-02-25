import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Admission } from './entities/admission.entity';
import { Ward, Bed } from '../wards/entities/ward.entity';
import { AdmissionsService } from './admissions.service';
import { AdmissionsController } from './admissions.controller';

@Module({
    imports: [TypeOrmModule.forFeature([Admission, Ward, Bed])],
    controllers: [AdmissionsController],
    providers: [AdmissionsService],
    exports: [AdmissionsService],
})
export class AdmissionsModule { }
