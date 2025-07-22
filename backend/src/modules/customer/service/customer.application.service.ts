import { Injectable, Inject } from '@nestjs/common'
import { CUSTOMER_REPOSITORY, CUSTOMER_STATUS_STATE_MACHINE } from '../constant/customer.constants'
import { ICustomerRepository } from '../repository/customer.repository.interface'
import { CustomerUID } from '../entity/value-object/customer.uid'
import { Customer } from '../entity/customer'
import { Email } from '../entity/value-object/email'
import { Password } from '../entity/value-object/password'
import { failure, Result, success } from '@shared/result/result'
import { ResourceTypesEnum as ResourceTypes } from '@shared/constant/resource.types'
import { FailureFactory } from '@shared/failure/failure.factory'
import { ICustomerApplicationService } from '@modules/customer/interface/customer.application.service.interface'
import { ensureNotNullResult } from '@shared/validator/utils/validation.helpers'
import { ICreateCustomerCommand, IStudentCardCommand } from '@modules/customer/interface/customer.command.interface'
import { CustomerStatusStateMachine } from './state/customer.status.state.machine'
import { CustomerStatusEnum } from '../enum/customer.status.enum'
import { CustomerStatusTransitionActorEnum } from '../enum/customer.status.transiction.action.enum'

@Injectable()
export class CustomerApplicationService implements ICustomerApplicationService {
  constructor(
    @Inject(CUSTOMER_REPOSITORY) private readonly repository: ICustomerRepository,
    @Inject(CUSTOMER_STATUS_STATE_MACHINE) private readonly customerStatusStateMachine: CustomerStatusStateMachine
  ) {}

  /**
   * Verifica se operações de escrita são permitidas para um cliente baseado em seu status.
   * @param customer A instância do cliente a ser verificada.
   * @returns Um `Result<void>` indicando se a operação é permitida ou não.
   * @private
   */
  private canPerformWriteOperation(customer: Customer): Result<void> {
    // Clientes com status BLOCKED, SUSPENDED ou PENDING_DELETION não podem realizar operações de escrita
    const restrictedStatuses = [
      CustomerStatusEnum.BLOCKED,
      CustomerStatusEnum.SUSPENDED,
      CustomerStatusEnum.PENDING_DELETION,
    ]

    return restrictedStatuses.includes(customer.status)
      ? failure(FailureFactory.CUSTOMER_WRITE_OPERATION_NOT_ALLOWED(customer.status))
      : success(undefined)
  }

  /**
   * Busca um cliente pelo seu UID.
   * @param uid O UID do cliente, pode ser string ou CustomerUID.
   * @returns Um `Result` contendo a instância de `Customer` ou uma lista de falhas.
   */
  public async findById(uid: string | CustomerUID): Promise<Result<Customer>> {
    const result = ensureNotNullResult({ uid })

    return result
      .flatMap(() => {
        return uid instanceof CustomerUID ? success(uid) : CustomerUID.parse(uid)
      })
      .flatMapAsync(async (customerUID) => {
        const customer = await this.repository.findById(customerUID)
        return !customer
          ? failure(FailureFactory.RESOURCE_NOT_FOUND(ResourceTypes.CUSTOMER, customerUID.value))
          : success(customer)
      })
  }

  /**
   * Busca um cliente pelo seu endereço de e-mail.
   * @param email O endereço de e-mail do cliente, pode ser string ou Email.
   * @returns Um `Result` contendo a instância de `Customer` ou uma lista de falhas.
   */
  public async findByEmail(email: string | Email): Promise<Result<Customer>> {
    const result = ensureNotNullResult({ email })

    return result
      .flatMap(() => {
        return email instanceof Email ? success(email) : Email.create(email)
      })
      .flatMapAsync(async (customerEmail) => {
        const customer = await this.repository.findByEmail(customerEmail)

        return !customer
          ? failure(FailureFactory.RESOURCE_NOT_FOUND(ResourceTypes.CUSTOMER, customerEmail.value))
          : success(customer)
      })
  }

