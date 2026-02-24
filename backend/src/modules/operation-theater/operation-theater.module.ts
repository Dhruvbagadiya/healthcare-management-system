import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OperationTheaterController } from './operation-theater.controller';
import { OperationTheaterService } from './operation-theater.service';
import { OperationTheater, Surgery } from './entities/operation-theater.entity';

@Module({
  imports: [TypeOrmModule.forFeature([OperationTheater, Surgery])],
  controllers: [OperationTheaterController],
  providers: [OperationTheaterService],
  exports: [OperationTheaterService],
})
export class OperationTheaterModule {}
