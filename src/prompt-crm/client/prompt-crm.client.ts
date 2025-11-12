// src/prompt-crm/client/prompt-crm.client.ts
import { Injectable, Inject } from '@nestjs/common';
import { ILeadContract, LeadDto } from '../contracts/lead.contract';

/**
 * Cliente (ACL) para el dominio PromptCrm.
 *
 */
@Injectable()
export class PromptCrmClient {
  constructor(
    @Inject('ILeadContract')
    private readonly leadService: ILeadContract,
  ) {}

  async registrarLead(lead: LeadDto, campanaId: string): Promise<{ leadId: string }> {
    return this.leadService.registrarLead(lead, campanaId);
  }

  async configurarCapturaLeads(campanaId: string): Promise<boolean> {
    return this.leadService.configurarCapturaLeads(campanaId);
  }
}