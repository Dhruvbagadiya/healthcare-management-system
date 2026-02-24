import 'reflect-metadata';
import * as path from 'path';
import * as dotenv from 'dotenv';
import * as crypto from 'crypto';
import { User, UserStatus, UserRole } from '../../modules/users/entities/user.entity';
import { Doctor } from '../../modules/doctors/entities/doctor.entity';
import { Patient, BloodType } from '../../modules/patients/entities/patient.entity';
import { Appointment, AppointmentStatus } from '../../modules/appointments/entities/appointment.entity';
import { Medicine } from '../../modules/pharmacy/entities/medicine.entity';
import { LabTest, LabTestStatus } from '../../modules/laboratory/entities/lab-test.entity';
import { Invoice, InvoiceStatus } from '../../modules/billing/entities/invoice.entity';
import { Expense, ExpenseType, PaymentStatus, Revenue } from '../../modules/accounts/entities/accounts.entity';
import { Staff, StaffRole, StaffStatus } from '../../modules/staff/entities/staff.entity';
import { Inventory, InventoryType, InventoryStatus } from '../../modules/inventory/entities/inventory.entity';
import { Surgery, SurgeryStatus, OperationTheater } from '../../modules/operation-theater/entities/operation-theater.entity';
import { ComplianceRecord, ComplianceStatus, ComplianceType } from '../../modules/compliance/entities/compliance.entity';
import * as bcrypt from 'bcrypt';

// Load environment variables FIRST
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