  /**
   * Cria um novo cliente no sistema.
   * @param input Os dados para criação do cliente.
   * @returns Um `Result` contendo a instância de `Customer` criada ou uma lista de falhas.
   */
  public async create(input: ICreateCustomerCommand): Promise<Result<Customer>> {
    const customerResult = ensureNotNullResult({ input }).flatMap(() => Customer.create(input))
    if (customerResult.isInvalid()) return customerResult

    const customer = customerResult.value
    const emailAlreadyInUse = await this.repository.hasEmail(customer.email)
    if (emailAlreadyInUse) return failure(FailureFactory.EMAIL_ALREADY_IN_USE(customer.email.value))

    const passwordResult = await Password.create(input.password)
    if (passwordResult.isInvalid()) return passwordResult

    const password = passwordResult.value
    const createdCustomer = await this.repository.create(customer, password)

    return createdCustomer
      ? success(createdCustomer)
      : failure(
          FailureFactory.INTERNAL_SERVER_ERROR('Failed to create customer due to an unexpected repository error.')
        )
  }

  /**
   * Atualiza o endereço de e-mail de um cliente.
   * @param customerUID O UID do cliente a ser atualizado.
   * @param email O novo endereço de e-mail.
   * @returns Um `Result` contendo a instância atualizada de `Customer` ou uma lista de falhas.
   */
  public async updateCustomerEmail(customerUID: string, email: string): Promise<Result<Customer>> {
    const createEmailResult = Email.create(email)
    if (createEmailResult.isInvalid()) return createEmailResult
    const emailVO = createEmailResult.value

    const emailExists = await this.repository.hasEmail(emailVO)
    if (emailExists) return failure(FailureFactory.EMAIL_ALREADY_IN_USE(email))

    const findCustomerResult = await this.findById(customerUID)
    if (findCustomerResult.isInvalid()) return findCustomerResult
    const customer = findCustomerResult.value

    const writePermissionResult = this.canPerformWriteOperation(customer)
    if (writePermissionResult.isInvalid()) return writePermissionResult

    const updatedCustomerResult = customer.updateEmail(emailVO.value)
    if (updatedCustomerResult.isInvalid()) return updatedCustomerResult
    const updatedCustomer = updatedCustomerResult.value

    const updatedCustomerFromRepo = await this.repository.update(customer.uid, { email: updatedCustomer.email })
    return updatedCustomerFromRepo
      ? success(updatedCustomerFromRepo)
      : failure(FailureFactory.RESOURCE_NOT_FOUND(ResourceTypes.CUSTOMER, customer.uid.value))
  }

  /**
   * Atualiza o nome de um cliente.
   * @param customerUID O UID do cliente a ser atualizado.
   * @param newName O novo nome do cliente.
   * @returns Um `Result` contendo a instância atualizada de `Customer` ou uma lista de falhas.
   */
  public async updateCustomerName(customerUID: string, newName: string): Promise<Result<Customer>> {
    const findCustomerResult = await this.findById(customerUID)
    if (findCustomerResult.isInvalid()) return findCustomerResult
    const customer = findCustomerResult.value

    const writePermissionResult = this.canPerformWriteOperation(customer)
    if (writePermissionResult.isInvalid()) return writePermissionResult

    const updateResult = customer.updateName(newName)
    if (updateResult.isInvalid()) return updateResult

    const updatedCustomerFromRepo = await this.repository.update(customer.uid, { name: updateResult.value.name })
    return updatedCustomerFromRepo
      ? success(updatedCustomerFromRepo)
      : failure(
          FailureFactory.INTERNAL_SERVER_ERROR('Failed to update customer name due to an unexpected repository error.')
        )
  }

