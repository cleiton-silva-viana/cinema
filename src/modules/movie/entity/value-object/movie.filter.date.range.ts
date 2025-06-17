import { failure, Result, success } from '@shared/result/result'
import { SimpleFailure } from '@shared/failure/simple.failure.type'
import { Validate } from '@shared/validator/validate'
import { FailureFactory } from '@shared/failure/failure.factory'
import { DateHelper } from '@shared/helper/date.helper'

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
   * Intervalo padrão utilizado pelo método createDefault
   * */
  public static readonly DEFAULT_DATE_RANGE_DAYS = 7

  /**
   * Cria um novo intervalo de datas com validação
   */
  public static create(startDate: Date, endDate: Date): Result<MovieFilterDateRange> {
    const today = DateHelper.startOfDay(new Date())
    const failures: SimpleFailure[] = []

    const maxFutureDate = DateHelper.endOfDay(DateHelper.addDays(this.MAX_FUTURE_DAYS, today))

    /*
      Abordagem que deve ser utilizada!

       return (Validate
        .date({startDate}, failures)
        .isRequired()
        .isAfter(today, () => FailureFactory.DATE_CANNOT_BE_PAST('startDate'))
        .isBefore(maxFutureDate))
          .map(() => {
            const maxEndDate = DateHelper.addDays(this.MAX_FUTURE_DAYS, today)
            Validate.date({endDate}, failures)
                .isRequired()
                .isAfter(startDate, () => FailureFactory.DATE_WITH_INVALID_SEQUENCE(DateHelper.formatDateToISOString(startDate), DateHelper.formatDateToISOString(endDate)))
                .isBefore(maxEndDate)
          })
          .fold((result) => {
            onFailure: (failures) => failure(failures)
            onSuccess: new MovieFilterDateRange(startDate, endDate)
          })*/

    Validate.date({ startDate }, failures)
      .isRequired()
      .isAfter(today, () => FailureFactory.DATE_CANNOT_BE_PAST('startDate'))
      .isBefore(maxFutureDate)
      .then(() => {
        const maxEndDate = DateHelper.addDays(this.MAX_FUTURE_DAYS, today)
        Validate.date({ endDate }, failures)
          .isRequired()
          .when(endDate != null, () => {
            Validate.date({ endDate }, failures)
              .isAfter(startDate, () =>
                FailureFactory.DATE_WITH_INVALID_SEQUENCE(
                  DateHelper.formatDateToISOString(startDate),
                  DateHelper.formatDateToISOString(endDate)
                )
              )
              .isBefore(maxEndDate)
              .isBefore(DateHelper.addDays(MovieFilterDateRange.MAX_DATE_RANGE_DAYS, startDate), () =>
                FailureFactory.DATE_RANGE_TOO_LARGE(MovieFilterDateRange.MAX_DATE_RANGE_DAYS)
              )
          })
      })

    return failures.length > 0 ? failure(failures) : success(new MovieFilterDateRange(startDate, endDate))
  }

  /**
   * Cria um intervalo de datas padrão (hoje até hoje + 7 dias)
   */
  public static createDefault(): MovieFilterDateRange {
    const today = DateHelper.startOfDay(new Date())
    const endDate = DateHelper.endOfDay(DateHelper.soon(MovieFilterDateRange.DEFAULT_DATE_RANGE_DAYS))
    return new MovieFilterDateRange(today, endDate)
  }
}
