import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OperationTheater, Surgery } from './entities/operation-theater.entity';

@Injectable()
export class OperationTheaterService {
  constructor(
    @InjectRepository(OperationTheater)
    private theaterRepository: Repository<OperationTheater>,
    @InjectRepository(Surgery)
    private surgeryRepository: Repository<Surgery>,
  ) {}

  async getAvailableTheaters() {
    return this.theaterRepository.find({ where: { isAvailable: true } });
  }

  async getScheduledSurgeries(skip = 0, take = 10) {
    const [surgeries, total] = await this.surgeryRepository.findAndCount({
      skip,
      take,
    });
    return { data: surgeries, total, count: surgeries.length };
  }

  async getSurgeriesByPatient(patientId: string) {
    return this.surgeryRepository.find({ where: { patientId } });
  }

  async getSurgeriesBySurgeon(surgeonId: string) {
    return this.surgeryRepository.find({ where: { surgeonId } });
  }
}
