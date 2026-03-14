import 'reflect-metadata';
import * as path from 'path';
import * as dotenv from 'dotenv';
import * as bcrypt from 'bcrypt';

import { User, UserStatus } from '../../modules/users/entities/user.entity';
import { Organization } from '../../modules/organizations/entities/organization.entity';
import { Role } from '../../modules/rbac/entities/role.entity';
import { Permission } from '../../modules/rbac/entities/permission.entity';

// Load environment variables FIRST
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

async function seedDemoUser() {
  const { AppDataSource } = await import('../typeorm.config');

  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    console.log('\n=== Seeding Demo User ===\n');

    const userRepo = AppDataSource.getRepository(User);
    const orgRepo = AppDataSource.getRepository(Organization);
    const roleRepo = AppDataSource.getRepository(Role);
    const permRepo = AppDataSource.getRepository(Permission);

    // 1. Find the organization with slug 'aarogentix-health'
    const org = await orgRepo.findOne({ where: { slug: 'aarogentix-health' } });
    if (!org) {
      console.error('Organization with slug "aarogentix-health" not found. Run seed-production-data.ts first.');
      process.exit(1);
    }
    const orgId = org.id;
    console.log(`Found organization: ${org.name} (${orgId})`);

    // 2. Get ALL permissions from the permissions table
    const allPermissions = await permRepo.find();
    console.log(`Found ${allPermissions.length} permissions`);

    // 3. Create or update a 'super_admin' role with ALL permissions
    let superAdminRole = await roleRepo.findOne({
      where: { name: 'super_admin', organizationId: orgId },
      relations: ['permissions'],
    });

    if (!superAdminRole) {
      superAdminRole = roleRepo.create({
        name: 'super_admin',
        description: 'Super Administrator with all permissions',
        organizationId: orgId,
        isSystemRole: true,
        permissions: allPermissions,
      });
      superAdminRole = await roleRepo.save(superAdminRole);
      console.log('Created super_admin role');
    } else {
      superAdminRole.isSystemRole = true;
      superAdminRole.permissions = allPermissions;
      superAdminRole = await roleRepo.save(superAdminRole);
      console.log('Updated super_admin role with all permissions');
    }

    // 4. Find existing admin and doctor roles
    const adminRole = await roleRepo.findOne({
      where: { name: 'admin', organizationId: orgId },
      relations: ['permissions'],
    });
    const doctorRole = await roleRepo.findOne({
      where: { name: 'doctor', organizationId: orgId },
      relations: ['permissions'],
    });

    if (!adminRole) {
      console.warn('Warning: admin role not found for this organization');
    }
    if (!doctorRole) {
      console.warn('Warning: doctor role not found for this organization');
    }

    // Build the roles array for the demo user
    const demoUserRoles: Role[] = [superAdminRole];
    if (adminRole) demoUserRoles.push(adminRole);
    if (doctorRole) demoUserRoles.push(doctorRole);

    // 5. Create or update the demo user
    const demoEmail = 'demo@aarogentix.com';
    const demoPassword = 'Demo@1234';
    const hashedPassword = await bcrypt.hash(demoPassword, 10);

    let demoUser = await userRepo.findOne({
      where: { email: demoEmail },
      relations: ['roles'],
    });

    if (!demoUser) {
      demoUser = userRepo.create({
        userId: 'DEMO-000001',
        email: demoEmail,
        password: hashedPassword,
        firstName: 'Demo',
        lastName: 'Admin',
        status: UserStatus.ACTIVE,
        emailVerified: true,
        organizationId: orgId,
        roles: demoUserRoles,
      });
      demoUser = await userRepo.save(demoUser);
      console.log(`Created demo user: ${demoEmail}`);
    } else {
      demoUser.password = hashedPassword;
      demoUser.firstName = 'Demo';
      demoUser.lastName = 'Admin';
      demoUser.status = UserStatus.ACTIVE;
      demoUser.emailVerified = true;
      demoUser.organizationId = orgId;
      demoUser.roles = demoUserRoles;
      demoUser = await userRepo.save(demoUser);
      console.log(`Updated demo user: ${demoEmail}`);
    }

    // 6. Update dhruvbagadiya@gmail.com to also have the super_admin role
    const dhruvEmail = 'dhruvbagadiya@gmail.com';
    const dhruvUser = await userRepo.findOne({
      where: { email: dhruvEmail },
      relations: ['roles'],
    });

    if (dhruvUser) {
      const existingRoleIds = dhruvUser.roles.map((r) => r.id);
      if (!existingRoleIds.includes(superAdminRole.id)) {
        dhruvUser.roles.push(superAdminRole);
        await userRepo.save(dhruvUser);
        console.log(`Added super_admin role to ${dhruvEmail}`);
      } else {
        console.log(`${dhruvEmail} already has super_admin role`);
      }
    } else {
      console.warn(`Warning: User ${dhruvEmail} not found — skipping super_admin assignment`);
    }

    console.log('\n=== Demo User Seed Complete ===');
    console.log(`  Email:    ${demoEmail}`);
    console.log(`  Password: ${demoPassword}`);
    console.log(`  Roles:    ${demoUserRoles.map((r) => r.name).join(', ')}\n`);

    process.exit(0);
  } catch (error) {
    console.error('Error seeding demo user:', error);
    process.exit(1);
  }
}

seedDemoUser();
