import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invoice } from './entities/invoice.entity';
import { BillingService } from './billing.service';
import { BillingController } from './billing.controller';
import { InvoiceRepository } from './repositories/invoice.repository';
import { CommonModule } from '../../common/common.module';

@Module({
  imports: [CommonModule, TypeOrmModule.forFeature([Invoice])],
  controllers: [BillingController],
  providers: [BillingService, InvoiceRepository],
  exports: [BillingService],
})
export class BillingModule { }
