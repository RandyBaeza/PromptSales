// src/prompt-ads/services/audience.service.ts
// Plantilla de servicio interno (para prueba unitaria)

import { Injectable } from '@nestjs/common';

@Injectable()
export class AudienceService {
  /**
   * Lógica de negocio interna para calcular el tamaño de una audiencia.
   * Esto NO es parte del contrato público.
   */
  calculateAudienceSize(segmentacion: { paises: string[]; intereses: string[] }): number {
    let size = 25000; // Base
    if (segmentacion.paises.includes('CR')) {
      size += 10000;
    }
    if (segmentacion.intereses.includes('tecnologia')) {
      size *= 1.2;
    }
    return Math.floor(size);
  }
}