async function seedData() {
  const { AppDataSource } = await import('../typeorm.config');

  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    console.log('\n🌱 Starting production data seeding...\n');

    const userRepo = AppDataSource.getRepository(User);
    const doctorRepo = AppDataSource.getRepository(Doctor);
    const patientRepo = AppDataSource.getRepository(Patient);
    const appointmentRepo = AppDataSource.getRepository(Appointment);
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

    // 0. Create Admin User
    console.log('👤 Creating admin user...');
    const adminEmail = 'dhruvbagadiya@gmail.com';
    const existingAdmin = await userRepo.findOne({ where: { email: adminEmail } });
    if (!existingAdmin) {
      const admin = userRepo.create({
        id: '00000000-0000-4000-a000-000000000001',
        userId: 'ADM-888888',
        email: adminEmail,
        password: await bcrypt.hash('Admin@123', 10),
        roles: [UserRole.ADMIN],
        status: UserStatus.ACTIVE,
        emailVerified: true,
        firstName: 'Dhruv',
        lastName: 'Bagdiya',
      });
      await userRepo.save(admin);
    }
    console.log('✅ Created admin user\n');

    // 1. Create Doctors
    console.log('👨‍⚕️ Creating 5 doctors...');
    const doctors: Doctor[] = [];
    const doctorsData = [
      { name: 'Dr. Rajesh Kumar', specialization: 'Cardiology', phone: '9876543210' },
      { name: 'Dr. Priya Singh', specialization: 'Orthopedics', phone: '9876543211' },
      { name: 'Dr. Amit Patel', specialization: 'Neurology', phone: '9876543212' },
      { name: 'Dr. Neha Sharma', specialization: 'Pediatrics', phone: '9876543213' },
      { name: 'Dr. Vikram Desai', specialization: 'General Surgery', phone: '9876543214' },
    ];

    for (const docData of doctorsData) {
      const email = `${docData.name.toLowerCase().replace(/\s+/g, '.')}@hospital.com`;
      let savedUser = await userRepo.findOne({ where: { email } });

      if (!savedUser) {
        const user = userRepo.create({
          userId: crypto.randomUUID(),
          email,
          password: await bcrypt.hash('Doctor@123', 10),
          roles: [UserRole.DOCTOR],
          status: UserStatus.ACTIVE,
          emailVerified: true,
          firstName: docData.name.split(' ')[1] || 'Doctor',
          lastName: docData.name.split(' ').pop() || docData.name,
        });
        savedUser = await userRepo.save(user);
      }

      let savedDoctor = await doctorRepo.findOne({ where: { customUserId: savedUser.userId } });
      if (!savedDoctor) {
        const doctor = doctorRepo.create({
          specialization: docData.specialization,
          licenseNumber: `LIC${Math.random().toString(36).substring(7).toUpperCase()}`,
          yearsOfExperience: Math.floor(Math.random() * 20) + 3,
          consultationFee: Math.floor(Math.random() * 3000) + 500,
          isActive: true,
        });
        doctor.customUserId = savedUser.userId;
        savedDoctor = await doctorRepo.save(doctor);
      }
      doctors.push(savedDoctor);
    }
    console.log('✅ Created 5 doctors\n');

    // 2. Create Patients
    console.log('👥 Creating 10 patients...');
    const patients: Patient[] = [];
    const bloodTypes = Object.values(BloodType);
    const patientsData = [
      { name: 'Arjun Mehta', email: 'arjun.m@example.com', phone: '9111111111', age: 45 },
      { name: 'Deepak Gupta', email: 'deepak.g@example.com', phone: '9222222222', age: 38 },
      { name: 'Sneha Kapoor', email: 'sneha.k@example.com', phone: '9333333333', age: 32 },
      { name: 'Rahul Verma', email: 'rahul.v@example.com', phone: '9444444444', age: 55 },
      { name: 'Pooja Nair', email: 'pooja.n@example.com', phone: '9555555555', age: 28 },
      { name: 'Sanjay Rao', email: 'sanjay.r@example.com', phone: '9666666666', age: 62 },
      { name: 'Anjali Reddy', email: 'anjali.r@example.com', phone: '9777777777', age: 35 },
      { name: 'Rohan Iyer', email: 'rohan.i@example.com', phone: '9888888888', age: 41 },
      { name: 'Kavita Sharma', email: 'kavita.s@example.com', phone: '9999999999', age: 29 },
      { name: 'Manoj Singh', email: 'manoj.s@example.com', phone: '9000000000', age: 48 },
    ];

    for (const patData of patientsData) {
      const email = patData.email;
      let savedUser = await userRepo.findOne({ where: { email } });

      if (!savedUser) {
        const user = userRepo.create({
          userId: crypto.randomUUID(),
          email,
          password: await bcrypt.hash('Patient@123', 10),
          roles: [UserRole.PATIENT],
          status: UserStatus.ACTIVE,
          emailVerified: true,
          firstName: patData.name.split(' ')[0],
          lastName: patData.name.split(' ').pop(),
        });
        savedUser = await userRepo.save(user);
      }

      let savedPatient = await patientRepo.findOne({ where: { customUserId: savedUser.userId } });
      if (!savedPatient) {
        const patient = patientRepo.create({
          bloodType: bloodTypes[Math.floor(Math.random() * bloodTypes.length)],
          insuranceProvider: 'Health Insurance Company',
          insurancePolicyNumber: `POL${Math.random().toString(36).substring(7).toUpperCase()}`,
          emergencyContactName: 'Emergency Contact',
          emergencyContactPhone: '9000000001',
          height: Math.floor(Math.random() * 40) + 150,
          weight: Math.floor(Math.random() * 50) + 50,
          maritalStatus: 'Married',
          occupation: 'Professional',
        });
        patient.customUserId = savedUser.userId;
        savedPatient = await patientRepo.save(patient);
      }
      patients.push(savedPatient);
    }
    console.log('✅ Created 10 patients\n');

    // 3. Create Appointments (connected to doctors & patients)
    console.log('📅 Creating 25 appointments...');
    const appointmentStatuses = [AppointmentStatus.SCHEDULED, AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED];
    for (let i = 0; i < 25; i++) {
      const doctor = doctors[i % doctors.length];
      const patient = patients[i % patients.length];
      const appointmentDate = new Date();
      appointmentDate.setDate(appointmentDate.getDate() + Math.floor(Math.random() * 60) - 30);
      const hours = Math.floor(Math.random() * 8) + 9;
      appointmentDate.setHours(hours, 0, 0, 0);

      const appointment = appointmentRepo.create({
        doctorId: doctor.customUserId,
        patientId: patient.customUserId,
        appointmentDate,
        appointmentTime: `${hours.toString().padStart(2, '0')}:00`,
        reason: ['Routine Checkup', 'Follow-up', 'Consultation', 'Emergency'][Math.floor(Math.random() * 4)],
        status: appointmentStatuses[Math.floor(Math.random() * appointmentStatuses.length)],
        notes: 'Patient arrived on time. Consultation completed.',
      });
      await appointmentRepo.save(appointment);
    }
    console.log('✅ Created 25 appointments\n');

    // 4. Create Medicines
    console.log('💊 Creating medicines...');
    const medicinesData = [
      { name: 'Aspirin', strength: '500mg', price: 150, stock: 500 },
      { name: 'Amoxicillin', strength: '250mg', price: 200, stock: 300 },
      { name: 'Metformin', strength: '500mg', price: 180, stock: 400 },
      { name: 'Atorvastatin', strength: '10mg', price: 250, stock: 250 },
      { name: 'Lisinopril', strength: '5mg', price: 220, stock: 280 },
      { name: 'Omeprazole', strength: '20mg', price: 190, stock: 320 },
      { name: 'Ibuprofen', strength: '400mg', price: 100, stock: 600 },
      { name: 'Paracetamol', strength: '500mg', price: 80, stock: 800 },
    ];

    for (const medData of medicinesData) {
      const existingMedicine = await medicineRepo.findOne({ where: { name: medData.name } });
      if (!existingMedicine) {
        const medicine = medicineRepo.create({
          medicineCode: `MED${Math.random().toString(36).substring(7).toUpperCase()}`,
          name: medData.name,
          strength: medData.strength,
          formulation: 'Tablet',
          purchasePrice: medData.price * 0.6,
          sellingPrice: medData.price,
          stock: medData.stock,
          reorderLevel: 100,
          expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          manufacturer: 'Pharma Labs India',
          isActive: true,
        });
        await medicineRepo.save(medicine);
      }
    }
    console.log('✅ Created medicines\n');

    // 5. Create Lab Tests
    console.log('🔬 Creating lab tests...');
    const labTestsData = [
      { name: 'Blood Test (CBC)', description: 'Complete Blood Count', patient: patients[0] },
      { name: 'Urine Test', description: 'Urinalysis', patient: patients[1] },
      { name: 'X-Ray Chest', description: 'Chest X-Ray Imaging', patient: patients[2] },
      { name: 'ECG', description: 'Electrocardiogram', patient: patients[3] },
      { name: 'Ultrasound Abdomen', description: 'Abdominal Ultrasound', patient: patients[4] },
    ];

    for (const testData of labTestsData) {
      const labTest = labTestRepo.create({
        patientId: testData.patient.customUserId,
        testName: testData.name,
        description: testData.description,
        status: LabTestStatus.ORDERED,
        orderedDate: new Date(),
      });
      await labTestRepo.save(labTest);
    }
    console.log('✅ Created lab tests\n');

    // 6. Create Staff
    console.log('👨‍💼 Creating 8 staff members...');
    const staffData = [
      { name: 'Nurse Maria Johnson', role: StaffRole.NURSE, experience: 8, phone: '9900000001', salary: 45000 },
      { name: 'Technician Arun Kumar', role: StaffRole.TECHNICIAN, experience: 5, phone: '9900000002', salary: 35000 },
      { name: 'Receptionist Priya Desai', role: StaffRole.RECEPTIONIST, experience: 3, phone: '9900000003', salary: 28000 },
      { name: 'Lab Technician Vikram', role: StaffRole.TECHNICIAN, experience: 6, phone: '9900000004', salary: 38000 },
      { name: 'Nurse Kavya Patel', role: StaffRole.NURSE, experience: 10, phone: '9900000005', salary: 50000 },
      { name: 'Receptionist Anjali', role: StaffRole.RECEPTIONIST, experience: 2, phone: '9900000006', salary: 26000 },
      { name: 'Nurse Sumitra', role: StaffRole.NURSE, experience: 7, phone: '9900000007', salary: 42000 },
      { name: 'Technician Suresh', role: StaffRole.TECHNICIAN, experience: 4, phone: '9900000008', salary: 33000 },
    ];

    for (const std of staffData) {
      const email = `${std.name.toLowerCase().replace(/\s+/g, '.')}@hospital.com`;
      let savedUser = await userRepo.findOne({ where: { email } });

      if (!savedUser) {
        const user = userRepo.create({
          userId: crypto.randomUUID(),
          email,
          password: await bcrypt.hash('Staff@123', 10),
          roles: [std.role === StaffRole.NURSE ? UserRole.NURSE : std.role === StaffRole.TECHNICIAN ? UserRole.LAB_TECHNICIAN : UserRole.RECEPTIONIST],
          status: UserStatus.ACTIVE,
          emailVerified: true,
          firstName: std.name.split(' ')[0],
          lastName: std.name.split(' ').pop(),
          phoneNumber: std.phone,
        });
        savedUser = await userRepo.save(user);
      }

      const existingStaff = await staffRepo.findOne({ where: { userId: savedUser.userId } });
      if (!existingStaff) {
        const staff = staffRepo.create({
          staffId: `STAFF${Math.random().toString(36).substring(7).toUpperCase()}`,
          userId: savedUser.userId,
          role: std.role,
          status: StaffStatus.ACTIVE,
          yearsOfExperience: std.experience,
          joiningDate: new Date(Date.now() - std.experience * 365 * 24 * 60 * 60 * 1000),
        });
        await staffRepo.save(staff);
      }
    }
    console.log('✅ Created 8 staff members\n');

    // 7. Create Invoices
    console.log('💰 Creating invoices...');
    const invoiceStatuses = Object.values(InvoiceStatus).slice(0, 5);
    for (let i = 0; i < 15; i++) {
      const patient = patients[i % patients.length];
      const subtotal = Math.floor(Math.random() * 15000) + 2000;
      const taxAmount = Math.floor(subtotal * 0.18);
      const totalAmount = subtotal + taxAmount;

      const invoiceData: any = {
        invoiceNumber: `INV${Date.now()}${i}`,
        patientId: patient.customUserId,
        subtotal,
        taxAmount,
        taxPercentage: 18,
        totalAmount,
        dueAmount: totalAmount,
        issueDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        dueDate: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000),
        status: invoiceStatuses[Math.floor(Math.random() * invoiceStatuses.length)],
        notes: 'Hospital treatment and medical services',
        lineItems: [
          { description: 'Consultation Fees', quantity: 1, unitPrice: subtotal * 0.4, totalPrice: subtotal * 0.4, category: 'consultation' },
          { description: 'Medicines', quantity: 1, unitPrice: subtotal * 0.3, totalPrice: subtotal * 0.3, category: 'medicine' },
          { description: 'Laboratory Tests', quantity: 1, unitPrice: subtotal * 0.3, totalPrice: subtotal * 0.3, category: 'test' },
        ],
      };
      const invoice = invoiceRepo.create(invoiceData);
      await invoiceRepo.save(invoice);
    }
    console.log('✅ Created invoices\n');

    // 8. Create Inventory Items
    console.log('📦 Creating inventory items...');
    const inventoryData = [
      { name: 'Oxygen Cylinders', type: InventoryType.EQUIPMENT, quantity: 50, price: 8000, minLevel: 10 },
      { name: 'Syringes (10ml)', type: InventoryType.SUPPLIES, quantity: 5000, price: 5, minLevel: 500 },
      { name: 'Sterile Gloves', type: InventoryType.SUPPLIES, quantity: 10000, price: 2, minLevel: 2000 },
      { name: 'Gauze Pads', type: InventoryType.SUPPLIES, quantity: 2000, price: 10, minLevel: 500 },
      { name: 'IV Fluid Bags', type: InventoryType.SUPPLIES, quantity: 200, price: 150, minLevel: 50 },
      { name: 'Bed Sheets Set', type: InventoryType.SUPPLIES, quantity: 300, price: 500, minLevel: 100 },
      { name: 'Patient Monitors', type: InventoryType.EQUIPMENT, quantity: 15, price: 50000, minLevel: 3 },
    ];

    for (const invData of inventoryData) {
      const existingInv = await inventoryRepo.findOne({ where: { itemName: invData.name } });
      if (!existingInv) {
        const inventory = inventoryRepo.create({
          itemCode: `INV${Math.random().toString(36).substring(7).toUpperCase()}`,
          itemName: invData.name,
          type: invData.type,
          category: invData.type === InventoryType.EQUIPMENT ? 'Medical Equipment' : 'Medical Supplies',
          quantity: invData.quantity,
          unit: 'units',
          unitCost: invData.price * 0.7,
          sellingPrice: invData.price,
          minimumLevel: invData.minLevel,
          location: 'Main Storage Warehouse',
          status: invData.quantity > invData.minLevel ? InventoryStatus.IN_STOCK : InventoryStatus.LOW_STOCK,
          supplier: 'Medical Supplies Corp',
        });
        await inventoryRepo.save(inventory);
      }
    }
    console.log('✅ Created inventory items\n');

    // 9. Create Operation Theaters and Surgeries
    console.log('🏥 Creating operation theaters and surgeries...');
    const theaterData = [
      { name: 'Theater A', code: 'OT-001' },
      { name: 'Theater B', code: 'OT-002' },
      { name: 'Theater C', code: 'OT-003' },
    ];

    const theaters: OperationTheater[] = [];
    for (const tdata of theaterData) {
      let savedTheater = await theaterRepo.findOne({ where: { theatreCode: tdata.code } });
      if (!savedTheater) {
        const theater = theaterRepo.create({
          theatreCode: tdata.code,
          theatreName: tdata.name,
          isAvailable: true,
          facilities: 'Advanced surgical equipment and monitoring systems',
        });
        savedTheater = await theaterRepo.save(theater);
      }
      theaters.push(savedTheater);
    }

    const surgeryTypes = ['Appendectomy', 'Hernia Repair', 'Knee Replacement', 'Cataract Surgery', 'Gallbladder Removal'];

    for (let i = 0; i < 10; i++) {
      const surgery = surgeryRepo.create({
        surgeryId: `SURG${Math.random().toString(36).substring(7).toUpperCase()}`,
        patientId: patients[i % patients.length].customUserId,
        surgeonId: doctors[i % doctors.length].customUserId,
        theatreId: theaters[i % theaters.length].theatreCode,
        surgeryType: surgeryTypes[Math.floor(Math.random() * surgeryTypes.length)],
        scheduledDate: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000),
        status: [SurgeryStatus.SCHEDULED, SurgeryStatus.COMPLETED][Math.floor(Math.random() * 2)],
        preOpNotes: 'Pre-operative assessment completed. Patient in good health.',
      });
      await surgeryRepo.save(surgery);
    }
    console.log('✅ Created operation theaters and surgeries\n');

    // 10. Create Financial Records
    console.log('💵 Creating financial records...');
    const expenseTypes = Object.values(ExpenseType);

    for (let i = 0; i < 30; i++) {
      // Revenue
      const revenue = revenueRepo.create({
        revenueId: `REV${Date.now()}${i}`,
        source: ['Patient Fees', 'Consultation Charges', 'Lab Tests', 'Surgical Procedures', 'Medical Supplies'][Math.floor(Math.random() * 5)],
        amount: Math.floor(Math.random() * 50000) + 5000,
        date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        remarks: 'Hospital revenue from services',
      });
      await revenueRepo.save(revenue);

      // Expenses
      const expense = expenseRepo.create({
        expenseId: `EXP${Date.now()}${i}`,
        expenseType: expenseTypes[Math.floor(Math.random() * expenseTypes.length)],
        description: 'Hospital operational expense',
        amount: Math.floor(Math.random() * 30000) + 2000,
        vendorName: ['Medical Supplies Inc', 'Pharma Distribution', 'Equipment Vendors Ltd'][Math.floor(Math.random() * 3)],
        invoiceNumber: `VINV${Math.random().toString(36).substring(7).toUpperCase()}`,
        expenseDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        status: PaymentStatus.PAID,
        remarks: 'Vendor invoice processed',
      });
      await expenseRepo.save(expense);
    }
    console.log('✅ Created financial records\n');

    // 11. Create Compliance Records
    console.log('✅ Creating compliance records...');
    const complianceTypeValues = Object.values(ComplianceType).slice(0, 5);

    for (let i = 0; i < 12; i++) {
      const compliance = complianceRepo.create({
        recordId: `COMP${Math.random().toString(36).substring(7).toUpperCase()}`,
        complianceType: complianceTypeValues[Math.floor(Math.random() * complianceTypeValues.length)],
        description: 'Quarterly compliance and audit check',
        status: [ComplianceStatus.COMPLIANT, ComplianceStatus.NON_COMPLIANT][Math.floor(Math.random() * 2)],
        lastAuditDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        nextAuditDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        remarks: 'Regular compliance check completed successfully',
      });
      await complianceRepo.save(compliance);
    }
    console.log('✅ Created compliance records\n');

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('✨ DATABASE SEEDING COMPLETED SUCCESSFULLY!');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('📊 Summary of Created Data:');
    console.log(`   ✓ 5 Doctors with specializations`);
    console.log(`   ✓ 10 Patients with full medical profiles`);
    console.log(`   ✓ 25 Appointments (scheduled/completed/cancelled)`);
    console.log(`   ✓ 8 Medicines with stock information`);
    console.log(`   ✓ 5 Laboratory tests`);
    console.log(`   ✓ 8 Staff members (nurses, technicians, receptionists)`);
    console.log(`   ✓ 15 Invoices linked to patients`);
    console.log(`   ✓ 7 Inventory items with stock levels`);
    console.log(`   ✓ 3 Operation theaters with 10 surgeries`);
    console.log(`   ✓ 30 Financial records (revenue & expenses)`);
    console.log(`   ✓ 12 Compliance audit records\n`);
    console.log('💡 All data is interconnected and ready for testing!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seedData();
