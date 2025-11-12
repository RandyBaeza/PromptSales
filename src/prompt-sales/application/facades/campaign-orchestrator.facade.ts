// src/prompt-sales/application/facades/campaign-orchestrator.facade.ts

import { Injectable, Inject } from '@nestjs/common';
import { PromptContentClient } from '../../prompt-content/client/prompt-content.client';
import { PromptAdsClient } from '../../prompt-ads/client/prompt-ads.client';
import { PromptCrmClient } from '../../prompt-crm/client/prompt-crm.client';

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
 * Cumple el requisito de "crear facades"
 * Orquesta llamadas a múltiples dominios (Content, Ads, Crm)
 * usando la Capa de Cliente.
 */
@Injectable()
export class CampaignOrchestratorFacade {
  constructor(
    private readonly contentClient: PromptContentClient,
    private readonly adsClient: PromptAdsClient,
    private readonly crmClient: PromptCrmClient,
  ) {}

  /**
   * Lanza una estrategia de mercadeo completa.
   * @param estrategiloa La estrategia diseñada por el usuario en el portal.
   */
  async lanzarEstrategia(estrategia: EstrategiaDto): Promise<{ campaignId: string }> {
    console.log('Iniciando orquestación de estrategia...');

    // 1. Dominio PromptContent (vía Cliente)
    const contenidoGenerado = await this.contentClient.generarTexto({
      prompt: estrategia.promptContenido,
      tono: 'persuasivo',
    });
    console.log(`Contenido generado: ${contenidoGenerado.id}`);

    // ... aquí iría el paso de "supervisión humana" (aprobación) ...

    // 2. Dominio PromptAds (vía Cliente)
    const campaignId = await this.adsClient.crearCampana({
      nombre: estrategia.nombreCampana,
      presupuesto: estrategia.presupuesto,
      segmentacion: estrategia.segmentacion,
      contenidoIds: [contenidoGenerado.id],
      fechaInicio: new Date(),
    });
    console.log(`Campaña creada: ${campaignId}`);

    // 3. Dominio PromptCrm (vía Cliente)
    if (estrategia.objetivo === 'generar_leads') {
      await this.crmClient.configurarCapturaLeads(campaignId);
      console.log(`Captura de leads configurada para campaña ${campaignId}`);
    }

    console.log('Orquestación completada.');
    return { campaignId };
  }
}