import 'reflect-metadata';
import * as path from 'path';
import * as dotenv from 'dotenv';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

// Load environment variables FIRST
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

import { User, UserStatus, UserRole } from '../../modules/users/entities/user.entity';
import { Doctor } from '../../modules/doctors/entities/doctor.entity';
import { Patient, BloodType } from '../../modules/patients/entities/patient.entity';
import { Appointment, AppointmentStatus } from '../../modules/appointments/entities/appointment.entity';
import { Prescription, PrescriptionStatus } from '../../modules/prescriptions/entities/prescription.entity';
import { Medicine } from '../../modules/pharmacy/entities/medicine.entity';
import { LabTest, LabTestStatus } from '../../modules/laboratory/entities/lab-test.entity';
import { Invoice, InvoiceStatus } from '../../modules/billing/entities/invoice.entity';
import { Expense, ExpenseType, PaymentStatus, Revenue } from '../../modules/accounts/entities/accounts.entity';
import { Staff, StaffRole, StaffStatus } from '../../modules/staff/entities/staff.entity';
import { Inventory, InventoryType, InventoryStatus } from '../../modules/inventory/entities/inventory.entity';
import { Surgery, SurgeryStatus, OperationTheater } from '../../modules/operation-theater/entities/operation-theater.entity';
import { ComplianceRecord, ComplianceStatus, ComplianceType } from '../../modules/compliance/entities/compliance.entity';
import { RadiologyRequest, ImagingType, ImagingStatus } from '../../modules/radiology/entities/radiology.entity';
import { Ward, Bed, BedStatus } from '../../modules/wards/entities/ward.entity';
import { Admission, AdmissionStatus } from '../../modules/admissions/entities/admission.entity';
import { Department } from '../../modules/departments/entities/department.entity';
import { BloodInventory, BloodRequest, BloodGroup, BloodComponent, InventoryStatus as BloodInventoryStatus, RequestPriority, RequestStatus } from '../../modules/blood-bank/entities/blood-bank.entity';
import { EmergencyCase, TriageLevel, EmergencyStatus, ArrivalMode } from '../../modules/emergency/entities/emergency.entity';
import { InsuranceProvider, InsuranceClaim, TreatmentType, ClaimStatus } from '../../modules/insurance/entities/insurance.entity';
import { Ambulance, AmbulanceTrip, VehicleType, AmbulanceStatus, TripType, TripStatus, TripPriority } from '../../modules/ambulance/entities/ambulance.entity';
import { DischargeSummary, DischargeType, DischargeStatus } from '../../modules/discharge-summary/entities/discharge-summary.entity';
import { OpdQueue, QueueStatus, QueuePriority } from '../../modules/opd-queue/entities/opd-queue.entity';
import { Notification } from '../../modules/notifications/entities/notification.entity';
import { Role } from '../../modules/rbac/entities/role.entity';
import { Permission } from '../../modules/rbac/entities/permission.entity';

// ── Helpers ──────────────────────────────────────────────────────────────────
const orgId = 'b2928b12-99a6-467d-a576-fff7c6d8a466';
const rand = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const daysOffset = (days: number) => new Date(Date.now() + days * 86400000);
const uid = () => crypto.randomUUID();
const shortId = () => crypto.randomBytes(3).toString('hex').toUpperCase();

