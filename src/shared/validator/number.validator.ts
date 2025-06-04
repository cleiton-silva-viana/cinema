import { SimpleFailure } from '../failure/simple.failure.type'
import { AbstractValidator } from './abstract.validator'
import { FailureFactory } from '../failure/failure.factory'

/**
 * `NumberValidator` é uma classe que estende `AbstractValidator` para fornecer métodos de validação específicos para números.
 * Ela permite verificar se um número está dentro de um intervalo, é maior ou menor que um valor, é positivo, negativo ou inteiro.
 */
export class NumberValidator extends AbstractValidator<NumberValidator> {
  /**
   * Cria uma instância de `NumberValidator`.
   * @param value O valor numérico a ser validado, encapsulado em um objeto com o nome do campo.
   * @param failures Um array onde as falhas de validação serão adicionadas.
   */
  constructor(value: Record<string, number>, failures: SimpleFailure[]) {
    super(value, failures)
  }

  /**
   * Verifica se o número atual está dentro do intervalo especificado (inclusivo).
   * @param min O valor mínimo permitido para o número.
   * @param max O valor máximo permitido para o número.
   * @param failure (Opcional) Uma função que retorna um `SimpleFailure` customizado em caso de falha.
   * @returns A instância atual de `NumberValidator` para encadeamento de chamadas.
   */
  public isInRange(min: number, max: number, failure?: () => SimpleFailure): NumberValidator {
    return this.validate(
      () => !(this._value >= min && this._value <= max),
      failure ? failure() : FailureFactory.VALUE_OUT_OF_RANGE(this._value, this._field, min, max)
    )
  }

  /**
   * Verifica se o número atual é menor ou igual ao valor máximo especificado.
   * @param max O valor máximo permitido para o número.
   * @param failure (Opcional) Uma função que retorna um `SimpleFailure` customizado em caso de falha.
   * @returns A instância atual de `NumberValidator` para encadeamento de chamadas.
   */
  public isAtMost(max: number, failure?: () => SimpleFailure): NumberValidator {
    return this.validate(
      () => !(this._value <= max),
      failure ? failure() : FailureFactory.VALUE_GREATER_THAN_MAX(this._value, max)
    )
  }

  /**
   * Verifica se o número atual é maior ou igual ao valor mínimo especificado.
   * @param min O valor mínimo permitido para o número.
   * @param failure (Opcional) Uma função que retorna um `SimpleFailure` customizado em caso de falha.
   * @returns A instância atual de `NumberValidator` para encadeamento de chamadas.
   */
  public isAtLeast(min: number, failure?: () => SimpleFailure): NumberValidator {
    return this.validate(
      () => !(this._value >= min),
      failure ? failure() : FailureFactory.VALUE_LESS_THAN_MIN(this._value, this._field, min)
    )
  }

  /**
   * Verifica se o número atual é positivo (maior que zero).
   * @param failure (Opcional) Uma função que retorna um `SimpleFailure` customizado em caso de falha.
   * @returns A instância atual de `NumberValidator` para encadeamento de chamadas.
   */
  public isPositive(failure?: () => SimpleFailure): NumberValidator {
    return this.validate(
      () => !(this._value > 0),
      failure ? failure() : FailureFactory.VALUE_CANNOT_BE_NEGATIVE(this._field, this._value)
    )
  }

  /**
   * Verifica se o número atual é negativo (menor que zero).
   * @param failure (Opcional) Uma função que retorna um `SimpleFailure` customizado em caso de falha.
   * @returns A instância atual de `NumberValidator` para encadeamento de chamadas.
   */
  public isNegative(failure?: () => SimpleFailure): NumberValidator {
    return this.validate(
      () => !(this._value < 0),
      failure ? failure() : FailureFactory.VALUE_MUST_BE_NEGATIVE(this._field, this._value)
    )
  }

  /**
   * Verifica se o número atual é um inteiro.
   * @param failure (Opcional) Uma função que retorna um `SimpleFailure` customizado em caso de falha.
   * @returns A instância atual de `NumberValidator` para encadeamento de chamadas.
   */
  public isInteger(failure?: () => SimpleFailure): NumberValidator {
    return this.validate(
      () => !Number.isInteger(this._value),
      failure ? failure() : FailureFactory.VALUE_NOT_INTEGER(this._field, this._value)
    )
  }
}
