import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, MoreThanOrEqual, IsNull, Not } from 'typeorm';
import { Campaign } from '../entities/campaign.entity';
import {
  ICampaignRepository,
  CampaignFilter,
} from './campaign.repository.interface';

@Injectable()
export class CampaignOrmRepository implements ICampaignRepository {
  constructor(
    @InjectRepository(Campaign)
    private readonly repository: Repository<Campaign>,
  ) {}

  async findById(id: number): Promise<Campaign | null> {
    return this.repository.findOne({
      where: { id },
    });
  }

  async findAll(filter?: CampaignFilter): Promise<Campaign[]> {
    const where: any = {};

    if (filter?.organizationId) {
      where.organizationId = filter.organizationId;
    }

    if (filter?.enabled !== undefined) {
      where.enabled = filter.enabled;
    }

    if (!filter?.includeDeleted) {
      where.deleted = false;
    }

    const query = this.repository.createQueryBuilder('campaign').where(where);

    if (filter?.searchTerm) {
      query.andWhere(
        '(campaign.name LIKE :search OR campaign.description LIKE :search)',
        {
          search: `%${filter.searchTerm}%`,
        },
      );
    }

    if (filter?.limit) {
      query.limit(filter.limit);
    }

    if (filter?.offset) {
      query.offset(filter.offset);
    }

    query.orderBy('campaign.createdAt', 'DESC');

    return query.getMany();
  }

  async create(campaign: Partial<Campaign>): Promise<Campaign> {
    const newCampaign = this.repository.create(campaign);
    return this.repository.save(newCampaign);
  }

  async update(id: number, campaign: Partial<Campaign>): Promise<Campaign> {
    await this.repository.update(id, campaign);

    const updated = await this.findById(id);
    if (!updated) {
      throw new NotFoundException(`Campaign with ID ${id} not found`);
    }

    return updated;
  }

  async delete(id: number): Promise<void> {
    const result = await this.repository.softDelete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`Campaign with ID ${id} not found`);
    }
  }

  async getActiveCampaigns(): Promise<Campaign[]> {
    const now = new Date();

    return this.repository.find({
      where: [
        {
          enabled: true,
          deleted: false,
          endsAt: MoreThanOrEqual(now),
        },
        {
          enabled: true,
          deleted: false,
          endsAt: IsNull(),
        },
      ],
      order: { createdAt: 'DESC' },
    });
  }

  async countByOrganization(organizationId: number): Promise<number> {
    return this.repository.count({
      where: {
        organizationId,
        deleted: false,
      },
    });
  }

  async findByOrganization(organizationId: number): Promise<Campaign[]> {
    return this.repository.find({
      where: {
        organizationId,
        deleted: false,
      },
      order: { createdAt: 'DESC' },
    });
  }

  async existsByName(name: string, organizationId: number): Promise<boolean> {
    const count = await this.repository.count({
      where: {
        name,
        organizationId,
        deleted: false,
      },
    });

    return count > 0;
  }
}
