import { v7 } from "uuid";
import { failure, Result, success } from "../result/result";
import { SimpleFailure } from "../failure/simple.failure.type";
import { Assert, Flow } from "../assert/assert";
import { not } from "../assert/not";
import { is } from "../assert/is";
import { isBlank, isNull, isUIDv7 } from "../validator/validator";
import { TechnicalError } from "../error/technical.error";
import { FailureCode } from "../failure/failure.codes.enum";

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
   * Comprimento padrão para UUIDs
   */
  private static readonly UUID_LENGTH: number = 36;

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
  public static hydrate(value: string): UID {
    TechnicalError.if(isBlank(value), FailureCode.NULL_ARGUMENT);
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

    Assert.all(
      failures,
      { field: "uid" },
      not.null(value, FailureCode.NULL_ARGUMENT, {}, Flow.stop),
      not.empty(value, FailureCode.EMPTY_FIELD, {}, Flow.stop),
      is.true(
        value?.startsWith(this.PREFIX),
        FailureCode.INVALID_UUID,
        {},
        Flow.stop,
      ),
      is.equal(
        value?.length,
        UID.UUID_LENGTH + this.PREFIX.length + this.SEPARATOR.length,
        FailureCode.INVALID_UUID,
        {},
        Flow.stop,
      ),
      is.true(UID.validateUuidPart(value, this), FailureCode.INVALID_UUID),
    );

    if (failures.length > 0) return failure(failures);

    const uuidPart = UID.extractUuidPart(value, this);
    return success(new (this as any)(uuidPart));
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
   * @returns A parte UUID do valor
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

  /**
   * Valida a parte UUID do UID. Subclasses podem sobrescrever para alterar a lógica de validação.
   * @param uid - Valor completo do UID
   * @param concreteClass - Classe concreta que extende UID
   * @returns true se válido, false caso contrário
   * @example
   * class CustomUID extends UID {
   *   protected static validateUuidPart(uid: string, concreteClass: typeof UID): boolean {
   *     return super.validateUuidPart(uid, concreteClass) && customValidation(uid);
   *   }
   * }
   */
  protected static validateUuidPart(
    uid: string,
    concreteClass: typeof UID,
  ): boolean {
    const uidPart = this.extractUuidPart(uid, concreteClass);
    return isUIDv7(uidPart);
  }
}
