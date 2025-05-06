import { BaseValidator } from "./base.validator.ts";
import { FailureCode } from "../failure/failure.codes.enum";

/**
 * Validador para datas
 */
export class DateValidator extends BaseValidator<DateValidator> {
  constructor(value: Date) {
    super(value);
  }

  /**
   * Verifica se a data é posterior à data limite
   * @param limitDate Data limite para comparação
   * @param code Código de erro opcional
   * @param details Detalhes adicionais para a mensagem de erro
   */
  public isAfter(
    limitDate: Date,
    code: string = FailureCode.DATE_NOT_AFTER_LIMIT,
    details: Record<string, any> = {},
  ): DateValidator {
    return this.validate(() => !(this._value.getTime() > limitDate.getTime()), {
      code,
      details: {
        value: this._value.toISOString(),
        limitDate: limitDate?.toISOString(),
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
    code: string = FailureCode.DATE_NOT_BEFORE_LIMIT,
    details: Record<string, any> = {},
  ): DateValidator {
    return this.validate(() =>  !(this._value.getTime() < limitDate.getTime()), {
      code,
      details: {
        value: this._value.toISOString(),
        limitDate: limitDate?.toISOString(),
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
    code: string = FailureCode.DATE_OUT_OF_RANGE,
    details: Record<string, any> = {},
  ): DateValidator {
    return this.validate(
      () => {
        const time = this._value.getTime();
        return !(time >= startDate.getTime() && time <= endDate.getTime());
      },
      {
        code,
        details: {
          value: this._value.toISOString(),
          startDate: startDate?.toISOString(),
          endDate: endDate?.toISOString(),
          ...details,
        },
      },
    );
  }
}
