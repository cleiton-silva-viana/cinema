import { Result, failure, success } from "../../../../shared/result/result";
import { SimpleFailure } from "../../../../shared/failure/simple.failure.type";
import { TechnicalError } from "../../../../shared/error/technical.error";
import { isNull } from "../../../../shared/validator/validator";
import { Assert } from "../../../../shared/assert/assert";
import { not } from "../../../../shared/assert/not";
import { FailureCode } from "../../../../shared/failure/failure.codes.enum";
import { Validate } from "../../../../shared/validator/validate";

/**
 * Enum que representa os possíveis estados de exibição de um filme
 */
export enum ScreeningStatus {
  /**
   * Filme em pré-venda, ainda não começou a ser exibido
   */
  PRESALE = "presale",

  /**
   * Filme em exibição atualmente
   */
  SHOWING = "showing",

  /**
   * Filme com exibição encerrada
   */
  ENDED = "ended",
}

export interface ICreateDisplayPeriodInput {
  startDate: Date;
  endDate: Date;
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
export class DisplayPeriod {
  private static readonly MIN_DATE_FOR_DISPLAY_PERIOD: Date = new Date();

  /**
   * Número máximo de meses no futuro para a data de início
   */
  private static readonly MAX_START_DATE_MONTHS_AHEAD: number = 2;

  /**
   * Número mínimo de dias entre a data de início e a data de término
   */
  private static readonly MIN_DISPLAY_PERIOD_DAYS: number = 14;

  /**
   * Número máximo de dias entre a data de início e a data de término
   */
  private static readonly MAX_DISPLAY_PERIOD_DAYS: number = 30;

  /**
   * Construtor privado. Use os métodos estáticos `create` ou `hydrate` para instanciar.
   * @param startDate Data de início da exibição
   * @param endDate Data de término da exibição
   */
  private constructor(
    public readonly startDate: Date,
    public readonly endDate: Date,
  ) {}

  /**
   * Cria uma instância de DisplayPeriod com validação
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
   * @returns Result<DisplayPeriod> com sucesso ou falhas de validação
   */
  public static create(startDate: Date, endDate: Date): Result<DisplayPeriod> {
    const failures: SimpleFailure[] = [];

    const maxStartDate = new Date();
    maxStartDate.setMonth(
      maxStartDate.getMonth() + DisplayPeriod.MAX_START_DATE_MONTHS_AHEAD,
    ); // máximo de 2 meses

    Validate.date(startDate)
      .field("startDate")
      .failures(failures)
      .isRequired()
      .isAfter(
        DisplayPeriod.MIN_DATE_FOR_DISPLAY_PERIOD,
        FailureCode.DATE_CANNOT_BE_PAST,
      )
      .isBefore(maxStartDate, FailureCode.DATE_EXCEEDS_MAX_FUTURE_LIMIT)
      .then(() => {
        const minEndDate = new Date(startDate.getTime());
        minEndDate.setDate(
          minEndDate.getDate() + DisplayPeriod.MIN_DISPLAY_PERIOD_DAYS,
        );

        const maxEndDate = new Date(startDate.getTime());
        maxEndDate.setDate(
          maxEndDate.getDate() + DisplayPeriod.MAX_DISPLAY_PERIOD_DAYS,
        );

        Validate.date(endDate)
          .field("endDate")
          .failures(failures)
          .isRequired()
          .isAfter(minEndDate, FailureCode.DATE_WITH_INVALID_SEQUENCE)
          .isBefore(maxEndDate, FailureCode.DATE_EXCEEDS_MAX_FUTURE_LIMIT);
      });

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
      isNull(startDate) || isNull(endDate),
      FailureCode.MISSING_REQUIRED_DATA,
    );
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
   * Verifica se o filme está disponível para exibição dentro do intervalo de datas fornecido
   * @param rangeStart Data de início do intervalo a verificar
   * @param rangeEnd Data de término do intervalo a verificar
   * @returns boolean indicando se está disponível no intervalo
   */
  public isAvailableInRange(rangeStart: Date, rangeEnd: Date): boolean {
    return isNull(rangeStart) || isNull(rangeEnd)
      ? false
      : rangeStart <= this.endDate && rangeEnd >= this.startDate;
  }
}
