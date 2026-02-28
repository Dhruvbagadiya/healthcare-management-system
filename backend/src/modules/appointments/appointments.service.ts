import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Appointment } from './entities/appointment.entity';
import { AppointmentPaginationDto } from './dto/appointment-pagination.dto';
import { PaginatedResponse } from '../../common/dto/pagination.dto';

import { TenantService } from '../../common/services/tenant.service';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepo: Repository<Appointment>,
    private readonly tenantService: TenantService,
  ) { }

  async findAll(query: AppointmentPaginationDto): Promise<PaginatedResponse<Appointment>> {
    const { page = 1, limit = 10, patientId, doctorId } = query;
    const skip = (page - 1) * limit;

    const organizationId = this.tenantService.getTenantId();
    const where: any = { organizationId };
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
    const organizationId = this.tenantService.getTenantId();
    const appointment = await this.appointmentRepo.findOne({
      where: { id, organizationId },
      relations: ['patient', 'patient.user', 'doctor', 'doctor.user'],
    });

    if (!appointment) {
      throw new NotFoundException(`Appointment with ID ${id} not found`);
    }

    return appointment;
  }

  async create(createAppointmentDto: any) {
    const { doctorId, appointmentDate } = createAppointmentDto;

    const organizationId = this.tenantService.getTenantId();

    // Get count of appointments for this doctor on this day within the organization
    const date = new Date(appointmentDate);
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const todayCount = await this.appointmentRepo.count({
      where: {
        doctorId,
        organizationId,
        appointmentDate: Between(startOfDay, endOfDay),
      },
    });

    const tokenNumber = todayCount + 1;

    const appointment = this.appointmentRepo.create({
      ...createAppointmentDto,
      tokenNumber,
      organizationId,
    });
    return this.appointmentRepo.save(appointment);
  }

  async update(id: string, updateAppointmentDto: any) {
    const appointment = await this.findOne(id);
    Object.assign(appointment, updateAppointmentDto);
    return this.appointmentRepo.save(appointment);
  }

  async remove(id: string) {
    const appointment = await this.findOne(id);
    return this.appointmentRepo.remove(appointment);
  }
}
