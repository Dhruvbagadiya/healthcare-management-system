import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InventoryType } from './entities/inventory.entity';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { CreateInventoryDto, UpdateInventoryDto } from './dto/create-inventory.dto';

@ApiTags('Inventory')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) { }

  @Post()
  @ApiOperation({ summary: 'Create a new inventory item' })
  async create(@Body() createInventoryDto: CreateInventoryDto) {
    return this.inventoryService.create(createInventoryDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all inventory items' })
  async findAll(@Query() query: PaginationQueryDto) {
    return this.inventoryService.findAll(query);
  }

  @Get('by-type')
  @ApiOperation({ summary: 'Get inventory items by type' })
  async getByType(@Query('type') type: string) {
    return this.inventoryService.getByType(type as InventoryType);
  }

  @Get('low-stock')
  @ApiOperation({ summary: 'Get items with low stock' })
  async getLowStockItems() {
    return this.inventoryService.getLowStockItems();
  }

  @Get('expired')
  @ApiOperation({ summary: 'Get expired items' })
  async getExpiredItems() {
    return this.inventoryService.getExpiredItems();
  }

  @Get('stock-value')
  @ApiOperation({ summary: 'Get total stock value' })
  async getStockValue() {
    return { stockValue: await this.inventoryService.getStockValue() };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get inventory item by ID' })
  async findOne(@Param('id') id: string) {
    return this.inventoryService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an inventory item' })
  async update(@Param('id') id: string, @Body() updateInventoryDto: UpdateInventoryDto) {
    return this.inventoryService.update(id, updateInventoryDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an inventory item' })
  async remove(@Param('id') id: string) {
    return this.inventoryService.remove(id);
  }
}
