import { Customer } from '../entity/customer'
import { CustomerUID } from '../entity/value-object/customer.uid'
import { Email } from '../entity/value-object/email'
import { CPF } from '@/modules/customer/entity/value-object/cpf'
import { Password } from '@modules/customer/entity/value-object/password'

export interface ICustomerRepository {
  hasEmail(email: Email): Promise<boolean>

  hasCPF(cpf: CPF): Promise<boolean>

  hasStudentCard(id: string): Promise<boolean>

  findById(uid: CustomerUID): Promise<Customer | null>

  findByEmail(email: Email): Promise<Customer | null>

  create(customer: Customer, password: Password): Promise<Customer>

  update(uid: CustomerUID, customer: Partial<Customer>): Promise<Customer | null>

  // Métodos administrativos para hard delete
  permanentlyDelete(uid: CustomerUID): Promise<{ affected: number }>

  findInactiveCustomersSince(date: Date): Promise<Customer[]>
}
