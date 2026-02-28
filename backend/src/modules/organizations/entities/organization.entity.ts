import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
    Index,
} from 'typeorm';

export enum OrganizationStatus {
    ACTIVE = 'active',
    SUSPENDED = 'suspended',
    PENDING = 'pending',
}

export enum SubscriptionPlan {
    BASIC = 'basic',
    PREMIUM = 'premium',
    ENTERPRISE = 'enterprise',
}

@Entity('organizations')
export class Organization {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column({ unique: true })
    @Index()
    slug: string;

    @Column({ nullable: true })
    logoUrl: string;

    @Column({
        type: 'enum',
        enum: SubscriptionPlan,
        default: SubscriptionPlan.BASIC,
    })
    subscriptionPlan: SubscriptionPlan;

    @Column({
        type: 'enum',
        enum: OrganizationStatus,
        default: OrganizationStatus.PENDING,
    })
    status: OrganizationStatus;

    @Column({ type: 'jsonb', nullable: true })
    settings: Record<string, any>;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @DeleteDateColumn()
    deletedAt?: Date;

    constructor(partial: Partial<Organization>) {
        Object.assign(this, partial);
    }
}
