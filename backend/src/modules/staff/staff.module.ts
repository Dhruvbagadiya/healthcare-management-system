import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from '../../common/common.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { StaffController } from './staff.controller';
import { StaffService } from './staff.service';
import { Staff } from './entities/staff.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [CommonModule, SubscriptionsModule, TypeOrmModule.forFeature([Staff, User])],
  controllers: [StaffController],
  providers: [StaffService],
  exports: [StaffService],
})
export class StaffModule { }
