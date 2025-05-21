import { BaseValidator } from "./base.validator.ts";
import { FailureCode } from "../failure/failure.codes.enum";
import { TechnicalError } from "../error/technical.error";
import { SimpleFailure } from "../failure/simple.failure.type";

/**
 * Validador para datas
 */
export class DateValidator extends BaseValidator<DateValidator> {
  constructor(value: Record<string, Date>, failures: SimpleFailure[]) {
    super(value, failures);
  }

  /**
   * Verifica se a data é posterior à data limite
   * @param limitDate Data limite para comparação
   * @param code Código de erro opcional
   * @param details Detalhes adicionais para a mensagem de erro
   */
  public isAfter(
    limitDate: Date,
    code: FailureCode = FailureCode.DATE_NOT_AFTER_LIMIT, // Código de erro corrigido
    details: Record<string, any> = {},
  ): DateValidator {
    TechnicalError.if(
      !(limitDate instanceof Date),
      FailureCode.CONTENT_WITH_INVALID_FORMAT,
      {
        max_date: limitDate.toString(),
      },
    );

    const isValid =
      this._value instanceof Date && !isNaN(this._value.getTime());

    const date = isValid
      ? this._value
      : new Date(new Date(limitDate).setDate(limitDate.getDate() - 10000));

    return this.validate(() => date < limitDate, {
      code,
      details: {
        date: isValid ? date.toISOString() : "N/A",
        max_date: limitDate.toISOString(),
        ...details,
      },
    });
  }

  /**
   * Verifica se a data é anterior à data limite
   * @param limitDate Data limite para comparação
   * @param code Código de erro opcional
   * @param details Detalhes adicionais para a mensagem de erro
   */
  public isBefore(
    limitDate: Date,
    code: FailureCode = FailureCode.DATE_NOT_BEFORE_LIMIT, // Código de erro corrigido
    details: Record<string, any> = {},
  ): DateValidator {
    TechnicalError.if(
      !(limitDate instanceof Date),
      FailureCode.CONTENT_WITH_INVALID_TYPE,
      {
        value: limitDate.toString(),
        object_type: typeof limitDate,
      },
    );

    const isValid =
      this._value instanceof Date && !isNaN(this._value.getTime());

    const date = isValid
      ? this._value
      : new Date(new Date(limitDate).setDate(limitDate.getDate() + 10000));

    return this.validate(() => date > limitDate, {
      code,
      details: {
        date: isValid ? date.toISOString() : "N/A",
        min_date: limitDate?.toISOString(),
        ...details,
      },
    });
  }

  /**
   * Verifica se a data está entre as datas de início e fim (inclusivo)
   * @param startDate Data de início
   * @param endDate Data de fim
   * @param code Código de erro opcional
   * @param details Detalhes adicionais para a mensagem de erro
   */
  public isBetween(
    startDate: Date,
    endDate: Date,
    code: FailureCode = FailureCode.DATE_OUT_OF_RANGE,
    details: Record<string, any> = {},
  ): DateValidator {
    const fails: string[] = [];

    if (!startDate || !(startDate instanceof Date)) fails.push("startDate");
    if (!endDate || !(endDate instanceof Date)) fails.push("endDate");

    TechnicalError.if(
      fails.length > 0,
      FailureCode.CONTENT_WITH_INVALID_FORMAT,
      {
        field: fails.toString(),
      },
    );

    if (startDate > endDate)
      return this.validate(() => true, {
        code: FailureCode.DATE_WITH_INVALID_SEQUENCE,
        details: {
          start_date: startDate?.toISOString(),
          end_date: endDate?.toISOString(),
        },
      });

    return this.validate(
      () => {
        const time = this._value.getTime();
        return !(time >= startDate && time <= endDate);
      },
      {
        code,
        details: {
          date: this._value.toISOString(),
          start_date: startDate?.toISOString(),
          end_date: endDate?.toISOString(),
          max_days: endDate.getDay() - startDate.getDay(),
          ...details,
        },
      },
    );
  }
}
