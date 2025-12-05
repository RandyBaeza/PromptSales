import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity('PAOrganizations')
export class Organization {
  @PrimaryGeneratedColumn({ name: 'id_organization' })
  id: number;

  @Column({ length: 60, name: 'name' })
  name: string;

  @Column({ length: 60, name: 'legal_name', nullable: true })
  legalName: string;

  @Column({ length: 80, name: 'email', nullable: true })
  email: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'organization_status', nullable: true })
  organizationStatus: number;
}
