import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription } from '../entities/subscription.entity';
import { SubscriptionStatus } from '../enums/subscription.enum';

@Injectable()
export class PlanValidationGuard implements CanActivate {
    constructor(
        @InjectRepository(Subscription)
        private subscriptionRepository: Repository<Subscription>,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const organizationId = request.tenantId; // Set by TenantInterceptor

        if (!organizationId) {
            throw new ForbiddenException('Organization context is missing');
        }

        const subscription = await this.subscriptionRepository.findOne({
            where: { organizationId },
        });

        if (!subscription) {
            throw new HttpException('No active subscription found for this organization', HttpStatus.PAYMENT_REQUIRED);
        }

        // Allow ACTIVE or TRIAL plans to proceed
        if (
            subscription.status === SubscriptionStatus.ACTIVE ||
            subscription.status === SubscriptionStatus.TRIAL
        ) {
            return true;
        }

        // PAST_DUE might still allow partial access in a real app,
        // but here we strictly require payment.
        if (subscription.status === SubscriptionStatus.PAST_DUE) {
            throw new HttpException('Subscription is past due. Please update your payment method.', HttpStatus.PAYMENT_REQUIRED);
        }

        throw new ForbiddenException(`Subscription status: ${subscription.status}`);
    }
}
