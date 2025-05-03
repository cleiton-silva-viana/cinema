import { UID } from "../../../../shared/value-object/uid";

/**
 * Representa um identificador único para entidades de Filme.
 *
 * Esta classe estende a classe base UID e define um prefixo específico
 * para identificadores de filmes. Os identificadores gerados terão o formato:
 * "MOVIE_" seguido por um UUID v4.
 *
 * Exemplo: "MOVIE_550e8400-e29b-41d4-a716-446655440000"
 *
 * Características:
 * - Imutável: todas as propriedades são readonly
 * - Identificável: cada filme possui um identificador único
 * - Validado: garante que o formato do identificador seja válido
 */
export class MovieUID extends UID {
  /**
   * Prefixo usado para identificar UIDs de filmes.
   * Este prefixo é concatenado com um UUID para formar o identificador completo.
   */
  protected static readonly PREFIX: string = "MOVIE";
}
