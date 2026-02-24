import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Inventory')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('inventory')
export class InventoryController {
  constructor(private inventoryService: InventoryService) {}

  @Get()
  async getAllInventory(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    const skip = (parseInt(page) - 1) * parseInt(limit);
    return this.inventoryService.getAllInventory(skip, parseInt(limit));
  }

  @Get('by-type')
  async getByType(@Query('type') type: string) {
    return this.inventoryService.getByType(type as any);
  }

  @Get('low-stock')
  async getLowStockItems() {
    return this.inventoryService.getLowStockItems();
  }

  @Get('expired')
  async getExpiredItems() {
    return this.inventoryService.getExpiredItems();
  }

  @Get('stock-value')
  async getStockValue() {
    return { stockValue: await this.inventoryService.getStockValue() };
  }
}
