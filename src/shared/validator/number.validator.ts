import { FailureCode } from '../failure/failure.codes.enum'
import { BaseValidator } from './base.validator.ts'
import { SimpleFailure } from '../failure/simple.failure.type'

/**
 * Validador para números
 */
export class NumberValidator extends BaseValidator<NumberValidator> {
  constructor(value: Record<string, number>, failures: SimpleFailure[]) {
    super(value, failures)
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
    code: FailureCode = FailureCode.VALUE_OUT_OF_RANGE,
    details: Record<string, any> = {}
  ): NumberValidator {
    return this.validate(() => !(this._value >= min && this._value <= max), {
      code,
      details: {
        value: this._value,
        min_value: min,
        max_value: max,
        ...details,
      },
    })
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
        max_value: max,
        ...details,
      },
    })
  }

  /**
   * Verifica se o número é maior ou igual ao mínimo
   * @param min Valor mínimo
   * @param code Código de erro opcional
   * @param details Detalhes adicionais para a mensagem de erro
   */
  public isAtLeast(
    min: number,
    code: FailureCode = FailureCode.VALUE_LESS_THAN_MIN,
    details: Record<string, any> = {}
  ): NumberValidator {
    return this.validate(() => !(this._value >= min), {
      code,
      details: {
        value: this._value,
        min_value: min,
        ...details,
      },
    })
  }

  /**
   * Verifica se o número é positivo (maior que zero)
   * @param code Código de erro opcional
   * @param details Detalhes adicionais para a mensagem de erro
   */
  public isPositive(
    code: FailureCode = FailureCode.VALUE_NOT_POSITIVE,
    details: Record<string, any> = {}
  ): NumberValidator {
    return this.validate(() => !(this._value > 0), {
      code,
      details: {
        value: this._value,
        ...details,
      },
    })
  }

  /**
   * Verifica se o número é negativo (menor que zero)
   * @param code Código de erro opcional
   * @param details Detalhes adicionais para a mensagem de erro
   */
  public isNegative(
    code: FailureCode = FailureCode.VALUE_CANNOT_BE_NEGATIVE,
    details: Record<string, any> = {}
  ): NumberValidator {
    return this.validate(() => !(this._value < 0), {
      code,
      details: {
        value: this._value,
        ...details,
      },
    })
  }

  /**
   * Verifica se o número é inteiro
   * @param code Código de erro opcional
   * @param details Detalhes adicionais para a mensagem de erro
   */
  public isInteger(
    code: FailureCode = FailureCode.VALUE_NOT_INTEGER,
    details: Record<string, any> = {}
  ): NumberValidator {
    return this.validate(() => !Number.isInteger(this._value), {
      code,
      details: {
        value: this._value,
        ...details,
      },
    })
  }
}
