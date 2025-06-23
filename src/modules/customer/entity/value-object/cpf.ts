import { failure, Result, success } from '@shared/result/result'
import { SimpleFailure } from '@shared/failure/simple.failure.type'
import { TechnicalError } from '@shared/error/technical.error'
import { isNull } from '@shared/validator/utils/validation'
import { FailureCode } from '@shared/failure/failure.codes.enum'
import { Validate } from '@shared/validator/validate'
import { FailureFactory } from '@shared/failure/failure.factory'

/**
 * Representa um CPF (Cadastro de Pessoas Físicas) brasileiro.
 * Este Value Object garante que o CPF esteja em um formato válido.
 */
export class CPF {
  private static readonly FORMAT_REGEX = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/

  /**
   * Construtor privado para garantir a criação através dos métodos estáticos.
   * @param value O valor do CPF.
   */
  private constructor(public readonly value: string) {}

  /**
   * Cria uma instância de CPF a partir de uma string.
   * Valida se o CPF fornecido não é nulo, não está vazio e corresponde ao formato esperado.
   * @param cpf A string do CPF a ser validada e criada.
   * @returns Um `Result` contendo a instância de `CPF` em caso de sucesso, ou um array de `SimpleFailure` em caso de falha.
   */
  public static create(cpf: string): Result<CPF> {
    const failures: SimpleFailure[] = []

    Validate.string({ cpf }, failures)
      .isRequired()
      .isNotEmpty(() => FailureFactory.MISSING_REQUIRED_DATA('cpf'))
      .matchesPattern(CPF.FORMAT_REGEX, () => FailureFactory.CPF_WITH_INVALID_FORMAT(cpf))

    return failures.length > 0 ? failure(failures) : success(new CPF(cpf))
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
    TechnicalError.if(isNull(cpf), () => FailureFactory.MISSING_REQUIRED_DATA('cpf'))
    const formattedCpf = CPF.formatCpf(cpf)
    return new CPF(formattedCpf)
  }

  /**
   * Compara este CPF com outro para verificar igualdade.
   * Dois CPFs são considerados iguais se suas strings de valor formatado forem idênticas.
   * @param other O outro CPF para comparar.
   * @returns `true` se os CPFs forem iguais, `false` caso contrário.
   */
  public equal(other: CPF): boolean {
    if (isNull(other)) return false
    if (!(other instanceof CPF)) return false
    return other.value === this.value
  }

  /**
   * Retorna o valor do CPF sem formatação (apenas dígitos).
   */
  public get unformattedValue(): string {
    return this.value.replace(/\D/g, '')
  }

  private static formatCpf(cpf: string): string {
    const cleanedCpf = cpf.replace(/\D/g, '')
    if (cleanedCpf.length !== 11) {
      return cpf // Retorna o original se não tiver 11 dígitos para evitar formatação incorreta
    }
    return cleanedCpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }
}
