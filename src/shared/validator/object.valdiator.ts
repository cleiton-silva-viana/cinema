import { BaseValidator } from "./base.validator.ts";
import { FailureCode } from "../failure/failure.codes.enum";
import { isNull } from "./validator";
import { SimpleFailure } from "../failure/simple.failure.type";

/**
 * Validador para objetos
 */
export class ObjectValidator<T extends object> extends BaseValidator<
  ObjectValidator<T>
> {
  constructor(value: Record<string, T>, failures: SimpleFailure[]) {
    super(value, failures);
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

  /**
   * Valida uma propriedade opcional do objeto.
   * Se a propriedade existir, executa as validações definidas no callback.
   * Se não existir, ignora silenciosamente.
   *
   * @param propertyName Nome da propriedade a ser validada
   * @param validator Função contendo as validações a serem executadas
   * @returns this para permitir encadeamento
   */
  public optionalProperty(propertyName: string, validator: () => void): this {
    if (this._value && propertyName in this._value) {
      validator();
    }
    return this;
  }

  /**
   * Valida uma propriedade obrigatória do objeto.
   * Se a propriedade não existir, adiciona um erro de propriedade ausente.
   * Se existir, executa as validações definidas no callback.
   *
   * @param propertyName Nome da propriedade a ser validada
   * @param validator Função contendo as validações a serem executadas
   * @returns this para permitir encadeamento
   */
  public property(propertyName: string, validator: () => void): this {
    if (isNull(this._value) || !(propertyName in this._value)) {
      this._failures.push({
        code: FailureCode.MISSING_REQUIRED_DATA,
        details: {
          field: propertyName,
        },
      });
      return this;
    }

    validator();
    return this;
  }
}
