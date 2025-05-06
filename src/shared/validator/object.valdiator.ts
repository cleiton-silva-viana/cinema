import { BaseValidator } from "./base.validator.ts";
import { FailureCode } from "../failure/failure.codes.enum";

/**
 * Validador para objetos
 */
export class ObjectValidator<T extends object> extends BaseValidator<
  ObjectValidator<T>
> {
  constructor(value: T) {
    super(value);
  }

  /**
   * Verifica se o objeto tem a propriedade especificada
   * @param prop Nome da propriedade
   * @param code Código de erro opcional
   * @param details Detalhes adicionais para a mensagem de erro
   */
  public hasProperty(
    prop: keyof T,
    code: FailureCode = FailureCode.OBJECT_MISSING_PROPERTY,
    details: Record<string, any> = {},
  ): ObjectValidator<T> {
    return this.validate(() => !(prop in this._value), {
      code,
      details: {
        property: prop,
        ...details,
      },
    });
  }

  /**
   * Verifica se o objeto não está vazio (tem pelo menos uma propriedade)
   * @param code Código de erro opcional
   * @param details Detalhes adicionais para a mensagem de erro
   */
  public isNotEmpty(
    code: FailureCode = FailureCode.OBJECT_IS_EMPTY,
    details: Record<string, any> = {},
  ): ObjectValidator<T> {
    return this.validate(() => !(Object.keys(this._value).length > 0), {
      code,
      details,
    });
  }
}
