import { Result, failure, success } from "../../../../shared/result/result";
import { SimpleFailure } from "../../../../shared/failure/simple.failure.type";
import { TechnicalError } from "../../../../shared/error/technical.error";
import { isNull } from "../../../../shared/validator/validator";
import { Assert } from "../../../../shared/assert/assert";
import { not } from "../../../../shared/assert/not";
import { is } from "../../../../shared/assert/is";
import { FailureCode } from "../../../../shared/failure/failure.codes.enum";
import { Validate } from "../../../../shared/validator/validate";

/**
 * Value Object que representa a duração de um filme em minutos.
 *
 * Esta classe encapsula as regras de negócio relacionadas à duração de filmes:
 * - Duração mínima de 60 minutos (1 hora)
 * - Duração máxima de 300 minutos (5 horas)
 *
 * Características:
 * - Imutável: todas as propriedades são readonly
 * - Validação na criação: use o método estático create() para instanciar com validação
 * - Hidratação: use o método hydrate() para instanciar a partir de dados já validados
 */
export class MovieDuration {
  /**
   * Duração mínima permitida para um filme em minutos (1 hora)
   */
  public static readonly MIN_DURATION = 60;

  /**
   * Duração máxima permitida para um filme em minutos (5 horas)
   */
  public static readonly MAX_DURATION = 300;

  /**
   * Construtor privado. Use os métodos estáticos `create` ou `hydrate` para instanciar.
   * @param minutes Duração em minutos
   * @private
   */
  private constructor(public readonly minutes: number) {}

  /**
   * Cria uma instância de MovieDuration a partir de um valor em minutos, com validação completa.
   *
   * Validações realizadas:
   * - Verifica se o valor não é nulo
   * - Verifica se a duração é maior ou igual a 60 minutos (MIN_DURATION)
   * - Verifica se a duração é menor ou igual a 300 minutos (MAX_DURATION)
   *
   * @param minutes Duração em minutos
   * @returns Result<MovieDuration> contendo a instância criada ou falhas de validação
   */
  public static create(minutes: number): Result<MovieDuration> {
    const failures: SimpleFailure[] = [];

    Validate.number(minutes)
      .field("minutes")
      .failures(failures)
      .isRequired()
      .isInteger()
      .isAtLeast(
        MovieDuration.MIN_DURATION,
        FailureCode.MOVIE_DURATION_TOO_SHORT,
      )
      .isAtMost(
        MovieDuration.MAX_DURATION,
        FailureCode.MOVIE_DURATION_TOO_LONG,
      );

    return failures.length > 0
      ? failure(failures)
      : success(new MovieDuration(minutes));
  }

  /**
   * Cria uma instância de MovieDuration diretamente a partir de dados do banco de dados.
   * Este método realiza apenas validação básica (não nulo) e é otimizado para performance.
   *
   * @param minutes Duração em minutos
   * @returns MovieDuration - Uma nova instância de MovieDuration
   * @throws TechnicalError com código NULL_ARGUMENT se minutes for nulo
   */
  public static hydrate(minutes: number): MovieDuration {
    TechnicalError.if(isNull(minutes), FailureCode.MISSING_REQUIRED_DATA);
    return new MovieDuration(minutes);
  }

  /**
   * Retorna a duração formatada como string no formato "Xh Ymin".
   *
   * Exemplos:
   * - 90 minutos: "1h 30min"
   * - 60 minutos: "1h"
   * - 30 minutos: "30min"
   *
   * @returns String formatada representando a duração
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
