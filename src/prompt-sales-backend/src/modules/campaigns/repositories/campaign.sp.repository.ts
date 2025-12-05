import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection } from 'typeorm';
import { Campaign } from '../entities/campaign.entity';
import {
  ICampaignRepository,
  CampaignFilter,
} from './campaign.repository.interface';

@Injectable()
export class CampaignSpRepository implements ICampaignRepository {
  constructor(
    @InjectConnection()
    private readonly connection: Connection,
  ) {}

  async findById(id: number): Promise<Campaign | null> {
    try {
      const results = await this.connection.query(
        `SELECT * FROM sp_get_campaigns($1, NULL, NULL, NULL, TRUE)`,
        [id],
      );

      return results[0] ? this.mapSpResultToCampaign(results[0]) : null;
    } catch (error) {
      console.error('Error in findById SP:', error);
      return null;
    }
  }

  async findAll(filter?: CampaignFilter): Promise<Campaign[]> {
    try {
      const query = `
        SELECT * FROM sp_get_campaigns(
          $1,  -- p_id_campaign
          $2,  -- p_id_organization
          $3,  -- p_is_active
          $4,  -- p_search_term
          $5   -- p_include_deleted
        )
      `;

      const params = [
        null, // p_id_campaign (null para todos)
        filter?.organizationId || null,
        filter?.enabled ?? null, // null, true, o false
        filter?.searchTerm || null,
        filter?.includeDeleted || false,
      ];

      console.log('Executing SP with params:', params);

      const results = await this.connection.query(query, params);
      return results.map(this.mapSpResultToCampaign);
    } catch (error) {
      console.error('Error in findAll SP:', error);
      return [];
    }
  }

  async create(campaign: Partial<Campaign>): Promise<Campaign> {
    try {
      // Validar que los campos requeridos estén presentes
      if (!campaign.name || !campaign.organizationId) {
        throw new Error('Name and organizationId are required');
      }

      // Preparar parámetros para sp_save_campaign
      const params = [
        null, // p_id_campaign (null para insert)
        campaign.organizationId,
        campaign.name, // <-- Aquí TypeScript ahora sabe que es string
        campaign.description || null,
        campaign.endsAt || null,
        campaign.enabled ?? true,
        campaign.deleted ?? false,
        null, // p_result (INOUT parameter)
      ];

      console.log(' Creating campaign via sp_save_campaign:', {
        name: campaign.name,
        orgId: campaign.organizationId,
      });

      // Ejecutar el stored procedure
      await this.connection.query(
        `CALL sp_save_campaign($1, $2, $3, $4, $5, $6, $7, $8)`,
        params,
      );

      // Buscar la campaña recién creada por nombre y organización
      const [newCampaign] = await this.connection.query(
        `SELECT * FROM "PACampaigns" 
       WHERE name = $1 AND id_organization = $2 
       ORDER BY created_at DESC LIMIT 1`,
        [campaign.name, campaign.organizationId], // <-- Ambos son strings/number confirmados
      );

      if (!newCampaign) {
        throw new Error('Failed to retrieve created campaign');
      }

      console.log(' Campaign created via SP, ID:', newCampaign.id_campaign);
      return this.mapDbResultToCampaign(newCampaign);
    } catch (error) {
      console.error(' Error in create SP:', error);
      throw new Error(`Failed to create campaign via SP: ${error.message}`);
    }
  }

  async update(id: number, campaign: Partial<Campaign>): Promise<Campaign> {
    try {
      const query = `
        CALL sp_save_campaign(
          $1,  -- p_id_campaign
          $2,  -- p_id_organization
          $3,  -- p_name
          $4,  -- p_description
          $5,  -- p_ends_at
          $6,  -- p_enabled
          $7,  -- p_deleted
          NULL -- p_result
        )
      `;

      const params = [
        id,
        campaign.organizationId,
        campaign.name,
        campaign.description || null,
        campaign.endsAt || null,
        campaign.enabled,
        campaign.deleted || false,
      ];

      console.log('Updating campaign via SP with params:', params);

      await this.connection.query(query, params);

      // Obtener la campaña actualizada
      const updated = await this.findById(id);

      if (!updated) {
        throw new NotFoundException(
          `Campaign with ID ${id} not found after update`,
        );
      }

      return updated;
    } catch (error) {
      console.error('Error in update SP:', error);
      throw new Error(`Failed to update campaign: ${error.message}`);
    }
  }

