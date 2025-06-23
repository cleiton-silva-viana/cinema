import { CustomerModel } from '@modules/customer/repository/model/customer.model'
import { StudentCardModel } from '@modules/customer/repository/model/student.card.model'
import { CustomerMapper } from '@modules/customer/repository/mapper/customer.mapper'
import { CustomerUID } from '@modules/customer/entity/value-object/customer.uid'
import { faker } from '@faker-js/faker/.'
import { CreateTestCustomer } from '@test/builder/customer.builder'
import { CreateTestStudentCard } from '@test/builder/student.card.builder'
import { Customer } from '@modules/customer/entity/customer'
import { Name } from '@shared/value-object/name'
import { Email } from '@modules/customer/entity/value-object/email'
import { CPF } from '@modules/customer/entity/value-object/cpf'
import { CustomerStatusEnum } from '@modules/customer/enum/customer.status.enum'

describe('CustomerMapper', () => {
  const mapper = new CustomerMapper()

  describe('toDomain', () => {
    const modelMock = new CustomerModel(
      CustomerUID.create().value,
      faker.person.firstName(),
      faker.internet.email(),
      new Date('1990-01-01'),
      CustomerStatusEnum.ACTIVE,
      new Date('2023-01-01'),
      new Date('2023-01-01'),
      '123.456.789-01'
    )

    it('deve mapear CustomerModel para Customer sem studentCard', () => {
      // Act
      const entity = mapper.toDomain(modelMock)

      // Assert
      expect(entity.uid.value).toBe(modelMock.uid)
      expect(entity.name.value).toBe(modelMock.name)
      expect(entity.email.value).toBe(modelMock.email)
      expect(entity.birthDate.value).toEqual(modelMock.birthDate)
      expect(entity.cpf?.value).toBe(modelMock.cpf)
      expect(entity.createdAt).toEqual(new Date(modelMock.createdAt))
      expect(entity.updatedAt).toEqual(new Date(modelMock.updatedAt))
      expect(entity.studentCard).toBeUndefined()
    })

    it('deve mapear CustomerModel para Customer com studentCard', () => {
      // Arrange
      const studentCardModel = new StudentCardModel(
        modelMock.uid,
        faker.string.alphanumeric(8),
        faker.lorem.words(4),
        new Date('2024-12-31')
      )
      modelMock.studentCard = studentCardModel

      // Act
      const entity = mapper.toDomain(modelMock)

      // Assert
      expect(entity.uid.value).toBe(modelMock.uid)
      expect(entity.name.value).toBe(modelMock.name)
      expect(entity.studentCard?.registrationNumber).toBe(studentCardModel.registrationNumber)
      expect(entity.studentCard?.expirationDate).toEqual(studentCardModel.expiresAt)
    })

    it('deve lidar com CustomerModel com campos opcionais nulos', () => {
      // Arrange
      const model = new CustomerModel(
        'customer-123',
        'Pedro Costa',
        'pedro@email.com',
        new Date('1985-03-20'),
        CustomerStatusEnum.ACTIVE,
        new Date('2023-01-01'),
        new Date('2023-01-01')
        // cpf é undefined
      )

      // Act
      const entity = mapper.toDomain(model)

      // Assert
      expect(entity.cpf).toBeUndefined()
      expect(entity.studentCard).toBeUndefined()
    })
  })

  describe('toModel', () => {
    const customerEntity = CreateTestCustomer({ cpf: '123.123.123-78' })

    it('deve mapear Customer para CustomerModel sem studentCard', () => {
      // Arrange

      // Act
      const result = mapper.toModel(customerEntity)

      // Assert
      expect(result.customerModel.uid).toBe(customerEntity.uid.unformattedValue)
      expect(result.customerModel.name).toBe(customerEntity.name.value)
      expect(result.customerModel.email).toBe(customerEntity.email.value)
      expect(result.customerModel.birthDate).toEqual(customerEntity.birthDate.value)
      expect(result.customerModel.cpf).toBe(customerEntity.cpf?.unformattedValue)
      expect(result.studentCardModel).toBeUndefined()
    })

    it('deve mapear Customer para CustomerModel com studentCard', () => {
      // Arrange
      const card = CreateTestStudentCard()
      const customer = CreateTestCustomer({ studentCard: card })

      // Act
      const result = mapper.toModel(customer)

      // Assert
      expect(result.customerModel.uid).toBe(customer.uid.unformattedValue)
      expect(result.studentCardModel).toBeDefined()
      expect(result.studentCardModel?.registrationNumber).toBe(card.registrationNumber)
      expect(result.studentCardModel?.expiresAt).toEqual(card.expirationDate)
      expect(result.studentCardModel?.customerUID).toBe(customer.uid.value)
    })
  })

  describe('toPartialModel', () => {
    const baseCustomer = CreateTestCustomer({ cpf: '111.222.333-44' })
    const baseCustomerModel = mapper.toModel(baseCustomer).customerModel

    describe('deve atualizar apenas uma única propriedade', () => {
      const cases = [
        {
          scenario: 'deve atualizar apenas o nome do cliente',
          overrides: { name: Name.hydrate(faker.person.firstName()) },
        },
        {
          scenario: 'deve atualizar o email do cliente',
          overrides: { email: Email.hydrate(faker.internet.email()) },
        },
        {
          scenario: 'deve atualizar o CPF do cliente para um novo valor',
          overrides: { cpf: CPF.hydrate('999.888.777-66') },
        },
      ] as { scenario: string; overrides: Partial<Customer> }[]

      cases.forEach(({ scenario, overrides }) => {
        it(scenario, () => {
          // Arrange
          const key = Object.keys(overrides)[0] as keyof typeof overrides
          const value = overrides[key]

          // Act
          const result = mapper.toPartialModel(baseCustomerModel, overrides)

          // Assert
          if (key === 'cpf') {
            expect((result as any)[key]).toBe((value as any)?.unformattedValue ?? value)
          } else {
            expect((result as any)[key]).toBe((value as any)?.value ?? value)
          }
        })
      })
    })

    it('deve definir o CPF do cliente como undefined se o overrides.cpf for nulo', () => {
      // Arrange
      const overrides: Partial<Customer> = { cpf: undefined }
      const result = mapper.toPartialModel(baseCustomerModel, overrides)

      // Act
      expect(result.cpf).toBeUndefined()
      expect(result.name).toBe(baseCustomerModel.name)
    })

    it('deve manter os valores existentes se não houver overrides para um campo específico', () => {
      // Arrange
      const overrides = {
        /* nenhum override */
      }

      // Act
      const result = mapper.toPartialModel(baseCustomerModel, overrides)

      // Assert
      expect(result.name).toBe(baseCustomerModel.name)
      expect(result.email).toBe(baseCustomerModel.email)
      expect(result.birthDate).toEqual(baseCustomerModel.birthDate)
      expect(result.cpf).toBe(baseCustomerModel.cpf)
    })

    it('deve atualizar múltiplos campos, incluindo nome, email e CPF', () => {
      // Assert
      const updatedName = Name.hydrate(faker.person.firstName())
      const updatedEmail = Email.hydrate(faker.internet.email())
      const updatedCpf = CPF.hydrate('123.123.123-00')
      const overrides: Partial<Customer> = {
        name: updatedName,
        email: updatedEmail,
        cpf: updatedCpf,
      }

      // Act
      const result = mapper.toPartialModel(baseCustomerModel, overrides)

      // Arrange
      expect(result.uid).toBe(baseCustomer.uid.unformattedValue)
      expect(result.name).toBe(updatedName.value)
      expect(result.email).toBe(updatedEmail.value)
      expect(result.cpf).toBe(updatedCpf.unformattedValue)
      expect(result.birthDate).toEqual(baseCustomerModel.birthDate)
    })
  })

  describe('Mapeamento Bidirecional', () => {
    it('deve manter a integridade dos dados no mapeamento de ida e volta sem studentCard', () => {
      // Act
      const entity = CreateTestCustomer({ cpf: '123.123.123-78' })
      const modelResult = mapper.toModel(entity)
      const roundTripCustomer = mapper.toDomain(modelResult.customerModel)

      // Assert
      expect(roundTripCustomer.uid.value).toBe(entity.uid.value)
      expect(roundTripCustomer.name.value).toBe(entity.name.value)
      expect(roundTripCustomer.email.value).toBe(entity.email.value)
      expect(roundTripCustomer.birthDate.value).toEqual(entity.birthDate.value)
      expect(roundTripCustomer.cpf?.value).toBe(entity.cpf?.value)
    })

    it('deve manter a integridade dos dados no mapeamento de ida e volta com studentCard', () => {
      // Arrange
      const card = CreateTestStudentCard()
      const entity = CreateTestCustomer({ studentCard: card })

      // Act
      const modelResult = mapper.toModel(entity)
      // Simular o relacionamento que seria feito pelo TypeORM
      if (modelResult.studentCardModel) {
        modelResult.customerModel.studentCard = modelResult.studentCardModel
      }
      const roundTripCustomer = mapper.toDomain(modelResult.customerModel)

      // Assert
      expect(roundTripCustomer.uid.value).toBe(entity.uid.value)
      expect(roundTripCustomer.studentCard?.registrationNumber).toBe(entity.studentCard?.registrationNumber)
      expect(roundTripCustomer.studentCard?.expirationDate).toEqual(entity.studentCard?.expirationDate)
    })
  })
})
