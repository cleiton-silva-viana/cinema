import { Customer } from '../entity/customer'
import { CustomerUID } from '../entity/value-object/customer.uid'
import { Email } from '../entity/value-object/email'
import { CPF } from '@/modules/customer/entity/value-object/cpf'

export interface ICustomerRepository {
  hasEmail(email: Email): Promise<boolean>

  hasCPF(cpf: CPF): Promise<boolean>

  hasStudentCardID(id: string): Promise<boolean>

  findById(uid: CustomerUID): Promise<Customer | null>

  findByEmail(email: Email): Promise<Customer | null>

  create(customer: Customer): Promise<Customer>

  update(uid: CustomerUID, customer: Partial<Customer>): Promise<Customer>

  delete(uid: CustomerUID): Promise<null>
}
