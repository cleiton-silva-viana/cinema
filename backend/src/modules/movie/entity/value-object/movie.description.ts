import { LanguageContent } from '@shared/value-object/language-content/language.content'

/**
 * Representa a descrição de um filme em múltiplos idiomas.
 *
 * Esta classe estende MultilingualContent e define regras específicas para
 * validação de descrições de filmes, incluindo:
 * - Comprimento mínimo e máximo do texto
 * - Formato válido através de expressão regular
 *
 * A descrição do filme deve conter entre 48 e 1024 caracteres e pode incluir:
 * - Letras (incluindo acentuadas)
 * - Números
 * - Espaços
 * - Pontuação básica (., ,)
 * - Símbolos comuns (-, _, ?, !, @, #, $, %, &, +, /)
 */
export class MovieDescription extends LanguageContent {
  /**
   * Comprimento mínimo permitido para a descrição do filme (48 caracteres).
   */
  protected static readonly MIN_LENGTH: number = 48

  /**
   * Comprimento máximo permitido para a descrição do filme (1024 caracteres).
   */
  protected static readonly MAX_LENGTH: number = 1024

  /**
   * Expressão regular que define o formato válido para a descrição do filme.
   * Permite letras (com acentos), números, espaços e símbolos comuns.
   */
  protected static readonly FORMAT_REGEX = /^[A-Za-zÀ-ÖØ-öø-ÿ\d\s\-_.,?!@#$%&+\/]+$/
}
