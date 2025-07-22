import { SimpleFailure } from '../failure/simple.failure.type'
import { FailureFactory } from '../failure/failure.factory'
import { AbstractValidator } from './abstract.validator'

/**
 * `ArrayValidator` é uma classe utilitária para validar arrays, estendendo `AbstractValidator`.
 * Fornece métodos para verificar a não-vacuidade, obrigatoriedade, tamanho, conteúdo e conformidade de elementos do array.
 * @template T O tipo dos elementos no array.
 */
export class ArrayValidator<T> extends AbstractValidator<ArrayValidator<T>> {
  protected _field: string
  constructor(value: Record<string, Array<T>>, failures: SimpleFailure[] = []) {
    super(value, failures)
    this._field = Object.keys(value)[0]
  }

  /**
   * Verifica se o array não está vazio.
   * @param failure Uma função opcional que retorna um `SimpleFailure` personalizado se a validação falhar.
   * @returns A instância atual de `ArrayValidator` para encadeamento de chamadas.
   */
  public isNotEmpty(failure?: () => SimpleFailure): ArrayValidator<T> {
    return this.validate(
      () => !(this._value.length > 0),
      failure ? failure() : FailureFactory.MISSING_REQUIRED_DATA(this._field)
    )
  }

  /**
   * Verifica se o array não é nulo ou indefinido.
   * @param failure Uma função opcional que retorna um `SimpleFailure` personalizado se a validação falhar.
   * @returns A instância atual de `ArrayValidator` para encadeamento de chamadas.
   */
  public isRequired(failure?: () => SimpleFailure): ArrayValidator<T> {
    return this.validate(
      () => this._value == null,
      failure ? failure() : FailureFactory.MISSING_REQUIRED_DATA(this._field)
    )
  }

  /**
   * Verifica se o tamanho do array está dentro do intervalo especificado.
   * @param min O tamanho mínimo permitido para o array.
   * @param max O tamanho máximo permitido para o array.
   * @param failure Uma função opcional que retorna um `SimpleFailure` personalizado se a validação falhar.
   * @returns A instância atual de `ArrayValidator` para encadeamento de chamadas.
   */
  public hasLengthBetween(min: number, max: number, failure?: () => SimpleFailure): ArrayValidator<T> {
    return this.validate(
      () => {
        const length = this._value.length
        return !(length >= min && length <= max)
      },
      failure ? failure() : FailureFactory.ARRAY_LENGTH_IS_OUT_OF_RANGE(this._field, min, max)
    )
  }

  /**
   * Verifica se o array contém o item especificado.
   * @param item O item a ser verificado no array.
   * @param failure Uma função opcional que retorna um `SimpleFailure` personalizado se a validação falhar.
   * @returns A instância atual de `ArrayValidator` para encadeamento de chamadas.
   */
  public contains(item: T, failure?: () => SimpleFailure): ArrayValidator<T> {
    return this.validate(
      () => !this._value.includes(item),
      failure ? failure() : FailureFactory.MISSING_REQUIRED_DATA(this._field)
    )
  }

  /**
   * Verifica se todos os itens do array satisfazem a condição fornecida.
   * @param predicate Uma função que testa cada elemento do array. Retorna `true` para um elemento que passa no teste, `false` caso contrário.
   * @param failure Uma função opcional que retorna um `SimpleFailure` personalizado se a validação falhar.
   * @returns A instância atual de `ArrayValidator` para encadeamento de chamadas.
   */
  public every(predicate: (item: T) => boolean, failure?: () => SimpleFailure): ArrayValidator<T> {
    return this.validate(
      () => !this._value.every(predicate),
      failure ? failure() : FailureFactory.CONTENT_WITH_INVALID_ITEMS(this._field)
    )
  }

  /**
   * Verifica se pelo menos um item do array satisfaz a condição fornecida.
   * @param predicate Uma função que testa cada elemento do array. Retorna `true` para um elemento que passa no teste, `false` caso contrário.
   * @param failure Uma função opcional que retorna um `SimpleFailure` personalizado se a validação falhar.
   * @returns A instância atual de `ArrayValidator` para encadeamento de chamadas.
   */
  public some(predicate: (item: T) => boolean, failure?: () => SimpleFailure): ArrayValidator<T> {
    return this.validate(
      () => !this._value.some(predicate),
      failure ? failure() : FailureFactory.MISSING_VALID_ITEM(this._field)
    )
  }
}
