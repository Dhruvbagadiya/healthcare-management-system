import { DataSource, DataSourceOptions } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';

// Entity imports
import { User } from '../modules/users/entities/user.entity';
import { Patient } from '../modules/patients/entities/patient.entity';
import { Doctor } from '../modules/doctors/entities/doctor.entity';
import { Appointment } from '../modules/appointments/entities/appointment.entity';
import { Prescription } from '../modules/prescriptions/entities/prescription.entity';
import { MedicalRecord } from '../modules/patients/entities/medical-record.entity';
import { Invoice } from '../modules/billing/entities/invoice.entity';
import { LabTest } from '../modules/laboratory/entities/lab-test.entity';
import { Medicine } from '../modules/pharmacy/entities/medicine.entity';
import { AuditLog } from '../common/entities/audit-log.entity';
import { Staff } from '../modules/staff/entities/staff.entity';
import { Inventory } from '../modules/inventory/entities/inventory.entity';
import { Ward, Bed } from '../modules/wards/entities/ward.entity';
import { Admission } from '../modules/admissions/entities/admission.entity';
import { OperationTheater, Surgery } from '../modules/operation-theater/entities/operation-theater.entity';
import { RadiologyRequest } from '../modules/radiology/entities/radiology.entity';
import { Expense, Revenue } from '../modules/accounts/entities/accounts.entity';
import { ComplianceRecord, DataAccessLog } from '../modules/compliance/entities/compliance.entity';

export const typeormConfig = (configService: ConfigService): DataSourceOptions => {
  const databaseUrl = configService.get<string>('DATABASE_URL');

  if (databaseUrl) {
    return {
      type: 'postgres',
      url: databaseUrl,
      entities: [
        User,
        Patient,
        Doctor,
        Appointment,
        Prescription,
        MedicalRecord,
        Invoice,
        LabTest,
        Medicine,
        AuditLog,
        Staff,
        Inventory,
        Ward,
        Bed,
        Admission,
        OperationTheater,
        Surgery,
        RadiologyRequest,
        Expense,
        Revenue,
        ComplianceRecord,
        DataAccessLog,
      ],
      migrations: [path.join(__dirname, '../database/migrations/*.{ts,js}')],
      migrationsTableName: 'typeorm_migrations',
      synchronize: true, // Should be false in production, but keeping as per current project state
      logging: configService.get<string>('NODE_ENV') === 'development',
      ssl:
        configService.get<string>('NODE_ENV') === 'production' ||
          databaseUrl.includes('neon.tech') ||
          databaseUrl.includes('supabase')
          ? { rejectUnauthorized: false }
          : false,
    };
  }

  return {
    type: 'postgres',
    host: configService.get<string>('DATABASE_HOST') || configService.get<string>('PGHOST') || 'localhost',
    port: configService.get<number>('DATABASE_PORT') || configService.get<number>('PGPORT') || 5432,
    username: configService.get<string>('DATABASE_USER') || configService.get<string>('PGUSER'),
    password: configService.get<string>('DATABASE_PASSWORD') || configService.get<string>('PGPASSWORD'),
    database: configService.get<string>('DATABASE_NAME') || configService.get<string>('PGDATABASE'),
    entities: [
      User,
      Patient,
      Doctor,
      Appointment,
      Prescription,
      MedicalRecord,
      Invoice,
      LabTest,
      Medicine,
      AuditLog,
      Staff,
      Inventory,
      Ward,
      Bed,
      Admission,
      OperationTheater,
      Surgery,
      RadiologyRequest,
      Expense,
      Revenue,
      ComplianceRecord,
      DataAccessLog,
    ],
    migrations: [path.join(__dirname, '../database/migrations/*.{ts,js}')],
    migrationsTableName: 'typeorm_migrations',
    synchronize: true,
    logging: configService.get<string>('NODE_ENV') === 'development',
    ssl:
      configService.get<string>('DATABASE_HOST')?.includes('neon.tech') ||
        configService.get<string>('DATABASE_HOST')?.includes('supabase') ||
        configService.get<string>('NODE_ENV') === 'production'
        ? { rejectUnauthorized: false }
        : false,
  };
};

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  host: !process.env.DATABASE_URL ? (process.env.DATABASE_HOST || process.env.PGHOST || 'localhost') : undefined,
  port: !process.env.DATABASE_URL ? parseInt(process.env.DATABASE_PORT || process.env.PGPORT || '5432') : undefined,
  username: !process.env.DATABASE_URL ? (process.env.DATABASE_USER || process.env.PGUSER) : undefined,
  password: !process.env.DATABASE_URL ? (process.env.DATABASE_PASSWORD || process.env.PGPASSWORD) : undefined,
  database: !process.env.DATABASE_URL ? (process.env.DATABASE_NAME || process.env.PGDATABASE) : undefined,
  entities: [
    User,
    Patient,
    Doctor,
    Appointment,
    Prescription,
    MedicalRecord,
    Invoice,
    LabTest,
    Medicine,
    AuditLog,
    Staff,
    Inventory,
    Ward,
    Bed,
    Admission,
    OperationTheater,
    Surgery,
    RadiologyRequest,
    Expense,
    Revenue,
    ComplianceRecord,
    DataAccessLog,
  ],
  migrations: [path.join(__dirname, '../database/migrations/*.{ts,js}')],
  migrationsTableName: 'typeorm_migrations',
  synchronize: true,
  logging: process.env.NODE_ENV === 'development',
  ssl:
    process.env.NODE_ENV === 'production' ||
      process.env.DATABASE_HOST?.includes('neon.tech') ||
      process.env.DATABASE_HOST?.includes('supabase') ||
      process.env.DATABASE_URL?.includes('neon.tech') ||
      process.env.DATABASE_URL?.includes('supabase')
      ? { rejectUnauthorized: false }
      : false,
} as DataSourceOptions);
