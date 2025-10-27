// src/prompt-crm/contracts/lead.contract.ts
// Basado en el diagrama de contratos

export interface LeadDto {
  email: string;
  nombre: string;
  telefono?: string;
  fuente: string;
}

/**
 * CONTRATO DE GESTIÓN DE LEADS
 * Define las operaciones que 'PromptCrm' expone.
 */
export interface ILeadContract {
  /**
   * Registra un nuevo lead en el CRM.
   */
  registrarLead(lead: LeadDto, campanaId: string): Promise<{ leadId: string }>;

  /**
   * Configura la lógica de captura de leads para una campaña.
   */
  configurarCapturaLeads(campanaId: string): Promise<boolean>;
}