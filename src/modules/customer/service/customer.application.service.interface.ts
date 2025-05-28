import { CustomerUID } from '@modules/customer/entity/value-object/customer.uid'
import { Result } from '@shared/result/result'
import { Customer } from '@modules/customer/entity/customer'
import { Email } from '@modules/customer/entity/value-object/email'

export interface ICreateCustomerProps {
  name: string
  birthDate: Date
  email: string
  password: string
}

export interface IStudentCardInput {
  id: string
  validity: Date
}

export interface ICustomerApplicationService {
  findById(uid: string | CustomerUID): Promise<Result<Customer>>
  findByEmail(email: string | Email): Promise<Result<Customer>>
  create(props: ICreateCustomerProps): Promise<Result<Customer>>
  updateCustomerEmail(customerUID: string, email: string): Promise<Result<Partial<Customer>>>
  updateCustomerName(customerUID: string, newName: string): Promise<Result<Partial<Customer>>>
  updateCustomerBirthDate(customerUID: string, birthDate: Date): Promise<Result<Partial<Customer>>>
  assignCustomerCPF(customerUID: string, cpf: string): Promise<Result<Partial<Customer>>>
  removeCustomerCPF(customerUID: string): Promise<Result<Partial<Customer>>>
  removeCustomerStudentCard(customerUID: string): Promise<Result<Partial<Customer>>>
  assignCustomerStudentCard(customerUID: string, studentCard: IStudentCardInput): Promise<Result<Partial<Customer>>>
}
