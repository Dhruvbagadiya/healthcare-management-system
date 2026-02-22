import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment } from './entities/appointment.entity';
import { AppointmentPaginationDto } from './dto/appointment-pagination.dto';
import { PaginatedResponse } from '../../common/dto/pagination.dto';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepo: Repository<Appointment>,
  ) { }

  async findAll(query: AppointmentPaginationDto): Promise<PaginatedResponse<Appointment>> {
    const { page = 1, limit = 10, patientId, doctorId } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (patientId) where.patientId = patientId;
    if (doctorId) where.doctorId = doctorId;

    const [data, total] = await this.appointmentRepo.findAndCount({
      where,
      relations: ['patient', 'patient.user', 'doctor', 'doctor.user'],
      order: { appointmentDate: 'DESC' },
      take: limit,
      skip,
    });

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const appointment = await this.appointmentRepo.findOne({
      where: { id },
      relations: ['patient', 'patient.user', 'doctor', 'doctor.user'],
    });

    if (!appointment) {
      throw new NotFoundException(`Appointment with ID ${id} not found`);
    }

    return appointment;
  }
}
