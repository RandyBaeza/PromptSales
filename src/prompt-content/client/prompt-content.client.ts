// src/prompt-content/client/prompt-content.client.ts
import { Injectable, Inject } from '@nestjs/common';
import { ITextContentContract, GenerateTextDto, GeneratedTextDto } from '../contracts/text-content.contract';

/**
 * Este es el "Cliente" (Capa Anti-Corrupción) para el dominio PromptContent.
 *
 * Es la única forma en que otros dominios (como PromptSales)
 * deben interactuar con PromptContent.
 */
@Injectable()
export class PromptContentClient {
  constructor(
    // El cliente consume el contrato interno del dominio.
    @Inject('ITextContentContract')
    private readonly textContentService: ITextContentContract,
  ) {}

  /**
   * Llama al dominio PromptContent para generar texto.
   * Oculta la lógica de implementación al consumidor.
   */
  async generarTexto(dto: GenerateTextDto): Promise<GeneratedTextDto> {
    return this.textContentService.generarTexto(dto);
  }

  // ... (aquí irían los otros métodos del contrato, ej. traducirTexto)
}