import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { DataSource } from 'typeorm';

describe('HealthController', () => {
  let controller: HealthController;
  let dataSource: { isInitialized: boolean };

  function setupModule(initialized: boolean) {
    return async () => {
      dataSource = { isInitialized: initialized };

      const module: TestingModule = await Test.createTestingModule({
        controllers: [HealthController],
        providers: [
          {
            provide: DataSource,
            useValue: dataSource,
          },
        ],
      }).compile();

      controller = module.get<HealthController>(HealthController);
    };
  }

  describe('GET /health', () => {
    describe('when DataSource is initialized', () => {
      beforeEach(setupModule(true));

      it('should return status ok and database connected', async () => {
        const result = await controller.check();

        expect(result.status).toBe('ok');
        expect(result.database).toBe('connected');
        expect(result.timestamp).toBeDefined();
        expect(result.uptime).toBeDefined();
      });
    });

    describe('when DataSource is not initialized', () => {
      beforeEach(setupModule(false));

      it('should return status degraded and database disconnected', async () => {
        const result = await controller.check();

        expect(result.status).toBe('degraded');
        expect(result.database).toBe('disconnected');
        expect(result.timestamp).toBeDefined();
        expect(result.uptime).toBeDefined();
      });
    });
  });

  describe('GET /health/ready', () => {
    describe('when DB is connected', () => {
      beforeEach(setupModule(true));

      it('should return ready', async () => {
        const result = await controller.ready();

        expect(result).toEqual({ status: 'ready' });
      });
    });

    describe('when DB is not connected', () => {
      beforeEach(setupModule(false));

      it('should return not_ready', async () => {
        const result = await controller.ready();

        expect(result).toEqual({ status: 'not_ready' });
      });
    });
  });

  describe('GET /health/live', () => {
    beforeEach(setupModule(true));

    it('should always return alive', () => {
      const result = controller.live();

      expect(result).toEqual({ status: 'alive' });
    });

    it('should return alive regardless of DB state', async () => {
      // Rebuild with uninitialized DataSource
      dataSource.isInitialized = false;

      const result = controller.live();

      expect(result).toEqual({ status: 'alive' });
    });
  });
});
