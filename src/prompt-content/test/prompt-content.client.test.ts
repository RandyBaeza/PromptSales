// src/prompt-content/test/prompt-content.client.test.ts
// Esta es la PRUEBA DE CLIENTE (Integración)

import { PromptContentClient } from '../client/prompt-content.client';
import { ITextContentContract } from '../contracts/text-content.contract';
import { TextContentService } from '../services/text-content.service'; // Implementación real

describe('PromptContentClient (Integration Test)', () => {
  let client: PromptContentClient;
  let service: ITextContentContract;

  beforeEach(() => {
    // Para una prueba de integración, inyectamos la implementación REAL
    // del servicio en el cliente.
    service = new TextContentService(); 
    client = new PromptContentClient(service);
  });

  it('debe llamar al servicio y retornar texto generado', async () => {
    const result = await client.generarTexto({
      prompt: 'Test de cliente',
      tono: 'profesional',
    });

    // Verificamos que el cliente (y el servicio detrás de él) funcionan
    expect(result).toBeDefined();
    expect(result.id).toEqual(expect.any(String));
    expect(result.texto).toContain('Test de cliente');
  });
});