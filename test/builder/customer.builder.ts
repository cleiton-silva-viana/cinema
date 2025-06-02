import { faker } from '@faker-js/faker'
import { Customer, IHydrateCustomerProps } from '@modules/customer/entity/customer'
import { CustomerUID } from '@modules/customer/entity/value-object/customer.uid'
import { ICreateCustomerDTO } from '@modules/customer/controller/dto/create.customer.dto'

export function CreateTestCustomer(override?: Partial<IHydrateCustomerProps>) {
  const uid = override?.uid ?? CustomerUID.create().value
  const name = override?.name ?? faker.person.fullName()
  const birthDate = override?.birthDate ?? faker.date.birthdate()
  const email = override?.email ?? faker.internet.email()
  const cpf = override?.cpf === undefined ? faker.string.numeric(11) : override.cpf
  const studentCard =
    override?.studentCard === undefined
      ? { id: faker.string.uuid(), validity: faker.date.future() }
      : override.studentCard

  return Customer.hydrate({ uid, name, birthDate, email, cpf, studentCard })
}

export function CloneTestCustomerWithOverrides(
  customer: Customer,
  override: Partial<Omit<IHydrateCustomerProps, 'uid'>>
) {
  return Customer.hydrate({
    uid: customer.uid.value,
    name: override?.name ?? customer.name.value,
    birthDate: override?.birthDate ?? customer.birthDate.value,
    email: override?.email ?? customer.email.value,
    cpf: override?.cpf === undefined ? customer.cpf?.value : override.cpf,
    studentCard:
      override?.studentCard === undefined
        ? customer.studentCard
          ? { id: customer.studentCard.id, validity: customer.studentCard.validity }
          : null
        : override.studentCard,
  })
}

export function CreateTestCustomerDTO(override?: Partial<ICreateCustomerDTO>): ICreateCustomerDTO {
  return {
    name: override?.name ?? faker.person.fullName(),
    birthDate: override?.birthDate ?? faker.date.birthdate(),
    email: override?.email ?? faker.internet.email(),
    password: '123!#$dfVV',
  } as ICreateCustomerDTO
}
