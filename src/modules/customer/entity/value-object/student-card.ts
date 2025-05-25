import { failure, Result, success } from '@shared/result/result'
import { Validate } from '@shared/validator/validate'
import { FailureCode } from '@shared/failure/failure.codes.enum'
import { TechnicalError } from '@shared/error/technical.error'
import { ensureNotNull } from '@shared/validator/common.validators'
import { SimpleFailure } from '@shared/failure/simple.failure.type'
import { isNull } from '@shared/validator/validator'

/**
 * @class StudentCard
 * @description Representa uma carteirinha de estudante com um ID e data de validade.
 * Este objeto de valor garante que as informações da carteirinha de estudante sejam válidas e consistentes.
 */
export class StudentCard {
  /** Comprimento mínimo para o ID da carteirinha de estudante. */
  private static MIN_ID_LENGTH = 6
  /** Comprimento máximo para o ID da carteirinha de estudante. */
  private static MAX_ID_LENGTH = 24
  /** Período máximo de validade no futuro, em dias (aproximadamente 2 anos). */
  private static MAX_VALIDITY_DAY_IN_FUTURE = 360 * 2

  /**
   * Construtor privado para impor a criação através de métodos de fábrica estáticos.
   * @param {string} id - O identificador único da carteirinha de estudante.
   * @param {Date} validity - A data de expiração da carteirinha de estudante.
   */
  private constructor(
    public readonly id: string,
    public readonly validity: Date
  ) {}

  /**
   * Verifica se a carteirinha de estudante está atualmente válida (ou seja, não expirada).
   *
   * @returns {boolean} Verdadeiro se a data de validade da carteirinha for futura ou hoje, falso caso contrário.
   * @memberof StudentCard
   */
  get isValid(): boolean {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const validityDate = new Date(this.validity)
    validityDate.setHours(0, 0, 0, 0)

    return validityDate >= today
  }

  /**
   * Cria uma nova instância de StudentCard após validar o ID e a data de validade fornecidos.
   *
   * @static
   * @param {string} id - A string de identificação da carteirinha de estudante.
   * @param {Date} validity - A data de expiração da carteirinha de estudante.
   * @returns {Result<StudentCard>} Um objeto Result contendo a instância de StudentCard ou um array de falhas.
   * @memberof StudentCard
   */
  public static create(id: string, validity: Date): Result<StudentCard> {
    const failures: SimpleFailure[] = ensureNotNull({ id, validity })
    if (failures.length > 0) return failure(failures)

    Validate.string({ id }, failures)
      .isRequired()
      .hasLengthBetween(
        StudentCard.MIN_ID_LENGTH,
        StudentCard.MAX_ID_LENGTH,
        FailureCode.STUDENT_CARD_ID_INVALID_FORMAT,
        { value: id }
      )

    const now = new Date()
    const maxFutureDate = new Date(now.getTime() + StudentCard.MAX_VALIDITY_DAY_IN_FUTURE * 24 * 60 * 60 * 1000)

    Validate.date({ validity }, failures)
      .isRequired()
      .isAfter(now, FailureCode.DATE_CANNOT_BE_PAST, {
        now: now.toISOString().split('T')[0],
      })
      .isBefore(maxFutureDate, FailureCode.DATE_NOT_AFTER_LIMIT, {
        limit: maxFutureDate.toISOString().split('T')[0],
      })

    return failures.length > 0 ? failure(failures) : success(new StudentCard(id, validity))
  }

  /**
   * Hidrata uma instância de StudentCard a partir de dados existentes sem realizar validações.
   * Útil para reconstruir um objeto de uma fonte de dados confiável (ex: banco de dados).
   *
   * @static
   * @param {string} id - A string de identificação da carteirinha de estudante.
   * @param {Date} validity - A data de expiração da carteirinha de estudante.
   * @returns {StudentCard} A instância de StudentCard hidratada.
   * @throws {TechnicalError} se id ou validity forem nulos ou indefinidos.
   * @memberof StudentCard
   */
  public static hydrate(id: string, validity: Date): StudentCard {
    TechnicalError.validateRequiredFields({ id, validity })
    return new StudentCard(id, validity)
  }

  /**
   * Compara esta instância de StudentCard com outra para verificar igualdade.
   * Duas instâncias de StudentCard são consideradas iguais se seus IDs e datas de validade forem os mesmos.
   *
   * @param {StudentCard} [other] - A outra instância de StudentCard para comparar.
   * @returns {boolean} Verdadeiro se as instâncias forem iguais, falso caso contrário.
   * @memberof StudentCard
   */
  public equals(other?: StudentCard): boolean {
    if (isNull(other)) return false
    if (!(other instanceof StudentCard)) return false
    return this.id === other.id && this.validity.getTime() === other.validity.getTime()
  }
}
