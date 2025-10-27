// src/prompt-content/contracts/text-content.contract.ts
// Basado en el diagrama de contratos

/**
 * DTO (Data Transfer Object) para solicitar la generación de texto.
 */
export interface GenerateTextDto {
  prompt: string;
  longitudMinima?: number;
  tono: 'profesional' | 'casual' | 'persuasivo';
}

/**
 * DTO para la respuesta de texto generado.
 */
export interface GeneratedTextDto {
  id: string; // ID del contenido guardado
  texto: string;
  promptUsado: string;
  tokens: number;
}

/**
 * CONTRATO DE CONTENIDO TEXTUAL
 * Esta interfaz define las capacidades que el dominio 'PromptContent'
 * expone al resto de la aplicación.
 */
export interface ITextContentContract {
  /**
   * Genera un nuevo fragmento de texto basado en un prompt.
   */
  generarTexto(dto: GenerateTextDto): Promise<GeneratedTextDto>;

  /**
   * Traduce un texto existente a otro idioma.
   */
  traducirTexto(textoId: string, idiomaTarget: string): Promise<GeneratedTextDto>;
}