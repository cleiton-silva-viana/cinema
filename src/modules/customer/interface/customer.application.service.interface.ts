import { CustomerUID } from '@modules/customer/entity/value-object/customer.uid'
import { Result } from '@shared/result/result'
import { Customer } from '@modules/customer/entity/customer'
import { Email } from '@modules/customer/entity/value-object/email'
import { ICreateCustomerCommand, IStudentCardCommand } from '@modules/customer/interface/customer.command.interface'
import { CustomerStatusEnum } from '@modules/customer/enum/customer.status.enum'

export interface ICustomerApplicationService {
  findById(uid: string | CustomerUID): Promise<Result<Customer>>
  findByEmail(email: string | Email): Promise<Result<Customer>>
  create(props: ICreateCustomerCommand): Promise<Result<Customer>>
  updateCustomerEmail(customerUID: string, email: string): Promise<Result<Customer>>
  updateCustomerName(customerUID: string, newName: string): Promise<Result<Customer>>
  updateCustomerBirthDate(customerUID: string, birthDate: Date): Promise<Result<Customer>>
  assignCustomerCPF(customerUID: string, cpf: string): Promise<Result<Customer>>
  removeCustomerCPF(customerUID: string): Promise<Result<Customer>>
  removeCustomerStudentCard(customerUID: string): Promise<Result<Customer>>
  assignCustomerStudentCard(customerUID: string, studentCard: IStudentCardCommand): Promise<Result<Customer>>
  requestAccountDeletion(customerUID: string): Promise<Result<Customer>>
  reactivateAccount(customerUID: string): Promise<Result<Customer>>
}
