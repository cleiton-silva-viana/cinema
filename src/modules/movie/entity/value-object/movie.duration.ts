import { Result, failure, success } from "../../../../shared/result/result";
import { SimpleFailure } from "../../../../shared/failure/simple.failure.type";
import { TechnicalError } from "../../../../shared/error/technical.error";
import { isNull } from "../../../../shared/validator/validator";
import { Assert } from "../../../../shared/assert/assert";
import { not } from "../../../../shared/assert/not";
import { is } from "../../../../shared/assert/is";

export const DurationCodes = {
  DURATION_NULL: 'MOVIE_DURATION_NULL',
  DURATION_TOO_SHORT: 'MOVIE_DURATION_TOO_SHORT',
  DURATION_TOO_LONG: 'MOVIE_DURATION_TOO_LONG'
}

/**
 * Value Object que representa a duração de um filme em minutos
 */
export class MovieDuration {
  public static readonly MIN_DURATION = 60; // em minutos
  public static readonly MAX_DURATION = 300; // em minutos

  private constructor(public readonly minutes: number) {}

  /**
   * Cria uma instância de MovieDuration a partir de um valor em minutos
   * @param minutes Duração em minutos
   * @returns Result<MovieDuration>
   */
  public static create(minutes: number): Result<MovieDuration> {
    const failures: SimpleFailure[] = [];

    Assert.untilFirstFailure(
      failures,
      { field: 'duration' },
      not.null(minutes, DurationCodes.DURATION_NULL),
      is.greaterOrEqualTo(minutes, MovieDuration.MIN_DURATION, DurationCodes.DURATION_TOO_SHORT),
      is.lessOrEqualTo(minutes, MovieDuration.MAX_DURATION, DurationCodes.DURATION_TOO_LONG),
    )

    return failures.length > 0
      ? failure(failures)
      : success(new MovieDuration(minutes));
  }

  /**
   * Cria uma instância de MovieDuration diretamente a partir de dados do banco de dados
   * Este método pula as validações para melhor performance
   * @param minutes Duração em minutos
   * @returns MovieDuration
   */
  public static hydrate(minutes: number): MovieDuration {
    TechnicalError.if(isNull(minutes), 'minutes cannot be null or undefined');
    return new MovieDuration(minutes);
  }

  /**
   * Retorna a duração formatada como string (ex: "2h 15min")
   */
  public format(): string {
    const hours = Math.floor(this.minutes / 60);
    const minutes = this.minutes % 60;
    
    if (hours === 0) {
      return `${minutes}min`;
    }
    
    if (minutes === 0) {
      return `${hours}h`;
    }
    
    return `${hours}h ${minutes}min`;
  }
}