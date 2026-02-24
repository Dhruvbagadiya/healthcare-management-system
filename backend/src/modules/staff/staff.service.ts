import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Staff } from './entities/staff.entity';

@Injectable()
export class StaffService {
  constructor(
    @InjectRepository(Staff)
    private staffRepository: Repository<Staff>,
  ) {}

  async getAllStaff(skip = 0, take = 10) {
    const [staff, total] = await this.staffRepository.findAndCount({
      relations: ['user'],
      skip,
      take,
    });
    return { data: staff, total, count: staff.length };
  }

  async getStaffById(id: string) {
    return this.staffRepository.findOne({
      where: { id },
      relations: ['user'],
    });
  }

  async getStaffByRole(role: string) {
    return this.staffRepository.find({
      where: { role },
      relations: ['user'],
    });
  }
}
