import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { typeormConfig } from './database/typeorm.config';
import { CommonModule } from './common/common.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { PatientsModule } from './modules/patients/patients.module';
import { DoctorsModule } from './modules/doctors/doctors.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { PrescriptionsModule } from './modules/prescriptions/prescriptions.module';
import { BillingModule } from './modules/billing/billing.module';
import { LaboratoryModule } from './modules/laboratory/laboratory.module';
import { PharmacyModule } from './modules/pharmacy/pharmacy.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { StaffModule } from './modules/staff/staff.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { WardsModule } from './modules/wards/wards.module';
import { OperationTheaterModule } from './modules/operation-theater/operation-theater.module';
import { RadiologyModule } from './modules/radiology/radiology.module';
import { AccountsModule } from './modules/accounts/accounts.module';
import { ComplianceModule } from './modules/compliance/compliance.module';
import { AdmissionsModule } from './modules/admissions/admissions.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => typeormConfig(configService),
    }),
    CommonModule,
    AuthModule,
    UsersModule,
    PatientsModule,
    DoctorsModule,
    AppointmentsModule,
    PrescriptionsModule,
    BillingModule,
    LaboratoryModule,
    PharmacyModule,
    DashboardModule,
    StaffModule,
    InventoryModule,
    WardsModule,
    OperationTheaterModule,
    RadiologyModule,
    AccountsModule,
    ComplianceModule,
    AdmissionsModule,
  ],
})
export class AppModule {
  constructor(private dataSource: DataSource) { }

  onModuleInit() {
    const options = this.dataSource.options as any;
    console.log(`📡 Database connected successfully to: ${options.host || options.url || 'unknown host'}`);
  }
}
