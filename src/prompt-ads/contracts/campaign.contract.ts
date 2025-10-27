// src/prompt-ads/contracts/campaign.contract.ts
// Basado en el diagrama de contratos

export interface AudienceConfigDto {
  paises: string[];
  intereses: string[];
  edadMinima: number;
}

export interface CampaignConfigDto {
  nombre: string;
  presupuesto: number;
  fechaInicio: Date;
  segmentacion: AudienceConfigDto;
  // Referencia al contenido creado en el dominio PromptContent
  contenidoIds: string[];
}

export interface CampaignReportDto {
  impresiones: number;
  clics: number;
  conversionRate: number;
  gasto: number;
}

/**
 * CONTRATO DE CAMPAÑA
 * Define las operaciones que el dominio 'PromptAds' expone.
 */
export interface ICampaignContract {
  /**
   * Crea y lanza una nueva campaña en las plataformas.
   */
  crearCampana(config: CampaignConfigDto): Promise<string>; // Retorna Campaign ID

  /**
   * Pausa una campaña activa.
   */
  pausarCampana(campanaId: string): Promise<boolean>;

  /**
   * Obtiene un reporte de rendimiento de una campaña.
   */
  generarReporte(campanaId: string, rangoFechas: { inicio: Date; fin: Date }): Promise<CampaignReportDto>;
}