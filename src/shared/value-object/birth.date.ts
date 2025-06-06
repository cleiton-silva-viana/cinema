import { failure, Result, success } from '../result/result'
import { SimpleFailure } from '../failure/simple.failure.type'
import { TechnicalError } from '../error/technical.error'
import { Validate } from '../validator/validate'
import { isNull } from '@shared/validator/utils/validation'

/**
 * Representa uma data de nascimento válida com regras de negócio aplicadas.
 * Garante que:
 * - A data não seja nula
 * - A pessoa tenha pelo menos 18 anos
 * - A data não seja irrealisticamente antiga (ex: antes de 1900)
 */
export class BirthDate {
  private static MIN_BIRTH_DATE = new Date(new Date().getFullYear() - 18, 0, 0, 0, 0, 0)

  private static MAX_BIRTH_DATE = new Date(1900, 0, 0, 0, 0, 0, 0)

  private constructor(private readonly _value: Date) {}

  public get value(): Date {
    return new Date(this._value)
  }

  /**
   * Cria uma instância válida de BirthDate com validações de negócio.
   * @param birthDate - Data de nascimento a ser validada
   * @returns Result<BirthDate> com falha nos seguintes casos:
   * - `FailureCode.NULL_ARGUMENT`: Se a data for nula
   * - `FailureCode.INVALID_BIRTH_DATE_TOO_YOUNG`: Se a pessoa tiver menos de 18 anos
   * - `FailureCode.INVALID_BIRTH_DATE_TOO_OLD`: Se a data for anterior a 01/01/1900
   */
  public static create(birthDate: Date): Result<BirthDate> {
    const failures: SimpleFailure[] = []

    Validate.date({ birthDate }, failures)
      .isRequired()
      .isAfter(BirthDate.MAX_BIRTH_DATE)
      .isBefore(BirthDate.MIN_BIRTH_DATE)

    return failures.length > 0 ? failure(failures) : success(new BirthDate(birthDate))
  }

  /**
   * Cria uma instância direta de BirthDate sem validações adicionais.
   * Usado para restaurar entidades a partir de dados persistentes.
   * @param birthDate - Data já validada previamente
   * @throws TechnicalError se a data for nula ou undefined
   */
  public static hydrate(birthDate: Date): BirthDate {
    TechnicalError.validateRequiredFields({ birthDate })
    return new BirthDate(birthDate)
  }

  /**
   * Compara este BirthDate com outro com base no valor de data.
   * Usa toISOString() para garantir igualdade mesmo com objetos Date diferentes.
   * @param other - Outro BirthDate a ser comparado
   * @returns true se as datas forem idênticas, false caso contrário
   */
  public equal(other: BirthDate): boolean {
    if (isNull(other)) return false
    if (!(other instanceof BirthDate)) return false
    return other.value.toISOString() === this.value.toISOString()
  }
}
