import { Result, failure, success } from "../../../../shared/result/result";
import { SimpleFailure } from "../../../../shared/failure/simple.failure.type";
import { TechnicalError } from "../../../../shared/error/technical.error";
import { isNull } from "../../../../shared/validator/validator";
import { Assert } from "../../../../shared/assert/assert";
import { not } from "../../../../shared/assert/not";

export enum ScreeningStatus {
  PRESALE = "presale",
  SHOWING = "showing",
  ENDED = "ended",
}

export const DisplayPeriodCodes = {
  DATE_IS_NOT_PROVIDED: "DATE_IS_NOT_PROVIDED",
  PAST_START_DATE: "MOVIE_DISPLAY_PERIOD_PAST_START",
  LONG_TERM_FOR_END_DATE: "LONG_TERM_FOR_END_DATE",
  INVALID_DATE_RANGE: "MOVIE_DISPLAY_PERIOD_INVALID_RANGE",
};

/**
 * Value Object que representa o período de exibição de um filme
 */
export class DisplayPeriod {
  private static readonly MIN_DATE_FOR_DISPLAY_PERIOD: Date = new Date();

  private constructor(
    public readonly startDate: Date,
    public readonly endDate: Date,
  ) {}

  /**
   * Cria uma instância de DisplayPeriod com validação
   * @param startDate Data de início da exibição
   * @param endDate Data de término da exibição
   * @returns Result<DisplayPeriod>
   */
  public static create(startDate: Date, endDate: Date): Result<DisplayPeriod> {
    const failures: SimpleFailure[] = [];

    const maxStartDate = new Date();
    maxStartDate.setMonth(maxStartDate.getMonth() + 2); // máximo de 2 meses

    Assert.untilFirstFailure(
      failures,
      { field: "startDate" },
      not.null(startDate, DisplayPeriodCodes.DATE_IS_NOT_PROVIDED),
      not.dateBefore(
        startDate,
        DisplayPeriod.MIN_DATE_FOR_DISPLAY_PERIOD,
        DisplayPeriodCodes.PAST_START_DATE,
      ),
      not.dateAfter(
        startDate,
        maxStartDate,
        DisplayPeriodCodes.LONG_TERM_FOR_END_DATE,
      ),
    );

    if (failures.length === 0 && startDate) {
      const minEndDate = new Date(startDate.getTime());
      minEndDate.setDate(minEndDate.getDate() + 14); // minimum 2 weeks from start

      const maxEndDate = new Date(startDate.getTime());
      maxEndDate.setDate(maxEndDate.getDate() + 30); // maximum 1 month from start

      Assert.untilFirstFailure(
        failures,
        { field: "endDate" },
        not.null(endDate, DisplayPeriodCodes.DATE_IS_NOT_PROVIDED),
        not.dateBefore(
          endDate,
          minEndDate,
          DisplayPeriodCodes.INVALID_DATE_RANGE,
        ),
        not.dateAfter(
          endDate,
          maxEndDate,
          DisplayPeriodCodes.LONG_TERM_FOR_END_DATE,
        ),
      );
    }

    return failures.length > 0
      ? failure(failures)
      : success(new DisplayPeriod(startDate, endDate));
  }

  /**
   * Cria uma instância de DisplayPeriod diretamente a partir de dados do banco de dados
   * @param startDate Data de início da exibição
   * @param endDate Data de término da exibição
   * @returns DisplayPeriod
   */
  public static hydrate(startDate: Date, endDate: Date): DisplayPeriod {
    TechnicalError.if(
      isNull(startDate),
      "startDate cannot be null or undefined",
    );
    TechnicalError.if(isNull(endDate), "endDate cannot be null or undefined");
    return new DisplayPeriod(startDate, endDate);
  }

  /**
   * Determina o status de exibição com base nas datas
   * @returns ScreeningStatus
   */
  public getScreeningStatus(): ScreeningStatus {
    const now = new Date();

    if (now < this.startDate) {
      return ScreeningStatus.PRESALE;
    }

    if (now > this.endDate) {
      return ScreeningStatus.ENDED;
    }

    return ScreeningStatus.SHOWING;
  }

  /**
   * Verifica se o período está ativo atualmente
   * @returns boolean
   */
  public isActive(): boolean {
    const now = new Date();
    return now >= this.startDate && now <= this.endDate;
  }

  /**
   * Verifica se o período já terminou
   * @returns boolean
   */
  public hasEnded(): boolean {
    return new Date() > this.endDate;
  }

  /**
   * Verifica se o período ainda não começou
   * @returns boolean
   */
  public hasNotStarted(): boolean {
    return new Date() < this.startDate;
  }

  /**
   * Checks if the movie is available for screening within the given date range
   * @param rangeStart Start date of the range to check
   * @param rangeEnd End date of the range to check
   * @returns boolean
   */
  public isAvailableInRange(rangeStart: Date, rangeEnd: Date): boolean {
    return isNull(rangeStart) || isNull(rangeEnd)
      ? false
      : rangeStart <= this.endDate && rangeEnd >= this.startDate;
  }
}
