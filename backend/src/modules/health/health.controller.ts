import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { DataSource } from 'typeorm';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly dataSource: DataSource) {}

  @Get()
  @Public()
  async check() {
    const dbHealthy = this.dataSource.isInitialized;
    return {
      status: dbHealthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: dbHealthy ? 'connected' : 'disconnected',
    };
  }

  @Get('ready')
  @Public()
  async ready() {
    const dbHealthy = this.dataSource.isInitialized;
    if (!dbHealthy) {
      return { status: 'not_ready' };
    }
    return { status: 'ready' };
  }

  @Get('live')
  @Public()
  live() {
    return { status: 'alive' };
  }
}
