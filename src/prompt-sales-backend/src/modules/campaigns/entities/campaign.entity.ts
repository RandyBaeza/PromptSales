import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Organization } from './organization.entity';

@Entity('PACampaigns')
export class Campaign {
  @PrimaryGeneratedColumn({ name: 'id_campaign' })
  id: number;

  @Column({ name: 'id_organization' })
  organizationId: number;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'id_organization' })
  organization: Organization;

  @Column({ length: 60, name: 'name' })
  name: string;

  @Column({ type: 'varchar', length: 200, nullable: true, name: 'description' })
  description: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'ends_at', type: 'timestamptz', nullable: true })
  endsAt: Date | null;

  @Column({ name: 'enabled', default: true })
  enabled: boolean;

  @Column({ name: 'deleted', default: false })
  deleted: boolean;

  @Column({ type: 'bytea', name: 'checksum', nullable: true })
  checksum: Buffer;

  // Métodos de ayuda
  isActive(): boolean {
    return this.enabled && !this.deleted;
  }

  isExpired(): boolean {
    if (!this.endsAt) return false;
    return new Date() > this.endsAt;
  }
}
