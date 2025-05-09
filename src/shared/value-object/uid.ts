import { v7 } from "uuid";
import { failure, Result, success } from "../result/result";
import { SimpleFailure } from "../failure/simple.failure.type";
import { isBlank, isNull } from "../validator/validator";
import { TechnicalError } from "../error/technical.error";
import { FailureCode } from "../failure/failure.codes.enum";
import { Validate } from "../validator/validate";

/**
 * Classe base abstrata para valores de identificação únicos (UIDs)
 * Fornece métodos padrão para validação, criação e comparação de UIDs
 *
 * @remarks
 * - Cada classe concreta deve definir um prefixo único via `protected static readonly PREFIX`
 * - O formato final do UID é: `${PREFIX}.${UUID_V7}`
 */
export abstract class UID {
  /**
   * Prefixo esperado para esta classe UID (deve ser definido na classe derivada)
   * Exemplo: `USER`, `PRODUCT`
   */
  protected static readonly PREFIX: string = "";

  /**
   * Separador entre prefixo e o valor UUID
   */
  protected static readonly SEPARATOR: string = ".";

  /**
   * Parte contendo a string em formato uuid v7
   */
  private readonly UUID: string;

  /**
   * Construtor protegido para inicialização da classe base
   * @param uuid Parte do UUID (sem o prefixo)
   */
  protected constructor(uuid: string) {
    this.UUID = uuid;
  }

  /**
   * Retorna o valor completo do UID (prefixo + UUID)
   */
  public get value(): string {
    const concreteClass = this.constructor as typeof UID;
    return concreteClass.PREFIX + concreteClass.SEPARATOR + this.UUID;
  }

  /**
   * Cria uma nova instância de UID com um UUID v7 gerado
   * @returns Instância da classe concreta com UUID v7
   */
  public static create(): UID {
    const uuid = v7();
    return new (this as any)(uuid);
  }

  /**
   * @throws TechnicalError se o valor for nulo ou vazio
   */
  /**
   * Cria uma instância de UID a partir de um valor conhecido como válido
   * Usado principalmente para hidratar entidades da persistência
   *
   * @param value String contendo o UID completo (ex: "USER.123e4567-e89b-12d3-a456-426614174000")
   * @throws TechnicalError se o valor for nulo, vazio ou não corresponder ao formato esperado
   * @returns Nova instância de UID
   */
  public static hydrate(value: string): UID {
    TechnicalError.if(isBlank(value), FailureCode.MISSING_REQUIRED_DATA, {
      field: "uid",
    });
    const uid = UID.extractUuidPart(value, this);
    return new (this as any)(uid);
  }

  /**
   * Tenta criar uma instância de UID a partir de uma string
   * @param value String contendo o UID completo (ex: "USER.123e4567-e89b-12d3-a456-426614174000")
   * @returns Result contendo a instância ou falha nos seguintes casos:
   * - `FailureCode.NULL_ARGUMENT`: Se `value` for nulo ou undefined
   * - `FailureCode.INVALID_UUID`: Se o prefixo, formato ou UUID forem inválidos
   */
  public static parse(value: string): Result<UID> {
    const failures: SimpleFailure[] = [];
    const concreteClass = this as typeof UID;
    const prefix = concreteClass.PREFIX + concreteClass.SEPARATOR;
    let uuidPart: string;

    Validate.string(value)
      .field("uid")
      .failures(failures)
      .isRequired()
      .isNotEmpty()
      .startsWith(prefix, FailureCode.INVALID_UUID)
      .then(() => {
        uuidPart = UID.extractUuidPart(value, concreteClass);
        Validate.string(uuidPart)
          .field("uid")
          .failures(failures)
          .isValidUUIDv7();
      });

    return failures.length > 0
      ? failure(failures)
      : success(new (this as any)(uuidPart));
  }

  /**
   * Compara dois UIDs com base no valor completo (prefixo + UUID).
   * @param other - Outro UID a ser comparado
   * @returns true se os valores forem idênticos, false caso contrário
   */
  public equal(other: UID): boolean {
    if (isNull(other)) return false;
    return other instanceof UID && other.value === this.value;
  }

  /**
   * Extrai a parte UUID de um valor completo de UID
   * @param value String contendo o UID completo
   * @param concreteClass Referência à classe concreta que está realizando a extração
   * @returns A parte UUID do valor ou string vazia se o formato for inválido
   * @private
   */
  private static extractUuidPart(
    value: string,
    concreteClass: typeof UID,
  ): string {
    const prefixWithSeparator = concreteClass.PREFIX + concreteClass.SEPARATOR;
    if (value && value.startsWith(prefixWithSeparator)) {
      return value.substring(prefixWithSeparator.length);
    }
    return "";
  }
}
