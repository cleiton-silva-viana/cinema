import { isNull } from './validator'
import { SimpleFailure } from '../failure/simple.failure.type'
import { AbstractValidator } from './abstract.validator'
import { FailureFactory } from '@shared/failure/failure.factory'

/**
 * Validador para objetos
 */
export class ObjectValidator<T extends object> extends AbstractValidator<ObjectValidator<T>> {
  constructor(value: Record<string, T>, failures: SimpleFailure[]) {
    super(value, failures)
  }

  /**
   * Verifica se o objeto tem a propriedade especificada
   * @param prop Nome da propriedade
   * @param failure Função opcional que retorna uma SimpleFailure para personalizar a falha.
   */
  public hasProperty(prop: keyof T, failure?: () => SimpleFailure): ObjectValidator<T> {
    return this.validate(
      () => !(prop in this._value),
      failure ? failure() : FailureFactory.MISSING_REQUIRED_DATA(this._field)
    )
  }

  /**
   * Verifica se o objeto não está vazio (tem pelo menos uma propriedade)
   * @param failure Função opcional que retorna uma SimpleFailure para personalizar a falha.
   */
  public isNotEmpty(failure?: () => SimpleFailure): ObjectValidator<T> {
    return this.validate(
      () => !(Object.keys(this._value).length > 0),
      failure ? failure() : FailureFactory.MISSING_REQUIRED_DATA(this._field)
    )
  }

  /**
   * Valida uma propriedade opcional do objeto.
   * Se a propriedade existir, executa as validações definidas no callback.
   * Se não existir, ignora silenciosamente.
   *
   * @param propertyName {string} Nome da propriedade a ser validada
   * @param validator Função contendo as validações a serem executadas
   * @returns this para permitir encadeamento
   */
  public optionalProperty(propertyName: string, validator: () => void): this {
    if (this._value && propertyName in this._value) {
      validator()
    }
    return this
  }

  /**
   * Valida uma propriedade obrigatória do objeto.
   * Se a propriedade não existir, adiciona um erro de propriedade ausente.
   * Se existir, executa as validações definidas no callback.
   *
   * @param propertyName {string} Nome da propriedade a ser validada
   * @param validator Função contendo as validações a serem executadas
   * @returns this para permitir encadeamento
   */
  public property(propertyName: string, validator: () => void): this {
    if (isNull(this._value) || !(propertyName in this._value)) {
      this._failures.push(FailureFactory.MISSING_REQUIRED_DATA(this._field))
      return this
    }

    validator()
    return this
  }
}
