import { failure, Result, success } from "../../../../shared/result/result";
import { SimpleFailure } from "../../../../shared/failure/simple.failure.type";
import { TechnicalError } from "../../../../shared/error/technical.error";
import { isNull } from "../../../../shared/validator/validator";
import { FailureCode } from "../../../../shared/failure/failure.codes.enum";
import { Validate } from "../../../../shared/validator/validate";

/**
 * Representa um CPF (Cadastro de Pessoas Físicas) brasileiro.
 * Este Value Object garante que o CPF esteja em um formato válido.
 */
export class CPF {
  /**
   * Construtor privado para garantir a criação através dos métodos estáticos.
   * @param value O valor do CPF.
   */
  private constructor(public readonly value: string) {}

  private static readonly FORMAT_REGEX = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;

  /**
   * Cria uma instância de CPF a partir de uma string.
   * Valida se o CPF fornecido não é nulo, não está vazio e corresponde ao formato esperado.
   * @param cpf A string do CPF a ser validada e criada.
   * @returns Um `Result` contendo a instância de `CPF` em caso de sucesso, ou um array de `SimpleFailure` em caso de falha.
   */
  public static create(cpf: string): Result<CPF> {
    const failures: SimpleFailure[] = [];

    Validate.string(cpf)
      .field("cpf")
      .failures(failures)
      .isRequired()
      .isNotEmpty(FailureCode.MISSING_REQUIRED_DATA)
      .matchesPattern(CPF.FORMAT_REGEX, FailureCode.CPF_WITH_INVALID_FORMAT);

    return failures.length > 0 ? failure(failures) : success(new CPF(cpf));
  }

  /**
   * Hidrata uma instância de CPF a partir de uma string, assumindo que os dados são válidos.
   * Lança um `TechnicalError` se o CPF fornecido for nulo.
   * Este método é geralmente usado ao recriar um objeto a partir de dados persistidos.
   * @param cpf A string do CPF.
   * @returns Uma nova instância de `CPF`.
   * @throws {TechnicalError} Se o CPF for nulo.
   */
  public static hydrate(cpf: string): CPF {
    TechnicalError.if(isNull(cpf), FailureCode.MISSING_REQUIRED_DATA);
    return new CPF(cpf);
  }

  /**
   * Compara este CPF com outro para verificar igualdade.
   * Dois CPFs são considerados iguais se suas strings de valor formatado forem idênticas.
   * @param other O outro CPF para comparar.
   * @returns `true` se os CPFs forem iguais, `false` caso contrário.
   */
  public equal(other: CPF): boolean {
    if (isNull(other)) return false;
    return other instanceof CPF && other.value === this.value;
  }
}
