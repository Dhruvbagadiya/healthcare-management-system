import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ward, Bed, BedStatus } from './entities/ward.entity';

@Injectable()
export class WardsService {
  constructor(
    @InjectRepository(Ward)
    private wardRepository: Repository<Ward>,
    @InjectRepository(Bed)
    private bedRepository: Repository<Bed>,
  ) {}

  async getAllWards() {
    return this.wardRepository.find();
  }

  async getWardById(id: string) {
    return this.wardRepository.findOne({ where: { id } });
  }

  async getAvailableBeds() {
    return this.bedRepository.find({ where: { status: BedStatus.AVAILABLE } });
  }

  async getBedsByWard(wardId: string) {
    return this.bedRepository.find({ where: { wardId } });
  }

  async getWardStats() {
    const wards = await this.wardRepository.find();
    const beds = await this.bedRepository.find();
    return {
      totalWards: wards.length,
      totalBeds: beds.length,
      occupiedBeds: beds.filter((b) => b.status === BedStatus.OCCUPIED).length,
      availableBeds: beds.filter((b) => b.status === BedStatus.AVAILABLE).length,
    };
  }
}
