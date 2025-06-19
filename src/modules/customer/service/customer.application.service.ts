import { Injectable, Inject } from '@nestjs/common'
import { CUSTOMER_REPOSITORY } from '../constant/customer.constants'
import { ICustomerRepository } from '../repository/customer.repository.interface'
import { CustomerUID } from '../entity/value-object/customer.uid'
import { Customer } from '../entity/customer'
import { Email } from '../entity/value-object/email'
import { Password } from '../entity/value-object/password'
import { failure, Result, success } from '@shared/result/result'
import { ResourceTypesEnum as ResourceTypes } from '@shared/constant/resource.types'
import { FailureFactory } from '@shared/failure/failure.factory'
import { ICustomerApplicationService } from '@modules/customer/service/customer.application.service.interface'
import { ensureNotNullResult } from '@shared/validator/utils/validation.helpers'
import { ICreateCustomerCommand, IStudentCardCommand } from '@modules/customer/interface/customer.command.interface'

@Injectable()
export class CustomerApplicationService implements ICustomerApplicationService {
  constructor(@Inject(CUSTOMER_REPOSITORY) private readonly repository: ICustomerRepository) {}

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

  public async create(input: ICreateCustomerCommand): Promise<Result<Customer>> {
    const customerResult = ensureNotNullResult({ input }).flatMap(() => Customer.create(input))
    if (customerResult.isInvalid()) return customerResult

    const customer = customerResult.value
    const emailAlreadyInUse = await this.repository.hasEmail(customer.email)
    if (emailAlreadyInUse) return failure(FailureFactory.EMAIL_ALREADY_IN_USE(customer.email.value))

    const passwordResult = await Password.create(input.password)
    if (passwordResult.isInvalid()) return passwordResult

    const password = passwordResult.value
    return success(await this.repository.create(customer, password))
  }

  public async updateCustomerEmail(customerUID: string, email: string): Promise<Result<Customer>> {
    const createEmailResult = Email.create(email)
    if (createEmailResult.isInvalid()) return createEmailResult
    const emailVO = createEmailResult.value

    const emailExists = await this.repository.hasEmail(emailVO)
    if (emailExists) return failure(FailureFactory.EMAIL_ALREADY_IN_USE(email))

    const findCustomerResult = await this.findById(customerUID)
    if (findCustomerResult.isInvalid()) return findCustomerResult
    const customer = findCustomerResult.value

    const updatedCustomerResult = customer.updateEmail(emailVO.value)
    if (updatedCustomerResult.isInvalid()) return updatedCustomerResult
    const updatedCustomer = updatedCustomerResult.value

    return success(await this.repository.update(customer.uid, { email: updatedCustomer.email }))
  }

  public async updateCustomerName(customerUID: string, newName: string): Promise<Result<Customer>> {
    const findCustomerResult = await this.findById(customerUID)
    if (findCustomerResult.isInvalid()) return findCustomerResult

    const customer = findCustomerResult.value
    const updateResult = customer.updateName(newName)
    if (updateResult.isInvalid()) return updateResult

    return success(await this.repository.update(customer.uid, { name: updateResult.value.name }))
  }

  public async updateCustomerBirthDate(customerUID: string, birthDate: Date): Promise<Result<Customer>> {
    const findCustomerResult = await this.findById(customerUID)
    if (findCustomerResult.isInvalid()) return findCustomerResult
    const customer = findCustomerResult.value

    const updateCustomerResult = customer.updateBirthDate(birthDate)
    if (updateCustomerResult.isInvalid()) return updateCustomerResult
    const updatedCustomer = updateCustomerResult.value

    return success(await this.repository.update(customer.uid, { birthDate: updatedCustomer.birthDate }))
  }

  public async assignCustomerCPF(customerUID: string, cpf: string): Promise<Result<Customer>> {
    const findCustomerResult = await this.findById(customerUID)
    if (findCustomerResult.isInvalid()) return findCustomerResult
    const customer = findCustomerResult.value

    const customerUpdateResult = customer.assignCPF(cpf)
    if (customerUpdateResult.isInvalid()) return customerUpdateResult
    const updatedCustomer = customerUpdateResult.value

    const cpfAlreadyInUse = await this.repository.hasCPF(updatedCustomer.cpf!)
    if (cpfAlreadyInUse) return failure(FailureFactory.CPF_ALREADY_IN_USE(cpf))

    return success(await this.repository.update(customer.uid, { cpf: customer.cpf }))
  }

  public async removeCustomerCPF(customerUID: string): Promise<Result<Customer>> {
    const findCustomerResult = await this.findById(customerUID)
    if (findCustomerResult.isInvalid()) return findCustomerResult

    const customer = findCustomerResult.value
    const updatedCustomerResult = customer.removeCPF()
    if (updatedCustomerResult.isInvalid()) return updatedCustomerResult

    return success(await this.repository.update(customer.uid, { cpf: updatedCustomerResult.value.cpf }))
  }

  public async assignCustomerStudentCard(customerUID: string, input: IStudentCardCommand): Promise<Result<Customer>> {
    const findCustomerResult = await this.findById(customerUID)
    if (findCustomerResult.isInvalid()) return findCustomerResult
    const customer = findCustomerResult.value

    const studentCardExists = await this.repository.hasStudentCardID(input.registrationNumber)
    if (studentCardExists) return failure(FailureFactory.STUDENT_CARD_ALREADY_IN_USE(input.registrationNumber))

    const updateCustomerResult = customer.assignStudentCard(input)
    if (updateCustomerResult.isInvalid()) return updateCustomerResult
    const updatedCustomer = updateCustomerResult.value

    return success(await this.repository.update(customer.uid, { studentCard: updatedCustomer.studentCard }))
  }

  public async removeCustomerStudentCard(customerUID: string): Promise<Result<Customer>> {
    const findCustomerResult = await this.findById(customerUID)
    if (findCustomerResult.isInvalid()) return findCustomerResult
    const customer = findCustomerResult.value

    const updateCustomerResult = customer.removeStudentCard()
    if (updateCustomerResult.isInvalid()) return updateCustomerResult

    return success(await this.repository.update(customer.uid, { studentCard: updateCustomerResult.value.studentCard }))
  }
}
