import { failure, Result, success } from '@shared/result/result'
import { Validate } from '@shared/validator/validate'
import { TechnicalError } from '@shared/error/technical.error'
import { ensureNotNullResult } from '@shared/validator/utils/validation.helpers'
import { isNullOrUndefined } from '@shared/validator/utils/validation'
import { FailureFactory } from '@shared/failure/failure.factory'
import { IStudentCardCommand } from '@modules/customer/interface/customer.command.interface'
import { SimpleFailure } from '@shared/failure/simple.failure.type'
import { DateHelper } from '@shared/helper/date.helper'

/**
 * @class StudentCard
 * @description Representa uma carteirinha de estudante com um ID e data de validade.
 * Este objeto de valor garante que as informações da carteirinha de estudante sejam válidas e consistentes.
 */
export class StudentCard {
  /** Comprimento mínimo para o ID da carteirinha de estudante. */
  private static readonly MIN_ID_LENGTH = 6

  /** Comprimento máximo para o ID da carteirinha de estudante. */
  private static readonly MAX_ID_LENGTH = 24

  /** Comprimento mínimo para o nome da instituição. */
  private static readonly MIN_INSTITUTION_LENGTH = 3

  /** Comprimento máximo para o nome da instituição. */
  private static readonly MAX_INSTITUTION_LENGTH = 100

  /** Padrão regex para caracteres permitidos no nome da instituição (letras, números, espaços e alguns caracteres especiais comuns como hífens e apóstrofos). */
  private static readonly INSTITUTION_NAME_REGEX = /^[a-zA-Z0-9\s\-'.&()]+$/

  /** Período máximo de validade no futuro, em dias (aproximadamente 2 anos). */
  private static readonly MAX_VALIDITY_DAY_IN_FUTURE = 360 * 2

  /**
   * Construtor privado para impor a criação através de métodos de fábrica estáticos.
   * @param {string} institution - A instituição de ensino associada à carteirinha.
   * @param {string} registrationNumber - O número de matrícula do estudante.
   * @param {Date} expirationDate - A data de expiração da carteirinha de estudante.
   */
  private constructor(
    public readonly institution: string,
    public readonly registrationNumber: string,
    public readonly expirationDate: Date
  ) {}

  /**
   * Cria uma nova instância de StudentCard após validar os dados fornecidos.
   *
   * @static
   * @param {IStudentCardCommand} input - Objeto contendo a instituição, número de matrícula e data de expiração.
   * @returns {Result<StudentCard>} Um objeto Result contendo a instância de StudentCard ou um array de falhas.
   * @memberof StudentCard
   */
  public static create(input: IStudentCardCommand): Result<StudentCard> {
    return ensureNotNullResult({ input })
      .flatMap(() => this.validateCreateStudentCardInput(input))
      .map(() => new StudentCard(input.institution, input.registrationNumber, input.expirationDate))
  }

  /**
   * Hidrata uma instância de StudentCard a partir de dados existentes sem realizar validações.
   * Útil para reconstruir um objeto de uma fonte de dados confiável (ex: banco de dados).
   *
   * @static
   * @returns {StudentCard} A instância de StudentCard hidratada.
   * @throws {TechnicalError} se os campos obrigatórios forem nulos ou indefinidos.
   * @memberof StudentCard
   */
  public static hydrate(input: IStudentCardCommand): StudentCard {
    TechnicalError.validateRequiredFields({ input })
    TechnicalError.validateRequiredFields({ ...input })
    return new StudentCard(input.institution, input.registrationNumber, input.expirationDate)
  }

  /**
   * Verifica se a carteirinha de estudante está atualmente válida (ou seja, não expirada).
   *
   * @returns {boolean} Verdadeiro se a data de validade da carteirinha for futura ou hoje, falso caso contrário.
   * @memberof StudentCard
   */
  get isValid(): boolean {
    const today = DateHelper.startOfDay(new Date())
    const expirationDate = DateHelper.startOfDay(new Date(this.expirationDate))
    return expirationDate >= today
  }

  /**
   * Verifica se a carteirinha de estudante está expirada.
   *
   * @returns {boolean} Verdadeiro se a data de validade da carteirinha for passada, falso caso contrário.
   */
  get hasExpired(): boolean {
    return !this.isValid
  }

  /**
   * Compara esta instância de StudentCard com outra para verificar igualdade.
   * Duas instâncias de StudentCard são consideradas iguais se seus `institution`, `registrationNumber` e `expirationDate` forem os mesmos.
   *
   * @param {StudentCard} [other] - A outra instância de StudentCard para comparar.
   * @returns {boolean} Verdadeiro se as instâncias forem iguais, falso caso contrário.
   * @memberof StudentCard
   */
  public equals(other?: StudentCard): boolean {
    if (isNullOrUndefined(other)) return false
    if (!(other instanceof StudentCard)) return false
    return (
      this.institution === other.institution &&
      this.registrationNumber === other.registrationNumber &&
      this.expirationDate.getTime() === other.expirationDate.getTime()
    )
  }

  private static validateRegistrationNumber(registrationNumber: string, failures: SimpleFailure[]): void {
    Validate.string({ registrationNumber }, failures)
      .isRequired()
      .hasLengthBetween(StudentCard.MIN_ID_LENGTH, StudentCard.MAX_ID_LENGTH, () =>
        FailureFactory.STUDENT_CARD_ID_INVALID_FORMAT(registrationNumber)
      )
  }

  private static validateInstitution(institution: string, failures: SimpleFailure[]): void {
    Validate.string({ institution }, failures)
      .isRequired()
      .hasLengthBetween(StudentCard.MIN_INSTITUTION_LENGTH, StudentCard.MAX_INSTITUTION_LENGTH)
      .matchesPattern(StudentCard.INSTITUTION_NAME_REGEX, () => FailureFactory.STRING_WITH_INVALID_FORMAT(institution))
  }

  private static validateExpirationDate(expirationDate: Date, failures: SimpleFailure[]): void {
    const now = new Date()
    const maxFutureDate = new Date(now.getTime() + StudentCard.MAX_VALIDITY_DAY_IN_FUTURE * 24 * 60 * 60 * 1000)

    Validate.date({ expirationDate }, failures)
      .isRequired()
      .isAfter(now, () => FailureFactory.DATE_CANNOT_BE_PAST('expirationDate'))
      .isBefore(maxFutureDate, () =>
        FailureFactory.DATE_NOT_AFTER_LIMIT(
          DateHelper.formatDateToISOString(expirationDate),
          DateHelper.formatDateToISOString(maxFutureDate)
        )
      )
  }

  private static validateCreateStudentCardInput(input: IStudentCardCommand): Result<true> {
    const failures: SimpleFailure[] = []

    this.validateRegistrationNumber(input.registrationNumber, failures)
    this.validateInstitution(input.institution, failures)
    this.validateExpirationDate(input.expirationDate, failures)

    return failures.length > 0 ? failure(failures) : success(true)
  }
}
