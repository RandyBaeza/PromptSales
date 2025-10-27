// src/prompt-sales/application/facades/campaign-orchestrator.facade.ts

import { Injectable, Inject } from '@nestjs/common';
import { ITextContentContract } from '../../prompt-content/contracts/text-content.contract';
import { ICampaignContract } from '../../prompt-ads/contracts/campaign.contract';
import { ILeadContract } from '../../prompt-crm/contracts/lead.contract';

// DTO para la "Estrategia de Mercadeo" que define el usuario
export interface EstrategiaDto {
  nombreCampana: string;
  promptContenido: string;
  presupuesto: number;
  segmentacion: {
    paises: string[];
    intereses: string[];
    edadMinima: number;
  };
  objetivo: 'generar_leads' | 'ventas_directas';
}

/**
 * FACADE DE ORQUESTACIÓN DE CAMPAÑAS
 * Cumple el requisito de "crear facades" y
 * "Diseño de estrategias de mercadeo personalizadas".
 * Orquesta llamadas a múltiples dominios (Content, Ads, Crm).
 */
@Injectable()
export class CampaignOrchestratorFacade {
  constructor(
    // Inyectamos los CONTRATOS de los otros dominios (Inyección de Dependencias)
    @Inject('ITextContentContract')
    private readonly contentContract: ITextContentContract,
    
    @Inject('ICampaignContract')
    private readonly adsContract: ICampaignContract,
    
    @Inject('ILeadContract')
    private readonly crmContract: ILeadContract,
  ) {}

  /**
   * Lanza una estrategia de mercadeo completa.
   * @param estrategia La estrategia diseñada por el usuario en el portal.
   */
  async lanzarEstrategia(estrategia: EstrategiaDto): Promise<{ campaignId: string }> {
    console.log('Iniciando orquestación de estrategia...');

    // 1. Dominio PromptContent: Generar el contenido
    const contenidoGenerado = await this.contentContract.generarTexto({
      prompt: estrategia.promptContenido,
      tono: 'persuasivo',
    });
    console.log(`Contenido generado: ${contenidoGenerado.id}`);

    // ... aquí iría el paso de "supervisión humana" (aprobación) ...

    // 2. Dominio PromptAds: Crear la campaña con el contenido
    const campaignId = await this.adsContract.crearCampana({
      nombre: estrategia.nombreCampana,
      presupuesto: estrategia.presupuesto,
      segmentacion: estrategia.segmentacion,
      contenidoIds: [contenidoGenerado.id],
      fechaInicio: new Date(),
    });
    console.log(`Campaña creada: ${campaignId}`);

    // 3. Dominio PromptCrm: Preparar la captura de leads
    if (estrategia.objetivo === 'generar_leads') {
      await this.crmContract.configurarCapturaLeads(campaignId);
      console.log(`Captura de leads configurada para campaña ${campaignId}`);
    }

    console.log('Orquestación completada.');
    return { campaignId };
  }
}