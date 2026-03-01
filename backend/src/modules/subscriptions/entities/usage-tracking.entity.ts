import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    UpdateDateColumn,
    Index,
} from 'typeorm';

@Entity('usage_tracking')
@Index(['organizationId', 'featureKey'], { unique: true })
export class UsageTracking {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    @Index()
    organizationId: string;

    @Column()
    featureKey: string;

    @Column({ type: 'int', default: 0 })
    currentUsage: number;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    lastResetAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
