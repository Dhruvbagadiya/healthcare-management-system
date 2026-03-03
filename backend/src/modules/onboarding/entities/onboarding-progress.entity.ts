import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { Organization } from '../../organizations/entities/organization.entity';

export type OnboardingStep = 'profile' | 'team' | 'demo' | 'modules' | 'complete';

@Entity('onboarding_progress')
@Index(['organizationId'], { unique: true })
export class OnboardingProgress {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'organization_id' })
    @Index()
    organizationId: string;

    @ManyToOne(() => Organization, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'organization_id' })
    organization: Organization;

    @Column({ name: 'current_step', type: 'int', default: 1 })
    currentStep: number;

    @Column({ name: 'completed_steps', type: 'jsonb', default: [] })
    completedSteps: OnboardingStep[];

    @Column({ name: 'is_completed', default: false })
    isCompleted: boolean;

    @Column({ type: 'jsonb', nullable: true })
    metadata: Record<string, any>;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    constructor(partial: Partial<OnboardingProgress>) {
        Object.assign(this, partial);
    }
}
