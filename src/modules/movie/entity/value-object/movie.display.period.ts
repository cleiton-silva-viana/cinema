import { failure, Result, success } from '@shared/result/result'
import { SimpleFailure } from '@shared/failure/simple.failure.type'
import { TechnicalError } from '@shared/error/technical.error'
import { isNull } from '@shared/validator/validator'
import { FailureCode } from '@shared/failure/failure.codes.enum'
import { Validate } from '@shared/validator/validate'

/**
 * Enum que representa os possíveis estados de exibição de um filme
 */
export enum ScreeningStatus {
  /**
   * Filme em pré-venda, ainda não começou a ser exibido
   */
  PRESALE = 'PRESALE',

  /**
   * Filme em exibição atualmente
   */
  SHOWING = 'SHOWING',

  /**
   * Filme com exibição encerrada
   */
  ENDED = 'ENDED',
}

export interface ICreateMovieDisplayPeriodInput {
  startDate: Date
  endDate: Date
}

/**
 * Value Object que representa o período de exibição de um filme
 *
 * Regras de negócio:
 * - A data de início não pode ser no passado
 * - A data de início não pode ser mais de 2 meses no futuro
 * - A data de término deve ser pelo menos 14 dias após a data de início
 * - A data de término não pode ser mais de 30 dias após a data de início
 */
export class MovieDisplayPeriod {
  private static readonly MIN_DATE_FOR_DISPLAY_PERIOD: Date = new Date()

  /**
   * Número máximo de meses no futuro para a data de início
   */
  private static readonly MAX_START_DATE_MONTHS_AHEAD: number = 2

  /**
   * Número mínimo de dias entre a data de início e a data de término
   */
  private static readonly MIN_DISPLAY_PERIOD_DAYS: number = 14

  /**
   * Número máximo de dias entre a data de início e a data de término
   */
  private static readonly MAX_DISPLAY_PERIOD_DAYS: number = 30

  /**
   * Construtor privado. Use os métodos estáticos `create` ou `hydrate` para instanciar.
   * @param startDate Data de início da exibição
   * @param endDate Data de término da exibição
   */
  private constructor(
    public readonly startDate: Date,
    public readonly endDate: Date
  ) {}

  /**
   * Determina o status de exibição com base nas datas
   * @returns ScreeningStatus
   */
  get screeningStatus(): ScreeningStatus {
    const now = new Date()

    if (now < this.startDate) {
      return ScreeningStatus.PRESALE
    }

    if (now > this.endDate) {
      return ScreeningStatus.ENDED
    }

    return ScreeningStatus.SHOWING
  }

  /**
   * Verifica se o período está ativo atualmente
   * @returns boolean
   */
  get isActive(): boolean {
    const now = new Date()
    return now >= this.startDate && now <= this.endDate
  }

  /**
   * Verifica se o período já terminou
   * @returns boolean
   */
  get hasEnded(): boolean {
    return new Date() > this.endDate
  }

  /**
   * Verifica se o período ainda não começou
   * @returns boolean
   */
  get hasNotStarted(): boolean {
    return new Date() < this.startDate
  }

  /**
   * Cria uma instância de MovieDisplayPeriod com validação
   *
   * Regras de validação:
   * - A data de início não pode ser nula
   * - A data de início não pode ser no passado
   * - A data de início não pode ser mais de 2 meses no futuro
   * - A data de término não pode ser nula
   * - A data de término deve ser pelo menos 14 dias após a data de início
   * - A data de término não pode ser mais de 30 dias após a data de início
   *
   * @param startDate Data de início da exibição
   * @param endDate Data de término da exibição
   * @returns Result<MovieDisplayPeriod> com sucesso ou falhas de validação
   */
  public static create(startDate: Date, endDate: Date): Result<MovieDisplayPeriod> {
    const failures: SimpleFailure[] = []

    const maxStartDate = new Date()
    maxStartDate.setMonth(maxStartDate.getMonth() + MovieDisplayPeriod.MAX_START_DATE_MONTHS_AHEAD)

    Validate.date({ startDate }, failures)
      .isRequired()
      .isAfter(MovieDisplayPeriod.MIN_DATE_FOR_DISPLAY_PERIOD, FailureCode.DATE_CANNOT_BE_PAST)
      .isBefore(maxStartDate)
      .then(() => {
        const minEndDate = new Date(startDate.getTime())
        minEndDate.setDate(minEndDate.getDate() + MovieDisplayPeriod.MIN_DISPLAY_PERIOD_DAYS)

        const maxEndDate = new Date(startDate.getTime())
        maxEndDate.setDate(maxEndDate.getDate() + MovieDisplayPeriod.MAX_DISPLAY_PERIOD_DAYS)

        Validate.date({ endDate }, failures)
          .isRequired()
          .isAfter(minEndDate, FailureCode.DATE_WITH_INVALID_SEQUENCE)
          .isBefore(maxEndDate)
      })

    return failures.length > 0 ? failure(failures) : success(new MovieDisplayPeriod(startDate, endDate))
  }

  /**
   * Cria uma instância de MovieDisplayPeriod diretamente a partir de dados do banco de dados
   * @param startDate Data de início da exibição
   * @param endDate Data de término da exibição
   * @returns MovieDisplayPeriod
   */
  public static hydrate(startDate: Date, endDate: Date): MovieDisplayPeriod {
    TechnicalError.if(isNull(startDate) || isNull(endDate), FailureCode.MISSING_REQUIRED_DATA)
    return new MovieDisplayPeriod(startDate, endDate)
  }

  /**
   * Verifica se o filme está disponível para exibição dentro do intervalo de datas fornecido
   * @param rangeStart Data de início do intervalo a verificar
   * @param rangeEnd Data de término do intervalo a verificar
   * @returns boolean indicando se está disponível no intervalo
   */
  public isAvailableInRange(rangeStart: Date, rangeEnd: Date): boolean {
    return isNull(rangeStart) || isNull(rangeEnd) ? false : rangeStart <= this.endDate && rangeEnd >= this.startDate
  }
}
