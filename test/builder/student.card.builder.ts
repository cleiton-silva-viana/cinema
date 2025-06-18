import { IStudentCardCommand } from '@modules/customer/interfaces/customer.command.interface'
import { StudentCard } from '@modules/customer/entity/value-object/student-card'
import { faker } from '@faker-js/faker'
import { DateHelper } from '@shared/helper/date.helper'

export function CreateTestStudentCard(overrides?: Partial<IStudentCardCommand>): StudentCard {
  return StudentCard.hydrate({
    registrationNumber: overrides?.registrationNumber || faker.string.alphanumeric(8),
    expirationDate: overrides?.expirationDate || DateHelper.soon(30),
    institution: overrides?.institution || faker.lorem.words(5),
  })
}

export function CloneTestStudentCardWithOverrides(
  instance: StudentCard,
  overrides?: Partial<IStudentCardCommand>
): StudentCard {
  return StudentCard.hydrate({
    registrationNumber: overrides?.registrationNumber || instance.registrationNumber,
    expirationDate: overrides?.expirationDate || instance.expirationDate,
    institution: overrides?.institution || instance.institution,
  })
}
