import { Customer } from './customer'
import { CPF } from './value-object/cpf'
import { CustomerUID } from './value-object/customer.uid'
import {
  ICreateCustomerCommand,
  IHydrateCustomerCommand,
  IStudentCardCommand,
} from '@modules/customer/interface/customer.command.interface'
import { faker } from '@faker-js/faker'
import { DateHelper } from '@shared/helper/date.helper'
import { testRequiredFields } from '@test/helpers/required.fields.helper'
import { CreateTestCustomer } from '@test/builder/customer.builder'
import { CreateTestStudentCard } from '@test/builder/student.card.builder'
import { CustomerStatusEnum } from '@modules/customer/enum/customer.status.enum'

describe('Customer', () => {
  describe('Métodos estáticos', () => {
    const input: ICreateCustomerCommand = {
      name: 'jon doe',
      email: faker.internet.email(),
      cpf: '123.123.123-12',
      birthDate: new Date(1990, 0, 1),
      password: '123ABCasv#$@',
      studentCard: {
        institution: 'faker inst',
        expirationDate: DateHelper.soon(45),
        registrationNumber: 'FAKER111',
      },
    }

    describe('create', () => {
      it('deve criar um Customer válido com todos os campos fornecidos', async () => {
        // Act
        const result = Customer.create(input)

        // Assert
        expect(result).toBeValidResultMatching<Customer>((c) => {
          expect(c).toBeInstanceOf(Customer)
          expect(c.name.value).toBe(input.name)
          expect(c.birthDate.value.toISOString()).toBe(input.birthDate.toISOString())
          expect(c.email.value).toBe(input.email)
          expect(c.cpf?.value).toBe(input.cpf)
          expect(c.studentCard?.institution).toBe(input.studentCard?.institution)
          expect(c.studentCard?.expirationDate).toBe(input.studentCard?.expirationDate)
          expect(c.studentCard?.registrationNumber).toBe(input.studentCard?.registrationNumber)
        })
      })

      describe('cenários de falha', () => {
        const cases = [
          { scenario: 'com nome inválido', prop: { name: '' } },
          {
            scenario: 'com data de nascimento inválida',
            prop: { birthDate: new Date() },
          },
          { scenario: 'com email inválido', prop: { email: 'invalid-email' } },
          {
            scenario: 'com cartão de estudante inválido',
            prop: { studentCard: {} as any },
          },
          { scenario: 'com CPF inválido', prop: { cpf: '123' } },
        ]

        cases.forEach(({ scenario, prop }) => {
          it(`deve falhar ao criar um Customer ${scenario}`, () => {
            // Act
            const result = Customer.create({ ...input, ...prop })

            // Assert
            expect(result).toBeInvalidResult()
          })
        })
      })
    })

    describe('hydrate', () => {
      const hydrateInput: IHydrateCustomerCommand = {
        ...input,
        uid: CustomerUID.create().value,
        cpf: '123.123.123-12',
        status: CustomerStatusEnum.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      it('deve hidratar um Customer com todos os campos', () => {
        // Act
        const customer = Customer.hydrate(hydrateInput)

        // Assert
        expect(customer).toBeInstanceOf(Customer)
        expect(customer.uid.value).toBe(hydrateInput.uid)
        expect(customer.name.value).toBe(hydrateInput.name)
        expect(customer.birthDate.value.toISOString()).toBe(hydrateInput.birthDate.toISOString())
        expect(customer.email.value).toBe(hydrateInput.email)
        expect(customer.cpf?.value).toBe(hydrateInput.cpf)
        expect(customer.studentCard?.institution).toBe(hydrateInput.studentCard?.institution)
        expect(customer.studentCard?.expirationDate).toBe(hydrateInput.studentCard?.expirationDate)
        expect(customer.studentCard?.registrationNumber).toBe(hydrateInput.studentCard?.registrationNumber)
      })

      it('deve hidratar um Customer sem CPF e StudentCard', () => {
        // Arrange
        const propsWithoutOptionalProps: IHydrateCustomerCommand = {
          ...hydrateInput,
          studentCard: undefined,
          cpf: undefined,
        }

        // Act
        const customer = Customer.hydrate(propsWithoutOptionalProps)

        // Assert
        expect(customer.cpf).toBeUndefined()
        expect(customer.studentCard).toBeUndefined()
      })

      it('deve falhar quando objeto de parâmetro for nulo', () => {
        expect(() => Customer.hydrate(null as any)).toThrowTechnicalError()
      })

      describe('deve falhar quando propriedades obrigatórias forem nulas', () => {
        testRequiredFields(Customer.hydrate, hydrateInput, [
          'uid',
          'name',
          'birthDate',
          'email',
          'createdAt',
          'updatedAt',
        ])
      })
    })
  })

  describe('Métodos de instância', () => {
    const customerMock = CreateTestCustomer({
      cpf: '123.123.133-99',
      studentCard: {
        institution: faker.lorem.words(5),
        registrationNumber: faker.string.alphanumeric(8),
        expirationDate: DateHelper.soon(30),
      },
    })

    describe('updateName', () => {
      it('deve atualizar o nome com sucesso', async () => {
        // Arrange
        const newName = 'Jane Doe'

        // Act
        const result = customerMock.updateName(newName)

        // Assert
        expect(result).toBeValidResultMatching<Customer>((c) => {
          expect(c.name.value).toBe(newName)
          expect(c.uid).toBe(customerMock.uid)
        })
      })

      it('deve falhar ao atualizar com nome inválido', async () => {
        // Arrange
        const invalidName = 'J'

        // Act
        const result = customerMock.updateName(invalidName)

        // Assert
        expect(result).toBeInvalidResult()
      })
    })

    describe('updateBirthDate', () => {
      it('deve atualizar a data de nascimento com sucesso', async () => {
        // Arrange
        const newBirthDate = new Date(1995, 5, 15)

        // Act
        const result = customerMock.updateBirthDate(newBirthDate)

        // Assert
        expect(result).toBeValidResultMatching<Customer>((c) => {
          expect(c.birthDate.value.toISOString()).toBe(newBirthDate.toISOString())
        })
      })

      it('deve falhar ao atualizar com data de nascimento inválida', async () => {
        // Arrange
        const invalidBirthDate = new Date(2500, 0, 1) // Data no futuro

        // Act
        const result = customerMock.updateBirthDate(invalidBirthDate)

        // Assert
        expect(result).toBeInvalidResult()
      })
    })

    describe('updateEmail', () => {
      it('deve atualizar o email com sucesso', async () => {
        // Arrange
        const newEmail = 'jane.doe@example.com'

        // Act
        const result = customerMock.updateEmail(newEmail)

        // Assert
        expect(result).toBeValidResultMatching<Customer>((c) => {
          expect(c.email.value).toBe(newEmail)
        })
      })

      it('deve falhar ao atualizar com email inválido', async () => {
        // Arrange
        const invalidEmail = 'invalid-email'

        // Act
        const result = customerMock.updateEmail(invalidEmail)

        // Assert
        expect(result).toBeInvalidResult()
      })
    })

    describe('assignCPF', () => {
      it('deve atribuir CPF com sucesso', async () => {
        // Arrange
        const newCPF = '123.456.789-89'

        // Act
        const result = customerMock.assignCPF(newCPF)

        // Assert
        expect(result).toBeValidResultMatching<Customer>((c) => {
          expect(c.cpf).toBeInstanceOf(CPF)
          expect(c.cpf?.value).toBe(newCPF)
        })
      })

      it('deve falhar ao atribuir CPF inválido', async () => {
        // Arrange
        const invalidCpf = '123'

        // Act
        const result = customerMock.assignCPF(invalidCpf)

        // Assert
        expect(result).toBeInvalidResult()
      })
    })

    describe('removeCPF', () => {
      it('deve remover o CPF com sucesso', () => {
        // Act
        const result = customerMock.removeCPF()

        // Assert
        expect(result).toBeValidResultMatching<Customer>((c) => {
          expect(c.cpf).toBeUndefined()
        })
      })
    })

    describe('assignStudentCard', () => {
      const newStudentCard: IStudentCardCommand = {
        registrationNumber: 'ABC123455',
        expirationDate: DateHelper.soon(35),
        institution: faker.lorem.words(5),
      }

      it('deve atribuir StudentCard com sucesso', async () => {
        // Act
        const result = customerMock.assignStudentCard(newStudentCard)

        // Assert
        expect(result).toBeValidResultMatching<Customer>((c) => {
          expect(c.studentCard?.institution).toBe(newStudentCard.institution)
          expect(c.studentCard?.registrationNumber).toBe(newStudentCard.registrationNumber)
          expect(c.studentCard?.expirationDate).toBe(newStudentCard.expirationDate)
        })
      })

      it('deve falhar ao atribuir StudentCard inválido', async () => {
        // Arrange
        const invalidId = { ...newStudentCard, expirationDate: DateHelper.recent(1) } // tentativa de cadastrar um cartão de estudante com validade expirada

        // Act
        const result = customerMock.assignStudentCard(invalidId)

        // Assert
        expect(result).toBeInvalidResult()
      })
    })

    describe('removeStudentCard', () => {
      it('deve remover o StudentCard com sucesso', async () => {
        expect(customerMock.studentCard).toBeDefined()

        // Act
        const result = customerMock.removeStudentCard()

        // Assert
        expect(result).toBeValidResultMatching<Customer>((c) => {
          expect(c.studentCard).toBeUndefined()
        })
      })
    })

    describe('isStudent', () => {
      it('deve retornar true se o cliente possui um cartão de estudante válido', () => {
        // Arrange
        expect(customerMock.studentCard).toBeDefined()

        // Act & Assert
        expect(customerMock.isStudent).toBe(true)
      })

      it('deve retornar false se o cliente não possui um cartão de estudante', () => {
        // Arrange
        const customer = CreateTestCustomer({ studentCard: undefined })

        // Act & assert
        expect(customer.isStudent).toBe(false)
      })

      it('deve retornar false se o cliente possui um cartão de estudante expirado', () => {
        // Arrange
        const studentCardExpired = CreateTestStudentCard({ expirationDate: DateHelper.recent(2) })
        const customer = CreateTestCustomer({ studentCard: studentCardExpired })

        // Act & Assert
        expect(customer.isStudent).toBe(false)
      })
    })

    describe('isOlder', () => {
      const MIN_OLDER_AGE = 65

      it(`deve retornar true se o cliente for mais velho que ${MIN_OLDER_AGE}`, () => {
        // Arrange
        const oldDate = DateHelper.past({ years: MIN_OLDER_AGE, days: 1 })
        const customer = CreateTestCustomer({ birthDate: oldDate })

        // Act & Assert
        expect(customer.isOlder).toBe(true)
      })

      it(`deve retornar false se o cliente for mais novo que ${MIN_OLDER_AGE}`, () => {
        // Arrange
        const youngDate = DateHelper.past({ years: MIN_OLDER_AGE, days: -1 })
        const customer = CreateTestCustomer({ birthDate: youngDate })

        // Act & Assert
        expect(customer.isOlder).toBe(false)
      })

      it(`deve retornar false se o cliente tiver exatamente ${MIN_OLDER_AGE}`, () => {
        // Arrange
        const exactDate = DateHelper.past({ years: MIN_OLDER_AGE })
        const customer = CreateTestCustomer({ birthDate: exactDate })

        // Act & Assert
        expect(customer.isOlder).toBe(false)
      })
    })
  })
})
