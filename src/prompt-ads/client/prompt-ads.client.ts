// src/prompt-ads/client/prompt-ads.client.ts
import { Injectable, Inject } from '@nestjs/common';
import { ICampaignContract, CampaignConfigDto, CampaignReportDto } from '../contracts/campaign.contract';

/**
 * Cliente (ACL) para el dominio PromptAds.
 *
 */
@Injectable()
export class PromptAdsClient {
  constructor(
    @Inject('ICampaignContract')
    private readonly campaignService: ICampaignContract,
  ) {}

  async crearCampana(config: CampaignConfigDto): Promise<string> {
    return this.campaignService.crearCampana(config);
  }

  async pausarCampana(campanaId: string): Promise<boolean> {
    return this.campaignService.pausarCampana(campanaId);
  }
  
  async generarReporte(campanaId: string, rangoFechas: { inicio: Date; fin: Date }): Promise<CampaignReportDto> {
    return this.campaignService.generarReporte(campanaId, rangoFechas);
  }
}