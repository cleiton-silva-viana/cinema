import { MultilingualContent } from '@shared/value-object/multilingual-content'

/**
 * Representa o título de um filme em múltiplos idiomas.
 *
 * Esta classe estende MultilingualContent e define regras específicas para
 * validação de títulos de filmes, incluindo:
 * - Comprimento mínimo e máximo do texto
 * - Formato válido através de expressão regular
 *
 * O título do filme deve conter entre 8 e 124 caracteres e pode incluir:
 * - Letras (incluindo acentuadas)
 * - Números
 * - Espaços
 * - Pontuação básica (., ,)
 * - Símbolos comuns (-, _, ?, !, @, #, $, %, &, +, /)
 */
export class MovieTitle extends MultilingualContent {
  /**
   * Comprimento mínimo permitido para o título do filme (8 caracteres).
   */
  protected static readonly MIN_LENGTH: number = 8

  /**
   * Comprimento máximo permitido para o título do filme (124 caracteres).
   */
  protected static readonly MAX_LENGTH: number = 124

  /**
   * Expressão regular que define o formato válido para o título do filme.
   * Permite letras (com acentos), números, espaços e símbolos comuns.
   */
  protected static readonly FORMAT_REGEX = /^[A-Za-zÀ-ÖØ-öø-ÿ\d\s\-_.,?!@#$%&+\/]+$/
}