  /**
   * Atualiza a data de nascimento de um cliente.
   * @param customerUID O UID do cliente a ser atualizado.
   * @param birthDate A nova data de nascimento.
   * @returns Um `Result` contendo a instância atualizada de `Customer` ou uma lista de falhas.
   */
  public async updateCustomerBirthDate(customerUID: string, birthDate: Date): Promise<Result<Customer>> {
    const findCustomerResult = await this.findById(customerUID)
    if (findCustomerResult.isInvalid()) return findCustomerResult
    const customer = findCustomerResult.value

    const writePermissionResult = this.canPerformWriteOperation(customer)
    if (writePermissionResult.isInvalid()) return writePermissionResult

    const updateCustomerResult = customer.updateBirthDate(birthDate)
    if (updateCustomerResult.isInvalid()) return updateCustomerResult
    const updatedCustomer = updateCustomerResult.value

    const updatedCustomerFromRepo = await this.repository.update(customer.uid, { birthDate: updatedCustomer.birthDate })
    return updatedCustomerFromRepo
      ? success(updatedCustomerFromRepo)
      : failure(
          FailureFactory.INTERNAL_SERVER_ERROR(
            'Failed to update customer birth date due to an unexpected repository error.'
          )
        )
  }

  /**
   * Atribui um CPF a um cliente.
   * @param customerUID O UID do cliente.
   * @param cpf O número do CPF a ser atribuído.
   * @returns Um `Result` contendo a instância atualizada de `Customer` ou uma lista de falhas.
   */
  public async assignCustomerCPF(customerUID: string, cpf: string): Promise<Result<Customer>> {
    const findCustomerResult = await this.findById(customerUID)
    if (findCustomerResult.isInvalid()) return findCustomerResult
    const customer = findCustomerResult.value

    const writePermissionResult = this.canPerformWriteOperation(customer)
    if (writePermissionResult.isInvalid()) return writePermissionResult

    const customerUpdateResult = customer.assignCPF(cpf)
    if (customerUpdateResult.isInvalid()) return customerUpdateResult
    const updatedCustomer = customerUpdateResult.value

    const cpfAlreadyInUse = await this.repository.hasCPF(updatedCustomer.cpf!)
    if (cpfAlreadyInUse) return failure(FailureFactory.CPF_ALREADY_IN_USE(cpf))

    const updatedCustomerFromRepo = await this.repository.update(customer.uid, { cpf: customer.cpf })
    return updatedCustomerFromRepo
      ? success(updatedCustomerFromRepo)
      : failure(
          FailureFactory.INTERNAL_SERVER_ERROR('Failed to assign customer CPF due to an unexpected repository error.')
        )
  }

  /**
   * Remove o CPF de um cliente.
   * @param customerUID O UID do cliente.
   * @returns Um `Result` contendo a instância atualizada de `Customer` ou uma lista de falhas.
   */
  public async removeCustomerCPF(customerUID: string): Promise<Result<Customer>> {
    const findCustomerResult = await this.findById(customerUID)
    if (findCustomerResult.isInvalid()) return findCustomerResult
    const customer = findCustomerResult.value

    const writePermissionResult = this.canPerformWriteOperation(customer)
    if (writePermissionResult.isInvalid()) return writePermissionResult

    const updatedCustomerResult = customer.removeCPF()
    if (updatedCustomerResult.isInvalid()) return updatedCustomerResult

    const updatedCustomerFromRepo = await this.repository.update(customer.uid, { cpf: updatedCustomerResult.value.cpf })
    return updatedCustomerFromRepo
      ? success(updatedCustomerFromRepo)
      : failure(
          FailureFactory.INTERNAL_SERVER_ERROR('Failed to remove customer CPF due to an unexpected repository error.')
        )
  }

  /**
   * Atribui um cartão de estudante a um cliente.
   * @param customerUID O UID do cliente.
   * @param input Os dados do cartão de estudante a ser atribuído.
   * @returns Um `Result` contendo a instância atualizada de `Customer` ou uma lista de falhas.
   */
  public async assignCustomerStudentCard(customerUID: string, input: IStudentCardCommand): Promise<Result<Customer>> {
    const findCustomerResult = await this.findById(customerUID)
    if (findCustomerResult.isInvalid()) return findCustomerResult
    const customer = findCustomerResult.value

    const writePermissionResult = this.canPerformWriteOperation(customer)
    if (writePermissionResult.isInvalid()) return writePermissionResult

    const studentCardExists = await this.repository.hasStudentCard(input.registrationNumber)
    if (studentCardExists) return failure(FailureFactory.STUDENT_CARD_ALREADY_IN_USE(input.registrationNumber))

    const updateCustomerResult = customer.assignStudentCard(input)
    if (updateCustomerResult.isInvalid()) return updateCustomerResult
    const updatedCustomer = updateCustomerResult.value

    const updatedCustomerFromRepo = await this.repository.update(customer.uid, {
      studentCard: updatedCustomer.studentCard,
    })
    return updatedCustomerFromRepo
      ? success(updatedCustomerFromRepo)
      : failure(
          FailureFactory.INTERNAL_SERVER_ERROR(
            'Failed to assign customer student card due to an unexpected repository error.'
          )
        )
  }

