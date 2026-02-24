import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RadiologyRequest } from './entities/radiology.entity';

@Injectable()
export class RadiologyService {
  constructor(
    @InjectRepository(RadiologyRequest)
    private radiologyRepository: Repository<RadiologyRequest>,
  ) {}

  async getRadiologyRequests(skip = 0, take = 10) {
    const [requests, total] = await this.radiologyRepository.findAndCount({
      skip,
      take,
    });
    return { data: requests, total, count: requests.length };
  }

  async getByPatient(patientId: string) {
    return this.radiologyRepository.find({ where: { patientId } });
  }

  async getByStatus(status: string) {
    return this.radiologyRepository.find({ where: { status } });
  }

  async getPendingReports() {
    return this.radiologyRepository.find({ where: { status: 'pending' } });
  }

  async getCompletedReports() {
    return this.radiologyRepository.find({ where: { status: 'completed' } });
  }
}
