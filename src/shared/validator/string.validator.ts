import { isEmail, isMatch, isUIDv4, isUIDv7 } from './utils/validation'
import { SimpleFailure } from '../failure/simple.failure.type'
import { AbstractValidator } from './abstract.validator'
import { FailureFactory } from '@shared/failure/failure.factory'
import { CaseSensitivityEnum } from '@shared/validator/enum/case.sensitivity.enum'

/**
 * Validador para strings
 */
export class StringValidator extends AbstractValidator<StringValidator> {
  constructor(value: Record<string, string>, failures: SimpleFailure[]) {
    super(value, failures)
  }

  /**
   * Verifica se a string não está vazia
   * @param failure Função opcional que retorna uma SimpleFailure personalizada.
   */
  public isNotEmpty(failure?: () => SimpleFailure): StringValidator {
    const value = this._value?.trim().length || 0
    return this.validate(() => value === 0, failure ? failure() : FailureFactory.STRING_CANNOT_BE_EMPTY(this._field))
  }

  /**
   * Verifica se a string não é nula ou está branco
   * @param failure Função opcional que retorna uma SimpleFailure personalizada.
   */
  public hasContent(failure?: () => SimpleFailure): StringValidator {
    const value = this._value?.trim().length || 0

    return this.validate(() => value === 0, failure ? failure() : FailureFactory.STRING_CANNOT_BE_BLANK(this._field))
  }

  /**
   * Verifica se a string corresponde a um padrão regex
   * @param pattern Expressão regular para validação
   * @param failure Função opcional que retorna uma SimpleFailure personalizada.
   */
  public matchesPattern(pattern: RegExp, failure?: () => SimpleFailure): StringValidator {
    return this.validate(
      () => !isMatch(pattern, this._value),
      failure ? failure() : FailureFactory.STRING_WITH_INVALID_FORMAT(this._field)
    )
  }

  /**
   * Verifica se a string é um email válido
   * @param failure Função opcional que retorna uma SimpleFailure personalizada.
   */
  public isValidEmail(failure?: () => SimpleFailure): StringValidator {
    return this.validate(
      () => !isEmail(this._value),
      failure ? failure() : FailureFactory.EMAIL_WITH_INVALID_FORMAT(this._value)
    )
  }

  /**
   * Verifica se a string é um UUID v4 válido
   * @param failure Função opcional que retorna uma SimpleFailure personalizada.
   */
  public isValidUUIDv4(failure?: () => SimpleFailure): StringValidator {
    return this.validate(
      () => !isUIDv4(this._value),
      failure ? failure() : FailureFactory.UID_WITH_INVALID_FORMAT(this._value, this._field)
    )
  }

  /**
   * Verifica se a string é um UUID v7 válido
   * @param failure Função opcional que retorna uma SimpleFailure personalizada.
   */
  public isValidUUIDv7(failure?: () => SimpleFailure): StringValidator {
    return this.validate(
      () => !isUIDv7(this._value),
      failure ? failure() : FailureFactory.UID_WITH_INVALID_FORMAT(this._value, this._field)
    )
  }

  /**
   * Verifica se o comprimento da string está dentro do intervalo especificado
   * @param min Comprimento mínimo (opcional)
   * @param max Comprimento máximo (opcional)
   * @param failure Função opcional que retorna uma SimpleFailure personalizada.
   */
  public hasLengthBetween(min: number, max: number, failure?: () => SimpleFailure): StringValidator {
    const length = this._value?.length || 0

    return this.validate(
      () => !(length >= min && length <= max),
      failure ? failure() : FailureFactory.STRING_LENGTH_OUT_OF_RANGE(this._field, min, max, length)
    )
  }

  /**
   * Verifica se a string está contida em um enum
   * @param enumType O enum para verificação
   * @param failure Função opcional que retorna uma SimpleFailure personalizada.
   */
  public isInEnum(
    enumType: Record<string, string | number>,
    caseSensitive: CaseSensitivityEnum = CaseSensitivityEnum.SENSITIVE,
    failure?: () => SimpleFailure
  ): StringValidator {
    const enumValues = Object.values(enumType)

    const normalizedValues =
      caseSensitive === CaseSensitivityEnum.INSENSITIVE
        ? enumValues.map((value) => String(value).toLowerCase())
        : enumValues

    const valueToCheck = caseSensitive === CaseSensitivityEnum.INSENSITIVE ? this._value.toLowerCase() : this._value

    return this.validate(
      () => !normalizedValues.includes(valueToCheck),
      failure ? failure() : FailureFactory.INVALID_ENUM_VALUE(this._value, this._field, enumValues.map(String))
    )
  }

  /**
   * Verifica se a string começa com o prefixo especificado
   * @param prefix Prefixo que a string deve conter
   * @param failure Função opcional que retorna uma SimpleFailure personalizada.
   */
  public startsWith(
    prefix: string,
    caseSensitive: CaseSensitivityEnum = CaseSensitivityEnum.SENSITIVE,
    failure?: () => SimpleFailure
  ): StringValidator {
    const valueToCheck = caseSensitive === CaseSensitivityEnum.INSENSITIVE ? this._value.toLowerCase() : this._value

    const prefixToCheck = caseSensitive === CaseSensitivityEnum.INSENSITIVE ? prefix.toLowerCase() : prefix

    return this.validate(
      () => !valueToCheck.startsWith(prefixToCheck),
      failure ? failure() : FailureFactory.STRING_WITH_INVALID_FORMAT(this._field)
    )
  }
}
