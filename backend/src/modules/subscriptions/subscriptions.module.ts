import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Plan } from './entities/plan.entity';
import { Subscription } from './entities/subscription.entity';
import { FeatureLimit } from './entities/feature-limit.entity';
import { UsageTracking } from './entities/usage-tracking.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionCronService } from './subscription-cron.service';
import { PlanValidationGuard } from './guards/plan-validation.guard';
import { FeatureLimitGuard } from './guards/feature-limit.guard';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Plan,
            Subscription,
            FeatureLimit,
            UsageTracking,
            Organization,
        ]),
    ],
    controllers: [SubscriptionsController],
    providers: [SubscriptionsService, SubscriptionCronService, PlanValidationGuard, FeatureLimitGuard],
    exports: [TypeOrmModule, SubscriptionsService, SubscriptionCronService, PlanValidationGuard, FeatureLimitGuard],
})
export class SubscriptionsModule { }
