import { BaseValidator } from './base.validator.ts'
import { FailureCode } from '../failure/failure.codes.enum'
import { SimpleFailure } from '../failure/simple.failure.type'

/**
 * Validador para arrays
 */
export class ArrayValidator<T> extends BaseValidator<ArrayValidator<T>> {
  constructor(value: Record<string, Array<T>>, failures: SimpleFailure[] = []) {
    super(value, failures)
  }

  /**
   * Verifica se o array não está vazio
   * @param code Código de erro opcional
   * @param details Detalhes adicionais para a mensagem de erro
   */
  public isNotEmpty(
    code: FailureCode = FailureCode.MISSING_REQUIRED_DATA,
    details: Record<string, any> = {}
  ): ArrayValidator<T> {
    return this.validate(() => !(this._value.length > 0), {
      code,
      details,
    })
  }

  /**
   * Verifica se o tamanho do array está dentro do intervalo especificado
   * @param min Tamanho mínimo (opcional)
   * @param max Tamanho máximo (opcional)
   * @param code Código de erro opcional
   * @param details Detalhes adicionais para a mensagem de erro
   */
  public hasLengthBetween(
    min: number,
    max: number,
    code: FailureCode = FailureCode.STRING_LENGTH_OUT_OF_RANGE,
    details: Record<string, any> = {}
  ): ArrayValidator<T> {
    return this.validate(
      () => {
        const length = this._value.length
        return !(length >= min && length <= max)
      },
      {
        code,
        details: {
          min: min,
          max: max,
          count: this._value.length,
          ...details,
        },
      }
    )
  }

  /**
   * Verifica se o array contém o item especificado
   * @param item Item a ser verificado
   * @param code Código de erro opcional
   * @param details Detalhes adicionais para a mensagem de erro
   */
  public contains(
    item: T,
    code: FailureCode = FailureCode.MISSING_REQUIRED_DATA,
    details: Record<string, any> = {}
  ): ArrayValidator<T> {
    return this.validate(() => !this._value.includes(item), {
      code,
      details,
    })
  }

  /**
   * Verifica se todos os itens do array satisfazem a condição
   * @param predicate Função que verifica cada item
   * @param code Código de erro opcional
   * @param details Detalhes adicionais para a mensagem de erro
   */
  public every(
    predicate: (item: T) => boolean,
    code: FailureCode = FailureCode.CONTENT_WITH_INVALID_ITEMS,
    details: Record<string, any> = {}
  ): ArrayValidator<T> {
    return this.validate(() => !this._value.every(predicate), {
      code,
      details,
    })
  }

  /**
   * Verifica se pelo menos um item do array satisfaz a condição
   * @param predicate Função que verifica cada item
   * @param code Código de erro opcional
   * @param details Detalhes adicionais para a mensagem de erro
   */
  public some(
    predicate: (item: T) => boolean,
    code: FailureCode = FailureCode.MISSING_VALID_ITEM,
    details: Record<string, any> = {}
  ): ArrayValidator<T> {
    return this.validate(() => !this._value.some(predicate), { code, details })
  }
}
