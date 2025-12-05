import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  HttpCode,
  HttpStatus,
  Headers,
  ForbiddenException,
} from '@nestjs/common';
import { CampaignService } from './campaign.service';
import { Campaign } from './entities/campaign.entity';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';

@Controller('campaigns')
export class CampaignController {
  constructor(private readonly campaignService: CampaignService) {}

  @Get()
  async findAll(
    @Query('organizationId') organizationId?: string,
    @Query('enabled') enabled?: string,
    @Query('search') searchTerm?: string,
    @Query('includeDeleted') includeDeleted?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ): Promise<Campaign[]> {
    // Convertir parámetros manualmente
    const filter = {
      organizationId: organizationId ? parseInt(organizationId, 10) : undefined,
      enabled: enabled !== undefined ? enabled === 'true' : undefined,
      searchTerm,
      includeDeleted: includeDeleted === 'true',
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    };

    console.log('Filter:', filter);

    return this.campaignService.findAll(filter);
  }

  @Get('active')
  async getActive(): Promise<Campaign[]> {
    return this.campaignService.getActiveCampaigns();
  }

  @Get('organization/:organizationId')
  async getByOrganization(
    @Param('organizationId', ParseIntPipe) organizationId: number,
  ): Promise<Campaign[]> {
    return this.campaignService.getOrganizationCampaigns(organizationId);
  }

  @Get('organization/:organizationId/count')
  async countByOrganization(
    @Param('organizationId', ParseIntPipe) organizationId: number,
  ): Promise<{ count: number }> {
    const count =
      await this.campaignService.countOrganizationCampaigns(organizationId);
    return { count };
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Campaign> {
    return this.campaignService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createCampaignDto: CreateCampaignDto,
  ): Promise<Campaign> {
    return this.campaignService.create(createCampaignDto);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCampaignDto: UpdateCampaignDto,
  ): Promise<Campaign> {
    return this.campaignService.update(id, updateCampaignDto);
  }

  /* @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.campaignService.remove(id);
  }*/

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Headers('x-user-role') role?: string, // <-- NUEVO PARÁMETRO
  ): Promise<void> {
    // ✅ VALIDACIÓN DE SEGURIDAD INLINE (SIMPLE)
    if (role !== 'admin') {
      throw new ForbiddenException(
        'Only users with admin role can delete campaigns',
      );
    }

    return this.campaignService.remove(id);
  }
}
