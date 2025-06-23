import { CustomerUID } from './value-object/customer.uid'
import { Email } from './value-object/email'
import { CPF } from './value-object/cpf'
import { StudentCard } from './value-object/student-card'
import { combine, failure, Result, success } from '@shared/result/result'
import { TechnicalError } from '@shared/error/technical.error'
import { BirthDate } from '@shared/value-object/birth.date'
import { Name } from '@shared/value-object/name'
import {
  ICreateCustomerCommand,
  IHydrateCustomerCommand,
  IStudentCardCommand,
} from '@modules/customer/interface/customer.command.interface'
import { ensureNotNullResult, hydrateEnum } from '@shared/validator/utils/validation.helpers'
import { DateHelper } from '@shared/helper/date.helper'
import { CustomerStatusEnum } from '@modules/customer/enum/customer.status.enum'

/**
 * Representa um cliente no sistema de cinema.
 *
 * Esta classe é imutável. Todas as propriedades são somente leitura.
 * Qualquer atualização resulta em uma nova instância.
 */
export class Customer {
  private constructor(
    public readonly uid: CustomerUID,
    public readonly name: Name,
    public readonly birthDate: BirthDate,
    public readonly email: Email,
    public readonly status: CustomerStatusEnum,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly studentCard?: StudentCard | null,
    public readonly cpf?: CPF | null
  ) {}

  private static readonly MIN_OLDER_AGE = 65

  /**
   * Cria uma nova instância de Customer com validação.
   * @param input As propriedades para criar o cliente.
   * @returns Um `Result` contendo a instância de `Customer` ou uma lista de falhas.
   */
  public static create(input: ICreateCustomerCommand): Result<Customer> {
    const result = ensureNotNullResult({ input })
    if (result.isInvalid()) return result

    return combine([
      Name.create(input.name),
      BirthDate.create(input.birthDate),
      Email.create(input.email),
      input.cpf ? CPF.create(input.cpf) : success(undefined),
      input.studentCard ? StudentCard.create(input.studentCard) : success(undefined),
    ]).flatMap((arr) => {
      const now = new Date()
      const [name, birthDate, email, cpf, studentCard] = arr
      return success(
        new Customer(
          CustomerUID.create(),
          name,
          birthDate,
          email,
          CustomerStatusEnum.ACTIVE,
          now,
          now,
          studentCard,
          cpf
        )
      )
    })
  }

  /**
   * Cria uma instância de Customer a partir de dados existentes sem validação.
   * Usado para reconstituir um objeto a partir do banco de dados ou outra fonte confiável.
   * @param input As propriedades para hidratar o cliente.
   * @returns Uma instância de `Customer`.
   */
  public static hydrate(input: IHydrateCustomerCommand): Customer {
    TechnicalError.validateRequiredFields({ input })
    TechnicalError.validateRequiredFields({ createdAt: input.createdAt, updatedAt: input.updatedAt })

    const cpf = input.cpf ? CPF.hydrate(input.cpf) : undefined
    const card = input.studentCard ? StudentCard.hydrate(input.studentCard) : undefined

    return new Customer(
      CustomerUID.hydrate(input.uid),
      Name.hydrate(input.name),
      BirthDate.hydrate(input.birthDate),
      Email.hydrate(input.email),
      hydrateEnum({ status: input.status }, CustomerStatusEnum),
      input.createdAt,
      input.updatedAt,
      card,
      cpf
    )
  }

  /**
   * Verifica se o cliente é considerado idoso com base em uma idade mínima predefinida.
   * @returns {boolean} Verdadeiro se a data de nascimento do cliente indica que ele é mais velho que a idade mínima, falso caso contrário.
   */
  get isOlder(): boolean {
    const limitDate = DateHelper.past({ years: Customer.MIN_OLDER_AGE })
    const birthDate = this.birthDate.value

    return DateHelper.startOfDay(birthDate) < DateHelper.startOfDay(limitDate)
  }

  /**
   * Verifica se o cliente é um estudante válido (possui carteira de estudante válida).
   * @returns {boolean} Verdadeiro se o cliente possui carteira de estudante e ela é válida, falso caso contrário.
   */
  get isStudent(): boolean {
    return Boolean(this.studentCard?.isValid)
  }

  /**
   * Atualiza o nome do cliente.
   * Retorna uma nova instância de `Customer` com o nome atualizado.
   * @param name O novo valor para o nome.
   * @returns Um `Result` contendo a nova instância de `Customer` ou uma lista de falhas.
   */
  public updateName(name: string): Result<Customer> {
    const nameResult = Name.create(name)
    return nameResult.isInvalid() ? nameResult : success(this.copyWith({ name: nameResult.value }))
  }

  /**
   * Atualiza a data de nascimento do cliente.
   * Retorna uma nova instância de `Customer` com a data de nascimento atualizada.
   * @param birthDateValue O novo valor para a data de nascimento.
   * @returns Um `Result` contendo a nova instância de `Customer` ou uma lista de falhas.
   */
  public updateBirthDate(birthDateValue: Date): Result<Customer> {
    const birthDateResult = BirthDate.create(birthDateValue)
    return birthDateResult.isInvalid() ? birthDateResult : success(this.copyWith({ birthDate: birthDateResult.value }))
  }

  /**
   * Atualiza o endereço de e-mail do cliente.
   * Retorna uma nova instância de `Customer` com o e-mail atualizado.
   * @param email O novo valor para o e-mail.
   * @returns Um `Result` contendo a nova instância de `Customer` ou uma lista de falhas.
   */
  public updateEmail(email: string): Result<Customer> {
    const emailResult = Email.create(email)
    return emailResult.isInvalid() ? emailResult : success(this.copyWith({ email: emailResult.value }))
  }

