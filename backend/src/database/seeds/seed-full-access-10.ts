import 'reflect-metadata';
import * as path from 'path';
import * as dotenv from 'dotenv';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

import { User, UserStatus, UserRole } from '../../modules/users/entities/user.entity';
import { Doctor } from '../../modules/doctors/entities/doctor.entity';
import { Patient, BloodType } from '../../modules/patients/entities/patient.entity';
import { MedicalRecord } from '../../modules/patients/entities/medical-record.entity';
import { Appointment, AppointmentStatus } from '../../modules/appointments/entities/appointment.entity';
import { Prescription, PrescriptionStatus } from '../../modules/prescriptions/entities/prescription.entity';
import { Medicine } from '../../modules/pharmacy/entities/medicine.entity';
import { LabTest, LabTestStatus } from '../../modules/laboratory/entities/lab-test.entity';
import { Invoice, InvoiceStatus } from '../../modules/billing/entities/invoice.entity';
import { Expense, ExpenseType, PaymentStatus, Revenue } from '../../modules/accounts/entities/accounts.entity';
import { Staff, StaffRole, StaffStatus } from '../../modules/staff/entities/staff.entity';
import { Inventory, InventoryType, InventoryStatus } from '../../modules/inventory/entities/inventory.entity';
import { Surgery, SurgeryStatus, OperationTheater } from '../../modules/operation-theater/entities/operation-theater.entity';
import { ComplianceRecord, ComplianceStatus, ComplianceType, DataAccessLog } from '../../modules/compliance/entities/compliance.entity';
import { RadiologyRequest, ImagingType, ImagingStatus } from '../../modules/radiology/entities/radiology.entity';
import { Ward, Bed, BedStatus } from '../../modules/wards/entities/ward.entity';
import { Admission, AdmissionStatus } from '../../modules/admissions/entities/admission.entity';
import { Organization, OrganizationStatus } from '../../modules/organizations/entities/organization.entity';
import { Role } from '../../modules/rbac/entities/role.entity';
import { Permission } from '../../modules/rbac/entities/permission.entity';
import { Plan } from '../../modules/subscriptions/entities/plan.entity';
import { FeatureLimit } from '../../modules/subscriptions/entities/feature-limit.entity';
import { Subscription } from '../../modules/subscriptions/entities/subscription.entity';
import { OrganizationUsage } from '../../modules/subscriptions/entities/organization-usage.entity';
import { AuditLog, AuditAction } from '../../common/entities/audit-log.entity';
import { Notification } from '../../modules/notifications/entities/notification.entity';
import { EmailVerificationToken } from '../../modules/auth/entities/email-verification-token.entity';
import { SubscriptionPlanTier, BillingCycle, SubscriptionStatus, ResetInterval } from '../../modules/subscriptions/enums/subscription.enum';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const rand = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];
const daysOffset = (days: number) => new Date(Date.now() + days * 86400000);

