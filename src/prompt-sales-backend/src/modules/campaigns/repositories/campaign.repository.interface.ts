import { Campaign } from '../entities/campaign.entity';

export interface CampaignFilter {
  organizationId?: number;
  enabled?: boolean;
  searchTerm?: string;
  includeDeleted?: boolean;
  limit?: number;
  offset?: number;
}

export interface ICampaignRepository {
  // Métodos de lectura
  findById(id: number): Promise<Campaign | null>;
  findAll(filter?: CampaignFilter): Promise<Campaign[]>;
  findByOrganization(organizationId: number): Promise<Campaign[]>;

  // Métodos de escritura
  create(campaign: Partial<Campaign>): Promise<Campaign>;
  update(id: number, campaign: Partial<Campaign>): Promise<Campaign>;
  delete(id: number): Promise<void>;

  // Métodos específicos
  getActiveCampaigns(): Promise<Campaign[]>;
  countByOrganization(organizationId: number): Promise<number>;

  // Métodos de validación
  existsByName(name: string, organizationId: number): Promise<boolean>;
}