async function seedDemoData() {
  const { AppDataSource } = await import('../typeorm.config');

  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    console.log('\n=== Starting Demo Data Seed ===\n');
    console.log(`Organization ID: ${orgId}\n`);

    const userRepo = AppDataSource.getRepository(User);
    const doctorRepo = AppDataSource.getRepository(Doctor);
    const patientRepo = AppDataSource.getRepository(Patient);
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
    const radiologyRepo = AppDataSource.getRepository(RadiologyRequest);
    const wardRepo = AppDataSource.getRepository(Ward);
    const bedRepo = AppDataSource.getRepository(Bed);
    const admissionRepo = AppDataSource.getRepository(Admission);
    const departmentRepo = AppDataSource.getRepository(Department);
    const bloodInventoryRepo = AppDataSource.getRepository(BloodInventory);
    const bloodRequestRepo = AppDataSource.getRepository(BloodRequest);
    const emergencyRepo = AppDataSource.getRepository(EmergencyCase);
    const insuranceProviderRepo = AppDataSource.getRepository(InsuranceProvider);
    const insuranceClaimRepo = AppDataSource.getRepository(InsuranceClaim);
    const ambulanceRepo = AppDataSource.getRepository(Ambulance);
    const ambulanceTripRepo = AppDataSource.getRepository(AmbulanceTrip);
    const dischargeSummaryRepo = AppDataSource.getRepository(DischargeSummary);
    const opdQueueRepo = AppDataSource.getRepository(OpdQueue);
    const notificationRepo = AppDataSource.getRepository(Notification);
    const roleRepo = AppDataSource.getRepository(Role);
    const permRepo = AppDataSource.getRepository(Permission);

    // ─── Ensure RBAC roles exist for the org ─────────────────────────────────
    const allPerms = await permRepo.find();
    const getRole = async (name: string) => {
      let role = await roleRepo.findOne({ where: { name, organizationId: orgId }, relations: ['permissions'] });
      if (!role) {
        role = await roleRepo.save(roleRepo.create({ name, organizationId: orgId, isSystemRole: true, permissions: allPerms }));
      }
      return role;
    };
    const doctorRole = await getRole(UserRole.DOCTOR);
    const patientRole = await getRole(UserRole.PATIENT);
    const nurseRole = await getRole(UserRole.NURSE);
    const receptionRole = await getRole(UserRole.RECEPTIONIST);
    const labRole = await getRole(UserRole.LAB_TECHNICIAN);
    const pharmacistRole = await getRole(UserRole.PHARMACIST);

    // =========================================================================
    // 1. DEPARTMENTS (10)
    // =========================================================================
    console.log('[1/22] Seeding departments...');
    const deptData = [
      { name: 'Cardiology', desc: 'Heart and cardiovascular system care' },
      { name: 'Orthopedics', desc: 'Musculoskeletal system treatment' },
      { name: 'Neurology', desc: 'Brain and nervous system disorders' },
      { name: 'Pediatrics', desc: 'Medical care for infants, children and adolescents' },
      { name: 'General Surgery', desc: 'Surgical procedures across organ systems' },
      { name: 'Emergency', desc: 'Acute illness and injury management' },
      { name: 'Radiology', desc: 'Medical imaging and diagnostic radiology' },
      { name: 'Pathology', desc: 'Laboratory medicine and diagnostic testing' },
      { name: 'ICU', desc: 'Intensive care for critically ill patients' },
      { name: 'Physiotherapy', desc: 'Physical rehabilitation and therapy' },
    ];
    const departments: Department[] = [];
    for (const d of deptData) {
      let dept = await departmentRepo.findOne({ where: { name: d.name, organizationId: orgId } });
      if (!dept) {
        dept = await departmentRepo.save(departmentRepo.create({
          name: d.name,
          description: d.desc,
          isActive: true,
          organizationId: orgId,
        }));
      }
      departments.push(dept);
    }
    console.log(`  -> ${departments.length} departments ready\n`);

    // =========================================================================
    // 2. DOCTORS (5) — each with a User record
    // =========================================================================
    console.log('[2/22] Seeding doctors...');
    const doctorsData = [
      { first: 'Anil', last: 'Kapoor', spec: 'Cardiology', phone: '9812300001', fee: 1500 },
      { first: 'Meera', last: 'Joshi', spec: 'Orthopedics', phone: '9812300002', fee: 1200 },
      { first: 'Ravi', last: 'Shankar', spec: 'Neurology', phone: '9812300003', fee: 1800 },
      { first: 'Sunita', last: 'Devi', spec: 'Pediatrics', phone: '9812300004', fee: 900 },
      { first: 'Karan', last: 'Malhotra', spec: 'General Surgery', phone: '9812300005', fee: 2000 },
    ];
    const doctors: any[] = [];
    for (let i = 0; i < doctorsData.length; i++) {
      const d = doctorsData[i];
      const email = `demo.dr.${d.first.toLowerCase()}.${d.last.toLowerCase()}@hospital.com`;
      let user = await userRepo.findOne({ where: { email } });
      if (!user) {
        user = await userRepo.save(userRepo.create({
          userId: `DEMO-DOC-${String(i + 1).padStart(3, '0')}`,
          email,
          password: await bcrypt.hash('DemoDoctor@123', 10),
          roles: [doctorRole],
          status: UserStatus.ACTIVE,
          emailVerified: true,
          firstName: d.first,
          lastName: d.last,
          phoneNumber: d.phone,
          organizationId: orgId,
        }));
      }
      let doctor: any = await doctorRepo.findOne({ where: { customUserId: user.userId } });
      if (!doctor) {
        doctor = await doctorRepo.save(doctorRepo.create({
          user,
          customUserId: user.userId,
          doctorId: `DEMO-DOC-${String(i + 1).padStart(3, '0')}`,
          specialization: d.spec,
          licenseNumber: `DLIC-${shortId()}`,
          yearsOfExperience: Math.floor(Math.random() * 15) + 5,
          consultationFee: d.fee,
          isActive: true,
          organizationId: orgId,
          qualifications: ['MBBS', 'MD'],
          rating: parseFloat((3.5 + Math.random() * 1.5).toFixed(1)),
        } as any));
      }
      doctors.push(doctor);
    }
    console.log(`  -> ${doctors.length} doctors ready\n`);

    // =========================================================================
    // 3. PATIENTS (8) — each with a User record
    // =========================================================================
    console.log('[3/22] Seeding patients...');
    const patientsData = [
      { first: 'Aarav', last: 'Sharma', email: 'demo.aarav@example.com', phone: '9711100001', blood: BloodType.B_POSITIVE, age: 42, emName: 'Priti Sharma', emPhone: '9711100099', emRel: 'Spouse' },
      { first: 'Diya', last: 'Patel', email: 'demo.diya@example.com', phone: '9711100002', blood: BloodType.O_POSITIVE, age: 34, emName: 'Rohan Patel', emPhone: '9711100098', emRel: 'Husband' },
      { first: 'Vivaan', last: 'Singh', email: 'demo.vivaan@example.com', phone: '9711100003', blood: BloodType.A_POSITIVE, age: 56, emName: 'Kavita Singh', emPhone: '9711100097', emRel: 'Wife' },
      { first: 'Ananya', last: 'Reddy', email: 'demo.ananya@example.com', phone: '9711100004', blood: BloodType.AB_POSITIVE, age: 28, emName: 'Suresh Reddy', emPhone: '9711100096', emRel: 'Father' },
      { first: 'Ishaan', last: 'Gupta', email: 'demo.ishaan@example.com', phone: '9711100005', blood: BloodType.O_NEGATIVE, age: 61, emName: 'Meera Gupta', emPhone: '9711100095', emRel: 'Wife' },
      { first: 'Saanvi', last: 'Nair', email: 'demo.saanvi@example.com', phone: '9711100006', blood: BloodType.A_NEGATIVE, age: 39, emName: 'Ajay Nair', emPhone: '9711100094', emRel: 'Husband' },
      { first: 'Arjun', last: 'Deshmukh', email: 'demo.arjun.d@example.com', phone: '9711100007', blood: BloodType.B_NEGATIVE, age: 48, emName: 'Sunita Deshmukh', emPhone: '9711100093', emRel: 'Wife' },
      { first: 'Myra', last: 'Iyer', email: 'demo.myra@example.com', phone: '9711100008', blood: BloodType.AB_NEGATIVE, age: 25, emName: 'Lakshmi Iyer', emPhone: '9711100092', emRel: 'Mother' },
    ];
    const patients: any[] = [];
    for (let i = 0; i < patientsData.length; i++) {
      const p = patientsData[i];
      let user = await userRepo.findOne({ where: { email: p.email } });
      if (!user) {
        user = await userRepo.save(userRepo.create({
          userId: `DEMO-PAT-${String(i + 1).padStart(3, '0')}`,
          email: p.email,
          password: await bcrypt.hash('DemoPatient@123', 10),
          roles: [patientRole],
          status: UserStatus.ACTIVE,
          emailVerified: true,
          firstName: p.first,
          lastName: p.last,
          phoneNumber: p.phone,
          dateOfBirth: new Date(2026 - p.age, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
          gender: i % 2 === 0 ? 'male' : 'female',
          address: `${Math.floor(Math.random() * 500) + 1}, Sector ${Math.floor(Math.random() * 30) + 1}`,
          city: rand(['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Pune']),
          state: rand(['Maharashtra', 'Karnataka', 'Tamil Nadu', 'Delhi', 'Gujarat']),
          postalCode: String(400000 + Math.floor(Math.random() * 10000)),
          country: 'India',
          organizationId: orgId,
        }));
      }
      let patient: any = await patientRepo.findOne({ where: { customUserId: user.userId } });
      if (!patient) {
        patient = await patientRepo.save(patientRepo.create({
          user,
          customUserId: user.userId,
          patientId: `DEMO-PAT-${String(i + 1).padStart(3, '0')}`,
          bloodType: p.blood,
          allergies: rand([['Penicillin'], ['Dust', 'Pollen'], ['Sulfa drugs'], []]),
          chronicDiseases: p.age > 50 ? rand([['Hypertension'], ['Type 2 Diabetes'], ['Hypertension', 'Diabetes']]) : [],
          insuranceProvider: rand(['Star Health Insurance', 'ICICI Lombard', 'HDFC Ergo', 'Max Bupa']),
          insurancePolicyNumber: `POL-${shortId()}`,
          emergencyContactName: p.emName,
          emergencyContactPhone: p.emPhone,
          emergencyContactRelation: p.emRel,
          height: Math.floor(Math.random() * 35) + 155,
          weight: Math.floor(Math.random() * 40) + 50,
          maritalStatus: rand(['Married', 'Single', 'Divorced']),
          occupation: rand(['Engineer', 'Teacher', 'Business Owner', 'Homemaker', 'Student', 'Government Employee']),
          organizationId: orgId,
        } as any));
      }
      patients.push(patient);
    }
    console.log(`  -> ${patients.length} patients ready\n`);

    // =========================================================================
    // 4. STAFF (5)
    // =========================================================================
    console.log('[4/22] Seeding staff...');
    const staffData = [
      { first: 'Rekha', last: 'Pillai', role: StaffRole.NURSE, userRole: nurseRole, exp: 8, phone: '9900100001' },
      { first: 'Sunil', last: 'Tiwari', role: StaffRole.TECHNICIAN, userRole: labRole, exp: 5, phone: '9900100002' },
      { first: 'Pooja', last: 'Mehta', role: StaffRole.RECEPTIONIST, userRole: receptionRole, exp: 3, phone: '9900100003' },
      { first: 'Ganesh', last: 'Yadav', role: StaffRole.LAB_TECHNICIAN, userRole: labRole, exp: 6, phone: '9900100004' },
      { first: 'Lata', last: 'Verma', role: StaffRole.NURSE, userRole: nurseRole, exp: 10, phone: '9900100005' },
    ];
    for (const s of staffData) {
      const email = `demo.${s.first.toLowerCase()}.${s.last.toLowerCase()}@hospital.com`;
      let user = await userRepo.findOne({ where: { email } });
      if (!user) {
        user = await userRepo.save(userRepo.create({
          userId: uid(),
          email,
          password: await bcrypt.hash('DemoStaff@123', 10),
          roles: [s.userRole],
          status: UserStatus.ACTIVE,
          emailVerified: true,
          firstName: s.first,
          lastName: s.last,
          phoneNumber: s.phone,
          organizationId: orgId,
        }));
      }
      if (!(await staffRepo.findOne({ where: { userId: user.id } }))) {
        await staffRepo.save(staffRepo.create({
          user,
          staffId: `DEMO-STF-${shortId()}`,
          userId: user.id,
          role: s.role,
          status: StaffStatus.ACTIVE,
          yearsOfExperience: s.exp,
          joiningDate: daysOffset(-(s.exp * 365)),
          isVerified: true,
          availableFrom: '08:00',
          availableTo: '18:00',
          organizationId: orgId,
        } as any));
      }
    }
    console.log(`  -> ${staffData.length} staff members ready\n`);

    // =========================================================================
    // 5. WARDS (4) with BEDS (5-10 per ward)
    // =========================================================================
    console.log('[5/22] Seeding wards and beds...');
    const wardsData = [
      { name: 'General Ward', code: 'DEMO-GW-001', beds: 10, price: 2000, floor: '1', block: 'A' },
      { name: 'ICU', code: 'DEMO-ICU-001', beds: 6, price: 8000, floor: '2', block: 'A' },
      { name: 'Pediatric Ward', code: 'DEMO-PW-001', beds: 8, price: 3500, floor: '1', block: 'B' },
      { name: 'Surgical Ward', code: 'DEMO-SW-001', beds: 5, price: 5000, floor: '3', block: 'A' },
    ];
    const wards: Ward[] = [];
    const allBeds: Bed[] = [];
    for (const w of wardsData) {
      let ward = await wardRepo.findOne({ where: { wardCode: w.code } });
      if (!ward) {
        ward = await wardRepo.save(wardRepo.create({
          wardCode: w.code,
          wardName: w.name,
          description: `${w.name} for patient care`,
          totalBeds: w.beds,
          occupiedBeds: 0,
          pricePerDay: w.price,
          floor: w.floor,
          block: w.block,
          facilities: JSON.stringify(['AC', 'Nursing Station', 'Oxygen Supply', 'Monitor']),
          organizationId: orgId,
        }));
      }
      wards.push(ward);

      // Create beds for this ward
      for (let b = 1; b <= w.beds; b++) {
        const bedNum = `${w.code}-B${String(b).padStart(2, '0')}`;
        let bed = await bedRepo.findOne({ where: { bedNumber: bedNum } });
        if (!bed) {
          bed = await bedRepo.save(bedRepo.create({
            wardId: ward.id,
            bedNumber: bedNum,
            status: BedStatus.AVAILABLE,
            organizationId: orgId,
          }));
        }
        allBeds.push(bed);
      }
    }
    console.log(`  -> ${wards.length} wards, ${allBeds.length} beds ready\n`);

    // =========================================================================
    // 6. APPOINTMENTS (15)
    // =========================================================================
    console.log('[6/22] Seeding appointments...');
    const existingAppts = await appointmentRepo.count({ where: { organizationId: orgId } });
    if (existingAppts < 15) {
      const reasons = ['Routine Checkup', 'Follow-up Visit', 'Chest Pain', 'Knee Pain', 'Headache', 'Fever', 'Skin Rash', 'Back Pain', 'Cough', 'Diabetes Review', 'Annual Physical', 'Joint Stiffness', 'Breathing Difficulty', 'Abdominal Pain', 'Post-Surgery Follow-up'];
      for (let i = 0; i < 15; i++) {
        const hour = Math.floor(Math.random() * 8) + 9;
        const status = [AppointmentStatus.SCHEDULED, AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED, AppointmentStatus.CONFIRMED, AppointmentStatus.COMPLETED, AppointmentStatus.SCHEDULED][i % 6];
        await appointmentRepo.save(appointmentRepo.create({
          patientId: patients[i % patients.length].id,
          doctorId: doctors[i % doctors.length].id,
          appointmentDate: daysOffset(i * 2 - 14),
          appointmentTime: `${String(hour).padStart(2, '0')}:${i % 2 === 0 ? '00' : '30'}`,
          duration: rand([15, 30, 45, 60]),
          tokenNumber: i + 1,
          reason: reasons[i],
          status,
          notes: status === AppointmentStatus.COMPLETED ? 'Patient examined. Treatment prescribed.' : null,
          diagnosis: status === AppointmentStatus.COMPLETED ? rand(['Hypertension', 'Migraine', 'Osteoarthritis', 'GERD', 'Healthy']) : null,
          isVirtual: i % 5 === 0,
          organizationId: orgId,
        }));
      }
    }
    console.log('  -> 15 appointments ready\n');

    // =========================================================================
    // 7. PRESCRIPTIONS (10)
    // =========================================================================
    console.log('[7/22] Seeding prescriptions...');
    const existingPrescriptions = await prescriptionRepo.count({ where: { organizationId: orgId } });
    if (existingPrescriptions < 10) {
      const prescStatuses = [PrescriptionStatus.ISSUED, PrescriptionStatus.ACTIVE, PrescriptionStatus.FULFILLED, PrescriptionStatus.EXPIRED];
      const diagnosisList = ['Hypertension', 'Type 2 Diabetes', 'Osteoarthritis', 'Migraine', 'GERD', 'Asthma', 'Anemia', 'Hypothyroidism', 'UTI', 'Sinusitis'];
      const medNames = ['Metformin', 'Amlodipine', 'Omeprazole', 'Atorvastatin', 'Paracetamol', 'Ibuprofen', 'Amoxicillin', 'Cetirizine', 'Levothyroxine', 'Pantoprazole'];
      for (let i = 0; i < 10; i++) {
        await prescriptionRepo.save(prescriptionRepo.create({
          patientId: patients[i % patients.length].id,
          doctorId: doctors[i % doctors.length].id,
          prescriptionNumber: `DEMO-RX-${Date.now()}-${i}`,
          status: rand(prescStatuses),
          diagnosis: diagnosisList[i],
          issuedDate: daysOffset(-i * 4),
          expiryDate: daysOffset(30 - i * 3),
          isRecurring: i % 4 === 0,
          isDigitallySigned: i % 2 === 0,
          medicines: [
            {
              medicineId: uid(),
              medicineName: medNames[i],
              dosage: rand(['500mg', '250mg', '10mg', '5mg']),
              frequency: rand(['Once daily', 'Twice daily', 'Three times a day']),
              duration: rand(['7 days', '14 days', '30 days']),
              instructions: rand(['Take after meals', 'Take before meals', 'Take with water']),
              quantity: Math.floor(Math.random() * 30) + 10,
            },
            {
              medicineId: uid(),
              medicineName: medNames[(i + 3) % 10],
              dosage: rand(['500mg', '100mg', '20mg']),
              frequency: rand(['Once daily', 'Twice daily']),
              duration: rand(['5 days', '10 days']),
              instructions: 'As directed by physician',
              quantity: Math.floor(Math.random() * 20) + 5,
            },
          ],
          notes: `Prescription for ${diagnosisList[i]}. Follow up in 2 weeks.`,
          pharmacyNotified: [],
          organizationId: orgId,
        }));
      }
    }
    console.log('  -> 10 prescriptions ready\n');

    // =========================================================================
    // 8. MEDICINES / PHARMACY (10)
    // =========================================================================
    console.log('[8/22] Seeding medicines...');
    const medicinesData = [
      { name: 'Aspirin', generic: 'Acetylsalicylic Acid', strength: '500mg', form: 'Tablet', price: 150, stock: 500, mfr: 'Sun Pharma' },
      { name: 'Amoxicillin', generic: 'Amoxicillin Trihydrate', strength: '250mg', form: 'Capsule', price: 200, stock: 300, mfr: 'Cipla' },
      { name: 'Metformin', generic: 'Metformin HCl', strength: '500mg', form: 'Tablet', price: 180, stock: 400, mfr: 'Dr Reddys' },
      { name: 'Atorvastatin', generic: 'Atorvastatin Calcium', strength: '10mg', form: 'Tablet', price: 250, stock: 250, mfr: 'Lupin' },
      { name: 'Omeprazole', generic: 'Omeprazole', strength: '20mg', form: 'Capsule', price: 190, stock: 320, mfr: 'Zydus' },
      { name: 'Ibuprofen', generic: 'Ibuprofen', strength: '400mg', form: 'Tablet', price: 100, stock: 600, mfr: 'Sun Pharma' },
      { name: 'Paracetamol', generic: 'Acetaminophen', strength: '500mg', form: 'Tablet', price: 80, stock: 800, mfr: 'Cipla' },
      { name: 'Cetirizine', generic: 'Cetirizine HCl', strength: '10mg', form: 'Tablet', price: 120, stock: 350, mfr: 'Dr Reddys' },
      { name: 'Azithromycin', generic: 'Azithromycin', strength: '500mg', form: 'Tablet', price: 280, stock: 200, mfr: 'Lupin' },
      { name: 'Clopidogrel', generic: 'Clopidogrel Bisulfate', strength: '75mg', form: 'Tablet', price: 160, stock: 300, mfr: 'Zydus' },
    ];
    for (const m of medicinesData) {
      const code = `DEMO-MED-${m.name.slice(0, 3).toUpperCase()}`;
      if (!(await medicineRepo.findOne({ where: { medicineCode: code } }))) {
        await medicineRepo.save(medicineRepo.create({
          medicineCode: code,
          name: m.name,
          genericName: m.generic,
          strength: m.strength,
          formulation: m.form,
          purchasePrice: m.price * 0.6,
          sellingPrice: m.price,
          stock: m.stock,
          reorderLevel: 100,
          expiryDate: daysOffset(365 + Math.floor(Math.random() * 365)),
          manufacturer: m.mfr,
          batchNumber: `BATCH-${shortId()}`,
          isActive: true,
          sideEffects: rand([['Nausea', 'Headache'], ['Dizziness'], ['Rash'], []]),
          contraindications: rand([['Pregnancy'], ['Renal failure'], []]),
          storageConditions: 'Store below 25C in a dry place',
          organizationId: orgId,
        }));
      }
    }
    console.log('  -> 10 medicines ready\n');

    // =========================================================================
    // 9. LAB TESTS (8)
    // =========================================================================
    console.log('[9/22] Seeding lab tests...');
    const existingLabTests = await labTestRepo.count({ where: { organizationId: orgId } });
    if (existingLabTests < 8) {
      const labTestsData = [
        { name: 'Complete Blood Count (CBC)', code: 'DEMO-CBC', desc: 'Full blood panel including RBC, WBC, platelets' },
        { name: 'Lipid Profile', code: 'DEMO-LPD', desc: 'Cholesterol, triglycerides and HDL/LDL levels' },
        { name: 'Blood Glucose Fasting', code: 'DEMO-BGL', desc: 'Fasting blood sugar measurement' },
        { name: 'Thyroid Function Test', code: 'DEMO-TFT', desc: 'TSH, T3, T4 levels' },
        { name: 'Liver Function Test', code: 'DEMO-LFT', desc: 'ALT, AST, bilirubin and albumin levels' },
        { name: 'Kidney Function Test', code: 'DEMO-KFT', desc: 'Creatinine, urea and electrolyte levels' },
        { name: 'HbA1c', code: 'DEMO-HBA', desc: 'Glycated hemoglobin for diabetes monitoring' },
        { name: 'Urine Routine', code: 'DEMO-UR', desc: 'Urinalysis including pH, protein, glucose' },
      ];
      for (let i = 0; i < 8; i++) {
        const t = labTestsData[i];
        const isCompleted = i < 4;
        await labTestRepo.save(labTestRepo.create({
          patientId: patients[i % patients.length].id,
          testName: t.name,
          testCode: t.code,
          description: t.desc,
          status: isCompleted ? LabTestStatus.REPORTED : rand([LabTestStatus.ORDERED, LabTestStatus.IN_PROGRESS, LabTestStatus.SAMPLE_COLLECTED]),
          orderedBy: `Dr. ${doctorsData[i % doctors.length].first} ${doctorsData[i % doctors.length].last}`,
          orderedDate: daysOffset(-i * 3),
          sampleCollectionDate: isCompleted ? daysOffset(-i * 3 + 1) : null,
          completionDate: isCompleted ? daysOffset(-i * 3 + 2) : null,
          testResults: isCompleted ? [
            { parameter: 'Result A', value: String(Math.floor(Math.random() * 100) + 50), unit: 'mg/dL', normalRange: '70-110', status: 'normal' as const },
            { parameter: 'Result B', value: String(Math.floor(Math.random() * 50) + 10), unit: 'U/L', normalRange: '10-40', status: rand(['normal' as const, 'abnormal' as const]) },
          ] : null,
          interpretation: isCompleted ? 'Results within acceptable limits. Follow up recommended.' : null,
          reportedBy: isCompleted ? 'Lab Tech Sunil Tiwari' : null,
          notes: 'Collected at main laboratory.',
          organizationId: orgId,
        }));
      }
    }
    console.log('  -> 8 lab tests ready\n');

    // =========================================================================
    // 10. INVOICES / BILLING (10)
    // =========================================================================
    console.log('[10/22] Seeding invoices...');
    const existingInvoices = await invoiceRepo.count({ where: { organizationId: orgId } });
    if (existingInvoices < 10) {
      const invoiceStatuses = [InvoiceStatus.PAID, InvoiceStatus.PENDING, InvoiceStatus.OVERDUE, InvoiceStatus.SENT, InvoiceStatus.PARTIALLY_PAID];
      for (let i = 0; i < 10; i++) {
        const subtotal = Math.floor(Math.random() * 15000) + 2000;
        const tax = Math.floor(subtotal * 0.18);
        const total = subtotal + tax;
        const status = invoiceStatuses[i % invoiceStatuses.length];
        const paid = status === InvoiceStatus.PAID ? total : status === InvoiceStatus.PARTIALLY_PAID ? Math.floor(total / 2) : 0;
        await invoiceRepo.save(invoiceRepo.create({
          patientId: patients[i % patients.length].id,
          invoiceNumber: `DEMO-INV-${Date.now()}-${i}`,
          subtotal,
          taxAmount: tax,
          taxPercentage: 18,
          discount: i % 3 === 0 ? Math.floor(subtotal * 0.05) : 0,
          totalAmount: total,
          paidAmount: paid,
          dueAmount: total - paid,
          status,
          issueDate: daysOffset(-i * 3),
          dueDate: daysOffset(30 - i * 3),
          lineItems: [
            { description: 'Consultation Fee', quantity: 1, unitPrice: subtotal * 0.4, totalPrice: subtotal * 0.4, category: 'consultation' },
            { description: 'Medicines', quantity: 1, unitPrice: subtotal * 0.3, totalPrice: subtotal * 0.3, category: 'medicine' },
            { description: 'Laboratory Tests', quantity: 1, unitPrice: subtotal * 0.3, totalPrice: subtotal * 0.3, category: 'test' },
          ],
          payments: status === InvoiceStatus.PAID ? [{
            paymentId: uid(),
            amount: total,
            method: 'upi' as any,
            transactionId: `TXN-${shortId()}`,
            paymentDate: daysOffset(-i * 3 + 2),
            reference: 'Payment received',
          }] : [],
          notes: 'Thank you for choosing our hospital.',
          organizationId: orgId,
        } as any));
      }
    }
    console.log('  -> 10 invoices ready\n');

    // =========================================================================
    // 11. INVENTORY (8)
    // =========================================================================
    console.log('[11/22] Seeding inventory...');
    const inventoryData = [
      { name: 'Oxygen Cylinders', type: InventoryType.EQUIPMENT, qty: 50, price: 8000, min: 10, unit: 'pieces' },
      { name: 'Syringes 10ml', type: InventoryType.SUPPLIES, qty: 5000, price: 5, min: 500, unit: 'pieces' },
      { name: 'Sterile Gloves (L)', type: InventoryType.SUPPLIES, qty: 10000, price: 3, min: 2000, unit: 'pairs' },
      { name: 'Gauze Pads', type: InventoryType.SUPPLIES, qty: 2000, price: 10, min: 500, unit: 'pieces' },
      { name: 'IV Fluid 500ml', type: InventoryType.SUPPLIES, qty: 200, price: 150, min: 50, unit: 'bottles' },
      { name: 'Patient Monitors', type: InventoryType.EQUIPMENT, qty: 15, price: 50000, min: 3, unit: 'pieces' },
      { name: 'Rapid COVID Test Kit', type: InventoryType.DIAGNOSTIC_KIT, qty: 500, price: 350, min: 100, unit: 'kits' },
      { name: 'Blood Glucose Strips', type: InventoryType.DIAGNOSTIC_KIT, qty: 1000, price: 15, min: 200, unit: 'strips' },
    ];
    for (const inv of inventoryData) {
      const code = `DEMO-INV-${inv.name.slice(0, 4).toUpperCase().replace(/\s/g, '')}`;
      if (!(await inventoryRepo.findOne({ where: { itemCode: code } }))) {
        await inventoryRepo.save(inventoryRepo.create({
          itemCode: code,
          itemName: inv.name,
          type: inv.type,
          category: inv.type === InventoryType.EQUIPMENT ? 'Medical Equipment' : inv.type === InventoryType.DIAGNOSTIC_KIT ? 'Diagnostics' : 'Medical Supplies',
          quantity: inv.qty,
          unit: inv.unit,
          unitCost: inv.price * 0.7,
          sellingPrice: inv.price,
          minimumLevel: inv.min,
          location: rand(['Main Warehouse', 'ICU Store', 'OT Store', 'Pharmacy Store']),
          status: inv.qty > inv.min ? InventoryStatus.IN_STOCK : InventoryStatus.LOW_STOCK,
          supplier: rand(['MedSupply Corp', 'Global Medical', 'HealthTech India']),
          expiryDate: daysOffset(Math.floor(Math.random() * 500) + 180),
          organizationId: orgId,
        }));
      }
    }
    console.log('  -> 8 inventory items ready\n');

    // =========================================================================
    // 12. RADIOLOGY REQUESTS (6)
    // =========================================================================
    console.log('[12/22] Seeding radiology requests...');
    const existingRadiology = await radiologyRepo.count({ where: { organizationId: orgId } });
    if (existingRadiology < 6) {
      const imgTypes = [ImagingType.X_RAY, ImagingType.CT_SCAN, ImagingType.MRI, ImagingType.ULTRASOUND, ImagingType.X_RAY, ImagingType.MRI];
      const bodyParts = ['Chest', 'Brain', 'Spine', 'Abdomen', 'Knee', 'Shoulder'];
      for (let i = 0; i < 6; i++) {
        const isCompleted = i < 3;
        await radiologyRepo.save(radiologyRepo.create({
          requestId: `DEMO-RAD-${shortId()}`,
          patientId: patients[i % patients.length].id,
          doctorId: doctors[i % doctors.length].id,
          imagingType: imgTypes[i],
          bodyPart: bodyParts[i],
          clinicalHistory: `Patient presents with ${rand(['chronic pain', 'acute injury', 'swelling', 'difficulty breathing'])}`,
          status: isCompleted ? ImagingStatus.REPORTED : ImagingStatus.PENDING,
          scheduledDate: daysOffset(-i * 2),
          completedDate: isCompleted ? daysOffset(-i * 2 + 1) : null,
          findings: isCompleted ? rand(['No significant abnormality detected', 'Mild effusion noted', 'Hairline fracture visible']) : null,
          reportNotes: isCompleted ? 'Report generated and sent to referring physician.' : null,
          cost: Math.floor(Math.random() * 3000) + 500,
          organizationId: orgId,
        }));
      }
    }
    console.log('  -> 6 radiology requests ready\n');

    // =========================================================================
    // 13. OPERATION THEATERS (3) + SURGERIES (6)
    // =========================================================================
    console.log('[13/22] Seeding operation theaters and surgeries...');
    const theaters: OperationTheater[] = [];
    for (let i = 1; i <= 3; i++) {
      const code = `DEMO-OT-${String(i).padStart(2, '0')}`;
      let theater = await theaterRepo.findOne({ where: { theatreCode: code } });
      if (!theater) {
        theater = await theaterRepo.save(theaterRepo.create({
          theatreCode: code,
          theatreName: `Demo Theater ${String.fromCharCode(64 + i)}`,
          isAvailable: true,
          facilities: 'HD monitors, anesthesia machine, surgical lights, sterilisation unit',
          organizationId: orgId,
        }));
      }
      theaters.push(theater);
    }

    const existingSurgeries = await surgeryRepo.count({ where: { organizationId: orgId } });
    if (existingSurgeries < 6) {
      const surgeryTypes = ['Appendectomy', 'Hernia Repair', 'Knee Replacement', 'Cataract Surgery', 'Gallbladder Removal', 'Bypass Surgery'];
      for (let i = 0; i < 6; i++) {
        await surgeryRepo.save(surgeryRepo.create({
          surgeryId: `DEMO-SURG-${shortId()}`,
          patientId: patients[i % patients.length].id,
          surgeonId: doctors[i % doctors.length].id,
          theatreId: theaters[i % 3].id,
          surgeryType: surgeryTypes[i],
          scheduledDate: daysOffset(i * 5 - 15),
          status: rand([SurgeryStatus.SCHEDULED, SurgeryStatus.COMPLETED, SurgeryStatus.IN_PROGRESS]),
          preOpNotes: 'Pre-operative assessment completed. Patient fasted for 8 hours.',
          postOpNotes: i % 2 === 0 ? 'Surgery completed successfully. Patient moved to recovery.' : null,
          anesthetist: 'Dr. Anand Verma',
          diagnosis: rand(['Appendicitis', 'Inguinal hernia', 'Osteoarthritis', 'Cataract', 'Cholelithiasis', 'Coronary artery disease']),
          procedure: surgeryTypes[i],
          estimatedCost: Math.floor(Math.random() * 100000) + 25000,
          startTime: '09:00',
          endTime: i % 2 === 0 ? '11:30' : null,
          organizationId: orgId,
        } as any));
      }
    }
    console.log(`  -> ${theaters.length} theaters, 6 surgeries ready\n`);

    // =========================================================================
    // 14. EXPENSES (10) + REVENUE (10)
    // =========================================================================
    console.log('[14/22] Seeding expenses and revenue...');
    const existingExpenses = await expenseRepo.count({ where: { organizationId: orgId } });
    if (existingExpenses < 10) {
      const expenseTypes = Object.values(ExpenseType);
      const expDescs = ['Staff salaries', 'Medical supplies procurement', 'Electricity bills', 'Equipment maintenance', 'New ECG machine', 'Building rent', 'Office supplies', 'IT infrastructure', 'Laundry services', 'Security services'];
      for (let i = 0; i < 10; i++) {
        await expenseRepo.save(expenseRepo.create({
          expenseId: `DEMO-EXP-${Date.now()}-${i}`,
          expenseType: expenseTypes[i % expenseTypes.length] as ExpenseType,
          description: expDescs[i],
          amount: Math.floor(Math.random() * 50000) + 5000,
          vendorName: rand(['MedSupply Corp', 'Pharma Distribution', 'Global Equipment Ltd', 'TechCare Solutions']),
          invoiceNumber: `DEMO-VINV-${shortId()}`,
          expenseDate: daysOffset(-i * 3),
          status: rand([PaymentStatus.PAID, PaymentStatus.PENDING, PaymentStatus.APPROVED]),
          paidDate: i % 2 === 0 ? daysOffset(-i * 3 + 2) : null,
          remarks: 'Demo expense record.',
          organizationId: orgId,
        }));
      }
    }

    const existingRevenue = await revenueRepo.count({ where: { organizationId: orgId } });
    if (existingRevenue < 10) {
      const revSources = ['Patient Consultation Fees', 'Lab Test Charges', 'Surgical Procedure Fees', 'Pharmacy Sales', 'Insurance Claims', 'Radiology Services', 'ICU Charges', 'Ward Rent', 'Ambulance Services', 'Pharmacy Wholesale'];
      for (let i = 0; i < 10; i++) {
        await revenueRepo.save(revenueRepo.create({
          revenueId: `DEMO-REV-${Date.now()}-${i}`,
          source: revSources[i],
          amount: Math.floor(Math.random() * 80000) + 10000,
          date: daysOffset(-i * 2),
          patientId: patients[i % patients.length].id,
          remarks: 'Demo revenue entry.',
          organizationId: orgId,
        }));
      }
    }
    console.log('  -> 10 expenses, 10 revenue entries ready\n');

    // =========================================================================
    // 15. COMPLIANCE RECORDS (5)
    // =========================================================================
    console.log('[15/22] Seeding compliance records...');
    const existingCompliance = await complianceRepo.count({ where: { organizationId: orgId } });
    if (existingCompliance < 5) {
      const compTypes = [ComplianceType.HIPAA, ComplianceType.GDPR, ComplianceType.DATA_SECURITY, ComplianceType.INFECTION_CONTROL, ComplianceType.PATIENT_RIGHTS];
      const compDescs = [
        'HIPAA privacy rule compliance audit',
        'GDPR data handling review',
        'Data security penetration testing',
        'Infection control quarterly check',
        'Patient rights awareness review',
      ];
      for (let i = 0; i < 5; i++) {
        await complianceRepo.save(complianceRepo.create({
          recordId: `DEMO-COMP-${shortId()}`,
          complianceType: compTypes[i],
          description: compDescs[i],
          regulatoryBody: rand(['Ministry of Health', 'NABH', 'ISO 27001', 'WHO', 'CDSCO']),
          status: rand([ComplianceStatus.COMPLIANT, ComplianceStatus.PENDING_REVIEW, ComplianceStatus.NON_COMPLIANT]),
          lastAuditDate: daysOffset(-i * 10),
          nextAuditDate: daysOffset(90 - i * 5),
          findings: i % 2 === 0 ? 'No critical findings. Minor recommendations noted.' : null,
          actionItems: i % 2 !== 0 ? 'Update privacy policy. Conduct staff training.' : null,
          remarks: 'Compliance review completed as scheduled.',
          organizationId: orgId,
        }));
      }
    }
    console.log('  -> 5 compliance records ready\n');

    // =========================================================================
    // 16. ADMISSIONS (5)
    // =========================================================================
    console.log('[16/22] Seeding admissions...');
    const existingAdmissions = await admissionRepo.count({ where: { organizationId: orgId } });
    const admissions: Admission[] = [];
    if (existingAdmissions < 5) {
      for (let i = 0; i < 5; i++) {
        const admStatus = i < 3 ? AdmissionStatus.ADMITTED : AdmissionStatus.DISCHARGED;
        const bed = allBeds[i % allBeds.length];
        const ward = wards.find(w => w.id === bed.wardId) || wards[0];
        const admission = await admissionRepo.save(admissionRepo.create({
          admissionId: `DEMO-ADM-${String(i + 1).padStart(3, '0')}`,
          patientId: patients[i].id,
          doctorId: doctors[i % doctors.length].id,
          wardId: ward.id,
          bedId: bed.id,
          admissionDate: daysOffset(-i - 5),
          dischargeDate: admStatus === AdmissionStatus.DISCHARGED ? daysOffset(-i) : null,
          status: admStatus,
          reason: rand(['Fever and weakness', 'Post-surgery recovery', 'Chest pain observation', 'Routine procedure recovery', 'Severe dehydration']),
          diagnosis: rand(['Hypertension', 'Type 2 Diabetes', 'Pneumonia', 'Appendicitis', 'Fracture']),
          vitalsHistory: admStatus === AdmissionStatus.ADMITTED ? [{
            timestamp: new Date(),
            bp: '120/80',
            pulse: 75,
            temp: 98.6,
            spO2: 98,
            recordedBy: 'Nurse Rekha',
          }] : [],
          organizationId: orgId,
        }));
        admissions.push(admission);

        // Update bed status
        if (admStatus === AdmissionStatus.ADMITTED) {
          await bedRepo.update(bed.id, { status: BedStatus.OCCUPIED, assignedPatientId: patients[i].id, assignedDate: daysOffset(-i - 5) });
        }
      }
    } else {
      const existingAdm = await admissionRepo.find({ where: { organizationId: orgId }, take: 5 });
      admissions.push(...existingAdm);
    }
    console.log('  -> 5 admissions ready\n');

    // =========================================================================
    // 17. BLOOD BANK INVENTORY (6) + BLOOD REQUESTS (4)
    // =========================================================================
    console.log('[17/22] Seeding blood bank...');
    const existingBlood = await bloodInventoryRepo.count({ where: { organizationId: orgId } });
    if (existingBlood < 6) {
      const bloodData = [
        { group: BloodGroup.A_POSITIVE, comp: BloodComponent.WHOLE_BLOOD, units: 10, donor: 'Ramesh Kumar', age: 30 },
        { group: BloodGroup.B_POSITIVE, comp: BloodComponent.PACKED_RBC, units: 8, donor: 'Sunil Patel', age: 25 },
        { group: BloodGroup.O_POSITIVE, comp: BloodComponent.PLATELETS, units: 5, donor: 'Priya Sharma', age: 28 },
        { group: BloodGroup.AB_POSITIVE, comp: BloodComponent.PLASMA, units: 6, donor: 'Anil Gupta', age: 35 },
        { group: BloodGroup.O_NEGATIVE, comp: BloodComponent.WHOLE_BLOOD, units: 4, donor: 'Kavita Nair', age: 32 },
        { group: BloodGroup.A_NEGATIVE, comp: BloodComponent.PACKED_RBC, units: 3, donor: 'Rajesh Iyer', age: 40 },
      ];
      for (let i = 0; i < bloodData.length; i++) {
        const b = bloodData[i];
        await bloodInventoryRepo.save(bloodInventoryRepo.create({
          bloodGroup: b.group,
          component: b.comp,
          units: b.units,
          bagNumber: `DEMO-BAG-${shortId()}-${i}`,
          collectedDate: daysOffset(-10 - i),
          expiryDate: daysOffset(25 - i),
          status: BloodInventoryStatus.AVAILABLE,
          donorName: b.donor,
          donorContact: `98765${String(40000 + i)}`,
          donorAge: b.age,
          crossMatchResult: 'Compatible',
          storageLocation: 'Blood Bank Refrigerator A',
          organizationId: orgId,
        }));
      }
    }

    const existingBloodReq = await bloodRequestRepo.count({ where: { organizationId: orgId } });
    if (existingBloodReq < 4) {
      for (let i = 0; i < 4; i++) {
        await bloodRequestRepo.save(bloodRequestRepo.create({
          patientId: patients[i].id,
          doctorId: doctors[i % doctors.length].id,
          bloodGroup: [BloodGroup.A_POSITIVE, BloodGroup.B_POSITIVE, BloodGroup.O_POSITIVE, BloodGroup.AB_POSITIVE][i],
          component: rand([BloodComponent.WHOLE_BLOOD, BloodComponent.PACKED_RBC]),
          unitsRequested: Math.floor(Math.random() * 3) + 1,
          unitsIssued: i < 2 ? Math.floor(Math.random() * 2) + 1 : 0,
          priority: rand([RequestPriority.ROUTINE, RequestPriority.URGENT, RequestPriority.EMERGENCY]),
          status: i < 2 ? RequestStatus.COMPLETED : rand([RequestStatus.PENDING, RequestStatus.APPROVED]),
          requestDate: daysOffset(-i * 3),
          requiredDate: daysOffset(-i * 3 + 1),
          issuedDate: i < 2 ? daysOffset(-i * 3 + 1) : null,
          reason: rand(['Pre-surgery requirement', 'Severe anemia', 'Post-trauma transfusion', 'Platelet transfusion']),
          notes: 'Blood request for patient care.',
          organizationId: orgId,
        }));
      }
    }
    console.log('  -> 6 blood inventory, 4 blood requests ready\n');

    // =========================================================================
    // 18. EMERGENCY CASES (5)
    // =========================================================================
    console.log('[18/22] Seeding emergency cases...');
    const existingEmergency = await emergencyRepo.count({ where: { organizationId: orgId } });
    if (existingEmergency < 5) {
      const emergencyData = [
        { complaint: 'Severe chest pain radiating to left arm', triage: TriageLevel.LEVEL_2_EMERGENCY, arrival: ArrivalMode.AMBULANCE, injury: 'cardiac' },
        { complaint: 'Road traffic accident with head injury', triage: TriageLevel.LEVEL_1_RESUSCITATION, arrival: ArrivalMode.AMBULANCE, injury: 'trauma' },
        { complaint: 'High fever with breathing difficulty', triage: TriageLevel.LEVEL_3_URGENT, arrival: ArrivalMode.WALK_IN, injury: 'respiratory' },
        { complaint: 'Severe abdominal pain and vomiting', triage: TriageLevel.LEVEL_3_URGENT, arrival: ArrivalMode.WALK_IN, injury: 'gastrointestinal' },
        { complaint: 'Fall from height with back pain', triage: TriageLevel.LEVEL_4_SEMI_URGENT, arrival: ArrivalMode.REFERRAL, injury: 'trauma' },
      ];
      for (let i = 0; i < 5; i++) {
        const e = emergencyData[i];
        const emStatus = i < 2 ? EmergencyStatus.ADMITTED : i < 4 ? EmergencyStatus.IN_TREATMENT : EmergencyStatus.DISCHARGED;
        await emergencyRepo.save(emergencyRepo.create({
          caseNumber: `DEMO-EMR-${String(i + 1).padStart(3, '0')}`,
          patientId: patients[i].id,
          doctorId: doctors[i % doctors.length].id,
          triageLevel: e.triage,
          status: emStatus,
          arrivalMode: e.arrival,
          chiefComplaint: e.complaint,
          vitals: {
            bp: rand(['120/80 mmHg', '140/90 mmHg', '100/60 mmHg', '160/100 mmHg']),
            pulse: Math.floor(Math.random() * 40) + 70,
            temperature: parseFloat((36.5 + Math.random() * 2.5).toFixed(1)),
            spO2: Math.floor(Math.random() * 6) + 94,
            respiratoryRate: Math.floor(Math.random() * 10) + 14,
            gcs: Math.floor(Math.random() * 5) + 11,
          },
          injuryType: e.injury,
          treatmentNotes: emStatus !== EmergencyStatus.DISCHARGED ? 'Initial assessment and stabilization done.' : 'Patient treated and discharged with medications.',
          disposition: emStatus === EmergencyStatus.ADMITTED ? 'Admitted to ward for further observation' : emStatus === EmergencyStatus.DISCHARGED ? 'Discharged with prescription' : null,
          arrivalTime: daysOffset(-i),
          triageTime: daysOffset(-i),
          treatmentStartTime: daysOffset(-i),
          dispositionTime: emStatus === EmergencyStatus.DISCHARGED ? daysOffset(-i) : null,
          isActive: emStatus !== EmergencyStatus.DISCHARGED,
          organizationId: orgId,
        }));
      }
    }
    console.log('  -> 5 emergency cases ready\n');

    // =========================================================================
    // 19. INSURANCE PROVIDERS (3) + CLAIMS (5)
    // =========================================================================
    console.log('[19/22] Seeding insurance providers and claims...');
    const insuranceProviders: InsuranceProvider[] = [];
    const providerData = [
      { name: 'Star Health Insurance', code: 'DEMO-STAR', contact: 'Ravi Kumar', email: 'claims@starhealth.in', phone: '1800200001' },
      { name: 'ICICI Lombard', code: 'DEMO-ICICI', contact: 'Priya Menon', email: 'claims@icicilombard.in', phone: '1800200002' },
      { name: 'HDFC Ergo', code: 'DEMO-HDFC', contact: 'Amit Shah', email: 'claims@hdfcergo.in', phone: '1800200003' },
    ];
    for (const p of providerData) {
      let provider = await insuranceProviderRepo.findOne({ where: { providerCode: p.code } });
      if (!provider) {
        provider = await insuranceProviderRepo.save(insuranceProviderRepo.create({
          providerName: p.name,
          providerCode: p.code,
          contactPerson: p.contact,
          contactEmail: p.email,
          contactPhone: p.phone,
          address: 'Mumbai, Maharashtra, India',
          isActive: true,
          organizationId: orgId,
        }));
      }
      insuranceProviders.push(provider);
    }

    const existingClaims = await insuranceClaimRepo.count({ where: { organizationId: orgId } });
    if (existingClaims < 5) {
      const claimStatuses = [ClaimStatus.SUBMITTED, ClaimStatus.APPROVED, ClaimStatus.UNDER_REVIEW, ClaimStatus.SETTLED, ClaimStatus.DRAFT];
      for (let i = 0; i < 5; i++) {
        const claimAmount = Math.floor(Math.random() * 100000) + 20000;
        const status = claimStatuses[i];
        const approvedAmt = (status === ClaimStatus.APPROVED || status === ClaimStatus.SETTLED) ? claimAmount * 0.8 : 0;
        const settledAmt = status === ClaimStatus.SETTLED ? approvedAmt : 0;
        await insuranceClaimRepo.save(insuranceClaimRepo.create({
          claimNumber: `DEMO-CLM-${Date.now()}-${i}`,
          patientId: patients[i].id,
          doctorId: doctors[i % doctors.length].id,
          providerId: insuranceProviders[i % insuranceProviders.length].id,
          policyNumber: `POL-${shortId()}-${i}`,
          policyHolderName: `${patientsData[i].first} ${patientsData[i].last}`,
          relationToPatient: 'self',
          admissionDate: daysOffset(-i * 5 - 3),
          dischargeDate: daysOffset(-i * 5),
          diagnosisCode: rand(['J18.9', 'K35.8', 'I10', 'E11.9', 'M17.1']),
          diagnosisDescription: rand(['Pneumonia, unspecified', 'Acute appendicitis', 'Essential hypertension', 'Type 2 diabetes', 'Osteoarthritis of knee']),
          treatmentType: rand([TreatmentType.CASHLESS, TreatmentType.REIMBURSEMENT]),
          claimAmount,
          approvedAmount: approvedAmt,
          settledAmount: settledAmt,
          status,
          submittedDate: status !== ClaimStatus.DRAFT ? daysOffset(-i * 5 + 1) : null,
          approvedDate: (status === ClaimStatus.APPROVED || status === ClaimStatus.SETTLED) ? daysOffset(-i * 5 + 5) : null,
          settledDate: status === ClaimStatus.SETTLED ? daysOffset(-i * 5 + 10) : null,
          remarks: 'Demo insurance claim.',
          organizationId: orgId,
        }));
      }
    }
    console.log(`  -> ${insuranceProviders.length} providers, 5 claims ready\n`);

    // =========================================================================
    // 20. AMBULANCES (3) + TRIPS (4)
    // =========================================================================
    console.log('[20/22] Seeding ambulances and trips...');
    const ambulances: Ambulance[] = [];
    const ambData = [
      { vehicle: 'DEMO-MH-12-AB-1001', type: VehicleType.ADVANCED_LIFE_SUPPORT, driver: 'Raju Yadav', phone: '9800100001' },
      { vehicle: 'DEMO-MH-12-CD-2002', type: VehicleType.BASIC_LIFE_SUPPORT, driver: 'Suresh Patil', phone: '9800100002' },
      { vehicle: 'DEMO-MH-12-EF-3003', type: VehicleType.PATIENT_TRANSPORT, driver: 'Ganesh Shinde', phone: '9800100003' },
    ];
    for (const a of ambData) {
      let amb = await ambulanceRepo.findOne({ where: { vehicleNumber: a.vehicle } });
      if (!amb) {
        amb = await ambulanceRepo.save(ambulanceRepo.create({
          vehicleNumber: a.vehicle,
          vehicleType: a.type,
          driverName: a.driver,
          driverPhone: a.phone,
          status: AmbulanceStatus.AVAILABLE,
          currentLocation: 'Hospital Parking',
          equipmentList: 'Defibrillator, Oxygen cylinder, ECG monitor, IV stand, Stretcher',
          lastServiceDate: daysOffset(-30),
          insuranceExpiry: daysOffset(180),
          fitnessExpiry: daysOffset(365),
          isActive: true,
          organizationId: orgId,
        }));
      }
      ambulances.push(amb);
    }

    const existingTrips = await ambulanceTripRepo.count({ where: { organizationId: orgId } });
    if (existingTrips < 4) {
      const tripData = [
        { type: TripType.EMERGENCY, priority: TripPriority.CRITICAL, pickup: '23, MG Road, Pune', drop: 'Demo Hospital, Pune', status: TripStatus.COMPLETED },
        { type: TripType.SCHEDULED, priority: TripPriority.NORMAL, pickup: '45, Station Road, Mumbai', drop: 'Demo Hospital, Mumbai', status: TripStatus.COMPLETED },
        { type: TripType.EMERGENCY, priority: TripPriority.URGENT, pickup: 'Sector 15, Navi Mumbai', drop: 'Demo Hospital, Mumbai', status: TripStatus.EN_ROUTE_HOSPITAL },
        { type: TripType.INTER_FACILITY, priority: TripPriority.NORMAL, pickup: 'City Hospital, Thane', drop: 'Demo Hospital, Mumbai', status: TripStatus.DISPATCHED },
      ];
      for (let i = 0; i < 4; i++) {
        const t = tripData[i];
        await ambulanceTripRepo.save(ambulanceTripRepo.create({
          ambulanceId: ambulances[i % ambulances.length].id,
          tripNumber: `DEMO-TRIP-${Date.now()}-${i}`,
          patientId: patients[i].id,
          patientName: `${patientsData[i].first} ${patientsData[i].last}`,
          patientContact: patientsData[i].phone,
          pickupLocation: t.pickup,
          dropLocation: t.drop,
          tripType: t.type,
          status: t.status,
          priority: t.priority,
          dispatchTime: daysOffset(-i),
          pickupTime: t.status !== TripStatus.DISPATCHED ? daysOffset(-i) : null,
          arrivalTime: t.status === TripStatus.COMPLETED ? daysOffset(-i) : null,
          completionTime: t.status === TripStatus.COMPLETED ? daysOffset(-i) : null,
          distance: t.status === TripStatus.COMPLETED ? parseFloat((Math.random() * 20 + 5).toFixed(2)) : null,
          fare: t.status === TripStatus.COMPLETED ? Math.floor(Math.random() * 2000) + 500 : null,
          driverNotes: t.status === TripStatus.COMPLETED ? 'Trip completed successfully.' : null,
          organizationId: orgId,
        }));
      }
    }
    console.log(`  -> ${ambulances.length} ambulances, 4 trips ready\n`);

    // =========================================================================
    // 21. DISCHARGE SUMMARIES (3)
    // =========================================================================
    console.log('[21/22] Seeding discharge summaries...');
    const existingDischarge = await dischargeSummaryRepo.count({ where: { organizationId: orgId } });
    if (existingDischarge < 3) {
      for (let i = 0; i < 3; i++) {
        const admDate = daysOffset(-15 - i * 5);
        const disDate = daysOffset(-10 - i * 5);
        await dischargeSummaryRepo.save(dischargeSummaryRepo.create({
          summaryNumber: `DEMO-DS-${String(i + 1).padStart(3, '0')}`,
          patientId: patients[i].id,
          doctorId: doctors[i % doctors.length].id,
          admissionId: admissions.length > i ? admissions[i].id : null,
          admissionDate: admDate.toISOString().split('T')[0],
          dischargeDate: disDate.toISOString().split('T')[0],
          dischargeType: DischargeType.NORMAL,
          status: i === 0 ? DischargeStatus.COMPLETED : DischargeStatus.APPROVED,
          diagnosisAtAdmission: rand(['Acute appendicitis', 'Pneumonia', 'Myocardial infarction']),
          diagnosisAtDischarge: rand(['Post-appendectomy recovery', 'Resolved pneumonia', 'Stabilized MI']),
          chiefComplaints: rand(['Severe abdominal pain', 'High fever with cough', 'Chest pain and breathlessness']),
          historyOfPresentIllness: 'Patient presented with symptoms for the past 3 days.',
          examinationFindings: 'Vitals stable. Examination findings consistent with diagnosis.',
          investigationsPerformed: [
            { name: 'CBC', result: 'Normal', date: admDate.toISOString().split('T')[0] },
            { name: 'X-Ray Chest', result: 'Clear', date: admDate.toISOString().split('T')[0] },
          ],
          treatmentGiven: 'IV antibiotics, analgesics, and supportive care.',
          courseInHospital: 'Patient responded well to treatment. Gradual improvement noted.',
          conditionAtDischarge: 'Stable, afebrile, tolerating oral diet.',
          dischargeMedications: [
            { medicine: 'Amoxicillin', dosage: '500mg', frequency: 'Three times daily', duration: '5 days', instructions: 'Take after meals' },
            { medicine: 'Paracetamol', dosage: '500mg', frequency: 'As needed', duration: '3 days', instructions: 'For fever/pain' },
          ],
          dietaryAdvice: 'Light diet for 1 week. Avoid spicy food.',
          activityRestrictions: 'Avoid heavy lifting for 2 weeks.',
          followUpDate: daysOffset(14 - i * 5).toISOString().split('T')[0],
          followUpInstructions: 'Visit OPD for follow-up. Bring all reports.',
          organizationId: orgId,
        } as any));
      }
    }
    console.log('  -> 3 discharge summaries ready\n');

    // =========================================================================
    // 22. OPD QUEUE (5)
    // =========================================================================
    console.log('[22/22] Seeding OPD queue...');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const existingQueue = await opdQueueRepo.count({ where: { organizationId: orgId } });
    if (existingQueue < 5) {
      const queueStatuses = [QueueStatus.WAITING, QueueStatus.IN_CONSULTATION, QueueStatus.COMPLETED, QueueStatus.WAITING, QueueStatus.WAITING];
      for (let i = 0; i < 5; i++) {
        await opdQueueRepo.save(opdQueueRepo.create({
          patientId: patients[i].id,
          doctorId: doctors[i % doctors.length].id,
          tokenNumber: i + 1,
          queueDate: today,
          status: queueStatuses[i],
          priority: i === 1 ? QueuePriority.URGENT : QueuePriority.NORMAL,
          checkinTime: new Date(today.getTime() + (8 + i) * 3600000),
          consultationStartTime: queueStatuses[i] !== QueueStatus.WAITING ? new Date(today.getTime() + (9 + i) * 3600000) : null,
          consultationEndTime: queueStatuses[i] === QueueStatus.COMPLETED ? new Date(today.getTime() + (9.5 + i) * 3600000) : null,
          chiefComplaint: rand(['Headache', 'Fever', 'Body pain', 'Cough', 'Skin rash']),
          notes: i === 2 ? 'Patient seen. Prescription issued.' : null,
          organizationId: orgId,
        }));
      }
    }
    console.log('  -> 5 OPD queue entries ready\n');

    // =========================================================================
    // SUMMARY
    // =========================================================================
    console.log('===============================================================');
    console.log('  DEMO DATA SEED COMPLETED SUCCESSFULLY');
    console.log('===============================================================\n');
    console.log('Summary:');
    const summary = [
      ['Departments', 10], ['Doctors', 5], ['Patients', 8], ['Staff', 5],
      ['Wards + Beds', `${wards.length} + ${allBeds.length}`], ['Appointments', 15],
      ['Prescriptions', 10], ['Medicines', 10], ['Lab Tests', 8],
      ['Invoices', 10], ['Inventory', 8], ['Radiology Requests', 6],
      ['Operation Theaters + Surgeries', '3 + 6'], ['Expenses + Revenue', '10 + 10'],
      ['Compliance Records', 5], ['Admissions', 5],
      ['Blood Inventory + Requests', '6 + 4'], ['Emergency Cases', 5],
      ['Insurance Providers + Claims', '3 + 5'], ['Ambulances + Trips', '3 + 4'],
      ['Discharge Summaries', 3], ['OPD Queue', 5],
    ];
    for (const [name, count] of summary) {
      console.log(`   ${String(name).padEnd(35)} -> ${count}`);
    }
    console.log(`\nOrganization: ${orgId}`);
    console.log('All data interconnected and ready for demo!\n');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding demo data:', error);
    process.exit(1);
  }
}

seedDemoData();
