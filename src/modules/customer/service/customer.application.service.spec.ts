import { v4 } from 'uuid'
import { faker } from '@faker-js/faker'
import { Test } from '@nestjs/testing'
import { CustomerApplicationService } from './customer.application.service'
import { CUSTOMER_REPOSITORY } from '../constant/customer.constants'
import { ICustomerRepository } from '../repository/customer.repository.interface'
import { Customer } from '../entity/customer'
import { FailureCode } from '@shared/failure/failure.codes.enum'
import { CloneTestCustomerWithOverrides, CreateTestCustomer } from '@test/builder/customer.builder'

describe('CustomerApplicationService', () => {
  let service: CustomerApplicationService
  let customerInstance: Customer
  let mockRepository: jest.Mocked<ICustomerRepository>

  beforeEach(async () => {
    customerInstance = CreateTestCustomer()

    const module = await Test.createTestingModule({
      providers: [
        CustomerApplicationService,
        {
          provide: CUSTOMER_REPOSITORY,
          useValue: {
            findById: jest.fn(),
            findByEmail: jest.fn(),
            hasEmail: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            hasCPF: jest.fn(),
            hasStudentCardID: jest.fn(),
          },
        },
      ],
    }).compile()

    service = module.get<CustomerApplicationService>(CustomerApplicationService)
    mockRepository = module.get(CUSTOMER_REPOSITORY)
  })

  describe('findById', () => {
    it('deve retornar um cliente quando encontrado pelo ID', async () => {
      // Arrange
      mockRepository.findById.mockResolvedValue(customerInstance)

      // Act
      const result = await service.findById(customerInstance.uid.value)

      // Assert
      expect(mockRepository.findById).toHaveBeenCalledTimes(1)
      expect(result).toBeValidResultWithValue(customerInstance)
    })

    it('deve retornar um erro quando o cliente não for encontrado', async () => {
      // Arrange
      mockRepository.findById.mockResolvedValue(null as any)

      // Act
      const result = await service.findById(customerInstance.uid.value)

      // Assert
      expect(result).toBeInvalidResultWithSingleFailure(FailureCode.RESOURCE_NOT_FOUND)
    })
  })

  describe('findByEmail', () => {
    it('deve retornar um cliente quando encontrado pelo email', async () => {
      // Arrange
      mockRepository.findByEmail.mockResolvedValue(customerInstance)

      // Act
      const result = await service.findByEmail(customerInstance.email.value)

      // Assert
      expect(result).toBeValidResultMatching<Customer>((c) => {
        expect(c).toEqual(customerInstance)
      })
    })

    it('deve retornar um erro quando o cliente não for encontrado', async () => {
      // Arrange
      mockRepository.findByEmail.mockResolvedValue(null as any)

      // Act
      const result = await service.findByEmail(faker.internet.email())

      // Assert
      expect(result).toBeInvalidResultWithSingleFailure(FailureCode.RESOURCE_NOT_FOUND)
    })
  })

  describe('create', () => {
    it('deve criar um novo cliente com dados válidos', async () => {
      // Arrange
      mockRepository.hasEmail.mockResolvedValue(false)
      mockRepository.create.mockResolvedValue(customerInstance)

      // Act
      const result = await service.create({
        name: customerInstance.name.value,
        birthDate: customerInstance.birthDate.value,
        email: customerInstance.email.value,
        password: '#R252f#@$R@65wvw',
      })

      // Assert
      expect(mockRepository.create).toHaveBeenCalled()
      expect(mockRepository.create).toHaveBeenCalledTimes(1)
      expect(result).toBeValidResultWithValue(customerInstance)
    })

    it('deve retornar erro quando o email já estiver em uso', async () => {
      // Arrange
      mockRepository.hasEmail.mockResolvedValue(true)

      // Act
      const result = await service.create({
        name: customerInstance.name.value,
        birthDate: customerInstance.birthDate.value,
        email: customerInstance.email.value,
        password: faker.internet.password(),
      })

      // Assert
      expect(result).toBeInvalidResultWithSingleFailure(FailureCode.EMAIL_ALREADY_IN_USE)
      expect(mockRepository.create).not.toHaveBeenCalled()
    })
  })

  describe('updateCustomerEmail', () => {
    it('deve atualizar o email do cliente quando válido', async () => {
      // Arrange
      const email = faker.internet.email()
      const updatedCustomer = CloneTestCustomerWithOverrides(customerInstance, { email })
      mockRepository.findById.mockResolvedValue(customerInstance)
      mockRepository.hasEmail.mockResolvedValue(false)
      mockRepository.update.mockResolvedValue(updatedCustomer)

      // Act
      const result = await service.updateCustomerEmail(customerInstance.uid.value, email)

      // Assert
      expect(result.isValid()).toBeTruthy()
      expect(mockRepository.update).toHaveBeenCalledTimes(1)
    })

    it('deve retornar erro quando o novo email já estiver em uso', async () => {
      // Arrange
      mockRepository.hasEmail.mockResolvedValue(true)

      // Act
      const result = await service.updateCustomerEmail(v4(), faker.internet.email())

      // Assert
      expect(result).toBeInvalidResultWithSingleFailure(FailureCode.EMAIL_ALREADY_IN_USE)
      expect(mockRepository.update).not.toHaveBeenCalled()
    })
  })

  describe('updateCustomerName', () => {
    it('deve atualizar o nome do cliente quando válido', async () => {
      // Arrange
      const name = faker.person.firstName()
      const updatedCustomer = CloneTestCustomerWithOverrides(customerInstance, { name })
      mockRepository.findById.mockResolvedValue(customerInstance)
      mockRepository.update.mockResolvedValue(updatedCustomer)

      // Act
      const result = await service.updateCustomerName(customerInstance.uid.value, name)

      // Assert
      expect(result).toBeValidResultMatching<Customer>((c) => {
        expect(c).toEqual(updatedCustomer)
      })
      expect(mockRepository.update).toHaveBeenCalledTimes(1)
    })

    it('deve retornar erro quando o novo nome for inválido', async () => {
      // Act
      const result = await service.updateCustomerName(customerInstance.uid.value, 'sa')

      // Assert
      expect(mockRepository.update).not.toHaveBeenCalled()
      expect(result).toBeInvalidResult()
    })
  })

  describe('updateCustomerBirthDate', () => {
    it('deve atualizar a data de nascimento quando válida', async () => {
      // Arrange
      const birthDate = faker.date.birthdate()
      const updatedCustomer = CloneTestCustomerWithOverrides(customerInstance, { birthDate })
      mockRepository.findById.mockResolvedValue(customerInstance)
      mockRepository.update.mockResolvedValue(updatedCustomer)

      // Act
      const result = await service.updateCustomerBirthDate(customerInstance.uid.value, birthDate)

      // Assert
      expect(result).toBeValidResultMatching<Customer>((c) => {
        expect(c).toEqual(updatedCustomer)
      })
      expect(mockRepository.update).toHaveBeenCalledTimes(1)
    })

    it('deve retornar erro quando a nova data for inválida', async () => {
      // Arrange
      mockRepository.hasEmail.mockResolvedValue(true)

      // Act
      const result = await service.updateCustomerBirthDate(v4(), new Date())

      // Assert
      expect(result).toBeInvalidResult()
      expect(mockRepository.update).not.toHaveBeenCalled()
    })
  })

  describe('assignCustomerCPF', () => {
    it('deve atribuir CPF quando válido e único', async () => {
      // Arrange
      const cpf = '222.222.222-33'
      const updatedCustomer = CloneTestCustomerWithOverrides(customerInstance, { cpf })
      mockRepository.findById.mockResolvedValue(customerInstance)
      mockRepository.hasCPF.mockResolvedValue(false)
      mockRepository.update.mockResolvedValue(updatedCustomer)

      // Act
      const result = await service.assignCustomerCPF(customerInstance.uid.value, cpf)

      // Assert
      expect(result).toBeValidResultWithValue(updatedCustomer)
      expect(mockRepository.update).toHaveBeenCalledTimes(1)
    })

    it('deve retornar erro quando o CPF já estiver em uso', async () => {
      // Arrange
      mockRepository.hasCPF.mockResolvedValue(true)

      // Act
      const result = await service.assignCustomerCPF(v4(), '123.456.789-09')

      // Assert
      expect(result).toBeInvalidResult()
    })
  })

  describe('removeCustomerCPF', () => {
    it('deve remover o CPF do cliente', async () => {
      // Arrange
      const updatedCustomer = CloneTestCustomerWithOverrides(customerInstance, { cpf: null as any })
      mockRepository.findById.mockResolvedValue(customerInstance)
      mockRepository.update.mockResolvedValue(updatedCustomer)

      // Act
      const result = await service.removeCustomerCPF(customerInstance.uid.value)

      // Assert
      expect(result).toBeValidResult()
      expect(mockRepository.update).toHaveBeenCalledTimes(1)
    })
  })

  describe('assignCustomerStudentCard', () => {
    it('deve atribuir carteira de estudante quando válida e única', async () => {
      // Arrange
      const studentCard = {
        id: 'STUDENT123',
        validity: new Date(Date.now() + 1000 + 60000),
      }
      const updatedCustomer = CloneTestCustomerWithOverrides(customerInstance, {
        studentCard,
      })

      mockRepository.findById.mockResolvedValue(customerInstance)
      mockRepository.hasStudentCardID.mockResolvedValue(false)
      mockRepository.update.mockResolvedValue(updatedCustomer)

      // Act
      const result = await service.assignCustomerStudentCard(customerInstance.uid.value, studentCard)

      // Assert
      expect(result).toBeValidResultMatching<Customer>((c) => {
        expect(c).toEqual(updatedCustomer)
      })
      expect(mockRepository.update).toHaveBeenCalledTimes(1)
    })

    it('deve retornar erro quando a carteira já estiver em uso', async () => {
      // Arrange
      mockRepository.hasStudentCardID.mockResolvedValue(true)

      // Act
      const result = await service.assignCustomerStudentCard('valid-id', {
        id: 'STUDENT123',
        validity: new Date('2025-12-31'),
      })

      // Assert
      expect(result).toBeInvalidResult()
      expect(mockRepository.update).not.toHaveBeenCalled()
    })
  })

  describe('removeCustomerStudentCard', () => {
    it('deve remover a carteira de estudante do cliente', async () => {
      // Arrange
      const instance = CreateTestCustomer({
        studentCard: { id: '123ac1', validity: new Date() },
      })
      const updatedInstance = CloneTestCustomerWithOverrides(instance, { studentCard: null })
      mockRepository.findById.mockResolvedValue(instance)
      mockRepository.update.mockResolvedValue(updatedInstance)

      // Act
      const result = await service.removeCustomerStudentCard(customerInstance.uid.value)

      // Assert
      expect(result).toBeValidResultWithValue(updatedInstance)
    })
  })
})
