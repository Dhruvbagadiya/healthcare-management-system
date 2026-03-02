import 'reflect-metadata';
import * as path from 'path';
import * as dotenv from 'dotenv';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { Organization, OrganizationStatus } from '../../modules/organizations/entities/organization.entity';
import { User, UserStatus } from '../../modules/users/entities/user.entity';
import { Role } from '../../modules/rbac/entities/role.entity';
import { Permission } from '../../modules/rbac/entities/permission.entity';
import { Subscription } from '../../modules/subscriptions/entities/subscription.entity';
import { Plan } from '../../modules/subscriptions/entities/plan.entity';
import { OrganizationUsage } from '../../modules/subscriptions/entities/organization-usage.entity';
import { SubscriptionStatus, SubscriptionPlanTier } from '../../modules/subscriptions/enums/subscription.enum';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

async function createSecondOrg() {
    const { AppDataSource } = await import('../typeorm.config');

    try {
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        console.log('\n🚀 Creating Second SaaS Organization (Elite Health Clinic)...\n');

        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const orgRepo = queryRunner.manager.getRepository(Organization);
            const userRepo = queryRunner.manager.getRepository(User);
            const roleRepo = queryRunner.manager.getRepository(Role);
            const permRepo = queryRunner.manager.getRepository(Permission);
            const subRepo = queryRunner.manager.getRepository(Subscription);
            const planRepo = queryRunner.manager.getRepository(Plan);
            const usageRepo = queryRunner.manager.getRepository(OrganizationUsage);

            // 1. Create Organization
            const orgName = 'Elite Health Clinic';
            const orgSlug = 'elite-health';

            let org = await orgRepo.findOne({ where: { slug: orgSlug } });
            if (org) {
                console.log(`⚠️  Organization with slug "${orgSlug}" already exists. Skipping.`);
                await queryRunner.rollbackTransaction();
                process.exit(0);
            }

            org = await orgRepo.save(orgRepo.create({
                id: randomUUID(),
                name: orgName,
                slug: orgSlug,
                status: 'active' as any,
                settings: {
                    phone: '+1-555-010-0001',
                    onboardingCompleted: true,
                },
            }));
            console.log(`✅ Created Organization: ${orgName} (${org.id})`);

            // 2. Setup Admin Role
            const allPerms = await permRepo.find();
            const adminRole = await roleRepo.save(roleRepo.create({
                id: randomUUID(),
                name: 'admin',
                description: 'Full system access',
                organizationId: org.id,
                isSystemRole: true,
                permissions: allPerms,
            }));
            console.log(`✅ Created Admin Role for ${orgName}`);

            // 3. Create Admin User
            const adminEmail = 'admin@elitehealth.com';
            const hashedPassword = await bcrypt.hash('ElitePassword2026', 12);

            const adminUser = await userRepo.save(userRepo.create({
                id: randomUUID(),
                userId: 'ADM-ELITE-01',
                email: adminEmail,
                password: hashedPassword,
                firstName: 'Elite',
                lastName: 'Admin',
                organizationId: org.id,
                status: 'active' as any,
                emailVerified: true,
                roles: [adminRole],
            }));
            console.log(`✅ Created Admin User: ${adminEmail} (${adminUser.id})`);

            // 4. Initialize Subscription (using 'basic' as 'trial' is missing)
            const plan = await planRepo.findOne({
                where: { tier: 'basic' as any },
            });

            if (!plan) {
                throw new Error('No appropriate plan found in database.');
            }

            const startDate = new Date();
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + 30); // 30-day period

            await subRepo.save(subRepo.create({
                id: randomUUID(),
                organizationId: org.id,
                planId: plan.id,
                status: 'ACTIVE' as any,
                currentPeriodStart: startDate,
                currentPeriodEnd: endDate,
                cancelAtPeriodEnd: false,
            }));
            console.log(`✅ Initialized ${plan.tier.toUpperCase()} Subscription`);

            // 5. Initialize Usage Counters
            const defaultUsageKeys = ['patients', 'doctors', 'appointments', 'staff'];
            const usageRecords = defaultUsageKeys.map(key =>
                usageRepo.create({
                    id: randomUUID(),
                    organizationId: org.id,
                    featureKey: key,
                    usedCount: 0,
                    lastResetAt: new Date(),
                }),
            );
            await usageRepo.save(usageRecords);
            console.log('✅ Initialized Usage Counters (patients, doctors, appointments, staff)');

            await queryRunner.commitTransaction();

            console.log('\n✨ Second Organization ready!');
            console.log('-----------------------------------');
            console.log(`Organization: ${orgName}`);
            console.log(`Admin Email:  ${adminEmail}`);
            console.log('Password:     ElitePassword2026');
            console.log('-----------------------------------\n');

        } catch (error) {
            await queryRunner.rollbackTransaction();
            console.error('❌ Error details:', error);
            throw error;
        } finally {
            await queryRunner.release();
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating second org:', error);
        process.exit(1);
    }
}

createSecondOrg();
