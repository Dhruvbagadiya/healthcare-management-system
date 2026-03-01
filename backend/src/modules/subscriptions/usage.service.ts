import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { UsageTracking } from './entities/usage-tracking.entity';

@Injectable()
export class UsageService {
    private readonly logger = new Logger(UsageService.name);

    constructor(
        @InjectRepository(UsageTracking)
        private readonly usageRepository: Repository<UsageTracking>,
    ) { }

    /**
     * Atomically increments the usage count for a specific feature.
     * If no record exists for the organization/feature, it creates one.
     */
    async increment(organizationId: string, featureKey: string, manager?: EntityManager): Promise<void> {
        const repo = manager ? manager.getRepository(UsageTracking) : this.usageRepository;

        try {
            // Postgres-specific UPSERT with atomic increment
            await repo.query(
                `INSERT INTO "organization_usage" ("organizationId", "featureKey", "currentUsage", "lastResetAt", "updatedAt")
                 VALUES ($1, $2, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                 ON CONFLICT ("organizationId", "featureKey")
                 DO UPDATE SET "currentUsage" = "organization_usage"."currentUsage" + 1, "updatedAt" = CURRENT_TIMESTAMP`,
                [organizationId, featureKey]
            );

            this.logger.log(`Incremented usage for ${featureKey} (Org: ${organizationId})`);
        } catch (error) {
            this.logger.error(`Failed to increment usage for ${featureKey}: ${error.message}`);
            throw error;
        }
    }

    async getUsage(organizationId: string, featureKey: string): Promise<number> {
        const usage = await this.usageRepository.findOne({
            where: { organizationId, featureKey },
        });
        return usage ? usage.currentUsage : 0;
    }
}
