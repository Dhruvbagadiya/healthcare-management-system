import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * SeedTrialPlanAndAddTierEnum1772430000000
 *
 * Two changes:
 *
 * 1. Adds 'trial' to the `subscription_plan_tier` PostgreSQL enum type
 *    so the new TRIAL tier is recognised at the DB level.
 *
 * 2. Inserts the system Trial Plan row into `plans` if one does not
 *    already exist (idempotent — safe to re-run).
 *
 * The Trial plan:
 *  - Free (price = 0)
 *  - 14-day access
 *  - Tier = 'trial'
 *  - slug = 'trial'
 *  - isActive = true
 *
 * down() removes the seeded row and then drops 'trial' from the enum.
 */
export class SeedTrialPlanAndAddTierEnum1772430000000 implements MigrationInterface {
    public name = 'SeedTrialPlanAndAddTierEnum1772430000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // ── 1. Add 'trial' to the enum type ──────────────────────────────────
        // PostgreSQL does not support using new enum values in the same transaction
        // they were added. We skip seeding data here and handle it in the seed script instead.
        await queryRunner.query(`
            ALTER TYPE "plans_tier_enum"
            ADD VALUE IF NOT EXISTS 'trial'
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove seeded row
        await queryRunner.query(`DELETE FROM "plans" WHERE "slug" = 'trial'`);

        // Note: PostgreSQL does not support DROP VALUE on enums.
        // The 'trial' enum value will remain in the type but unused.
    }
}