  async delete(id: number): Promise<void> {
    try {
      // El SP no tiene delete, usamos soft delete vía update
      const query = `
        CALL sp_save_campaign(
          $1,  -- p_id_campaign
          NULL, -- p_id_organization (mantener actual)
          NULL, -- p_name (mantener actual)
          NULL, -- p_description (mantener actual)
          NULL, -- p_ends_at (mantener actual)
          NULL, -- p_enabled (mantener actual)
          TRUE, -- p_deleted = true (soft delete)
          NULL  -- p_result
        )
      `;

      await this.connection.query(query, [id]);

      console.log(`Campaign ${id} soft-deleted via SP`);
    } catch (error) {
      console.error('Error in delete SP:', error);
      throw new Error(`Failed to delete campaign: ${error.message}`);
    }
  }

  async getActiveCampaigns(): Promise<Campaign[]> {
    return this.findAll({
      enabled: true,
      includeDeleted: false,
    });
  }

  async countByOrganization(organizationId: number): Promise<number> {
    try {
      const campaigns = await this.findAll({
        organizationId,
        includeDeleted: false,
      });
      return campaigns.length;
    } catch (error) {
      console.error('Error in countByOrganization SP:', error);
      return 0;
    }
  }

  async findByOrganization(organizationId: number): Promise<Campaign[]> {
    return this.findAll({ organizationId, includeDeleted: false });
  }

  async existsByName(name: string, organizationId: number): Promise<boolean> {
    try {
      const results = await this.connection.query(
        `SELECT EXISTS (
          SELECT 1 FROM "PACampaigns" 
          WHERE name = $1 AND id_organization = $2 AND deleted = FALSE
        ) as exists`,
        [name, organizationId],
      );

      return results[0]?.exists === true;
    } catch (error) {
      console.error('Error in existsByName:', error);
      return false;
    }
  }

  private async findByNameAndOrg(
    name: string,
    organizationId: number,
  ): Promise<Campaign | null> {
    try {
      const results = await this.connection.query(
        `SELECT * FROM "PACampaigns" 
         WHERE name = $1 AND id_organization = $2 
         ORDER BY created_at DESC LIMIT 1`,
        [name, organizationId],
      );

      return results[0] ? this.mapDbResultToCampaign(results[0]) : null;
    } catch (error) {
      console.error('Error in findByNameAndOrg:', error);
      return null;
    }
  }

  // Mapear resultado del SP a entidad Campaign
  private mapSpResultToCampaign(spResult: any): Campaign {
    const campaign = new Campaign();

    campaign.id = spResult.id_campaign;
    campaign.organizationId = spResult.id_organization;
    campaign.name = spResult.name;
    campaign.description = spResult.description;
    campaign.createdAt = spResult.created_at
      ? new Date(spResult.created_at)
      : new Date();
    campaign.updatedAt = spResult.updated_at
      ? new Date(spResult.updated_at)
      : new Date();
    campaign.endsAt = spResult.ends_at ? new Date(spResult.ends_at) : null;
    campaign.enabled = spResult.enabled;
    campaign.deleted = spResult.deleted || false;

    // El SP devuelve organization_name pero nuestra entidad no lo tiene
    // Podemos ignorarlo o agregarlo como propiedad temporal

    return campaign;
  }

  // Mapear resultado directo de DB a entidad Campaign
  private mapDbResultToCampaign(dbResult: any): Campaign {
    const campaign = new Campaign();

    campaign.id = dbResult.id_campaign;
    campaign.organizationId = dbResult.id_organization;
    campaign.name = dbResult.name;
    campaign.description = dbResult.description;
    campaign.createdAt = dbResult.created_at
      ? new Date(dbResult.created_at)
      : new Date();
    campaign.updatedAt = dbResult.updated_at
      ? new Date(dbResult.updated_at)
      : new Date();
    campaign.endsAt = dbResult.ends_at ? new Date(dbResult.ends_at) : null;
    campaign.enabled = dbResult.enabled;
    campaign.deleted = dbResult.deleted || false;
    campaign.checksum = dbResult.checksum;

    return campaign;
  }
}
