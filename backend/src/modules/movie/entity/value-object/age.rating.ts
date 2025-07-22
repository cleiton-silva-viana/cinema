import { TechnicalError } from '@shared/error/technical.error'
import { Result, success } from '@shared/result/result'
import { parseToEnum } from '@shared/validator/utils/validation.helpers'

/**
 * Enumeração que representa a Classificação Etária dos Filmes de acordo com o padrão brasileiro.
 */
export enum AgeRatingEnum {
  /** Livre para todos os públicos */
  L = 'L',
  /** Não recomendado para menores de 10 anos */
  TEN = '10',
  /** Não recomendado para menores de 12 anos */
  TWELVE = '12',
  /** Não recomendado para menores de 14 anos */
  FOURTEEN = '14',
  /** Não recomendado para menores de 16 anos */
  SIXTEEN = '16',
  /** Não recomendado para menores de 18 anos */
  EIGHTEEN = '18',
}

/**
 * Value Object que representa a classificação etária de um filme.
 * Encapsula as regras de negócio relacionadas à classificação etária.
 */
export class AgeRating {
  private static readonly ageRanges = [
    { rating: AgeRatingEnum.L, min: 0 },
    { rating: AgeRatingEnum.TEN, min: 10 },
    { rating: AgeRatingEnum.TWELVE, min: 12 },
    { rating: AgeRatingEnum.FOURTEEN, min: 14 },
    { rating: AgeRatingEnum.SIXTEEN, min: 16 },
    { rating: AgeRatingEnum.EIGHTEEN, min: 18 },
  ]

  private constructor(public readonly value: AgeRatingEnum) {}

  /**
   * Retorna a idade mínima para esta classificação.
   * @returns number
   */
  public get minimumAge(): number {
    return AgeRating.ageRanges.find((r) => r.rating === this.value)?.min || 0
  }

  /**
   * Cria uma instância de AgeRating a partir de uma string.
   * @param rating String representando a classificação etária
   * @returns AgeRating
   */
  public static create(rating: string): Result<AgeRating> {
    const result = parseToEnum('age_rating', rating, AgeRatingEnum)
    if (result.isInvalid()) return result
    return success(new AgeRating(result.value))
  }

  /**
   * Cria uma instância padrão de AgeRating (Livre).
   * @returns Result<AgeRating>
   */
  public static createDefault(): AgeRating {
    return new AgeRating(AgeRatingEnum.L)
  }

  /**
   * Cria uma instância de AgeRating a partir de uma string, sem validação.
   * Usado para hidratar objetos do banco de dados.
   *
   * @param rating String representando a classificação etária
   * @returns AgeRating
   * @throws TechnicalError se o rating for nulo
   */
  public static hydrate(rating: string): AgeRating {
    TechnicalError.validateRequiredFields({ rating })
    return new AgeRating(rating as AgeRatingEnum)
  }

  /**
   * Verifica se uma pessoa com determinada idade pode assistir a um filme com esta classificação.
   * @param age Idade da pessoa
   * @returns boolean
   */
  public canWatch(age: number): boolean {
    if (this.value === AgeRatingEnum.L) return true

    const minAge = AgeRating.ageRanges.find((r) => r.rating === this.value)?.min || 0
    return age >= minAge
  }
}
