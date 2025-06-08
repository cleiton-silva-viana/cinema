import { Customer, IHydrateCustomerProps } from './customer'
import { CPF } from './value-object/cpf'
import { CustomerUID } from './value-object/customer.uid'
import { FailureCode } from '@shared/failure/failure.codes.enum'
import { CreateTestCustomer } from '@test/builder/customer.builder'

describe('Customer', () => {
  const validName = 'John Doe'
  const validBirthDate = new Date(1990, 0, 1)
  const validEmail = 'john.doe@example.com'
  const validCpf = '123.456.789-01'
  const validStudentCardId = 'STUDENT123'
  const validStudentCardValidity = new Date()
  validStudentCardValidity.setDate(validStudentCardValidity.getDate() + 30) // Validade para 30 dias no futuro

  describe('Métodos estáticos', () => {
    describe('create', () => {
      it('deve criar um Customer válido com todos os campos fornecidos', async () => {
        // Act
        const result = Customer.create(validName, validBirthDate, validEmail)

        // Assert
        expect(result).toBeValidResultMatching<Customer>((c) => {
          expect(c).toBeInstanceOf(Customer)
          expect(c.name.value).toBe(validName)
          expect(c.birthDate.value.toISOString()).toBe(validBirthDate.toISOString())
          expect(c.email.value).toBe(validEmail)
          expect(c.cpf).toBeUndefined()
          expect(c.studentCard).toBeUndefined()
        })
      })

      it('deve falhar ao criar um Customer com nome inválido', async () => {
        // Act
        const result = Customer.create('J', validBirthDate, validEmail) // Nome muito curto

        // Assert
        expect(result).toBeInvalidResult()
      })

      it('deve falhar ao criar um Customer com data de nascimento inválida', async () => {
        // Act
        const futureDate = new Date()
        futureDate.setDate(futureDate.getDate() + 1) // Data no futuro
        const result = Customer.create(validName, futureDate, validEmail)

        // Assert
        expect(result).toBeInvalidResultWithFailureCount(1)
      })

      it('deve falhar ao criar um Customer com email inválido', async () => {
        // Act
        const result = Customer.create(validName, validBirthDate, 'invalid-email')

        // Assert
        expect(result).toBeInvalidResultWithFailureCount(1)
      })

      it('deve acumular falhas se múltiplos campos forem inválidos', async () => {
        // Act
        const result = Customer.create('J', new Date(2500, 0, 1), 'invalid-email')

        // Assert
        expect(result).toBeInvalidResultWithFailureCount(3)
      })
    })

    describe('hydrate', () => {
      const hydrateProps: IHydrateCustomerProps = {
        uid: CustomerUID.create().value,
        name: validName,
        birthDate: validBirthDate,
        email: validEmail,
        cpf: validCpf,
        studentCard: {
          id: validStudentCardId,
          validity: validStudentCardValidity,
        },
      }

      it('deve hidratar um Customer com todos os campos', () => {
        // Act
        const customer = Customer.hydrate(hydrateProps)

        // Assert
        expect(customer).toBeInstanceOf(Customer)
        expect(customer.uid.value).toBe(hydrateProps.uid)
        expect(customer.name.value).toBe(hydrateProps.name)
        expect(customer.birthDate.value.toISOString().split('T')[0]).toBe(
          hydrateProps.birthDate.toISOString().split('T')[0]
        )
        expect(customer.email.value).toBe(hydrateProps.email)
        expect(customer.cpf?.value).toBe(hydrateProps.cpf)
        expect(customer.studentCard?.id).toBe(hydrateProps.studentCard?.id)
        expect(customer.studentCard?.validity.toISOString().split('T')[0]).toBe(
          hydrateProps.studentCard?.validity.toISOString().split('T')[0]
        )
      })

      it('deve hidratar um Customer sem CPF e StudentCard', () => {
        // Arrange
        const propsWithoutOptional: IHydrateCustomerProps = {
          uid: CustomerUID.create().value,
          name: validName,
          birthDate: validBirthDate,
          email: validEmail,
        }

        // Act
        const customer = Customer.hydrate(propsWithoutOptional)

        // Assert
        expect(customer.cpf).toBeNull()
        expect(customer.studentCard).toBeNull()
      })

      it('deve hidratar um Customer apenas com CPF', () => {
        // Arrange
        const propsWithCpf: IHydrateCustomerProps = {
          uid: CustomerUID.create().value,
          name: validName,
          birthDate: validBirthDate,
          email: validEmail,
          cpf: validCpf,
        }

        // Act
        const customer = Customer.hydrate(propsWithCpf)

        // Assert
        expect(customer.cpf?.value).toBe(validCpf)
        expect(customer.studentCard).toBeNull()
      })

      it('deve hidratar um Customer apenas com StudentCard', () => {
        // Arrange
        const propsWithStudentCard: IHydrateCustomerProps = {
          uid: CustomerUID.create().value,
          name: validName,
          birthDate: validBirthDate,
          email: validEmail,
          studentCard: {
            id: validStudentCardId,
            validity: validStudentCardValidity,
          },
        }

        // Act
        const customer = Customer.hydrate(propsWithStudentCard)

        // Assert
        expect(customer.cpf).toBeNull()
        expect(customer.studentCard?.id).toBe(validStudentCardId)
      })

      // Testes de TechnicalError para campos obrigatórios ausentes em hydrate
      const requiredFields: (keyof IHydrateCustomerProps)[] = ['uid', 'name', 'birthDate', 'email']
      requiredFields.forEach((field) => {
        it(`deve lançar TechnicalError se ${field} estiver ausente no hydrate`, () => {
          const incompleteProps = { ...hydrateProps }
          delete incompleteProps[field]
          expect(() => Customer.hydrate(incompleteProps as any)).toThrow(Error) // TechnicalError
        })
      })
    })
  })

  describe('Métodos de instância', () => {
    let customerInstance: Customer
    beforeEach(() => (customerInstance = CreateTestCustomer()))

    describe('updateName', () => {
      it('deve atualizar o nome com sucesso', async () => {
        // Arrange
        const newName = 'Jane Doe'

        // Act
        const result = customerInstance.updateName(newName)

        // Assert
        expect(result).toBeValidResultMatching<Customer>((c) => {
          expect(c.name.value).toBe(newName)
          expect(c.uid).toBe(customerInstance.uid)
        })
      })

      it('deve falhar ao atualizar com nome inválido', async () => {
        // Arrange
        const invalidName = 'J'

        // Act
        const result = customerInstance.updateName(invalidName)

        // Assert
        expect(result).toBeInvalidResult()
      })
    })

    describe('updateBirthDate', () => {
      it('deve atualizar a data de nascimento com sucesso', async () => {
        // Arrange
        const newBirthDate = new Date(1995, 5, 15)

        // Act
        const result = customerInstance.updateBirthDate(newBirthDate)

        // Assert
        expect(result).toBeValidResultMatching<Customer>((c) => {
          expect(c.birthDate.value.toISOString()).toBe(newBirthDate.toISOString())
        })
      })

      it('deve falhar ao atualizar com data de nascimento inválida', async () => {
        // Arrange
        const invalidBirthDate = new Date(2500, 0, 1) // Data no futuro

        // Act
        const result = customerInstance.updateBirthDate(invalidBirthDate)

        // Assert
        expect(result).toBeInvalidResult()
      })
    })

    describe('updateEmail', () => {
      it('deve atualizar o email com sucesso', async () => {
        // Arrange
        const newEmail = 'jane.doe@example.com'

        // Act
        const result = customerInstance.updateEmail(newEmail)

        // Assert
        expect(result).toBeValidResultMatching<Customer>((c) => {
          expect(c.email.value).toBe(newEmail)
        })
      })

      it('deve falhar ao atualizar com email inválido', async () => {
        // Arrange
        const invalidEmail = 'invalid-email'

        // Act
        const result = customerInstance.updateEmail(invalidEmail)

        // Assert
        expect(result).toBeInvalidResult()
      })
    })

    describe('assignCPF', () => {
      it('deve atribuir CPF com sucesso', async () => {
        // Act
        const result = customerInstance.assignCPF(validCpf)

        // Assert
        expect(result).toBeValidResultMatching<Customer>((c) => {
          expect(c.cpf).toBeInstanceOf(CPF)
          expect(c.cpf?.value).toBe(validCpf)
        })
      })

      it('deve falhar ao atribuir CPF inválido', async () => {
        // Arrange
        const invalidCpf = '123'

        // Act
        const result = customerInstance.assignCPF(invalidCpf)

        // Assert
        expect(result).toBeInvalidResult()
      })
    })

    describe('removeCPF', () => {
      it('deve remover o CPF com sucesso', () => {
        // Arrange
        const customerWithCpf = CreateTestCustomer({ cpf: validCpf })

        // Act
        const result = customerWithCpf.removeCPF()

        // Assert
        expect(result).toBeValidResultMatching<Customer>((c) => {
          expect(c.cpf).toBeNull()
        })
      })
    })

    describe('assignStudentCard', () => {
      it('deve atribuir StudentCard com sucesso', async () => {
        // Act
        const result = customerInstance.assignStudentCard(validStudentCardId, validStudentCardValidity)

        // Assert
        expect(result).toBeValidResultMatching<Customer>((c) => {
          expect(c.studentCard?.id).toBe(validStudentCardId)
          expect(c.studentCard?.validity).toBe(validStudentCardValidity)
        })
      })

      it('deve falhar ao atribuir StudentCard com ID inválido', async () => {
        // Arrange
        const invalidId = 'S1'

        // Act
        const result = customerInstance.assignStudentCard(invalidId, validStudentCardValidity)

        // Assert
        expect(result).toBeInvalidResultWithSingleFailure(FailureCode.STUDENT_CARD_ID_INVALID_FORMAT)
      })

      it('deve falhar ao atribuir StudentCard com validade inválida (passado)', async () => {
        // Arrange
        const customer = CreateTestCustomer()
        const pastDate = new Date(2000, 0, 1)

        // Act
        const result = customer.assignStudentCard(validStudentCardId, pastDate)

        // Assert
        expect(result).toBeInvalidResultWithSingleFailure(FailureCode.DATE_CANNOT_BE_PAST)
      })
    })

    describe('removeStudentCard', () => {
      it('deve remover o StudentCard com sucesso', async () => {
        // Arrange
        const customerWithCard = CreateTestCustomer({
          studentCard: { id: validStudentCardId, validity: validStudentCardValidity },
        })

        // Act
        const result = customerWithCard.removeStudentCard()

        // Assert
        expect(result).toBeValidResultMatching<Customer>((c) => {
          expect(c.studentCard).toBeNull()
        })
      })
    })
  })
})
