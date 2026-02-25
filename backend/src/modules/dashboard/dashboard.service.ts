import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Patient } from '../patients/entities/patient.entity';
import { Doctor } from '../doctors/entities/doctor.entity';
import { Appointment } from '../appointments/entities/appointment.entity';

@Injectable()
export class DashboardService {
    constructor(
        @InjectRepository(Patient)
        private readonly patientRepo: Repository<Patient>,
        @InjectRepository(Doctor)
        private readonly doctorRepo: Repository<Doctor>,
        @InjectRepository(Appointment)
        private readonly appointmentRepo: Repository<Appointment>,
    ) { }

    async getStats() {
        const [totalPatients, totalDoctors, totalAppointments] = await Promise.all([
            this.patientRepo.count(),
            this.doctorRepo.count(),
            this.appointmentRepo.count(),
        ]);

        // Simplified revenue calculation for demo
        const revenue = await this.appointmentRepo
            .createQueryBuilder('appointment')
            .select('SUM(appointment.duration * 10)', 'total') // Dummy calculation
            .getRawOne();

        return {
            totalPatients,
            totalDoctors,
            totalAppointments,
            revenue: parseFloat(revenue?.total || '0'),
            change: {
                patients: '+12%',
                appointments: '+8%',
                doctors: '+2%',
                revenue: '+23%',
            },
        };
    }

    async getRecentActivity() {
        const recentAppointments = await this.appointmentRepo.find({
            relations: ['patient', 'patient.user', 'doctor', 'doctor.user'],
            order: { appointmentDate: 'DESC' },
            take: 5,
        });

        return recentAppointments.map((app) => ({
            id: app.id,
            patientName: `${app.patient.user?.firstName || 'Unknown'} ${app.patient.user?.lastName || ''}`,
            doctorName: `Dr. ${app.doctor.user?.firstName || 'Unknown'}`,
            date: app.appointmentDate,
            time: app.appointmentTime,
            status: app.status,
        }));
    }
}
