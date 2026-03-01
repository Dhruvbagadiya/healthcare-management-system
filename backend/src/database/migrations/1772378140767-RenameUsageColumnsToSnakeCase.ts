import { MigrationInterface, QueryRunner } from "typeorm";

export class RenameUsageColumnsToSnakeCase1772378140767 implements MigrationInterface {
    name = 'RenameUsageColumnsToSnakeCase1772378140767'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "organization_usage" RENAME COLUMN "organizationId" TO "organization_id"`);
        await queryRunner.query(`ALTER TABLE "organization_usage" RENAME COLUMN "featureKey" TO "feature_key"`);
        await queryRunner.query(`ALTER TABLE "organization_usage" RENAME COLUMN "currentUsage" TO "used_count"`);
        await queryRunner.query(`ALTER TABLE "organization_usage" RENAME COLUMN "lastResetAt" TO "last_reset_at"`);
        await queryRunner.query(`ALTER TABLE "organization_usage" RENAME COLUMN "updatedAt" TO "updated_at"`);

        // Recreate indexes with new names if necessary, but Renaming columns might already update them.
        // However, it's safer to drop and recreate them if the names change.
        // Actually, Postgres RENAME COLUMN keeps the index associations, but the index structure might still refer to old names.
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "organization_usage" RENAME COLUMN "organization_id" TO "organizationId"`);
        await queryRunner.query(`ALTER TABLE "organization_usage" RENAME COLUMN "feature_key" TO "featureKey"`);
        await queryRunner.query(`ALTER TABLE "organization_usage" RENAME COLUMN "used_count" TO "currentUsage"`);
        await queryRunner.query(`ALTER TABLE "organization_usage" RENAME COLUMN "last_reset_at" TO "lastResetAt"`);
        await queryRunner.query(`ALTER TABLE "organization_usage" RENAME COLUMN "updated_at" TO "updatedAt"`);
    }

}
