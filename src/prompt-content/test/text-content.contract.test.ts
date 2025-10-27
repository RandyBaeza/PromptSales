// src/prompt-content/test/text-content.contract.test.ts
// Plantilla de prueba de contrato

import { ITextContentContract } from '../contracts/text-content.contract';
import { TextContentService } from '../services/text-content.service';

describe('ITextContentContract (TextContentService Implementation)', () => {
  let service: ITextContentContract;

  beforeEach(() => {
    // Para pruebas de contrato, usamos una implementación real (o un mock fiel).
    service = new TextContentService();
  });

  it('debe cumplir con el contrato de generarTexto', async () => {
    const result = await service.generarTexto({
      prompt: 'Hola mundo',
      tono: 'casual',
    });

    // Verificamos que la respuesta CUMPLE con la forma del DTO
    expect(result).toBeDefined();
    expect(result.id).toEqual(expect.any(String));
    expect(result.texto).toContain('Hola mundo');
    expect(result.tokens).toBeGreaterThan(0);
  });
});