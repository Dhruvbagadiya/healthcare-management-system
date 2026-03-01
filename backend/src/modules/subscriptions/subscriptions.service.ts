import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { Plan } from './entities/plan.entity';
import { Subscription } from './entities/subscription.entity';
import { UsageTracking } from './entities/usage-tracking.entity';
import { FeatureLimit } from './entities/feature-limit.entity';
import { UpgradePlanDto, CancelSubscriptionDto } from './dto/subscription.dto';
import { BillingCycle, SubscriptionStatus } from './enums/subscription.enum';

@Injectable()
export class SubscriptionsService {
    private stripe: Stripe;

    constructor(
        @InjectRepository(Plan)
        private readonly plansRepository: Repository<Plan>,
        @InjectRepository(Subscription)
        private readonly subscriptionsRepository: Repository<Subscription>,
        @InjectRepository(UsageTracking)
        private readonly usageTrackingRepository: Repository<UsageTracking>,
        @InjectRepository(FeatureLimit)
        private readonly featureLimitsRepository: Repository<FeatureLimit>,
        private readonly configService: ConfigService,
    ) {
        const stripeSecret = this.configService.get<string>('STRIPE_SECRET_KEY') || 'sk_test_mock';
        this.stripe = new Stripe(stripeSecret, {
            apiVersion: '2024-12-18.acacia' as any,
        });
    }

    async getAvailablePlans(): Promise<Plan[]> {
        return this.plansRepository.find({ where: { isActive: true }, order: { price: 'ASC' } });
    }

    async getCurrentSubscription(organizationId: string): Promise<Subscription> {
        const sub = await this.subscriptionsRepository.findOne({
            where: { organizationId },
            relations: ['plan'],
        });
        if (!sub) throw new NotFoundException('Subscription not found');
        return sub;
    }

    async getCurrentUsage(organizationId: string): Promise<any> {
        const sub = await this.getCurrentSubscription(organizationId);

        // Fetch limits for plan
        const limits = await this.featureLimitsRepository.find({
            where: { planId: sub.planId },
        });

        // Fetch actual usage
        const usage = await this.usageTrackingRepository.find({
            where: { organizationId },
        });

        // Map usage to limits
        return limits.map((limit) => {
            const current = usage.find((u) => u.featureKey === limit.featureKey);
            return {
                featureKey: limit.featureKey,
                limit: limit.limitValue,
                used: current ? current.currentUsage : 0,
                isEnabled: limit.isEnabled,
            };
        });
    }

    async upgradePlan(organizationId: string, dto: UpgradePlanDto) {
        const plan = await this.plansRepository.findOne({ where: { id: dto.planId } });
        if (!plan) throw new NotFoundException('Plan not found');

        const frontendUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:3000';

        const lineItem: any = {
            price_data: {
                currency: plan.currency.toLowerCase(),
                product_data: {
                    name: `${plan.name} Plan`,
                    description: plan.description || `Subscription to ${plan.name} plan`,
                },
                unit_amount: Math.round(plan.price * 100), // Stripe expects cents/paise
            },
            quantity: 1,
        };

        if (plan.billingCycle !== BillingCycle.ONCE) {
            lineItem.price_data.recurring = {
                interval: plan.billingCycle === BillingCycle.MONTHLY ? 'month' : 'year',
            };
        }

        const session = await this.stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [lineItem],
            mode: plan.billingCycle === BillingCycle.ONCE ? 'payment' : 'subscription',
            success_url: `${frontendUrl}/dashboard/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${frontendUrl}/dashboard/billing?canceled=true`,
            client_reference_id: organizationId,
            metadata: {
                organizationId,
                planId: plan.id,
            }
        });

        return {
            message: 'Checkout session created successfully',
            planId: dto.planId,
            checkoutUrl: session.url
        };
    }

    async cancelPlan(organizationId: string) {
        const sub = await this.getCurrentSubscription(organizationId);

        if (sub.gatewaySubscriptionId) {
            // Unsubscribe from Stripe end-of-period
            await this.stripe.subscriptions.update(sub.gatewaySubscriptionId, {
                cancel_at_period_end: true,
            });
        }

        sub.cancelAtPeriodEnd = true;
        await this.subscriptionsRepository.save(sub);

        return { message: 'Subscription will cancel at the end of the current billing period' };
    }

    async handleStripeWebhook(payload: Buffer, signature: string) {
        const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET') || 'whsec_mock';
        let event: Stripe.Event;

        try {
            event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
        } catch (err: any) {
            throw new Error(`Invalid Stripe signature: ${err.message}`);
        }

        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session;
                if (session.metadata?.organizationId && session.metadata?.planId) {
                    await this.activateSubscription(
                        session.metadata.organizationId,
                        session.metadata.planId,
                        session.subscription as string
                    );
                }
                break;
            }
            case 'invoice.payment_succeeded': {
                // Future Implementation: Add robust recurring billing logging
                break;
            }
            case 'invoice.payment_failed': {
                // Future Implementation: Set Subscription PAST_DUE and email user
                break;
            }
            case 'customer.subscription.deleted': {
                const subscription = event.data.object as Stripe.Subscription;
                const sub = await this.subscriptionsRepository.findOne({ where: { gatewaySubscriptionId: subscription.id } });
                if (sub) {
                    sub.status = SubscriptionStatus.CANCELLED;
                    await this.subscriptionsRepository.save(sub);
                }
                break;
            }
            default:
                console.log(`Unhandled Stripe Webhook event type: ${event.type}`);
        }

        return { received: true };
    }

    private async activateSubscription(organizationId: string, planId: string, gatewaySubscriptionId: string) {
        let sub = await this.subscriptionsRepository.findOne({ where: { organizationId } });
        const plan = await this.plansRepository.findOne({ where: { id: planId } });

        const now = new Date();
        const nextPeriod = new Date();
        if (plan?.billingCycle === BillingCycle.YEARLY) {
            nextPeriod.setFullYear(now.getFullYear() + 1);
        } else if (plan?.billingCycle === BillingCycle.MONTHLY) {
            nextPeriod.setMonth(now.getMonth() + 1);
        } else {
            nextPeriod.setFullYear(now.getFullYear() + 100); // Lifetime essentially
        }

        if (!sub) {
            sub = this.subscriptionsRepository.create({ organizationId });
        }

        sub.planId = planId;
        sub.status = SubscriptionStatus.ACTIVE;
        sub.currentPeriodStart = now;
        sub.currentPeriodEnd = nextPeriod;
        sub.gatewaySubscriptionId = gatewaySubscriptionId || sub.gatewaySubscriptionId;
        sub.cancelAtPeriodEnd = false;

        await this.subscriptionsRepository.save(sub);
    }
}
