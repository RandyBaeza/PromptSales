// src/prompt-ads/test/audience-segmentation.unit.test.ts
// Plantilla de prueba unitaria

import { AudienceService } from '../services/audience.service';

describe('AudienceService (Unit Test)', () => {
  let service: AudienceService;

  beforeEach(() => {
    // En una prueba unitaria, NO usamos dependencias reales.
    service = new AudienceService();
  });

  it('debe calcular el tamaño de audiencia para CR + tech', () => {
    const segmentacion = {
      paises: ['CR'],
      intereses: ['tecnologia'],
    };
    
    const estimatedSize = service.calculateAudienceSize(segmentacion);

    // Verificamos la lógica de negocio interna
    expect(estimatedSize).toBe(42000); // (25000 + 10000) * 1.2
  });

  it('debe calcular el tamaño de audiencia base', () => {
    const segmentacion = {
      paises: ['MX'],
      intereses: ['comida'],
    };
    
    const estimatedSize = service.calculateAudienceSize(segmentacion);
    expect(estimatedSize).toBe(25000);
  });
});