import { Customer } from '../entity/customer'
import { CustomerUID } from '../entity/value-object/customer.uid'
import { Email } from '../entity/value-object/email'

export interface ICustomerRepository {
  findById(uid: CustomerUID): Promise<Customer>

  findByEmail(email: Email): Promise<Customer>

  create(customer: Customer): Promise<Customer>

  update(uid: CustomerUID, customer: Customer): Promise<Customer>

  delete(uid: CustomerUID): Promise<null>
}
