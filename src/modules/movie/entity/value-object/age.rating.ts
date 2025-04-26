import { TechnicalError } from "../../../../shared/error/technical.error";
import { failure, Result, success } from "../../../../shared/result/result";
import { isNull } from "../../../../shared/validator/validator";

/**
 * Enumeração que representa a Classificação Etária dos Filmes de acordo com o padrão brasileiro.
 */
export enum AgeRatingEnum {
  /** Livre para todos os públicos */
  L = "L",
  /** Não recomendado para menores de 10 anos */
  Ten = "10",
  /** Não recomendado para menores de 12 anos */
  Twelve = "12",
  /** Não recomendado para menores de 14 anos */
  Fourteen = "14",
  /** Não recomendado para menores de 16 anos */
  Sixteen = "16",
  /** Não recomendado para menores de 18 anos */
  Eighteen = "18",
}

/**
 * Value Object que representa a classificação etária de um filme.
 * Encapsula as regras de negócio relacionadas à classificação etária.
 */
export class AgeRating {
  private static readonly ageRanges = [
    { rating: AgeRatingEnum.L, min: 0 },
    { rating: AgeRatingEnum.Ten, min: 10 },
    { rating: AgeRatingEnum.Twelve, min: 12 },
    { rating: AgeRatingEnum.Fourteen, min: 14 },
    { rating: AgeRatingEnum.Sixteen, min: 16 },
    { rating: AgeRatingEnum.Eighteen, min: 18 },
  ];

  private constructor(public readonly value: AgeRatingEnum) {}

  // Tem que ser refatorado!
  /**
   * Cria uma instância de AgeRating a partir de uma string.
   * @param rating String representando a classificação etária
   * @returns AgeRating
   */
  public static create(rating: string): Result<AgeRating> {
    const isInvalid = !Object.values(AgeRatingEnum).includes(
      rating as AgeRatingEnum,
    );

    if (isInvalid) {
      return failure({
        code: "INVALID_AGE_RATING",
        details: {
          value: rating,
          validOptions: Object.values(AgeRatingEnum),
        },
      });
    }

    return success(new AgeRating(rating as AgeRatingEnum));
  }

  // Adicionar documentação
  public static hydrate(rating: string): AgeRating {
    TechnicalError.if(isNull(rating), "NULL_ARGUMENT", { field: "rating" });

    return new AgeRating(rating as AgeRatingEnum);
  }

  /**
   * Verifica se uma pessoa com determinada idade pode assistir a um filme com esta classificação.
   * @param age Idade da pessoa
   * @returns boolean
   */
  public canWatch(age: number): boolean {
    if (this.value === AgeRatingEnum.L) return true;

    const minAge =
      AgeRating.ageRanges.find((r) => r.rating === this.value)?.min || 0;
    return age >= minAge;
  }

  /**
   * Retorna a idade mínima para esta classificação.
   * @returns number
   */
  public get minimumAge(): number {
    return AgeRating.ageRanges.find((r) => r.rating === this.value)?.min || 0;
  }
}
