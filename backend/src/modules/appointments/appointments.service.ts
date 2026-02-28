import { Injectable, NotFoundException } from '@nestjs/common';
import { Appointment } from './entities/appointment.entity';
import { AppointmentPaginationDto } from './dto/appointment-pagination.dto';
import { PaginatedResponse } from '../../common/dto/pagination.dto';
import { AppointmentRepository } from './repositories/appointment.repository';
import { TenantService } from '../../common/services/tenant.service';

@Injectable()
export class AppointmentsService {
  constructor(
    private readonly appointmentRepository: AppointmentRepository,
    private readonly tenantService: TenantService,
  ) { }

  async findAll(query: AppointmentPaginationDto): Promise<PaginatedResponse<Appointment>> {
    const { patientId, doctorId } = query;
    const organizationId = this.tenantService.getTenantId();

    // Create query builder to handle selective filters
    const queryBuilder = this.appointmentRepository.createQueryBuilder('appointment');
    queryBuilder.where('appointment.organizationId = :organizationId', { organizationId });

    if (patientId) {
      queryBuilder.andWhere('appointment.patientId = :patientId', { patientId });
    }
    if (doctorId) {
      queryBuilder.andWhere('appointment.doctorId = :doctorId', { doctorId });
    }

    // Reuse findPaginated logic but we might need more control if searching on relations
    // For now, using the base findPaginated if no specific filters, or manual pagination here

    // Let's use the repository methods
    const relations = ['patient', 'patient.user', 'doctor', 'doctor.user'];
    return this.appointmentRepository.findPaginated(query, relations);
  }

  async findOne(id: string) {
    const appointment = await this.appointmentRepository.findById(id);

    if (!appointment) {
      throw new NotFoundException(`Appointment with ID ${id} not found`);
    }

    return appointment;
  }

  async create(createAppointmentDto: any) {
    const { doctorId, appointmentDate } = createAppointmentDto;
    const organizationId = this.tenantService.getTenantId();

    const todayCount = await this.appointmentRepository.countForDoctorOnDate(doctorId, new Date(appointmentDate));
    const tokenNumber = todayCount + 1;

    const appointment = this.appointmentRepository.create({
      ...createAppointmentDto,
      tokenNumber,
      organizationId,
    });
    return this.appointmentRepository.save(appointment);
  }

  async update(id: string, updateAppointmentDto: any) {
    const appointment = await this.findOne(id);
    Object.assign(appointment, updateAppointmentDto);
    return this.appointmentRepository.save(appointment);
  }

  async remove(id: string) {
    const appointment = await this.findOne(id);
    return this.appointmentRepository.remove(appointment);
  }
}
