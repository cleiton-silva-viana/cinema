import { failure, Result, success } from '@shared/result/result'
import { SimpleFailure } from '@shared/failure/simple.failure.type'
import { Validate } from '@shared/validator/validate'
import { FailureFactory } from '@shared/failure/failure.factory'
import { DateUtils } from '@shared/utils/date.utils'

export class MovieFilterDateRange {
  private constructor(
    public readonly startDate: Date,
    public readonly endDate: Date
  ) {}

  /**
   * Número máximo de dias no futuro permitido para a data inicial
   */
  public static readonly MAX_FUTURE_DAYS = 30

  /**
   * Intervalo máximo em dias entre a data inicial e final
   */
  public static readonly MAX_DATE_RANGE_DAYS = 14

  /**
   * Cria um novo intervalo de datas com validação
   */
  public static create(startDate: Date, endDate: Date): Result<MovieFilterDateRange> {
    const failures: SimpleFailure[] = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const maxFutureDate = new Date(today)
    maxFutureDate.setDate(today.getDate() + this.MAX_FUTURE_DAYS)

    Validate.date({ startDate }, failures)
      .isRequired()
      .isAfter(today, () => FailureFactory.DATE_CANNOT_BE_PAST('startDate'))
      .isBefore(maxFutureDate)

    if (failures.length === 0) {
      const maxEndDate = new Date()
      maxEndDate.setDate(maxFutureDate.getDate() + this.MAX_DATE_RANGE_DAYS)

      Validate.date({ endDate }, failures)
        .isRequired()
        .isAfter(startDate, () =>
          FailureFactory.DATE_WITH_INVALID_SEQUENCE(
            DateUtils.formatDateToISOString(startDate),
            DateUtils.formatDateToISOString(endDate)
          )
        )
        .isBefore(maxEndDate)
    }

    if (failures.length > 0) return failure(failures)

    return success(new MovieFilterDateRange(startDate, endDate))
  }

  /**
   * Cria um intervalo de datas padrão (hoje até hoje + 7 dias)
   */
  public static createDefault(): MovieFilterDateRange {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const endDate = new Date(today)
    endDate.setDate(endDate.getDate() + 7)

    return new MovieFilterDateRange(today, endDate)
  }
}
