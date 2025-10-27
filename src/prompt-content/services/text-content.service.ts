// src/prompt-content/services/text-content.service.ts
// Plantilla de implementación (Mock) para que las pruebas funcionen.

import { Injectable } from '@nestjs/common';
import { ITextContentContract, GenerateTextDto, GeneratedTextDto } from '../contracts/text-content.contract';

@Injectable()
export class TextContentService implements ITextContentContract {
  
  async generarTexto(dto: GenerateTextDto): Promise<GeneratedTextDto> {
    console.log(`Mock Service: Generando texto para prompt: ${dto.prompt}`);
    return {
      id: `txt_${Math.random().toString(36).substring(2, 9)}`,
      texto: `Este es un texto generado para: ${dto.prompt}`,
      promptUsado: dto.prompt,
      tokens: Math.floor(dto.prompt.length / 4),
    };
  }

  async traducirTexto(textoId: string, idiomaTarget: string): Promise<GeneratedTextDto> {
    console.log(`Mock Service: Traduciendo texto ${textoId} a ${idiomaTarget}`);
    return {
      id: `txt_${Math.random().toString(36).substring(2, 9)}`,
      texto: 'This is a translated text.',
      promptUsado: `Traducir ${textoId}`,
      tokens: 5,
    };
  }
}