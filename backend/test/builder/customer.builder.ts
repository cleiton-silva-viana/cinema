import { faker } from '@faker-js/faker'
import { Customer } from '@modules/customer/entity/customer'
import { CustomerUID } from '@modules/customer/entity/value-object/customer.uid'
import { IHydrateCustomerCommand, IStudentCardCommand } from '@modules/customer/interface/customer.command.interface'
import { DateHelper } from '@shared/helper/date.helper'
import { CustomerStatusEnum } from '@modules/customer/enum/customer.status.enum'

/**
 * Cria uma instância válida da classe Customer
 * ATENÇÃO: As propriedades opcionais são undefined por padrão
 * */
export function CreateTestCustomer(override?: Partial<IHydrateCustomerCommand>) {
  const uid = override?.uid ?? CustomerUID.create().value
  const name = override?.name ?? faker.person.fullName()
  const birthDate = override?.birthDate ?? faker.date.birthdate()
  const email = override?.email ?? faker.internet.email()
  const createdAt = override?.createdAt ?? DateHelper.recent(120)
  const updatedAt = override?.updatedAt ?? DateHelper.recent(60)
  const cpf = override?.cpf
  const studentCard = override?.studentCard
  const status = override?.status ?? CustomerStatusEnum.ACTIVE

  return Customer.hydrate({ uid, name, birthDate, email, status, createdAt, updatedAt, cpf, studentCard })
}

export function CloneTestCustomerWithOverrides(
  customer: Customer,
  override: Partial<Omit<IHydrateCustomerCommand, 'uid'>>
) {
  const card: IStudentCardCommand | undefined = customer.studentCard
    ? {
        expirationDate: customer.studentCard?.expirationDate,
        registrationNumber: customer.studentCard?.registrationNumber,
        institution: customer.studentCard?.institution,
      }
    : undefined

  return Customer.hydrate({
    uid: customer.uid.value,
    name: override?.name ?? customer.name.value,
    birthDate: override?.birthDate ?? customer.birthDate.value,
    email: override?.email ?? customer.email.value,
    status: override.status ?? customer.status,
    createdAt: override.createdAt ?? customer.createdAt,
    updatedAt: customer.updatedAt ?? customer.updatedAt,
    cpf: override.hasOwnProperty('cpf') ? override.cpf : customer.cpf?.value,
    studentCard: override.hasOwnProperty('studentCard') ? override.studentCard : card,
  })
}
