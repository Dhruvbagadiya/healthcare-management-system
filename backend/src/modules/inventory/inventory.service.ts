import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Inventory, InventoryStatus, InventoryType } from './entities/inventory.entity';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(Inventory)
    private inventoryRepository: Repository<Inventory>,
  ) {}

  async getAllInventory(skip = 0, take = 10) {
    const [items, total] = await this.inventoryRepository.findAndCount({
      skip,
      take,
    });
    return { data: items, total, count: items.length };
  }

  async getByType(type: InventoryType) {
    return this.inventoryRepository.find({ where: { type } });
  }

  async getLowStockItems() {
    return this.inventoryRepository.find({
      where: { status: InventoryStatus.LOW_STOCK },
    });
  }

  async getExpiredItems() {
    return this.inventoryRepository.find({
      where: { status: InventoryStatus.EXPIRED },
    });
  }

  async getStockValue() {
    const items = await this.inventoryRepository.find();
    const totalValue = items.reduce(
      (sum, item) => sum + Number(item.quantity) * Number(item.unitCost),
      0,
    );
    return totalValue;
  }
}
