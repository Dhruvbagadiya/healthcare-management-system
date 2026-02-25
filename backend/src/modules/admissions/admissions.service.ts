import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Admission, AdmissionStatus } from './entities/admission.entity';
import { Ward, Bed, BedStatus } from '../wards/entities/ward.entity';
import { CreateAdmissionDto, UpdateVitalsDto, AddNursingNoteDto, DischargeAdmissionDto } from './dto/create-admission.dto';
import { PaginationQueryDto, PaginatedResponse } from '../../common/dto/pagination.dto';

@Injectable()
export class AdmissionsService {
    constructor(
        @InjectRepository(Admission)
        private readonly admissionRepo: Repository<Admission>,
        @InjectRepository(Ward)
        private readonly wardRepo: Repository<Ward>,
        @InjectRepository(Bed)
        private readonly bedRepo: Repository<Bed>,
    ) { }

    async findAll(query: PaginationQueryDto): Promise<PaginatedResponse<Admission>> {
        const { page = 1, limit = 10, search } = query;
        const skip = (page - 1) * limit;

        const where = search
            ? [
                { admissionId: Like(`%${search}%`) },
                { patient: { firstName: Like(`%${search}%`) } },
                { patient: { lastName: Like(`%${search}%`) } },
            ]
            : {};

        const [data, total] = await this.admissionRepo.findAndCount({
            where,
            relations: ['patient', 'doctor', 'ward', 'bed'],
            order: { admissionDate: 'DESC' },
            take: limit,
            skip,
        });

        return {
            data,
            meta: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async findOne(id: string) {
        const admission = await this.admissionRepo.findOne({
            where: { id },
            relations: ['patient', 'doctor', 'ward', 'bed'],
        });

        if (!admission) {
            throw new NotFoundException(`Admission with ID ${id} not found`);
        }

        return admission;
    }

    async create(createAdmissionDto: CreateAdmissionDto) {
        const { bedId, wardId } = createAdmissionDto;

        // Check bed availability
        const bed = await this.bedRepo.findOne({ where: { id: bedId } });
        if (!bed) throw new NotFoundException('Bed not found');
        if (bed.status !== BedStatus.AVAILABLE) {
            throw new BadRequestException('Bed is not available');
        }

        // Create admission
        const admission = this.admissionRepo.create({
            ...createAdmissionDto,
            admissionDate: new Date(createAdmissionDto.admissionDate),
        });

        const savedAdmission = await this.admissionRepo.save(admission);

        // Update bed status
        bed.status = BedStatus.OCCUPIED;
        bed.assignedPatientId = createAdmissionDto.patientId;
        bed.assignedDate = new Date();
        await this.bedRepo.save(bed);

        // Update ward occupancy
        const ward = await this.wardRepo.findOne({ where: { id: wardId } });
        if (ward) {
            ward.occupiedBeds += 1;
            await this.wardRepo.save(ward);
        }

        return savedAdmission;
    }

    async updateVitals(id: string, updateVitalsDto: UpdateVitalsDto) {
        const admission = await this.findOne(id);

        admission.vitalsHistory.push({
            ...updateVitalsDto,
            timestamp: new Date(),
        });

        return this.admissionRepo.save(admission);
    }

    async addNursingNote(id: string, addNursingNoteDto: AddNursingNoteDto) {
        const admission = await this.findOne(id);

        admission.nursingNotes.push({
            ...addNursingNoteDto,
            timestamp: new Date(),
        });

        return this.admissionRepo.save(admission);
    }

    async discharge(id: string, dischargeDto: DischargeAdmissionDto) {
        const admission = await this.findOne(id);
        if (admission.status === AdmissionStatus.DISCHARGED) {
            throw new BadRequestException('Patient already discharged');
        }

        // Update admission record
        admission.status = AdmissionStatus.DISCHARGED;
        admission.dischargeDate = new Date(dischargeDto.dischargeDate);
        admission.dischargeSummary = dischargeDto.dischargeSummary;
        admission.dischargePlan = dischargeDto.dischargePlan;

        await this.admissionRepo.save(admission);

        // Free the bed
        const bed = await this.bedRepo.findOne({ where: { id: admission.bedId } });
        if (bed) {
            bed.status = BedStatus.AVAILABLE;
            bed.assignedPatientId = null;
            bed.assignedDate = null;
            await this.bedRepo.save(bed);
        }

        // Update ward occupancy
        const ward = await this.wardRepo.findOne({ where: { id: admission.wardId } });
        if (ward) {
            ward.occupiedBeds = Math.max(0, ward.occupiedBeds - 1);
            await this.wardRepo.save(ward);
        }

        return admission;
    }
}
