import { FailureCode } from "../failure/failure.codes.enum";
import { BaseValidator } from "./base.validator.ts";

/**
 * Validador para números
 */
export class NumberValidator extends BaseValidator<NumberValidator> {
  constructor(value: number) {
    super(value);
  }

  /**
   * Verifica se o número está dentro do intervalo especificado (inclusivo)
   * @param min Valor mínimo (opcional)
   * @param max Valor máximo (opcional)
   * @param code Código de erro opcional
   * @param details Detalhes adicionais para a mensagem de erro
   */
  public isInRange(
    min: number,
    max: number,
    code: string = FailureCode.VALUE_OUT_OF_RANGE,
    details: Record<string, any> = {}
  ): NumberValidator {
    return this.validate(() => !(this._value >= min && this._value <= max), {
      code,
      details: {
        minValue: min,
        maxValue: max,
        value: this._value,
        ...details
      }
    });
  }

  /**
   * Verifica se o número é menor ou igual ao máximo
   * @param max Valor máximo
   * @param code Código de erro opcional
   * @param details Detalhes adicionais para a mensagem de erro
   */
  public isAtMost(
    max: number,
    code: FailureCode = FailureCode.VALUE_GREATER_THAN_MAX,
    details: Record<string, any> = {}
  ): NumberValidator {
    return this.validate(() => !(this._value <= max), {
      code,
      details: {
        value: this._value,
        maxValue: max,
        ...details
      }
    });
  }

  /**
   * Verifica se o número é maior ou igual ao mínimo
   * @param min Valor mínimo
   * @param code Código de erro opcional
   * @param details Detalhes adicionais para a mensagem de erro
   */
  public isAtLeast(
    min: number,
    code: string = FailureCode.VALUE_LESS_THAN_MIN,
    details: Record<string, any> = {}
  ): NumberValidator {
    return this.validate(() => !(this._value >= min), {
      code,
      details: {
        value: this._value,
        minValue: min,
        ...details
      }
    });
  }

  /**
   * Verifica se o número é positivo (maior que zero)
   * @param code Código de erro opcional
   * @param details Detalhes adicionais para a mensagem de erro
   */
  public isPositive(
    code: string = FailureCode.VALUE_NOT_POSITIVE,
    details: Record<string, any> = {}
  ): NumberValidator {
    return this.validate(() => !(this._value > 0), {
      code,
      details: {
        value: this._value,
        ...details
      }
    });
  }

  /**
   * Verifica se o número é negativo (menor que zero)
   * @param code Código de erro opcional
   * @param details Detalhes adicionais para a mensagem de erro
   */
  public isNegative(
    code: string = FailureCode.VALUE_CANNOT_BE_NEGATIVE,
    details: Record<string, any> = {}
  ): NumberValidator {
    return this.validate(() => !(this._value < 0), {
      code,
      details: {
        value: this._value,
        ...details
      }
    });
  }

  /**
   * Verifica se o número é inteiro
   * @param code Código de erro opcional
   * @param details Detalhes adicionais para a mensagem de erro
   */
  public isInteger(
    code: string = FailureCode.VALUE_NOT_INTEGER,
    details: Record<string, any> = {}
  ): NumberValidator {
    return this.validate(() => !Number.isInteger(this._value), {
      code,
      details: {
        value: this._value,
        ...details
      }
    });
  }
}
