import { Inject, Injectable } from '@nestjs/common'
import { CUSTOMER_REPOSITORY } from '../constant/customer.constants'
import { ICustomerRepository } from '../repository/customer.repository.interface'
import { CustomerUID } from '../entity/value-object/customer.uid'
import { Customer } from '../entity/customer'
import { Email } from '../entity/value-object/email'
import { Password } from '../entity/value-object/password'
import { failure, Result, success } from '@shared/result/result'
import { ensureNotNull } from '@shared/validator/common.validators'
import { ResourceTypes } from '@shared/constant/resource.types'
import { isNull } from '@shared/validator/validator'
import { FailureFactory } from '@shared/failure/failure.factory'
import {
  ICreateCustomerProps,
  ICustomerApplicationService,
  IStudentCardInput,
} from '@modules/customer/service/customer.application.service.interface'

@Injectable()
export class CustomerApplicationService implements ICustomerApplicationService {
  constructor(@Inject(CUSTOMER_REPOSITORY) private readonly repository: ICustomerRepository) {}

  public async findById(uid: string | CustomerUID): Promise<Result<Customer>> {
    const failures = ensureNotNull({ uid })
    if (failures.length > 0) return failure(failures)

    const parseCustomerUidResult = uid instanceof CustomerUID ? success(uid) : CustomerUID.parse(uid)

    if (parseCustomerUidResult.isInvalid()) return parseCustomerUidResult

    const customerUID = parseCustomerUidResult.value

    const customer = await this.repository.findById(customerUID)

    return !customer
      ? failure(FailureFactory.RESOURCE_NOT_FOUND(ResourceTypes.CUSTOMER, customerUID.value))
      : success(customer)
  }

  public async findByEmail(email: string | Email): Promise<Result<Customer>> {
    const failures = ensureNotNull({ email })
    if (failures.length > 0) return failure(failures)

    const emailCheckedResult = email instanceof Email ? success(email) : Email.create(email)

    if (emailCheckedResult.isInvalid()) return emailCheckedResult

    const customerEmail = emailCheckedResult.value

    const customer = await this.repository.findByEmail(customerEmail)

    return isNull(customer)
      ? failure(FailureFactory.RESOURCE_NOT_FOUND(ResourceTypes.CUSTOMER, customerEmail.value))
      : success(customer)
  }

  public async create(props: ICreateCustomerProps): Promise<Result<Customer>> {
    const failures = ensureNotNull({ props })
    if (failures.length > 0) return failure(failures)

    const { name, birthDate, email, password } = props
    failures.push(...ensureNotNull({ name, birthDate, email, password }))
    if (failures.length > 0) return failure(failures)

    const createCustomerResult = Customer.create(name, birthDate, email)
    if (createCustomerResult.isInvalid()) return createCustomerResult

    const customer = createCustomerResult.value

    const emailAlreadyInUse = await this.repository.hasEmail(customer.email)
    if (emailAlreadyInUse) return failure(FailureFactory.EMAIL_ALREADY_IN_USE(email))

    const createPasswordResult = await Password.create(password)
    if (createPasswordResult.isInvalid()) return createPasswordResult

    return success(await this.repository.create(customer))
  }

  public async updateCustomerEmail(customerUID: string, email: string): Promise<Result<Customer>> {
    const failures = ensureNotNull({ customerUID, email })
    if (failures.length > 0) return failure(failures)

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

    return success(await this.repository.update(customer.uid, { name: customer.name }))
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

  public async assignCustomerStudentCard(
    customerUID: string,
    studentCard: IStudentCardInput
  ): Promise<Result<Customer>> {
    const findCustomerResult = await this.findById(customerUID)
    if (findCustomerResult.isInvalid()) return findCustomerResult

    const customer = findCustomerResult.value

    const updateCustomerResult = customer.assignStudentCard(studentCard?.id, studentCard?.validity)
    if (updateCustomerResult.isInvalid()) return updateCustomerResult

    const updatedCustomer = updateCustomerResult.value

    const studentCardExists = await this.repository.hasStudentCardID(updatedCustomer.studentCard!.id)
    if (studentCardExists) failure(FailureFactory.STUDENT_CARD_ALREADY_IN_USE(studentCard.id))

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
