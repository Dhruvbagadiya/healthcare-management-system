import { AppDataSource } from './src/database/typeorm.config';
import { Subscription } from './src/modules/subscriptions/entities/subscription.entity';
import { Organization, OrganizationStatus } from './src/modules/organizations/entities/organization.entity';
import { Plan } from './src/modules/subscriptions/entities/plan.entity';
import { FeatureLimit } from './src/modules/subscriptions/entities/feature-limit.entity';
import { UsageTracking } from './src/modules/subscriptions/entities/usage-tracking.entity';
import { SubscriptionPlanTier, BillingCycle, SubscriptionStatus, ResetInterval } from './src/modules/subscriptions/enums/subscription.enum';
import { PatientsService } from './src/modules/patients/patients.service';
import { PlanValidationGuard } from './src/modules/subscriptions/guards/plan-validation.guard';
import { UsageService } from './src/modules/subscriptions/usage.service';
import { User } from './src/modules/users/entities/user.entity';
import { Reflector } from '@nestjs/core';
import { PatientRepository } from './src/modules/patients/repositories/patient.repository';
import { MedicalRecordRepository } from './src/modules/patients/repositories/medical-record.repository';

async function runTest() {
    console.log('--- SaaS Plan Limits Verification ---');

    if (!AppDataSource.isInitialized) {
        await AppDataSource.initialize();
    }

    const orgRepo = AppDataSource.getRepository(Organization);
    const planRepo = AppDataSource.getRepository(Plan);
    const featureRepo = AppDataSource.getRepository(FeatureLimit);
    const subRepo = AppDataSource.getRepository(Subscription);
    const usageRepo = AppDataSource.getRepository(UsageTracking);
    const userRepo = AppDataSource.getRepository(User);

    // 1. Create Mock Organization
    const testOrg = await orgRepo.save(orgRepo.create({
        name: 'Limit Test Org',
        slug: 'limit-test-' + Date.now(),
        status: OrganizationStatus.ACTIVE,
    }));
    console.log(`Created test organization: ${testOrg.id}`);

    // 2. Setup Plan with Limit (MAX_PATIENTS = 2)
    // Try to find an existing BASIC plan or create a new one with a unique tier if needed
    // But since tier is unique, let's just use the existing one if it exists or create it.
    let testPlan = await planRepo.findOne({ where: { tier: SubscriptionPlanTier.BASIC } });
    if (!testPlan) {
        testPlan = await planRepo.save(planRepo.create({
            name: 'Limited Plan',
            slug: 'limited-plan-' + Date.now(),
            tier: SubscriptionPlanTier.BASIC,
            price: 0,
            currency: 'USD',
            billingCycle: BillingCycle.MONTHLY,
            isActive: true,
        }));
    }

    // Create/Update limit for this plan
    let limit = await featureRepo.findOne({ where: { planId: testPlan.id, featureKey: 'MAX_PATIENTS' } });
    if (limit) {
        limit.limitValue = 2;
        await featureRepo.save(limit);
    } else {
        await featureRepo.save(featureRepo.create({
            planId: testPlan.id,
            featureKey: 'MAX_PATIENTS',
            limitValue: 2,
            isEnabled: true,
            resetInterval: ResetInterval.LIFETIME,
        }));
    }
    console.log(`Using plan ${testPlan.id} with limit: MAX_PATIENTS = 2`);

    // 3. Create Subscription
    // Delete any existing sub for this org just in case
    await subRepo.delete({ organizationId: testOrg.id });

    await subRepo.save(subRepo.create({
        organizationId: testOrg.id,
        planId: testPlan.id,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    }));
    console.log('Created subscription for organization.');

    // 4. Test Guard & Service
    const usageService = new UsageService(usageRepo);
    const reflector = new Reflector();
    const planGuard = new PlanValidationGuard(reflector, subRepo, featureRepo, usageService);

    const mockTenantService = {
        getTenantId: () => testOrg.id
    };

    // Instantiate Repositories manually
    const patientRepository = new PatientRepository(AppDataSource, mockTenantService as any);
    const medicalRecordRepo = new MedicalRecordRepository(AppDataSource, mockTenantService as any);

    const patientsService = new PatientsService(
        patientRepository,
        medicalRecordRepo,
        userRepo,
        mockTenantService as any,
        usageService,
        AppDataSource
    );

    console.log('\n--- Simulation Starts ---');

    async function attemptCreate(patientNum: number) {
        console.log(`\nAttempting to create Patient #${patientNum}...`);

        // Mock ExecutionContext for Guard
        const mockContext = {
            switchToHttp: () => ({
                getRequest: () => ({
                    tenantId: testOrg.id
                })
            }),
            getHandler: () => ({}),
            getClass: () => ({})
        } as any;

        // Manually mock reflector behavior for the test
        (reflector as any).getAllAndOverride = () => 'MAX_PATIENTS';

        try {
            await planGuard.canActivate(mockContext);
            console.log('✅ Guard: PASSED');

            await patientsService.create({
                email: `test${patientNum}-${Date.now()}@test.com`,
                firstName: 'Test',
                lastName: 'Patient',
                phoneNumber: '1234567890',
                dateOfBirth: '1990-01-01',
                gender: 'male',
            } as any);
            console.log(`✅ Service: Patient #${patientNum} created successfully.`);

            const usage = await usageService.getUsage(testOrg.id, 'MAX_PATIENTS');
            console.log(`Current Usage: ${usage}`);
        } catch (error) {
            console.log(`❌ FAILED: ${error.message}`);
        }
    }

    await attemptCreate(1);
    await attemptCreate(2);
    await attemptCreate(3); // Should fail

    // Cleanup
    console.log('\n--- Cleaning up ---');
    await AppDataSource.query('DELETE FROM "organization_usage" WHERE "organizationId" = $1', [testOrg.id]);
    await AppDataSource.query('DELETE FROM "subscriptions" WHERE "organizationId" = $1', [testOrg.id]);
    await AppDataSource.query('DELETE FROM "patients" WHERE "organizationId" = $1', [testOrg.id]);
    await AppDataSource.query('DELETE FROM "users" WHERE "organizationId" = $1', [testOrg.id]);
    await orgRepo.delete(testOrg.id);

    // We don't necessarily want to delete the plan if it was a real one, 
    // but this is a test environment. For safety, let's only delete if we created it with a specific name.
    if (testPlan.name === 'Limited Plan') {
        await featureRepo.delete({ planId: testPlan.id });
        await planRepo.delete(testPlan.id);
    }

    console.log('Cleanup done.');
    process.exit(0);
}

runTest().catch(err => {
    console.error('Test failed:', err);
    process.exit(1);
});
