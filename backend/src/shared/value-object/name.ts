import { failure, Result, success } from '../result/result'
import { SimpleFailure } from '../failure/simple.failure.type'
import { TechnicalError } from '../error/technical.error'
import { Validate } from '../validator/validate'
import { isNull } from '@shared/validator/utils/validation'
import { FailureFactory } from '@shared/failure/failure.factory'

/**
 * Representa um nome válido encapsulado com validações de formato e tamanho.
 * Garante que nomes sigam regras de negócio (ex: mínimo 3 caracteres, apenas letras e espaços).
 */
export class Name {
  private static readonly MIN_NAME_LENGTH = 3

  private static readonly MAX_NAME_LENGTH = 50

  /**
   * Regex que permite letras (incluindo acentos e caracteres Unicode) e espaços.
   * Exemplos válidos: "João", "José Silva", "Élise".
   */
  private static readonly NAME_FORMAT_REGEX = /^[\p{L}\s]{3,50}$/u

  private constructor(public readonly value: string) {}

  /**
   * Cria uma instância válida de Name com validações de formato e tamanho.
   * @param name - Nome a ser validado e encapsulado
   * @returns Result<Name> com falha nos seguintes casos:
   * - `FailureCode.NULL_ARGUMENT`: Se o nome for nulo
   * - `FailureCode.EMPTY_FIELD`: Se o nome for vazio
   * - `FailureCode.INVALID_FIELD_SIZE`: Se o comprimento for menor ou maior que o permitido
   * - `FailureCode.NAME_WITH_INVALID_FORMAT`: Se conter caracteres não alfabéticos ou especiais
   */
  public static create(name: string): Result<Name> {
    const failures: SimpleFailure[] = []

    Validate.string({ name }, failures)
      .isRequired()
      .isNotEmpty()
      .hasLengthBetween(Name.MIN_NAME_LENGTH, Name.MAX_NAME_LENGTH)
      .matchesPattern(Name.NAME_FORMAT_REGEX, () => FailureFactory.NAME_WITH_INVALID_FORMAT(name))

    return failures.length > 0 ? failure(failures) : success(new Name(name))
  }

  /**
   * Cria uma instância direta de Name sem validações adicionais.
   * @param name - Nome já validado (recuperado do banco de dados)
   * @throws TechnicalError se o nome for nulo ou vazio
   */
  public static hydrate(name: string): Name {
    TechnicalError.if(isNull(name), () => FailureFactory.MISSING_REQUIRED_DATA('name'))
    return new Name(name)
  }

  /**
   * Compara este Name com outro com base no valor encapsulado.
   * @param other - Outro Name a ser comparado
   * @returns true se os valores forem idênticos, false caso contrário
   */
  public equal(other: Name): boolean {
    return other instanceof Name && other.value === this.value
  }
}
