import { Assert, Flow } from "../assert/assert";
import { not } from "../assert/not";
import { failure, Result, success } from "../result/result";
import { SimpleFailure } from "../failure/simple.failure.type";
import { TechnicalError } from "../error/technical.error";
import { isNull } from "../validator/validator";
import { is } from "../assert/is";
import { FailureCode } from "../failure/failure.codes.enum";

/**
 * Representa uma data de nascimento válida com regras de negócio aplicadas.
 * Garante que:
 * - A data não seja nula
 * - A pessoa tenha pelo menos 18 anos
 * - A data não seja irrealisticamente antiga (ex: antes de 1900)
 */
export class BirthDate {
  private constructor(private readonly _value: Date) {}

  private static MIN_BIRTH_DATE = new Date(
    new Date().getFullYear() - 18, 0, 0, 0, 0, 0);

  private static MAX_BIRTH_DATE = new Date(1900, 0, 0, 0, 0, 0, 0);

  public get value(): Date {
    return new Date(this._value);
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
    const failures: SimpleFailure[] = [];

    Assert.all(
      failures,
      { field: "birth date" },
      not.null(birthDate, FailureCode.NULL_ARGUMENT, {}, Flow.stop),
      is.true(
        birthDate < BirthDate.MIN_BIRTH_DATE,
        FailureCode.INVALID_BIRTH_DATE_TOO_YOUNG,
        {},
        Flow.stop,
      ),
      is.true(
        birthDate > BirthDate.MAX_BIRTH_DATE,
        FailureCode.INVALID_BIRTH_DATE_TOO_OLD,
        {},
        Flow.stop,
      ),
    );

    return failures.length > 0
      ? failure(failures)
      : success(new BirthDate(birthDate));
  }

  /**
   * Cria uma instância direta de BirthDate sem validações adicionais.
   * Usado para restaurar entidades a partir de dados persistentes.
   * @param birthDate - Data já validada previamente
   * @throws TechnicalError se a data for nula ou undefined
   */
  public static hydrate(birthDate: Date): BirthDate {
    TechnicalError.if(isNull(birthDate), FailureCode.NULL_ARGUMENT);
    return new BirthDate(birthDate);
  }

  /**
   * Compara este BirthDate com outro com base no valor de data.
   * Usa toISOString() para garantir igualdade mesmo com objetos Date diferentes.
   * @param other - Outro BirthDate a ser comparado
   * @returns true se as datas forem idênticas, false caso contrário
   */
  public equal(other: BirthDate): boolean {
    if (isNull(other)) return false;
    return (
      other instanceof BirthDate &&
      other.value.toISOString() === this.value.toISOString()
    );
  }
}
