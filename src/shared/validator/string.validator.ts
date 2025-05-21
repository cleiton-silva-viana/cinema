import { BaseValidator } from "./base.validator.ts";
import { FailureCode } from "../failure/failure.codes.enum";
import { isEmail, isMatch, isUIDv4, isUIDv7 } from "./validator";
import { SimpleFailure } from "../failure/simple.failure.type";

/**
 * Validador para strings
 */
export class StringValidator extends BaseValidator<StringValidator> {
  constructor(value: Record<string, string>, failures: SimpleFailure[]) {
    super(value, failures);
  }

  /**
   * Verifica se a string não está vazia
   * @param code Código de erro opcional
   * @param details Detalhes adicionais para a mensagem de erro
   */
  public isNotEmpty(
    code: FailureCode = FailureCode.STRING_CANNOT_BE_EMPTY,
    details: Record<string, any> = {},
  ): StringValidator {
    const value = this._value?.trim().length || 0;
    return this.validate(() => value === 0, {
      code,
      details,
    });
  }

  /**
   * Verifica se a string não é nula ou está branco
   * @param code Código de erro opcional
   * @param details Detalhes adicionais para a mensagem de erro
   */
  public hasContent(
    code: FailureCode = FailureCode.STRING_CANNOT_BE_BLANK,
    details: Record<string, any> = {},
  ): StringValidator {
    const value = this._value?.trim().length || 0;

    return this.validate(() => value === 0, {
      code,
      details,
    });
  }

  /**
   * Verifica se a string corresponde a um padrão regex
   * @param pattern Expressão regular para validação
   * @param code Código de erro opcional
   * @param details Detalhes adicionais para a mensagem de erro
   */
  public matchesPattern(
    pattern: RegExp,
    code: FailureCode = FailureCode.STRING_INVALID_FORMAT,
    details: Record<string, any> = {},
  ): StringValidator {
    return this.validate(() => !isMatch(pattern, this._value), {
      code,
      details,
    });
  }

  /**
   * Verifica se a string é um email válido
   * @param code Código de erro opcional
   * @param details Detalhes adicionais para a mensagem de erro
   */
  public isValidEmail(
    code: FailureCode = FailureCode.EMAIL_WITH_INVALID_FORMAT,
    details: Record<string, any> = {},
  ): StringValidator {
    return this.validate(() => !isEmail(this._value), {
      code,
      details: {
        email: this._value,
        ...details,
      },
    });
  }

  /**
   * Verifica se a string é um UUID v4 válido
   * @param code Código de erro opcional
   * @param details Detalhes adicionais para a mensagem de erro
   */
  public isValidUUIDv4(
    code: FailureCode = FailureCode.UID_WITH_INVALID_FORMAT,
    details: Record<string, any> = {},
  ): StringValidator {
    return this.validate(() => !isUIDv4(this._value), {
      code,
      details: {
        uuid: this._value,
        ...details,
      },
    });
  }

  /**
   * Verifica se a string é um UUID v7 válido
   * @param code Código de erro opcional
   * @param details Detalhes adicionais para a mensagem de erro
   */
  public isValidUUIDv7(
    code: FailureCode = FailureCode.UID_WITH_INVALID_FORMAT,
    details: Record<string, any> = {},
  ): StringValidator {
    return this.validate(() => !isUIDv7(this._value), {
      code,
      details: {
        uuid: this._value,
        ...details,
      },
    });
  }

  /**
   * Verifica se o comprimento da string está dentro do intervalo especificado
   * @param min Comprimento mínimo (opcional)
   * @param max Comprimento máximo (opcional)
   * @param code Código de erro opcional
   * @param details Detalhes adicionais para a mensagem de erro
   */
  public hasLengthBetween(
    min: number,
    max: number,
    code: FailureCode = FailureCode.STRING_LENGTH_OUT_OF_RANGE,
    details: Record<string, any> = {},
  ): StringValidator {
    const length = this._value?.length || 0;

    return this.validate(() => !(length >= min && length <= max), {
      code,
      details: {
        min,
        max,
        length,
        ...details,
      },
    });
  }

  /**
   * Verifica se a string está contida em um enum
   * @param enumType O enum para verificação
   * @param code Código de erro opcional
   * @param details Detalhes adicionais para a mensagem de erro
   */
  public isInEnum(
    enumType: Record<string, string | number>,
    code: FailureCode = FailureCode.INVALID_ENUM_VALUE,
    details: Record<string, any> = {},
  ): StringValidator {
    const enumValues = Object.values(enumType);

    return this.validate(() => !enumValues.includes(this._value), {
      code,
      details: {
        value: this._value,
        allowed_values: enumValues.map((value) => String(value)),
        ...details,
      },
    });
  }

  /**
   * Verifica se a string começa com o prefixo especificado
   * @param prefix Prefixo que a string deve conter
   * @param code Código de erro opcional
   * @param details Detalhes adicionais para a mensagem de erro
   */
  public startsWith(
    prefix: string,
    code: FailureCode = FailureCode.STRING_INVALID_FORMAT,
    details: Record<string, any> = {},
  ): StringValidator {
    return this.validate(() => !this._value.startsWith(prefix), {
      code,
      details,
    });
  }
}
