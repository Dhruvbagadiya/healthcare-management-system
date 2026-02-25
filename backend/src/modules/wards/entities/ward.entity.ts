import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum BedStatus {
  AVAILABLE = 'available',
  OCCUPIED = 'occupied',
  MAINTENANCE = 'maintenance',
  RESERVED = 'reserved',
}

@Entity('wards')
@Index(['wardCode'])
export class Ward {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  wardCode: string;

  @Column()
  wardName: string;

  @Column()
  description: string;

  @Column({ type: 'int' })
  totalBeds: number;

  @Column({ type: 'int', default: 0 })
  occupiedBeds: number;

  @Column({ type: 'int', default: 0 })
  maintenanceBeds: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  pricePerDay: number;

  @Column({ nullable: true })
  wardIncharge: string; // Staff ID

  @Column({ nullable: true })
  floor: string;

  @Column({ nullable: true })
  block: string;

  @Column({ type: 'text', nullable: true })
  facilities: string; // JSON array of facilities

  @Column({ nullable: true })
  remarks: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('beds')
@Index(['wardId'])
@Index(['bedNumber'])
export class Bed {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  wardId: string;

  @Column()
  bedNumber: string;

  @Column({ type: 'enum', enum: BedStatus, default: BedStatus.AVAILABLE })
  status: BedStatus;

  @Column({ nullable: true })
  assignedPatientId: string;

  @Column({ nullable: true })
  assignedDate: Date;

  @Column({ nullable: true })
  remarks: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