async function seedData() {
    const { AppDataSource } = await import('../typeorm.config');
    const { MoreThan } = await import('typeorm');

    try {
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        console.log('\n🚀 Starting Full Access & 10-Row Database Seeding...\n');

        const userRepo = AppDataSource.getRepository(User);
        const doctorRepo = AppDataSource.getRepository(Doctor);
        const patientRepo = AppDataSource.getRepository(Patient);
        const medRecordRepo = AppDataSource.getRepository(MedicalRecord);
        const appointmentRepo = AppDataSource.getRepository(Appointment);
        const prescriptionRepo = AppDataSource.getRepository(Prescription);
        const medicineRepo = AppDataSource.getRepository(Medicine);
        const labTestRepo = AppDataSource.getRepository(LabTest);
        const invoiceRepo = AppDataSource.getRepository(Invoice);
        const expenseRepo = AppDataSource.getRepository(Expense);
        const revenueRepo = AppDataSource.getRepository(Revenue);
        const staffRepo = AppDataSource.getRepository(Staff);
        const inventoryRepo = AppDataSource.getRepository(Inventory);
        const surgeryRepo = AppDataSource.getRepository(Surgery);
        const theaterRepo = AppDataSource.getRepository(OperationTheater);
        const complianceRepo = AppDataSource.getRepository(ComplianceRecord);
        const dataLogRepo = AppDataSource.getRepository(DataAccessLog);
        const radiologyRepo = AppDataSource.getRepository(RadiologyRequest);
        const wardRepo = AppDataSource.getRepository(Ward);
        const bedRepo = AppDataSource.getRepository(Bed);
        const admissionRepo = AppDataSource.getRepository(Admission);
        const orgRepo = AppDataSource.getRepository(Organization);
        const roleRepo = AppDataSource.getRepository(Role);
        const permRepo = AppDataSource.getRepository(Permission);
        const planRepo = AppDataSource.getRepository(Plan);
        const featureRepo = AppDataSource.getRepository(FeatureLimit);
        const subRepo = AppDataSource.getRepository(Subscription);
        const usageRepo = AppDataSource.getRepository(OrganizationUsage);
        const auditRepo = AppDataSource.getRepository(AuditLog);
        const notificationRepo = AppDataSource.getRepository(Notification);
        const tokenRepo = AppDataSource.getRepository(EmailVerificationToken);

        // ─────────────────────────────────────────────────────────────────────────
        // 0. Schema Patches (Fix for broken database state)
        // ─────────────────────────────────────────────────────────────────────────
        console.log('🛠️ Checking and patching database schema...');
        try {
            // Comprehensive patch: Apply deletedAt to all tables that might be using soft deletes in entities
            const tablesToPatch = [
                'wards', 'beds', 'inventory', 'staff', 'surgeries', 'admissions',
                'lab_tests', 'radiology_requests', 'operation_theaters',
                'medical_records', 'prescriptions', 'invoices', 'patients', 'doctors', 'appointments',
                'onboarding_progress'
            ];

            for (const table of tablesToPatch) {
                await AppDataSource.query(`ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "deletedAt" "timestamp"`);
            }

            // Specific patch for onboarding_progress snake_case columns
            try {
                await AppDataSource.query(`ALTER TABLE "onboarding_progress" ADD COLUMN IF NOT EXISTS "organization_id" "uuid"`);
                await AppDataSource.query(`ALTER TABLE "onboarding_progress" ADD COLUMN IF NOT EXISTS "current_step" "int" DEFAULT 1`);
                await AppDataSource.query(`ALTER TABLE "onboarding_progress" ADD COLUMN IF NOT EXISTS "is_completed" "boolean" DEFAULT false`);
                await AppDataSource.query(`ALTER TABLE "onboarding_progress" ADD COLUMN IF NOT EXISTS "created_at" "timestamp" DEFAULT now()`);
                await AppDataSource.query(`ALTER TABLE "onboarding_progress" ADD COLUMN IF NOT EXISTS "updated_at" "timestamp" DEFAULT now()`);
            } catch (pErr) {
                console.warn('⚠️ OnboardingProgress patch warning:', pErr.message);
            }

            console.log('✅ Schema patches applied where needed.');
        } catch (err) {
            console.warn('⚠️ Schema patch warning:', err.message);
        }

        // ─────────────────────────────────────────────────────────────────────────
        // 1. Organization & Plans
        // ─────────────────────────────────────────────────────────────────────────
        console.log('🏢 Setting up organization and SaaS plans...');

        let org = await orgRepo.findOne({ where: { slug: 'aarogentix-health' } });
        if (!org) {
            org = await orgRepo.save(orgRepo.create({
                name: 'Aarogentix Hospital',
                slug: 'aarogentix-health',
                status: OrganizationStatus.ACTIVE,
            }));
        }
        const orgId = org.id;

        const plansData = [
            { tier: 'trial' as any, name: 'Trial', slug: 'trial', description: '14-day free trial', price: 0, billingCycle: BillingCycle.MONTHLY },
            { tier: 'basic' as any, name: 'Basic', slug: 'basic-monthly', price: 0, billingCycle: BillingCycle.MONTHLY },
            { tier: 'pro' as any, name: 'Professional', slug: 'pro-monthly', price: 2999, billingCycle: BillingCycle.MONTHLY },
            { tier: 'enterprise' as any, name: 'Enterprise', slug: 'enterprise-monthly', price: 9999, billingCycle: BillingCycle.MONTHLY }
        ];

        const cachedPlans: Record<string, Plan> = {};
        for (const data of plansData) {
            let plan = await planRepo.findOne({
                where: [{ slug: data.slug }, { tier: data.tier }]
            });
            if (!plan) {
                plan = await planRepo.save(planRepo.create(data));
            } else {
                // Update existing plan if needed
                Object.assign(plan, data);
                plan = await planRepo.save(plan);
            }
            cachedPlans[data.tier] = plan;
        }

        // Subscription for the org
        let sub = await subRepo.findOne({ where: { organizationId: orgId } });
        if (!sub) {
            await subRepo.save(subRepo.create({
                organizationId: orgId,
                planId: cachedPlans[SubscriptionPlanTier.ENTERPRISE].id,
                status: SubscriptionStatus.ACTIVE,
                currentPeriodStart: new Date(),
                currentPeriodEnd: daysOffset(30),
            }));
        }

        // ─────────────────────────────────────────────────────────────────────────
        // 2. RBAC (Full Access)
        // ─────────────────────────────────────────────────────────────────────────
        console.log('🔐 Setting up full-access permissions and roles...');
        const permissions = [
            'appointments:create', 'appointments:delete', 'appointments:read', 'appointments:update',
            'laboratory:create', 'laboratory:delete', 'laboratory:read', 'laboratory:update',
            'patients:create', 'patients:delete', 'patients:read', 'patients:update',
            'prescriptions:create', 'prescriptions:delete', 'prescriptions:read', 'prescriptions:update',
            'radiology:read', 'billing:manage', 'inventory:manage', 'staff:manage', 'users:manage', 'system:admin'
        ];

        for (const name of permissions) {
            if (!(await permRepo.findOne({ where: { name } }))) {
                await permRepo.save(permRepo.create({ name, category: name.split(':')[0] }));
            }
        }
        const allPerms = await permRepo.find();

        const getRole = async (name: string, isSystem = false) => {
            let role = await roleRepo.findOne({ where: { name, organizationId: orgId }, relations: ['permissions'] });
            if (!role) {
                role = await roleRepo.save(roleRepo.create({
                    name, organizationId: orgId, isSystemRole: isSystem, permissions: allPerms
                }));
            } else {
                // Synchronize permissions for system roles to ensure full access
                role.permissions = allPerms;
                await roleRepo.save(role);
            }
            return role;
        };

        const adminRole = await getRole(UserRole.ADMIN, true);
        const doctorRole = await getRole(UserRole.DOCTOR, true);
        const patientRole = await getRole(UserRole.PATIENT, true);
        const nurseRole = await getRole(UserRole.NURSE, true);

        // ─────────────────────────────────────────────────────────────────────────
        // 3. The Full Access Admin User
        // ─────────────────────────────────────────────────────────────────────────
        console.log('👤 Creating/Updating full-access admin user...');
        const adminEmail = 'dhruvbagadiya@gmail.com';
        let adminUser = await userRepo.findOne({ where: { email: adminEmail } });
        if (!adminUser) {
            adminUser = await userRepo.save(userRepo.create({
                id: '00000000-0000-4000-a000-000000000001',
                userId: 'DOC-000001',
                email: adminEmail,
                password: await bcrypt.hash('Dhruv@6606', 10),
                roles: [adminRole, doctorRole],
                status: UserStatus.ACTIVE,
                emailVerified: true,
                firstName: 'Dhruv',
                lastName: 'Bagdiya',
                organizationId: orgId,
            }));
        } else {
            adminUser.roles = [adminRole, doctorRole];
            adminUser.password = await bcrypt.hash('Dhruv@6606', 10);
            adminUser.status = UserStatus.ACTIVE;
            await userRepo.save(adminUser);
        }

        // ─────────────────────────────────────────────────────────────────────────
        // 4. Seeding 10 records per major entity
        // ─────────────────────────────────────────────────────────────────────────

        // 4a. Doctors
        console.log('👨‍⚕️ Seeding 10 doctors...');
        const doctors: Doctor[] = [];
        for (let i = 0; i < 10; i++) {
            const email = `doctor${i}@aarogentix.com`;
            let user = await userRepo.findOne({ where: { email } });
            if (!user) {
                user = await userRepo.save(userRepo.create({
                    userId: `DOC-S${i}`,
                    email,
                    password: await bcrypt.hash('Doctor@123', 10),
                    roles: [doctorRole],
                    status: UserStatus.ACTIVE,
                    emailVerified: true,
                    firstName: `Doctor`,
                    lastName: `${i}`,
                    organizationId: orgId,
                }));
            }
            let doc = await doctorRepo.findOne({ where: { customUserId: user.userId } });
            if (!doc) {
                const docObj = doctorRepo.create({
                    user,
                    customUserId: user.userId,
                    doctorId: `DOC-S${i}`,
                    specialization: rand(['Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics']),
                    licenseNumber: `LIC-${i}000`,
                    yearsOfExperience: 5 + i,
                    isActive: true,
                    organizationId: orgId,
                } as any);
                doc = await doctorRepo.save(docObj) as unknown as Doctor;
            }
            doctors.push(doc as Doctor);
        }

        // 4b. Patients
        console.log('👥 Seeding 10 patients...');
        const patients: Patient[] = [];
        for (let i = 0; i < 10; i++) {
            const email = `patient${i}@example.com`;
            let user = await userRepo.findOne({ where: { email } });
            if (!user) {
                user = await userRepo.save(userRepo.create({
                    userId: `PAT-S${i}`,
                    email,
                    password: await bcrypt.hash('Patient@123', 10),
                    roles: [patientRole],
                    status: UserStatus.ACTIVE,
                    emailVerified: true,
                    firstName: `Patient`,
                    lastName: `${i}`,
                    organizationId: orgId,
                }));
            }
            let pat = await patientRepo.findOne({ where: { customUserId: user.userId } });
            if (!pat) {
                const patObj = patientRepo.create({
                    user,
                    customUserId: user.userId,
                    patientId: `PAT-S${i}`,
                    bloodType: rand(Object.values(BloodType)),
                    organizationId: orgId,
                } as any);
                pat = await patientRepo.save(patObj) as unknown as Patient;
            }
            patients.push(pat as Patient);
        }

        // 4c. Wards & Beds
        console.log('🏨 Seeding 10 wards and 10 beds...');
        const wards: Ward[] = [];
        for (let i = 0; i < 10; i++) {
            const code = `WRD-${i}`;
            let ward = await wardRepo.findOne({ where: { wardCode: code } });
            if (!ward) {
                ward = await wardRepo.save(wardRepo.create({
                    wardCode: code,
                    wardName: `Ward ${i}`,
                    description: `General Ward Section ${i}`,
                    totalBeds: 10,
                    pricePerDay: 1000 + (i * 500),
                    organizationId: orgId,
                }));
            }
            wards.push(ward);

            // 1 bed per ward for seeding simplicity
            let bed = await bedRepo.findOne({ where: { bedNumber: `B-${i}`, wardId: ward.id } });
            if (!bed) {
                await bedRepo.save(bedRepo.create({
                    bedNumber: `B-${i}`,
                    wardId: ward.id,
                    status: BedStatus.AVAILABLE,
                    organizationId: orgId,
                }));
            }
        }

        // 4d. Other entities (Appointments, Prescriptions, Med Records, Lab Tests, Radiology, Invoices, Staff, etc.)
        console.log('⚙️ Seeding remaining 10 rows per table...');
        for (let i = 0; i < 10; i++) {
            const pat = patients[i];
            const doc = doctors[i % doctors.length];
            const ward = wards[i];

            // Appointment
            if (!(await appointmentRepo.findOne({ where: { patientId: pat.id, appointmentDate: daysOffset(i) } }))) {
                await appointmentRepo.save(appointmentRepo.create({
                    patientId: pat.id, doctorId: doc.id,
                    appointmentDate: daysOffset(i), appointmentTime: '10:00',
                    status: AppointmentStatus.SCHEDULED, reason: 'Checkup', organizationId: orgId
                }));
            }

            // Prescription
            const rxNum = `RX-${i}-${orgId.slice(0, 4)}`;
            if (!(await prescriptionRepo.findOne({ where: { prescriptionNumber: rxNum } }))) {
                await prescriptionRepo.save(prescriptionRepo.create({
                    patientId: pat.id, doctorId: doc.id,
                    prescriptionNumber: rxNum,
                    status: PrescriptionStatus.ACTIVE, diagnosis: 'Common Cold',
                    issuedDate: new Date(),
                    medicines: [{ medicineName: 'Paracetamol', dosage: '500mg', frequency: 'TDS', duration: '5 days', quantity: 15, medicineId: `MED-${i}`, instructions: 'After meals' }],
                    organizationId: orgId
                }));
            }

            // Medical Record
            if (!(await medRecordRepo.findOne({ where: { patientId: pat.id, title: `Record ${i}` } }))) {
                await medRecordRepo.save(medRecordRepo.create({
                    patientId: pat.id, doctorId: doc.id,
                    recordType: 'consultation', title: `Record ${i}`,
                    description: 'Patient examined', organizationId: orgId
                }));
            }

            // Lab Test
            if (!(await labTestRepo.findOne({ where: { patientId: pat.id, testName: `Test ${i}` } }))) {
                await labTestRepo.save(labTestRepo.create({
                    patientId: pat.id, testName: `Test ${i}`,
                    description: 'Full blood count',
                    status: LabTestStatus.ORDERED, orderedDate: new Date(), organizationId: orgId
                }));
            }

            // Radiology
            const radReqId = `RAD-${i}-${orgId.slice(0, 4)}`;
            if (!(await radiologyRepo.findOne({ where: { requestId: radReqId } }))) {
                await radiologyRepo.save(radiologyRepo.create({
                    patientId: pat.id, doctorId: doc.id,
                    requestId: radReqId,
                    imagingType: ImagingType.X_RAY, bodyPart: 'Chest',
                    status: ImagingStatus.PENDING, organizationId: orgId
                }));
            }

            // Invoice
            const invNum = `INV-${i}-${orgId.slice(0, 4)}`;
            if (!(await invoiceRepo.findOne({ where: { invoiceNumber: invNum } }))) {
                await invoiceRepo.save(invoiceRepo.create({
                    patientId: pat.id, invoiceNumber: invNum,
                    subtotal: 1000, taxAmount: 180, totalAmount: 1180,
                    dueAmount: 1180, paidAmount: 0,
                    issueDate: new Date(), dueDate: daysOffset(7),
                    status: InvoiceStatus.PENDING, organizationId: orgId,
                    lineItems: [{ description: 'General Consultation', quantity: 1, unitPrice: 1000, totalPrice: 1000, category: 'consultation' }]
                }));
            }

            // Staff
            const staffEmail = `staff${i}@aarogentix.com`;
            let staffUser = await userRepo.findOne({ where: { email: staffEmail } });
            if (!staffUser) {
                staffUser = await userRepo.save(userRepo.create({
                    userId: `STF-U${i}`, email: staffEmail, password: await bcrypt.hash('Staff@123', 10),
                    roles: [nurseRole], status: UserStatus.ACTIVE, firstName: 'Staff', lastName: `${i}`, organizationId: orgId
                }));
            }
            if (!(await staffRepo.findOne({ where: { userId: staffUser.id } }))) {
                await staffRepo.save(staffRepo.create({
                    user: staffUser, userId: staffUser.id,
                    staffId: `STF-S${i}`, role: StaffRole.NURSE, status: StaffStatus.ACTIVE,
                    organizationId: orgId
                } as any));
            }

            // Inventory
            if (!(await inventoryRepo.findOne({ where: { itemCode: `ITEM-${i}` } }))) {
                await inventoryRepo.save(inventoryRepo.create({
                    itemCode: `ITEM-${i}`, itemName: `Item ${i}`, type: InventoryType.SUPPLIES,
                    quantity: 100, sellingPrice: 50, category: 'General', unit: 'units', unitCost: 35,
                    status: InventoryStatus.IN_STOCK, minimumLevel: 10,
                    organizationId: orgId
                } as any));
            }

            // Medicine
            if (!(await medicineRepo.findOne({ where: { medicineCode: `MED-CODE-${i}` } }))) {
                await medicineRepo.save(medicineRepo.create({
                    medicineCode: `MED-CODE-${i}`, name: `Medicine ${i}`, sellingPrice: 100, stock: 50,
                    strength: '500mg', formulation: 'Tablet', purchasePrice: 70, organizationId: orgId
                }));
            }

            // Admission
            const bed = await bedRepo.findOne({ where: { wardId: ward.id } });
            if (bed && !(await admissionRepo.findOne({ where: { admissionId: `ADM-S${i}` } }))) {
                await admissionRepo.save(admissionRepo.create({
                    admissionId: `ADM-S${i}`, patientId: pat.id, doctorId: doc.id,
                    wardId: ward.id, bedId: bed.id, status: AdmissionStatus.ADMITTED,
                    admissionDate: new Date(), organizationId: orgId
                }));
            }

            // OT & Surgery
            let theater = await theaterRepo.findOne({ where: { theatreCode: `OT-${i}` } });
            if (!theater) {
                theater = await theaterRepo.save(theaterRepo.create({
                    theatreCode: `OT-${i}`, theatreName: `OT ${i}`, isAvailable: true, organizationId: orgId
                }));
            }
            const surgId = `SURG-S${i}`;
            if (!(await surgeryRepo.findOne({ where: { surgeryId: surgId } }))) {
                await surgeryRepo.save(surgeryRepo.create({
                    surgeryId: surgId, patientId: pat.id, surgeonId: doc.id,
                    theatreId: theater.theatreCode, surgeryType: 'Minor Surgery',
                    status: SurgeryStatus.SCHEDULED, scheduledDate: daysOffset(5), organizationId: orgId
                } as any));
            }

            // Expense & Revenue
            const expNum = `EXP-S${i}`;
            if (!(await expenseRepo.findOne({ where: { expenseId: expNum } }))) {
                await expenseRepo.save(expenseRepo.create({
                    expenseId: expNum, amount: 500, expenseType: ExpenseType.SUPPLIES,
                    description: 'Office supplies purchase', vendorName: 'Stationery Hub',
                    status: PaymentStatus.PAID, expenseDate: new Date(), organizationId: orgId
                }));
            }
            const revNum = `REV-S${i}`;
            if (!(await revenueRepo.findOne({ where: { revenueId: revNum } }))) {
                await revenueRepo.save(revenueRepo.create({
                    revenueId: revNum, amount: 2000, source: 'Consultation Fee',
                    date: new Date(), patientId: pat.id, organizationId: orgId
                }));
            }

            // Compliance & Logs
            const compRecId = `COMP-S${i}`;
            if (!(await complianceRepo.findOne({ where: { recordId: compRecId } }))) {
                await complianceRepo.save(complianceRepo.create({
                    recordId: compRecId, complianceType: ComplianceType.HIPAA,
                    status: ComplianceStatus.COMPLIANT, description: 'Annual security audit', organizationId: orgId
                }));
            }
            if (!(await dataLogRepo.findOne({ where: { userId: adminUser.id, entityId: pat.id, timestamp: MoreThan(daysOffset(-1)) } as any }))) {
                await dataLogRepo.save(dataLogRepo.create({
                    userId: adminUser.id, action: 'view', entityType: 'Patient',
                    entityId: pat.id, timestamp: new Date(), organizationId: orgId
                }));
            }

            // Notification: No easy unique check, but we can check for same user/title/org
            if (!(await notificationRepo.findOne({ where: { organizationId: orgId, userId: adminUser.id, title: `Notification ${i}` } }))) {
                await notificationRepo.save(notificationRepo.create({
                    organizationId: orgId, userId: adminUser.id, type: 'system',
                    title: `Notification ${i}`, message: 'System message', isRead: false
                }));
            }

            // Audit Log: No easy unique check, but we can check for same user/action/entity
            if (!(await auditRepo.findOne({ where: { organizationId: orgId, userId: adminUser.id, action: AuditAction.READ, entityId: adminUser.id } }))) {
                await auditRepo.save(auditRepo.create({
                    organizationId: orgId, userId: adminUser.id, userEmail: adminEmail,
                    action: AuditAction.READ, entityType: 'User', entityId: adminUser.id,
                    ipAddress: '127.0.0.1', success: true
                }));
            }

            // Org Usage
            if (!(await usageRepo.findOne({ where: { organizationId: orgId, featureKey: `FEATURE_${i}` } }))) {
                await usageRepo.save(usageRepo.create({
                    organizationId: orgId, featureKey: `FEATURE_${i}`, usedCount: i + 1
                }));
            }

            // Feature Limits (link to enterprise plan)
            const enterprisePlan = cachedPlans[SubscriptionPlanTier.ENTERPRISE];
            if (!(await featureRepo.findOne({ where: { planId: enterprisePlan.id, featureKey: `MAX_VAL_${i}` } }))) {
                await featureRepo.save(featureRepo.create({
                    planId: enterprisePlan.id, featureKey: `MAX_VAL_${i}`, limitValue: -1, isEnabled: true, resetInterval: ResetInterval.LIFETIME
                }));
            }

            // Tokens
            if (!(await tokenRepo.findOne({ where: { userId: adminUser.id, expiresAt: MoreThan(new Date()) } as any }))) {
                await tokenRepo.save(tokenRepo.create({
                    userId: adminUser.id, tokenHash: crypto.randomBytes(16).toString('hex'),
                    expiresAt: daysOffset(1)
                }));
            }
        }

        console.log('\n✅ SEEDING COMPLETE! 10 records created in every required table.');
        console.log(`👤 Admin: ${adminEmail} / Dhruv@6606`);
        process.exit(0);

    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
}

seedData();
