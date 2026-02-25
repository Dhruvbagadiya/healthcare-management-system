import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Patient } from './entities/patient.entity';
import { MedicalRecord } from './entities/medical-record.entity';
import { User } from '../users/entities/user.entity';
import { PatientsController } from './patients.controller';
import { PatientsService } from './patients.service';

@Module({
  imports: [TypeOrmModule.forFeature([Patient, MedicalRecord, User])],
  controllers: [PatientsController],
  providers: [PatientsService],
})
export class PatientsModule { }
