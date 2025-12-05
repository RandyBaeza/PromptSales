import {
  Injectable,
  Inject,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Campaign } from './entities/campaign.entity';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import type { ICampaignRepository } from './repositories/campaign.repository.interface';

@Injectable()
export class CampaignService {
  constructor(
    @Inject('ICampaignRepository')
    private readonly campaignRepository: ICampaignRepository,
  ) {}

  async findAll(filter?: any): Promise<Campaign[]> {
    return this.campaignRepository.findAll(filter);
  }

  async findOne(id: number): Promise<Campaign> {
    const campaign = await this.campaignRepository.findById(id);

    if (!campaign) {
      throw new NotFoundException(`Campaign with ID ${id} not found`);
    }

    return campaign;
  }
  /*
  async create(createCampaignDto: CreateCampaignDto): Promise<Campaign> {

     if (!createCampaignDto.name || createCampaignDto.name.trim() === '') {
    throw new BadRequestException('Campaign name is required');
  }



    // Verificar si ya existe una campaña con el mismo nombre en la misma organización
    const exists = await this.campaignRepository.existsByName(
      createCampaignDto.name,
      createCampaignDto.organizationId,
    );
    
    if (exists) {
      throw new ConflictException(
        `A campaign with name "${createCampaignDto.name}" already exists in this organization`,
      );
    }
    
    // Crear la campaña
    const campaignData = {
      ...createCampaignDto,
      endsAt: createCampaignDto.endsAt ? new Date(createCampaignDto.endsAt) : null,
    };
    
    return this.campaignRepository.create(campaignData);
  }
*/
  async create(createCampaignDto: CreateCampaignDto): Promise<Campaign> {
    //  VALIDACIÓN MANUAL DE CAMPOS REQUERIDOS
    if (!createCampaignDto.name || createCampaignDto.name.trim() === '') {
      throw new BadRequestException('Campaign name is required');
    }

    if (!createCampaignDto.organizationId) {
      throw new BadRequestException('Organization ID is required');
    }

    if (
      typeof createCampaignDto.organizationId !== 'number' ||
      createCampaignDto.organizationId <= 0
    ) {
      throw new BadRequestException(
        'Organization ID must be a positive number',
      );
    }

    // Verificar si ya existe una campaña con el mismo nombre en la misma organización
    const exists = await this.campaignRepository.existsByName(
      createCampaignDto.name,
      createCampaignDto.organizationId,
    );

    if (exists) {
      throw new ConflictException(
        `A campaign with name "${createCampaignDto.name}" already exists in this organization`,
      );
    }

    // Crear la campaña
    const campaignData = {
      ...createCampaignDto,
      endsAt: createCampaignDto.endsAt
        ? new Date(createCampaignDto.endsAt)
        : null,
    };

    return this.campaignRepository.create(campaignData);
  }

  async update(
    id: number,
    updateCampaignDto: UpdateCampaignDto,
  ): Promise<Campaign> {
    // Verificar si la campaña existe
    const existing = await this.campaignRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Campaign with ID ${id} not found`);
    }

    // Si se está actualizando el nombre, verificar que no haya conflictos
    if (updateCampaignDto.name && updateCampaignDto.name !== existing.name) {
      const exists = await this.campaignRepository.existsByName(
        updateCampaignDto.name,
        updateCampaignDto.organizationId || existing.organizationId,
      );

      if (exists) {
        throw new ConflictException(
          `A campaign with name "${updateCampaignDto.name}" already exists in this organization`,
        );
      }
    }

    // Preparar datos para actualizar
    const updateData = {
      ...updateCampaignDto,
      endsAt: updateCampaignDto.endsAt
        ? new Date(updateCampaignDto.endsAt)
        : undefined,
    };

    return this.campaignRepository.update(id, updateData);
  }

  async remove(id: number): Promise<void> {
    // Verificar si la campaña existe
    const existing = await this.campaignRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Campaign with ID ${id} not found`);
    }

    return this.campaignRepository.delete(id);
  }

  async getActiveCampaigns(): Promise<Campaign[]> {
    return this.campaignRepository.getActiveCampaigns();
  }

  async getOrganizationCampaigns(organizationId: number): Promise<Campaign[]> {
    return this.campaignRepository.findByOrganization(organizationId);
  }

  async countOrganizationCampaigns(organizationId: number): Promise<number> {
    return this.campaignRepository.countByOrganization(organizationId);
  }
}