  /**
   * Atribui um CPF ao cliente.
   * Retorna uma nova instância de `Customer` com o CPF atribuído.
   * @param cpf O novo valor para o CPF.
   * @returns Um `Result` contendo a nova instância de `Customer` ou uma lista de falhas.
   */
  public assignCPF(cpf: string): Result<Customer> {
    const cpfResult = CPF.create(cpf)
    return cpfResult.isInvalid() ? failure(cpfResult.failures) : success(this.copyWith({ cpf: cpfResult.value }))
  }

  /**
   * Remove o CPF do cliente.
   * Retorna uma nova instância de `Customer` sem o CPF.
   * @returns Um `Result` contendo a nova instância de `Customer`.
   */
  public removeCPF(): Result<Customer> {
    return success(this.copyWith({ cpf: undefined }))
  }

  /**
   * Atribui ou atualiza a carteira de estudante do cliente.
   * Retorna uma nova instância de `Customer` com a carteira de estudante atribuída/atualizada.
   * @param input As propriedades para criar o cliente.
   * @returns Um `Result` contendo a nova instância de `Customer` ou uma lista de falhas.
   */
  public assignStudentCard(input: IStudentCardCommand): Result<Customer> {
    const studentCardResult = StudentCard.create(input)
    return studentCardResult.isInvalid()
      ? failure(studentCardResult.failures)
      : success(this.copyWith({ studentCard: studentCardResult.value }))
  }

  /**
   * Remove a carteira de estudante do cliente.
   * Retorna uma nova instância de `Customer` sem a carteira de estudante.
   * @returns Um `Result` contendo a nova instância de `Customer`.
   */
  public removeStudentCard(): Result<Customer> {
    return success(this.copyWith({ studentCard: undefined }))
  }

  /**
   * Atualiza o status do cliente.
   * Retorna uma nova instância de `Customer` com o status atualizado.
   * @param status O novo status do cliente.
   * @returns Um `Result` contendo a nova instância de `Customer`.
   */
  public updateStatus(status: CustomerStatusEnum): Result<Customer> {
    return success(this.copyWith({ status }))
  }

  /**
   * Inativa o cliente (soft delete).
   * Retorna uma nova instância de `Customer` com status INACTIVE.
   * @returns Um `Result` contendo a nova instância de `Customer`.
   */
  public deactivate(): Result<Customer> {
    return success(this.copyWith({ status: CustomerStatusEnum.INACTIVE }))
  }

  /**
   * Reativa o cliente.
   * Retorna uma nova instância de `Customer` com status ACTIVE.
   * @returns Um `Result` contendo a nova instância de `Customer`.
   */
  public activate(): Result<Customer> {
    return success(this.copyWith({ status: CustomerStatusEnum.ACTIVE }))
  }

  /**
   * Suspende o cliente.
   * Retorna uma nova instância de `Customer` com status SUSPENDED.
   * @returns Um `Result` contendo a nova instância de `Customer`.
   */
  public suspend(): Result<Customer> {
    return success(this.copyWith({ status: CustomerStatusEnum.SUSPENDED }))
  }

  /**
   * Bloqueia o cliente permanentemente.
   * Retorna uma nova instância de `Customer` com status BLOCKED.
   * @returns Um `Result` contendo a nova instância de `Customer`.
   */
  public block(): Result<Customer> {
    return success(this.copyWith({ status: CustomerStatusEnum.BLOCKED }))
  }

  /**
   * Verifica se o cliente está ativo.
   * @returns {boolean} Verdadeiro se o status do cliente é ACTIVE, falso caso contrário.
   */
  get isActive(): boolean {
    return this.status === CustomerStatusEnum.ACTIVE
  }

  /**
   * Verifica se o cliente está inativo.
   * @returns {boolean} Verdadeiro se o status do cliente é INACTIVE, falso caso contrário.
   */
  get isInactive(): boolean {
    return this.status === CustomerStatusEnum.INACTIVE
  }

  /**
   * Verifica se o cliente está suspenso.
   * @returns {boolean} Verdadeiro se o status do cliente é SUSPENDED, falso caso contrário.
   */
  get isSuspended(): boolean {
    return this.status === CustomerStatusEnum.SUSPENDED
  }

  /**
   * Verifica se o cliente está bloqueado.
   * @returns {boolean} Verdadeiro se o status do cliente é BLOCKED, falso caso contrário.
   */
  get isBlocked(): boolean {
    return this.status === CustomerStatusEnum.BLOCKED
  }

  private copyWith(changes: {
    uid?: CustomerUID
    name?: Name
    birthDate?: BirthDate
    email?: Email
    status?: CustomerStatusEnum
    createdAt?: Date
    updatedAt?: Date
    studentCard?: StudentCard | null
    cpf?: CPF | null
  }): Customer {
    return new Customer(
      'uid' in changes ? changes.uid! : this.uid,
      'name' in changes ? changes.name! : this.name,
      'birthDate' in changes ? changes.birthDate! : this.birthDate,
      'email' in changes ? changes.email! : this.email,
      'status' in changes ? changes.status! : this.status,
      'createdAt' in changes ? changes.createdAt! : this.createdAt,
      new Date(), // Always update 'updatedAt' when copying
      'studentCard' in changes ? changes.studentCard : this.studentCard,
      'cpf' in changes ? changes.cpf : this.cpf
    )
  }
}