  /**
   * Remove o cartão de estudante de um cliente.
   * @param customerUID O UID do cliente.
   * @returns Um `Result` contendo a instância atualizada de `Customer` ou uma lista de falhas.
   */
  public async removeCustomerStudentCard(customerUID: string): Promise<Result<Customer>> {
    const findCustomerResult = await this.findById(customerUID)
    if (findCustomerResult.isInvalid()) return findCustomerResult
    const customer = findCustomerResult.value

    const writePermissionResult = this.canPerformWriteOperation(customer)
    if (writePermissionResult.isInvalid()) return writePermissionResult

    const updateCustomerResult = customer.removeStudentCard()
    if (updateCustomerResult.isInvalid()) return updateCustomerResult

    const updatedCustomerFromRepo = await this.repository.update(customer.uid, {
      studentCard: updateCustomerResult.value.studentCard,
    })
    return updatedCustomerFromRepo
      ? success(updatedCustomerFromRepo)
      : failure(
          FailureFactory.INTERNAL_SERVER_ERROR(
            'Failed to remove customer student card due to an unexpected repository error.'
          )
        )
  }

  /**
   * Solicita a deleção da conta do cliente (soft delete).
   * O cliente pode solicitar a deleção quando está nos status ACTIVE, INACTIVE ou SUSPENDED.
   * @param customerUID O UID do cliente.
   * @returns Um `Result` contendo a instância atualizada de `Customer` ou uma lista de falhas.
   */
  public async requestAccountDeletion(customerUID: string): Promise<Result<Customer>> {
    const findCustomerResult = await this.findById(customerUID)
    if (findCustomerResult.isInvalid()) return findCustomerResult
    const customer = findCustomerResult.value

    const transitionResult = CustomerStatusStateMachine.for(customer).markForDeletion(
      CustomerStatusTransitionActorEnum.CUSTOMER
    )

    if (transitionResult.isInvalid()) return transitionResult
    const updatedCustomer = transitionResult.value

    const updatedCustomerFromRepo = await this.repository.update(customer.uid, {
      status: updatedCustomer.status,
    })
    return updatedCustomerFromRepo
      ? success(updatedCustomerFromRepo)
      : failure(
          FailureFactory.INTERNAL_SERVER_ERROR(
            'Failed to request account deletion due to an unexpected repository error.'
          )
        )
  }

  /**
   * Reativa uma conta de cliente que está `PENDING_DELETION`
   * Apenas o próprio cliente pode reativar sua conta quando está suspenso.
   * @param customerUID O UID do cliente.
   * @returns Um `Result` contendo a instância atualizada de `Customer` ou uma lista de falhas.
   */
  public async reactivateAccount(customerUID: string): Promise<Result<Customer>> {
    const findCustomerResult = await this.findById(customerUID)
    if (findCustomerResult.isInvalid()) return findCustomerResult
    const customer = findCustomerResult.value

    const transitionResult = CustomerStatusStateMachine.for(customer).activate(
      CustomerStatusTransitionActorEnum.CUSTOMER
    )

    if (transitionResult.isInvalid()) return transitionResult
    const updatedCustomer = transitionResult.value

    const updatedCustomerFromRepo = await this.repository.update(customer.uid, {
      status: updatedCustomer.status,
    })
    return updatedCustomerFromRepo
      ? success(updatedCustomerFromRepo)
      : failure(
          FailureFactory.INTERNAL_SERVER_ERROR('Failed to reactivate account due to an unexpected repository error.')
        )
  }
}
