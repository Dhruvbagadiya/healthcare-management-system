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

// Load environment variables FIRST
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const rand = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];
const daysOffset = (days: number) => new Date(Date.now() + days * 86400000);
const diagnosisList = ['Hypertension', 'Type 2 Diabetes', 'Osteoarthritis', 'Migraine', 'GERD', 'Asthma', 'Anemia', 'Hypothyroidism', 'UTI', 'Sinusitis'];

async function seedData() {
  const { AppDataSource } = await import('../typeorm.config');

  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    console.log('\n🌱 Starting Aarogentix full database seeding (10 records per table)...\n');

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

    // ─────────────────────────────────────────────────────────────────────────
    // 0. Admin User — dhruvbagadiya@gmail.com
    // ─────────────────────────────────────────────────────────────────────────
    console.log('👤 Creating admin user...');
    const adminEmail = 'dhruvbagadiya@gmail.com';
    let adminUser = await userRepo.findOne({ where: { email: adminEmail } });
    if (!adminUser) {
      adminUser = await userRepo.save(userRepo.create({
        id: '00000000-0000-4000-a000-000000000001',
        userId: 'ADM-888888',
        email: adminEmail,
        password: await bcrypt.hash('Admin@123', 10),
        roles: [UserRole.ADMIN],
        status: UserStatus.ACTIVE,
        emailVerified: true,
        firstName: 'Dhruv',
        lastName: 'Bagdiya',
      }));
    } else {
      // Always ensure admin role is set
      await userRepo.update(adminUser.id, { roles: [UserRole.ADMIN], status: UserStatus.ACTIVE });
    }
    console.log('✅ Admin user ready (dhruvbagadiya@gmail.com / Admin@123)\n');

    // ─────────────────────────────────────────────────────────────────────────
    // 0b. Special Account — Shruti Gadhiya (Physiotherapist)
    // ─────────────────────────────────────────────────────────────────────────
    console.log('👤 Creating Shruti Gadhiya account...');
    const shrutiEmail = 'sgadhiya03@gmail.com';
    let shrutiUser = await userRepo.findOne({ where: { email: shrutiEmail } });
    if (!shrutiUser) {
      shrutiUser = await userRepo.save(userRepo.create({
        userId: 'PHY-000001',
        email: shrutiEmail,
        password: await bcrypt.hash('Shruti@1530', 10),
        roles: [UserRole.DOCTOR],
        status: UserStatus.ACTIVE,
        emailVerified: true,
        firstName: 'Shruti',
        lastName: 'Gadhiya',
      }));
    } else {
      // Update password in case it changed
      await userRepo.update(shrutiUser.id, {
        password: await bcrypt.hash('Shruti@1530', 10),
        status: UserStatus.ACTIVE,
        roles: [UserRole.DOCTOR],
      });
      shrutiUser = await userRepo.findOne({ where: { email: shrutiEmail } });
    }

    // Create doctor record for Shruti if not already there
    const shrutiDoc = await doctorRepo.findOne({ where: { customUserId: shrutiUser!.userId } });
    if (!shrutiDoc) {
      await doctorRepo.save(doctorRepo.create({
        user: shrutiUser,
        customUserId: shrutiUser!.userId,
        firstName: 'Shruti',
        lastName: 'Gadhiya',
        doctorId: 'DOC-SHR-001',
        specialization: 'Physiotherapist',
        licenseNumber: 'PHY123456',
        yearsOfExperience: 5,
        consultationFee: 1500,
        isActive: true,
      } as any));
    }
    console.log('✅ Shruti Gadhiya account ready (sgadhiya03@gmail.com / Shruti@1530)\n');

    // ─────────────────────────────────────────────────────────────────────────
    // CLEANUP — Remove records with null names or null required foreign IDs
    // ─────────────────────────────────────────────────────────────────────────
    console.log('🧹 Cleaning up invalid/incomplete records...');
    const q = AppDataSource.query.bind(AppDataSource);

    // Users without a firstName or lastName
    await q(`DELETE FROM users WHERE ("firstName" IS NULL OR "firstName" = '' OR "lastName" IS NULL OR "lastName" = '') AND email != $1`, [adminEmail]);

    // Doctors: null customUserId OR null doctorId OR orphaned (user deleted)
    await q(`DELETE FROM doctors WHERE "custom_user_id" IS NULL OR "custom_user_id" = '' OR "doctorId" IS NULL OR "doctorId" = ''`);
    await q(`DELETE FROM doctors WHERE "custom_user_id" NOT IN (SELECT "userId" FROM users WHERE "userId" IS NOT NULL)`);

    // Patients: null customUserId OR null patientId OR orphaned (user deleted)
    await q(`DELETE FROM patients WHERE "custom_user_id" IS NULL OR "custom_user_id" = '' OR "patientId" IS NULL OR "patientId" = ''`);
    await q(`DELETE FROM patients WHERE "custom_user_id" NOT IN (SELECT "userId" FROM users WHERE "userId" IS NOT NULL)`);

    // Medical records with null patientId (UUID — no empty string check)
    await q(`DELETE FROM medical_records WHERE "patientId" IS NULL`);

    // Appointments with null patientId
    await q(`DELETE FROM appointments WHERE "patientId" IS NULL`);

    // Prescriptions with null patientId
    await q(`DELETE FROM prescriptions WHERE "patientId" IS NULL`);

    // Lab tests with null patientId
    await q(`DELETE FROM lab_tests WHERE "patientId" IS NULL`);

    // Invoices with null patientId
    await q(`DELETE FROM invoices WHERE "patientId" IS NULL`);

    // Surgeries with null patientId or surgeonId
    await q(`DELETE FROM surgeries WHERE "patientId" IS NULL OR "surgeonId" IS NULL`);

    // Radiology requests with null patientId or doctorId
    await q(`DELETE FROM radiology_requests WHERE "patientId" IS NULL OR "doctorId" IS NULL`);

    // Staff with null userId
    await q(`DELETE FROM staff WHERE "userId" IS NULL`);
    // Special: Delete Shruti's old staff record if it exists (since she is now a doctor)
    await q(`DELETE FROM staff WHERE "userId" IN (SELECT id FROM users WHERE email = 'sgadhiya03@gmail.com')`);

    // Beds with null wardId
    await q(`DELETE FROM beds WHERE "wardId" IS NULL`);

    // Data access logs with null userId or entityId
    await q(`DELETE FROM data_access_logs WHERE "userId" IS NULL OR "entityId" IS NULL`);

    console.log('✅ Cleanup complete\n');

    // ─────────────────────────────────────────────────────────────────────────
    // 1. Doctors (10)
    // ─────────────────────────────────────────────────────────────────────────
    console.log('👨‍⚕️ Seeding 10 doctors...');
    const doctorsData = [
      { first: 'Rajesh', last: 'Kumar', spec: 'Cardiology', phone: '9876540001', fee: 1200 },
      { first: 'Priya', last: 'Singh', spec: 'Orthopedics', phone: '9876540002', fee: 1000 },
      { first: 'Amit', last: 'Patel', spec: 'Neurology', phone: '9876540003', fee: 1500 },
      { first: 'Neha', last: 'Sharma', spec: 'Pediatrics', phone: '9876540004', fee: 800 },
      { first: 'Vikram', last: 'Desai', spec: 'General Surgery', phone: '9876540005', fee: 2000 },
      { first: 'Ananya', last: 'Mehta', spec: 'Dermatology', phone: '9876540006', fee: 900 },
      { first: 'Suresh', last: 'Rao', spec: 'Ophthalmology', phone: '9876540007', fee: 700 },
      { first: 'Kavitha', last: 'Nair', spec: 'Gynecology', phone: '9876540008', fee: 1100 },
      { first: 'Rahul', last: 'Verma', spec: 'Psychiatry', phone: '9876540009', fee: 1300 },
      { first: 'Sanjay', last: 'Iyer', spec: 'Endocrinology', phone: '9876540010', fee: 950 },
    ];

    const doctors: any[] = [];
    for (const d of doctorsData) {
      const email = `dr.${d.first.toLowerCase()}.${d.last.toLowerCase()}@hospital.com`;
      let user = await userRepo.findOne({ where: { email } });
      if (!user) {
        user = await userRepo.save(userRepo.create({
          userId: `DOC-${Math.floor(1000 + Math.random() * 9000)}`,
          email,
          password: await bcrypt.hash('Doctor@123', 10),
          roles: [UserRole.DOCTOR],
          status: UserStatus.ACTIVE,
          emailVerified: true,
          firstName: d.first,
          lastName: d.last,
          phoneNumber: d.phone,
        }));
      }
      let doctor: any = await doctorRepo.findOne({ where: { customUserId: user.userId } });
      if (!doctor) {
        doctor = await doctorRepo.save(doctorRepo.create({
          user,
          customUserId: user.userId,
          firstName: d.first,
          lastName: d.last,
          doctorId: `DOC-${Math.floor(1000 + Math.random() * 9000)}`,
          specialization: d.spec,
          licenseNumber: `LIC${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
          yearsOfExperience: Math.floor(Math.random() * 20) + 3,
          consultationFee: d.fee,
          isActive: true,
        } as any));
      }
      doctors.push(doctor);
    }
    console.log('✅ 10 Doctors created\n');

    // ─────────────────────────────────────────────────────────────────────────
    // 2. Patients (10)
    // ─────────────────────────────────────────────────────────────────────────
    console.log('👥 Seeding 10 patients...');
    const patientsData = [
      { first: 'Arjun', last: 'Mehta', email: 'arjun.mehta@example.com', phone: '9111110001', age: 45, blood: BloodType.B_POSITIVE },
      { first: 'Deepak', last: 'Gupta', email: 'deepak.gupta@example.com', phone: '9111110002', age: 38, blood: BloodType.O_POSITIVE },
      { first: 'Sneha', last: 'Kapoor', email: 'sneha.kapoor@example.com', phone: '9111110003', age: 32, blood: BloodType.A_POSITIVE },
      { first: 'Rahul', last: 'Verma', email: 'rahul.verma@example.com', phone: '9111110004', age: 55, blood: BloodType.AB_POSITIVE },
      { first: 'Pooja', last: 'Nair', email: 'pooja.nair@example.com', phone: '9111110005', age: 28, blood: BloodType.O_NEGATIVE },
      { first: 'Sanjay', last: 'Rao', email: 'sanjay.rao@example.com', phone: '9111110006', age: 62, blood: BloodType.A_NEGATIVE },
      { first: 'Anjali', last: 'Reddy', email: 'anjali.reddy@example.com', phone: '9111110007', age: 35, blood: BloodType.B_NEGATIVE },
      { first: 'Rohan', last: 'Iyer', email: 'rohan.iyer@example.com', phone: '9111110008', age: 41, blood: BloodType.AB_NEGATIVE },
      { first: 'Kavita', last: 'Sharma', email: 'kavita.sharma@example.com', phone: '9111110009', age: 29, blood: BloodType.O_POSITIVE },
      { first: 'Manoj', last: 'Singh', email: 'manoj.singh@example.com', phone: '9111110010', age: 48, blood: BloodType.A_POSITIVE },
    ];

    const patients: any[] = [];
    for (const p of patientsData) {
      let user = await userRepo.findOne({ where: { email: p.email } });
      if (!user) {
        user = await userRepo.save(userRepo.create({
          userId: `PAT-${Math.floor(1000 + Math.random() * 9000)}`,
          email: p.email,
          password: await bcrypt.hash('Patient@123', 10),
          roles: [UserRole.PATIENT],
          status: UserStatus.ACTIVE,
          emailVerified: true,
          firstName: p.first,
          lastName: p.last,
          phoneNumber: p.phone,
        }));
      }
      let patient: any = await patientRepo.findOne({ where: { customUserId: user.userId } });
      if (!patient) {
        patient = await patientRepo.save(patientRepo.create({
          user,
          customUserId: user.userId,
          firstName: p.first,
          lastName: p.last,
          patientId: `PAT-${Math.floor(1000 + Math.random() * 9000)}`,
          bloodType: p.blood,
          insuranceProvider: 'Star Health Insurance',
          insurancePolicyNumber: `POL${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
          emergencyContactName: 'Emergency Contact',
          emergencyContactPhone: '9000000001',
          emergencyContactRelation: 'Spouse',
          height: Math.floor(Math.random() * 40) + 155,
          weight: Math.floor(Math.random() * 50) + 50,
          maritalStatus: rand(['Married', 'Single', 'Divorced']),
          occupation: rand(['Engineer', 'Teacher', 'Doctor', 'Businessman', 'Homemaker']),
          allergies: rand([['Penicillin'], ['Dust'], ['Pollen'], []]),
          chronicDiseases: rand([['Diabetes'], ['Hypertension'], ['Asthma'], []]),
        } as any));
      }
      patients.push(patient);
    }
    console.log('✅ 10 Patients created\n');

    // ─────────────────────────────────────────────────────────────────────────
    // 3. Medical Records (10)
    // ─────────────────────────────────────────────────────────────────────────
    console.log('📋 Seeding 10 medical records...');
    const recordTypes = ['consultation', 'diagnosis', 'test', 'surgery', 'follow-up'];
    const medRecordTitles = [
      'Annual Health Check', 'Cardiac Evaluation', 'Diabetes Management',
      'Post-Op Follow-up', 'Blood Pressure Review', 'Orthopedic Assessment',
      'Neurological Examination', 'Pediatric Wellness Visit', 'Dermatology Consultation',
      'Gynecology Review',
    ];
    for (let i = 0; i < 10; i++) {
      await medRecordRepo.save(medRecordRepo.create({
        patient: patients[i],
        patientId: patients[i].id,
        recordType: rand(recordTypes),
        title: medRecordTitles[i],
        description: `Detailed medical record for ${medRecordTitles[i]}. Patient examined and findings documented.`,
        findings: `Patient presented with ${rand(['mild fever', 'fatigue', 'chest pain', 'joint pain', 'headache'])}. Examination revealed normal vitals.`,
        diagnosis: rand(['Hypertension Stage 1', 'Type 2 Diabetes', 'Osteoarthritis', 'Migraine', 'Healthy']),
        treatment: rand(['Medication prescribed', 'Physiotherapy recommended', 'Lifestyle changes advised', 'Surgery scheduled']),
        doctorName: `Dr. ${doctorsData[i % 10].first} ${doctorsData[i % 10].last}`,
        doctorId: doctors[i % 10].id,
        attachmentUrls: [],
        visitDate: daysOffset(-(i * 7)),
        isConfidential: i % 3 === 0,
      }));
    }
    console.log('✅ 10 Medical records created\n');

    // ─────────────────────────────────────────────────────────────────────────
    // 4. Appointments (10)
    // ─────────────────────────────────────────────────────────────────────────
    console.log('📅 Seeding 10 appointments...');
    const apptStatuses = [AppointmentStatus.SCHEDULED, AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED, AppointmentStatus.CONFIRMED];
    const reasons = ['Routine Checkup', 'Follow-up Consultation', 'Emergency Visit', 'Specialist Referral', 'Lab Result Review', 'Prescription Renewal', 'Post-Op Review', 'Second Opinion', 'Vaccination', 'Health Screening'];
    for (let i = 0; i < 10; i++) {
      const hour = Math.floor(Math.random() * 8) + 9;
      await appointmentRepo.save(appointmentRepo.create({
        patientId: patients[i].id,
        doctorId: doctors[i % 10].id,
        patient: patients[i],
        doctor: doctors[i % 10],
        appointmentDate: daysOffset(i * 3 - 15),
        appointmentTime: `${String(hour).padStart(2, '0')}:00`,
        duration: rand([15, 30, 45, 60]),
        reason: reasons[i],
        status: rand(apptStatuses),
        notes: 'Patient arrived on time. Consultation completed satisfactorily.',
        isVirtual: i % 4 === 0,
        meetingLink: i % 4 === 0 ? 'https://meet.Aarogentix.in/room-' + i : null,
      }));
    }
    console.log('✅ 10 Appointments created\n');

    // ─────────────────────────────────────────────────────────────────────────
    // 5. Prescriptions (10)
    // ─────────────────────────────────────────────────────────────────────────
    console.log('📝 Seeding 10 prescriptions...');
    const prescStatuses = [PrescriptionStatus.ISSUED, PrescriptionStatus.ACTIVE, PrescriptionStatus.FULFILLED, PrescriptionStatus.EXPIRED];
    const diagnosisList = ['Hypertension', 'Type 2 Diabetes', 'Osteoarthritis', 'Migraine', 'GERD', 'Asthma', 'Anemia', 'Hypothyroidism', 'UTI', 'Sinusitis'];
    const medNames = ['Metformin', 'Amlodipine', 'Omeprazole', 'Atorvastatin', 'Paracetamol', 'Ibuprofen', 'Amoxicillin', 'Cetirizine', 'Levothyroxine', 'Pantoprazole'];
    for (let i = 0; i < 10; i++) {
      await prescriptionRepo.save(prescriptionRepo.create({
        patient: patients[i],
        patientId: patients[i].id,
        doctor: doctors[i % 10],
        doctorId: doctors[i % 10].id,
        prescriptionNumber: `RX-${Date.now()}-${i}`,
        status: rand(prescStatuses),
        diagnosis: diagnosisList[i],
        issuedDate: daysOffset(-i * 5),
        expiryDate: daysOffset(30 - i * 3),
        isRecurring: i % 3 === 0,
        isDigitallySigned: i % 2 === 0,
        medicines: [
          {
            medicineId: crypto.randomUUID(),
            medicineName: medNames[i],
            dosage: rand(['500mg', '250mg', '10mg', '5mg', '1g']),
            frequency: rand(['Once daily', 'Twice daily', 'Three times a day', 'As needed']),
            duration: rand(['7 days', '14 days', '30 days', '3 months']),
            instructions: rand(['Take after meals', 'Take before meals', 'Take with water', 'Avoid alcohol']),
            quantity: Math.floor(Math.random() * 30) + 10,
          },
          {
            medicineId: crypto.randomUUID(),
            medicineName: medNames[(i + 1) % 10],
            dosage: rand(['500mg', '100mg', '20mg', '10mg']),
            frequency: rand(['Once daily', 'Twice daily']),
            duration: rand(['5 days', '10 days', '1 month']),
            instructions: 'As directed by physician',
            quantity: Math.floor(Math.random() * 20) + 5,
          },
        ],
        notes: `Prescription for ${diagnosisList[i]}. Patient advised to follow up in 2 weeks.`,
        pharmacyNotified: [],
      }));
    }
    console.log('✅ 10 Prescriptions created\n');

    // ─────────────────────────────────────────────────────────────────────────
    // 6. Medicines (10)
    // ─────────────────────────────────────────────────────────────────────────
    console.log('💊 Seeding 10 medicines...');
    const medicinesData = [
      { name: 'Aspirin', generic: 'Acetylsalicylic Acid', strength: '500mg', price: 150, stock: 500 },
      { name: 'Amoxicillin', generic: 'Amoxicillin', strength: '250mg', price: 200, stock: 300 },
      { name: 'Metformin', generic: 'Metformin HCl', strength: '500mg', price: 180, stock: 400 },
      { name: 'Atorvastatin', generic: 'Atorvastatin Calcium', strength: '10mg', price: 250, stock: 250 },
      { name: 'Lisinopril', generic: 'Lisinopril', strength: '5mg', price: 220, stock: 280 },
      { name: 'Omeprazole', generic: 'Omeprazole', strength: '20mg', price: 190, stock: 320 },
      { name: 'Ibuprofen', generic: 'Ibuprofen', strength: '400mg', price: 100, stock: 600 },
      { name: 'Paracetamol', generic: 'Acetaminophen', strength: '500mg', price: 80, stock: 800 },
      { name: 'Cetirizine', generic: 'Cetirizine HCl', strength: '10mg', price: 120, stock: 350 },
      { name: 'Pantoprazole', generic: 'Pantoprazole Sodium', strength: '40mg', price: 210, stock: 270 },
    ];
    for (const m of medicinesData) {
      if (!(await medicineRepo.findOne({ where: { name: m.name } }))) {
        await medicineRepo.save(medicineRepo.create({
          medicineCode: `MED-${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
          name: m.name,
          genericName: m.generic,
          strength: m.strength,
          formulation: rand(['Tablet', 'Capsule', 'Syrup', 'Injection']),
          purchasePrice: m.price * 0.6,
          sellingPrice: m.price,
          stock: m.stock,
          reorderLevel: 100,
          expiryDate: daysOffset(365),
          manufacturer: rand(['Sun Pharma', 'Cipla', 'Dr Reddys', 'Lupin', 'Zydus']),
          isActive: true,
          sideEffects: rand([['Nausea', 'Headache'], ['Dizziness'], ['Rash'], []]),
          contraindications: rand([['Pregnancy'], ['Renal failure'], []]),
        }));
      }
    }
    console.log('✅ 10 Medicines created\n');

    // ─────────────────────────────────────────────────────────────────────────
    // 7. Lab Tests (10)
    // ─────────────────────────────────────────────────────────────────────────
    console.log('🔬 Seeding 10 lab tests...');
    const labTestNames = [
      { name: 'Complete Blood Count (CBC)', code: 'LT-CBC', desc: 'Full blood panel including RBC, WBC, platelets' },
      { name: 'Lipid Profile', code: 'LT-LPD', desc: 'Cholesterol, triglycerides and HDL/LDL levels' },
      { name: 'Blood Glucose Fasting', code: 'LT-BGL', desc: 'Fasting blood sugar level measurement' },
      { name: 'Thyroid Function Test', code: 'LT-TFT', desc: 'TSH, T3, T4 levels' },
      { name: 'Liver Function Test', code: 'LT-LFT', desc: 'ALT, AST, bilirubin and albumin levels' },
      { name: 'Kidney Function Test', code: 'LT-KFT', desc: 'Creatinine, urea and electrolyte levels' },
      { name: 'Urine Routine', code: 'LT-UR', desc: 'Urinalysis including pH, protein, glucose' },
      { name: 'HbA1c', code: 'LT-HBA', desc: 'Glycated haemoglobin for diabetes monitoring' },
      { name: 'ECG', code: 'LT-ECG', desc: 'Electrocardiogram for cardiac assessment' },
      { name: 'Chest X-Ray', code: 'LT-CXR', desc: 'Chest radiograph for pulmonary evaluation' },
    ];
    const labStatuses = [LabTestStatus.ORDERED, LabTestStatus.IN_PROGRESS, LabTestStatus.COMPLETED, LabTestStatus.REPORTED];
    for (let i = 0; i < 10; i++) {
      const t = labTestNames[i];
      const isCompleted = i < 5;
      await labTestRepo.save(labTestRepo.create({
        patient: patients[i],
        patientId: patients[i].id,
        testName: t.name,
        testCode: t.code,
        description: t.desc,
        status: isCompleted ? LabTestStatus.REPORTED : rand(labStatuses),
        orderedBy: `Dr. ${doctorsData[i % 10].first} ${doctorsData[i % 10].last}`,
        orderedDate: daysOffset(-i * 3),
        sampleCollectionDate: isCompleted ? daysOffset(-i * 3 + 1) : null,
        completionDate: isCompleted ? daysOffset(-i * 3 + 2) : null,
        testResults: isCompleted ? [
          { parameter: 'Result 1', value: String(Math.floor(Math.random() * 100)), unit: 'mg/dL', normalRange: '70-110', status: 'normal' },
          { parameter: 'Result 2', value: String(Math.floor(Math.random() * 50)), unit: 'U/L', normalRange: '10-40', status: rand(['normal', 'abnormal']) },
        ] : null,
        interpretation: isCompleted ? 'Results within acceptable limits. Follow up recommended.' : null,
        reportedBy: isCompleted ? 'Lab Technician Arun Kumar' : null,
        notes: 'Collected at main laboratory.',
      }));
    }
    console.log('✅ 10 Lab tests created\n');

    // ─────────────────────────────────────────────────────────────────────────
    // 8. Invoices (10)
    // ─────────────────────────────────────────────────────────────────────────
    console.log('💰 Seeding 10 invoices...');
    const invoiceStatuses = [InvoiceStatus.PAID, InvoiceStatus.SENT, InvoiceStatus.PENDING, InvoiceStatus.OVERDUE, InvoiceStatus.PARTIALLY_PAID];
    for (let i = 0; i < 10; i++) {
      const subtotal = Math.floor(Math.random() * 15000) + 2000;
      const tax = Math.floor(subtotal * 0.18);
      const total = subtotal + tax;
      await invoiceRepo.save(invoiceRepo.create({
        patient: patients[i],
        patientId: patients[i].id,
        invoiceNumber: `INV-${Date.now()}-${i}`,
        subtotal,
        taxAmount: tax,
        taxPercentage: 18,
        discount: i % 3 === 0 ? subtotal * 0.05 : 0,
        totalAmount: total,
        paidAmount: rand([0, total / 2, total]),
        dueAmount: rand([0, total / 2, total]),
        status: rand(invoiceStatuses),
        issueDate: daysOffset(-i * 4),
        dueDate: daysOffset(30 - i * 4),
        lineItems: [
          { description: 'Consultation Fee', quantity: 1, unitPrice: subtotal * 0.4, totalPrice: subtotal * 0.4, category: 'consultation' },
          { description: 'Medicines', quantity: 1, unitPrice: subtotal * 0.3, totalPrice: subtotal * 0.3, category: 'medicine' },
          { description: 'Laboratory Tests', quantity: 1, unitPrice: subtotal * 0.3, totalPrice: subtotal * 0.3, category: 'test' },
        ],
        payments: [],
        notes: 'Thank you for choosing Aarogentix Hospital.',
      } as any));
    }
    console.log('✅ 10 Invoices created\n');

    // ─────────────────────────────────────────────────────────────────────────
    // 9. Inventory (10)
    // ─────────────────────────────────────────────────────────────────────────
    console.log('📦 Seeding 10 inventory items...');
    const inventoryData = [
      { name: 'Oxygen Cylinders', type: InventoryType.EQUIPMENT, qty: 50, price: 8000, min: 10 },
      { name: 'Syringes 10ml', type: InventoryType.SUPPLIES, qty: 5000, price: 5, min: 500 },
      { name: 'Sterile Gloves (L)', type: InventoryType.SUPPLIES, qty: 10000, price: 2, min: 2000 },
      { name: 'Gauze Pads', type: InventoryType.SUPPLIES, qty: 2000, price: 10, min: 500 },
      { name: 'IV Fluid Bags', type: InventoryType.SUPPLIES, qty: 200, price: 150, min: 50 },
      { name: 'Patient Monitors', type: InventoryType.EQUIPMENT, qty: 15, price: 50000, min: 3 },
      { name: 'Pulse Oximeters', type: InventoryType.EQUIPMENT, qty: 30, price: 2500, min: 5 },
      { name: 'Rapid COVID Test Kit', type: InventoryType.DIAGNOSTIC_KIT, qty: 500, price: 350, min: 100 },
      { name: 'Surgical Masks (box)', type: InventoryType.SUPPLIES, qty: 300, price: 200, min: 50 },
      { name: 'Blood Glucose Strips', type: InventoryType.DIAGNOSTIC_KIT, qty: 1000, price: 15, min: 200 },
    ];
    for (const inv of inventoryData) {
      if (!(await inventoryRepo.findOne({ where: { itemName: inv.name } }))) {
        await inventoryRepo.save(inventoryRepo.create({
          itemCode: `INV-${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
          itemName: inv.name,
          type: inv.type,
          category: inv.type === InventoryType.EQUIPMENT ? 'Medical Equipment' : inv.type === InventoryType.DIAGNOSTIC_KIT ? 'Diagnostics' : 'Medical Supplies',
          quantity: inv.qty,
          unit: 'units',
          unitCost: inv.price * 0.7,
          sellingPrice: inv.price,
          minimumLevel: inv.min,
          location: rand(['Main Warehouse', 'ICU Store', 'OT Store', 'Pharmacy Store']),
          status: inv.qty > inv.min ? InventoryStatus.IN_STOCK : InventoryStatus.LOW_STOCK,
          supplier: rand(['MedSupply Corp', 'Global Medical', 'HealthTech India', 'PharmaDistrib']),
          expiryDate: daysOffset(Math.floor(Math.random() * 500) + 180),
        }));
      }
    }
    console.log('✅ 10 Inventory items created\n');

    // ─────────────────────────────────────────────────────────────────────────
    // 10. Staff (10)
    // ─────────────────────────────────────────────────────────────────────────
    console.log('👨‍💼 Seeding 10 staff members...');
    const staffData = [
      { first: 'Maria', last: 'Johnson', role: StaffRole.NURSE, userRole: UserRole.NURSE, exp: 8, phone: '9900000001' },
      { first: 'Arun', last: 'Kumar', role: StaffRole.TECHNICIAN, userRole: UserRole.LAB_TECHNICIAN, exp: 5, phone: '9900000002' },
      { first: 'Priya', last: 'Desai', role: StaffRole.RECEPTIONIST, userRole: UserRole.RECEPTIONIST, exp: 3, phone: '9900000003' },
      { first: 'Vikram', last: 'Bhat', role: StaffRole.LAB_TECHNICIAN, userRole: UserRole.LAB_TECHNICIAN, exp: 6, phone: '9900000004' },
      { first: 'Kavya', last: 'Patel', role: StaffRole.NURSE, userRole: UserRole.NURSE, exp: 10, phone: '9900000005' },
      { first: 'Anjali', last: 'Menon', role: StaffRole.RECEPTIONIST, userRole: UserRole.RECEPTIONIST, exp: 2, phone: '9900000006' },
      { first: 'Sumitra', last: 'Das', role: StaffRole.NURSE, userRole: UserRole.NURSE, exp: 7, phone: '9900000007' },
      { first: 'Suresh', last: 'Pillai', role: StaffRole.TECHNICIAN, userRole: UserRole.LAB_TECHNICIAN, exp: 4, phone: '9900000008' },
      { first: 'Ramesh', last: 'Tiwari', role: StaffRole.PHARMACIST, userRole: UserRole.PHARMACIST, exp: 9, phone: '9900000009' },
      { first: 'Geeta', last: 'Saxena', role: StaffRole.ADMIN, userRole: UserRole.ADMIN, exp: 12, phone: '9900000010' },
    ];
    for (const s of staffData) {
      const email = `${s.first.toLowerCase()}.${s.last.toLowerCase()}@hospital.com`;
      let user = await userRepo.findOne({ where: { email } });
      if (!user) {
        user = await userRepo.save(userRepo.create({
          userId: crypto.randomUUID(),
          email,
          password: await bcrypt.hash('Staff@123', 10),
          roles: [s.userRole],
          status: UserStatus.ACTIVE,
          emailVerified: true,
          firstName: s.first,
          lastName: s.last,
          phoneNumber: s.phone,
        }));
      }
      if (!(await staffRepo.findOne({ where: { userId: user.id } }))) {
        await staffRepo.save(staffRepo.create({
          user,
          staffId: `STF-${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
          userId: user.id,
          firstName: s.first,
          lastName: s.last,
          role: s.role,
          status: StaffStatus.ACTIVE,
          yearsOfExperience: s.exp,
          joiningDate: daysOffset(-(s.exp * 365)),
          isVerified: true,
          availableFrom: '08:00',
          availableTo: '18:00',
        } as any));
      }
    }
    console.log('✅ 10 Staff members created\n');

    // ─────────────────────────────────────────────────────────────────────────
    // 11. Operation Theaters (10) + Surgeries (10)
    // ─────────────────────────────────────────────────────────────────────────
    console.log('🏥 Seeding 10 operation theaters and 10 surgeries...');
    const theaters: OperationTheater[] = [];
    for (let i = 1; i <= 10; i++) {
      const code = `OT-${String(i).padStart(3, '0')}`;
      let theater = await theaterRepo.findOne({ where: { theatreCode: code } });
      if (!theater) {
        theater = await theaterRepo.save(theaterRepo.create({
          theatreCode: code,
          theatreName: `Theater ${String.fromCharCode(64 + i)}`,
          isAvailable: i % 4 !== 0,
          facilities: 'HD monitors, anesthesia machine, surgical lights, sterilisation unit',
        }));
      }
      theaters.push(theater);
    }

    const surgeryTypes = ['Appendectomy', 'Hernia Repair', 'Knee Replacement', 'Cataract Surgery', 'Gallbladder Removal', 'Bypass Surgery', 'Hip Replacement', 'Spinal Fusion', 'Tonsillectomy', 'Cesarean Section'];
    for (let i = 0; i < 10; i++) {
      await surgeryRepo.save(surgeryRepo.create({
        surgeryId: `SURG-${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
        patientId: patients[i].id,
        surgeonId: doctors[i % 10].id,
        theatreId: theaters[i % 10].theatreCode,
        surgeryType: surgeryTypes[i],
        scheduledDate: daysOffset(i * 5 - 25),
        status: rand([SurgeryStatus.SCHEDULED, SurgeryStatus.COMPLETED, SurgeryStatus.IN_PROGRESS]),
        preOpNotes: 'Pre-operative assessment completed. Patient fasted for 8 hours.',
        postOpNotes: i % 2 === 0 ? 'Surgery completed successfully. Patient moved to recovery.' : null,
        anesthetist: 'Dr. Anand Verma',
        diagnosis: diagnosisList[i % 10],
        estimatedCost: Math.floor(Math.random() * 100000) + 25000,
      } as any));
    }
    console.log('✅ 10 Operation theaters and 10 surgeries created\n');

    // ─────────────────────────────────────────────────────────────────────────
    // 12. Expenses (10) + Revenue (10)
    // ─────────────────────────────────────────────────────────────────────────
    console.log('💵 Seeding 10 expenses and 10 revenue entries...');
    const expenseTypes = Object.values(ExpenseType);
    const expenseDescs = ['Staff salaries for the month', 'Medical supplies procurement', 'Electricity and water bills', 'Equipment maintenance', 'New ECG machine purchase', 'Building rent', 'Office supplies', 'IT infrastructure', 'Laundry services', 'Security services'];
    const revenueSources = ['Patient Consultation Fees', 'Lab Test Charges', 'Surgical Procedure Fees', 'Pharmacy Sales', 'Insurance Claims', 'Radiology Services', 'ICU Charges', 'Ward Rent', 'Ambulance Services', 'Pharmacy Wholesale'];

    for (let i = 0; i < 10; i++) {
      await expenseRepo.save(expenseRepo.create({
        expenseId: `EXP-${Date.now()}-${i}`,
        expenseType: expenseTypes[i % expenseTypes.length] as ExpenseType,
        description: expenseDescs[i],
        amount: Math.floor(Math.random() * 50000) + 5000,
        vendorName: rand(['MedSupply Corp', 'Pharma Distribution', 'Global Equipment Ltd', 'TechCare Solutions']),
        invoiceNumber: `VINV-${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
        expenseDate: daysOffset(-i * 3),
        status: PaymentStatus.PAID,
        paidDate: daysOffset(-i * 3 + 2),
        approvedBy: 'ADM-888888',
        remarks: 'Approved and processed successfully.',
      }));

      await revenueRepo.save(revenueRepo.create({
        revenueId: `REV-${Date.now()}-${i}`,
        source: revenueSources[i],
        amount: Math.floor(Math.random() * 80000) + 10000,
        date: daysOffset(-i * 2),
        patientId: patients[i % 10].id,
        invoiceId: null,
        remarks: 'Revenue collected and recorded.',
      }));
    }
    console.log('✅ 10 Expenses and 10 Revenue entries created\n');

    // ─────────────────────────────────────────────────────────────────────────
    // 13. Compliance Records (10) + Data Access Logs (10)
    // ─────────────────────────────────────────────────────────────────────────
    console.log('📋 Seeding 10 compliance records and 10 data access logs...');
    const complianceTypes = Object.values(ComplianceType);
    const complianceDescs = [
      'HIPAA privacy rule compliance audit',
      'GDPR data handling review',
      'Data security penetration testing',
      'Infection control quarterly check',
      'Patient rights awareness review',
      'Medical documentation standards audit',
      'HIPAA security rule assessment',
      'GDPR consent management review',
      'Biosafety protocol inspection',
      'Annual regulatory compliance review',
    ];

    for (let i = 0; i < 10; i++) {
      await complianceRepo.save(complianceRepo.create({
        recordId: `COMP-${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
        complianceType: complianceTypes[i % complianceTypes.length] as ComplianceType,
        description: complianceDescs[i],
        regulatoryBody: rand(['Ministry of Health', 'NABH', 'ISO 27001', 'WHO', 'CDSCO']),
        status: rand([ComplianceStatus.COMPLIANT, ComplianceStatus.PENDING_REVIEW, ComplianceStatus.NON_COMPLIANT]),
        lastAuditDate: daysOffset(-i * 10),
        nextAuditDate: daysOffset(90 - i * 5),
        auditedBy: 'ADM-888888',
        findings: i % 2 === 0 ? 'No critical findings. Minor recommendations noted.' : null,
        actionItems: i % 3 === 0 ? 'Update privacy policy. Conduct staff training.' : null,
        remarks: 'Compliance review completed as scheduled.',
      }));

      await dataLogRepo.save(dataLogRepo.create({
        userId: doctors[i % 10].user?.id ?? doctors[i % 10].customUserId,
        action: rand(['view', 'edit', 'create', 'delete', 'export']),
        entityType: rand(['patient', 'prescription', 'lab_test', 'invoice', 'medical_record']),
        entityId: patients[i % 10].id,
        timestamp: daysOffset(-i),
        ipAddress: `192.168.1.${10 + i}`,
        reason: rand(['Routine patient care', 'Follow-up visit', 'Emergency access', 'Insurance processing']),
        status: 'success',
      }));
    }
    console.log('✅ 10 Compliance records and 10 Data access logs created\n');

    // ─────────────────────────────────────────────────────────────────────────
    // 14. Wards (10) + Beds (10)
    // ─────────────────────────────────────────────────────────────────────────
    console.log('🏨 Seeding 10 wards and 10 beds...');
    const wardNames = ['General Ward', 'ICU', 'Pediatric Ward', 'Maternity Ward', 'Surgical Ward', 'Cardiac Ward', 'Ortho Ward', 'Oncology Ward', 'Neuro Ward', 'Isolation Ward'];
    const wards: Ward[] = [];
    for (let i = 0; i < 10; i++) {
      const code = `WRD-${String(i + 1).padStart(3, '0')}`;
      let ward = await wardRepo.findOne({ where: { wardCode: code } });
      if (!ward) {
        ward = await wardRepo.save(wardRepo.create({
          wardCode: code,
          wardName: wardNames[i],
          description: `${wardNames[i]} for specialized patient care`,
          totalBeds: Math.floor(Math.random() * 20) + 10,
          occupiedBeds: Math.floor(Math.random() * 10),
          maintenanceBeds: i % 3 === 0 ? 2 : 0,
          wardIncharge: null,
          floor: String(Math.floor(i / 3) + 1),
          block: rand(['A', 'B', 'C']),
          facilities: JSON.stringify(['AC', 'Nursing Station', 'Monitor', 'Oxygen Supply']),
          remarks: 'Operational',
        }));
      }
      wards.push(ward);
    }

    const bedStatuses = [BedStatus.AVAILABLE, BedStatus.OCCUPIED, BedStatus.MAINTENANCE, BedStatus.RESERVED];
    for (let i = 0; i < 10; i++) {
      const status = bedStatuses[i % bedStatuses.length];
      await bedRepo.save(bedRepo.create({
        wardId: wards[i % 10].id,
        bedNumber: `BED-${String(i + 1).padStart(3, '0')}`,
        status,
        assignedPatientId: status === BedStatus.OCCUPIED ? patients[i % 10].id : null,
        assignedDate: status === BedStatus.OCCUPIED ? daysOffset(-i) : null,
        remarks: status === BedStatus.MAINTENANCE ? 'Under repair' : null,
      }));
    }
    console.log('✅ 10 Wards and 10 Beds created\n');

    // ─────────────────────────────────────────────────────────────────────────
    // 15. Radiology Requests (10)
    // ─────────────────────────────────────────────────────────────────────────
    console.log('🔭 Seeding 10 radiology requests...');
    const imagingTypes = Object.values(ImagingType);
    const bodyParts = ['Chest', 'Abdomen', 'Spine', 'Brain', 'Knee', 'Hip', 'Shoulder', 'Pelvis', 'Ankle', 'Wrist'];
    const radiologyStatuses = [ImagingStatus.PENDING, ImagingStatus.COMPLETED, ImagingStatus.REPORTED, ImagingStatus.ARCHIVED];

    for (let i = 0; i < 10; i++) {
      const status = radiologyStatuses[i % radiologyStatuses.length];
      const isCompleted = status === ImagingStatus.COMPLETED || status === ImagingStatus.REPORTED || status === ImagingStatus.ARCHIVED;
      await radiologyRepo.save(radiologyRepo.create({
        requestId: `RAD-${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
        patientId: patients[i].id,
        doctorId: doctors[i % 10].id,
        imagingType: imagingTypes[i % imagingTypes.length] as ImagingType,
        bodyPart: bodyParts[i],
        clinicalHistory: `Patient presents with ${rand(['chronic pain', 'acute injury', 'swelling', 'difficulty breathing', 'dizziness'])}`,
        status,
        scheduledDate: daysOffset(-i * 2),
        completedDate: isCompleted ? daysOffset(-i * 2 + 1) : null,
        technicianId: null,
        findings: isCompleted ? rand(['No significant abnormality detected', 'Mild effusion noted', 'Hairline fracture visible', 'Consolidation in lower lobe']) : null,
        radiologistId: isCompleted ? doctors[(i + 2) % 10].id : null,
        reportNotes: isCompleted ? 'Imaging completed. Report generated and sent to referring physician.' : null,
        cost: Math.floor(Math.random() * 3000) + 500,
      }));
    }
    console.log('✅ 10 Radiology requests created\n');

    // ─────────────────────────────────────────────────────────────────────────
    // Summary
    // ─────────────────────────────────────────────────────────────────────────
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('✨ DATABASE SEEDING COMPLETED SUCCESSFULLY!');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('📊 Seeded 10 records per table:');
    const tables = [
      ['users (doctors)', 10], ['users (patients)', 10], ['users (staff)', 10],
      ['doctors', 10], ['patients', 10], ['medical_records', 10],
      ['appointments', 10], ['prescriptions', 10], ['medicines', 10],
      ['lab_tests', 10], ['invoices', 10], ['inventory', 10],
      ['staff', 10], ['operation_theaters', 10], ['surgeries', 10],
      ['expenses', 10], ['revenue', 10], ['compliance_records', 10],
      ['data_access_logs', 10], ['wards', 10], ['beds', 10],
      ['radiology_requests', 10],
    ];
    for (const [table, count] of tables) {
      console.log(`   ✓ ${table.toString().padEnd(24)} → ${count} records`);
    }
    console.log('\n💡 All data interconnected and ready for testing!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seedData();
