import { faker } from '@faker-js/faker'
import { CUSTOMER_REPOSITORY, CUSTOMER_STATUS_STATE_MACHINE } from '../constant/customer.constants'
import { CloneTestCustomerWithOverrides, CreateTestCustomer } from '@test/builder/customer.builder'
import { CreateTestStudentCard } from '@test/builder/student.card.builder'
import { failure, success } from '@shared/result/result'
import { Test } from '@nestjs/testing'
import { CustomerApplicationService } from './customer.application.service'
import { ICustomerRepository } from '../repository/customer.repository.interface'
import { Customer } from '../entity/customer'
import { FailureCode } from '@shared/failure/failure.codes.enum'
import { SimpleFailure } from '@shared/failure/simple.failure.type'
import { CustomerUID } from '@modules/customer/entity/value-object/customer.uid'
import { Email } from '@modules/customer/entity/value-object/email'
import { StudentCard } from '@modules/customer/entity/value-object/student-card'
import { Password } from '../entity/value-object/password'
import { CustomerStatusEnum } from '../enum/customer.status.enum'

describe('CustomerApplicationService', () => {
  const simpleFailureMock: SimpleFailure = { code: FailureCode.STRING_CANNOT_BE_EMPTY, details: { a: 'b' } }
  const customerMock = CreateTestCustomer()

  let service: CustomerApplicationService
  let repositoryMock: jest.Mocked<ICustomerRepository>

  beforeAll(async () => {
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
            hasStudentCard: jest.fn(),
          },
        },
        {
          provide: CUSTOMER_STATUS_STATE_MACHINE,
          useValue: {
            canTransition: jest.fn(),
            executeTransition: jest.fn(),
            for: jest.fn(),
          },
        },
      ],
    }).compile()

    service = module.get<CustomerApplicationService>(CustomerApplicationService)
    repositoryMock = module.get(CUSTOMER_REPOSITORY)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })
  describe('findById', () => {
    it('deve retornar um cliente quando encontrado pelo ID', async () => {
      // Arrange
      repositoryMock.findById.mockResolvedValue(customerMock)

      // Act
      const result = await service.findById(customerMock.uid.value)

      // Assert
      expect(repositoryMock.findById).toHaveBeenCalledWith(customerMock.uid)
      expect(result).toBeValidResultWithValue(customerMock)
    })

    it('deve retornar erro se uid fornecido for inválido', async () => {
      // Arrange
      jest.spyOn(CustomerUID, 'parse').mockReturnValue(failure(simpleFailureMock))

      // Act
      const result = await service.findById(customerMock.uid.value)

      // Assert
      expect(repositoryMock.findById).not.toHaveBeenCalled()
      expect(result).toBeInvalidResultWithFailure(simpleFailureMock)
    })

    it('deve retornar um erro quando o cliente não for encontrado', async () => {
      // Arrange
      repositoryMock.findById.mockResolvedValue(null)
      jest.spyOn(CustomerUID, 'parse').mockReturnValue(success(customerMock.uid))

      // Act
      const result = await service.findById(customerMock.uid.value)

      // Assert
      expect(result).toBeInvalidResultWithSingleFailure(FailureCode.RESOURCE_NOT_FOUND)
    })
  })

  describe('findByEmail', () => {
    it('deve retornar um cliente quando encontrado pelo email', async () => {
      // Arrange
      jest.spyOn(Email, 'create').mockReturnValue(success(customerMock.email))
      repositoryMock.findByEmail.mockResolvedValue(customerMock)

      // Act
      const result = await service.findByEmail(customerMock.email.value)

      // Assert
      expect(repositoryMock.findByEmail).toHaveBeenCalledWith(customerMock.email)
      expect(result).toBeValidResultWithValue(customerMock)
    })

    it('deve retornar falha quando email fornecido for inválido', async () => {
      // Arrange
      jest.spyOn(Email, 'create').mockReturnValue(failure(simpleFailureMock))

      // Act
      const result = await service.findByEmail(customerMock.email.value)

      // Assert
      expect(repositoryMock.findByEmail).not.toHaveBeenCalled()
      expect(result).toBeInvalidResultWithFailure(simpleFailureMock)
    })

    it('deve retornar um erro quando o cliente não for encontrado', async () => {
      // Arrange
      jest.spyOn(Email, 'create').mockReturnValue(success(customerMock.email))
      repositoryMock.findByEmail.mockResolvedValue(null)

      // Act
      const result = await service.findByEmail(faker.internet.email())

      // Assert
      expect(result).toBeInvalidResultWithSingleFailure(FailureCode.RESOURCE_NOT_FOUND)
    })
  })

  describe('create', () => {
    const input = {
      name: faker.person.firstName(),
      birthDate: faker.date.birthdate(),
      email: faker.internet.email(),
      password: faker.internet.password(),
    }

    it('deve criar um novo cliente com dados válidos', async () => {
      // Arrange
      const pass = { value: input.password } as any
      jest.spyOn(Customer, 'create').mockReturnValue(success(customerMock))
      jest.spyOn(Password, 'create').mockResolvedValue(success(pass))
      repositoryMock.hasEmail.mockResolvedValue(false)
      repositoryMock.create.mockResolvedValue(customerMock)

      // Act
      const result = await service.create(input)

      // Assert
      expect(Customer.create).toHaveBeenCalledWith(input)
      expect(repositoryMock.hasEmail).toHaveBeenCalledWith(customerMock.email)
      expect(repositoryMock.create).toHaveBeenCalledWith(customerMock, pass)
      expect(result).toBeValidResultWithValue(customerMock)
    })

    it('deve retornar erro quando o email já estiver em uso', async () => {
      // Arrange
      jest.spyOn(Customer, 'create').mockReturnValue(success(customerMock))
      repositoryMock.hasEmail.mockResolvedValue(true)

      // Act
      const result = await service.create(input)

      // Assert
      expect(Customer.create).toHaveBeenCalledWith(input)
      expect(repositoryMock.hasEmail).toHaveBeenCalledWith(customerMock.email)
      expect(repositoryMock.create).not.toHaveBeenCalled()
      expect(result).toBeInvalidResultWithSingleFailure(FailureCode.EMAIL_ALREADY_IN_USE)
    })

    it('deve retornar falha quando a criação do cliente falhar', async () => {
      // Arrange
      jest.spyOn(Customer, 'create').mockReturnValue(failure(simpleFailureMock))

      // Act
      const result = await service.create(input)

      // Assert
      expect(Customer.create).toHaveBeenCalledWith(input)
      expect(repositoryMock.hasEmail).not.toHaveBeenCalled()
      expect(repositoryMock.create).not.toHaveBeenCalled()
      expect(result).toBeInvalidResultWithFailure(simpleFailureMock)
    })
  })

  describe('updateCustomerEmail', () => {
    it('deve atualizar o email do cliente quando válido', async () => {
      // Arrange
      const email = faker.internet.email()
      const updatedCustomer = CloneTestCustomerWithOverrides(customerMock, { email })
      jest.spyOn(Email, 'create').mockReturnValue(success(updatedCustomer.email))
      repositoryMock.findById.mockResolvedValue(customerMock)
      repositoryMock.hasEmail.mockResolvedValue(false)
      repositoryMock.update.mockResolvedValue(updatedCustomer)

      // Act
      const result = await service.updateCustomerEmail(customerMock.uid.value, email)

      // Assert
      expect(result).toBeValidResultWithValue(updatedCustomer)
      expect(repositoryMock.update).toHaveBeenCalledWith(customerMock.uid, { email: updatedCustomer.email })
    })

    it('deve retornar erro quando o novo email já estiver em uso', async () => {
      // Arrange
      const email = faker.internet.email()
      jest.spyOn(Email, 'create').mockReturnValue(success(customerMock.email))
      repositoryMock.findById.mockResolvedValue(customerMock)
      repositoryMock.hasEmail.mockResolvedValue(true)

      // Act
      const result = await service.updateCustomerEmail(customerMock.uid.value, email)

      // Assert
      expect(result).toBeInvalidResultWithSingleFailure(FailureCode.EMAIL_ALREADY_IN_USE)
      expect(repositoryMock.update).not.toHaveBeenCalled()
    })

    it('deve retornar falha quando o email for inválido', async () => {
      // Arrange
      jest.spyOn(Email, 'create').mockReturnValue(failure(simpleFailureMock))

      // Act
      const result = await service.updateCustomerEmail(customerMock.uid.value, 'invalid-email')

      // Assert
      expect(result).toBeInvalidResultWithFailure(simpleFailureMock)
      expect(repositoryMock.findById).not.toHaveBeenCalled()
      expect(repositoryMock.hasEmail).not.toHaveBeenCalled()
      expect(repositoryMock.update).not.toHaveBeenCalled()
    })

    describe('cenários com status adversos', () => {
      const cases = [
        { scenario: 'cliente bloqueado', status: CustomerStatusEnum.BLOCKED },
        { scenario: 'cliente suspenso', status: CustomerStatusEnum.SUSPENDED },
        { scenario: 'cliente com deleção pendente', status: CustomerStatusEnum.PENDING_DELETION },
      ]

      cases.forEach(async ({ scenario, status }) => {
        it(`deve falhar quando ${scenario}`, async () => {
          // Arrange
          const email = faker.internet.email()
          const blockedCustomer = CreateTestCustomer({ status })
          jest.spyOn(Email, 'create').mockReturnValue(success(blockedCustomer.email))
          repositoryMock.findById.mockResolvedValue(blockedCustomer)
          repositoryMock.hasEmail.mockResolvedValue(false)

          // Act
          const result = await service.updateCustomerEmail(blockedCustomer.uid.value, email)

          // Assert
          expect(result).toBeInvalidResultWithSingleFailure(FailureCode.CUSTOMER_WRITE_OPERATION_NOT_ALLOWED)
          expect(repositoryMock.update).not.toHaveBeenCalled()
        })
      })
    })
  })

  describe('updateCustomerName', () => {
    it('deve atualizar o nome do cliente quando válido', async () => {
      // Arrange
      const name = faker.person.firstName()
      const updatedCustomer = CloneTestCustomerWithOverrides(customerMock, { name: name })
      jest.spyOn(customerMock, 'updateName').mockReturnValue(success(updatedCustomer))
      repositoryMock.findById.mockResolvedValue(customerMock)
      repositoryMock.update.mockResolvedValue(updatedCustomer)

      // Act
      const result = await service.updateCustomerName(customerMock.uid.value, name)

      // Assert
      expect(repositoryMock.findById).toHaveBeenCalledWith(customerMock.uid)
      expect(repositoryMock.update).toHaveBeenCalledWith(customerMock.uid, { name: updatedCustomer.name })
      expect(result).toBeValidResultWithValue(updatedCustomer)
    })

    it('deve retornar erro quando o novo nome for inválido', async () => {
      // Arrange
      repositoryMock.findById.mockResolvedValue(customerMock)
      jest.spyOn(customerMock, 'updateName').mockReturnValue(failure(simpleFailureMock))

      // Act
      const result = await service.updateCustomerName(customerMock.uid.value, 'sa')

      // Assert
      expect(repositoryMock.findById).toHaveBeenCalledWith(customerMock.uid)
      expect(repositoryMock.update).not.toHaveBeenCalled()
      expect(result).toBeInvalidResultWithFailure(simpleFailureMock)
    })

    describe('cenários com status adversos', () => {
      const cases = [
        { scenario: 'cliente bloqueado', status: CustomerStatusEnum.BLOCKED },
        { scenario: 'cliente suspenso', status: CustomerStatusEnum.SUSPENDED },
        { scenario: 'cliente com deleção pendente', status: CustomerStatusEnum.PENDING_DELETION },
      ]

      cases.forEach(async ({ scenario, status }) => {
        it(`deve falhar quando ${scenario}`, async () => {
          // Arrange
          const name = faker.person.firstName()
          const blockedCustomer = CreateTestCustomer({ status })
          repositoryMock.findById.mockResolvedValue(blockedCustomer)

          // Act
          const result = await service.updateCustomerName(blockedCustomer.uid.value, name)

          // Assert
          expect(result).toBeInvalidResultWithSingleFailure(FailureCode.CUSTOMER_WRITE_OPERATION_NOT_ALLOWED)
          expect(repositoryMock.update).not.toHaveBeenCalled()
        })
      })
    })
  })

  describe('updateCustomerBirthDate', () => {
    it('deve atualizar a data de nascimento quando válida', async () => {
      // Arrange
      const birthDate = faker.date.birthdate()
      const updatedCustomer = CloneTestCustomerWithOverrides(customerMock, { birthDate })
      jest.spyOn(customerMock, 'updateBirthDate').mockReturnValue(success(updatedCustomer))
      repositoryMock.findById.mockResolvedValue(customerMock)
      repositoryMock.update.mockResolvedValue(updatedCustomer)

      // Act
      const result = await service.updateCustomerBirthDate(customerMock.uid.value, birthDate)

      // Assert
      expect(repositoryMock.findById).toHaveBeenCalledWith(customerMock.uid)
      expect(repositoryMock.update).toHaveBeenCalledWith(customerMock.uid, { birthDate: updatedCustomer.birthDate })
      expect(result).toBeValidResultWithValue(updatedCustomer)
    })

    it('deve retornar erro quando a nova data for inválida', async () => {
      // Arrange
      repositoryMock.findById.mockResolvedValue(customerMock)
      jest.spyOn(customerMock, 'updateBirthDate').mockReturnValue(failure(simpleFailureMock))

      // Act
      const result = await service.updateCustomerBirthDate(customerMock.uid.value, new Date())

      // Assert
      expect(repositoryMock.findById).toHaveBeenCalledWith(customerMock.uid)
      expect(repositoryMock.update).not.toHaveBeenCalled()
      expect(result).toBeInvalidResultWithFailure(simpleFailureMock)
    })

    describe('cenários com status adversos', () => {
      const cases = [
        { scenario: 'cliente bloqueado', status: CustomerStatusEnum.BLOCKED },
        { scenario: 'cliente suspenso', status: CustomerStatusEnum.SUSPENDED },
        { scenario: 'cliente com deleção pendente', status: CustomerStatusEnum.PENDING_DELETION },
      ]

      cases.forEach(async ({ scenario, status }) => {
        it(`deve falhar quando ${scenario}`, async () => {
          // Arrange
          const birthDate = faker.date.birthdate()
          const blockedCustomer = CreateTestCustomer({ status })
          repositoryMock.findById.mockResolvedValue(blockedCustomer)

          // Act
          const result = await service.updateCustomerBirthDate(blockedCustomer.uid.value, birthDate)

          // Assert
          expect(result).toBeInvalidResultWithSingleFailure(FailureCode.CUSTOMER_WRITE_OPERATION_NOT_ALLOWED)
          expect(repositoryMock.update).not.toHaveBeenCalled()
        })
      })
    })
  })

  describe('assignCustomerCPF', () => {
    it('deve atribuir CPF quando válido e único', async () => {
      // Arrange
      const cpf = '222.222.222-33'
      const updatedCustomer = CloneTestCustomerWithOverrides(customerMock, { cpf })
      jest.spyOn(customerMock, 'assignCPF').mockReturnValue(success(updatedCustomer))
      repositoryMock.findById.mockResolvedValue(customerMock)
      repositoryMock.hasCPF.mockResolvedValue(false)
      repositoryMock.update.mockResolvedValue(updatedCustomer)

      // Act
      const result = await service.assignCustomerCPF(customerMock.uid.value, cpf)

      // Assert
      expect(repositoryMock.findById).toHaveBeenCalledWith(customerMock.uid)
      expect(repositoryMock.update).toHaveBeenCalledWith(customerMock.uid, { cpf: customerMock.cpf })
      expect(customerMock.assignCPF).toHaveBeenCalledWith(cpf)
      expect(result).toBeValidResultWithValue(updatedCustomer)
    })

    it('deve retornar erro quando o CPF já estiver em uso', async () => {
      // Arrange
      const cpf = '123.456.789-09'
      repositoryMock.findById.mockResolvedValue(customerMock)
      repositoryMock.hasCPF.mockResolvedValue(true)

      // Act
      const result = await service.assignCustomerCPF(customerMock.uid.value, cpf)

      // Assert
      expect(result).toBeInvalidResultWithSingleFailure(FailureCode.CPF_ALREADY_IN_USE)
    })

    it('deve retornar falha quando o CPF for inválido', async () => {
      // Arrange
      repositoryMock.findById.mockResolvedValue(customerMock)
      jest.spyOn(customerMock, 'assignCPF').mockReturnValue(failure(simpleFailureMock))

      // Act
      const result = await service.assignCustomerCPF(customerMock.uid.value, 'invalid-cpf')

      // Assert
      expect(result).toBeInvalidResultWithFailure(simpleFailureMock)
      expect(repositoryMock.findById).toHaveBeenCalledWith(customerMock.uid)
      expect(repositoryMock.hasCPF).not.toHaveBeenCalled()
      expect(repositoryMock.update).not.toHaveBeenCalled()
    })

    describe('cenários com status adversos', () => {
      const cases = [
        { scenario: 'cliente bloqueado', status: CustomerStatusEnum.BLOCKED },
        { scenario: 'cliente suspenso', status: CustomerStatusEnum.SUSPENDED },
        { scenario: 'cliente com deleção pendente', status: CustomerStatusEnum.PENDING_DELETION },
      ]

      cases.forEach(async ({ scenario, status }) => {
        it(`deve falhar quando ${scenario}`, async () => {
          // Arrange
          const cpf = '123.456.789-09'
          const blockedCustomer = CreateTestCustomer({ status })
          repositoryMock.findById.mockResolvedValue(blockedCustomer)
          repositoryMock.hasCPF.mockResolvedValue(false)

          // Act
          const result = await service.assignCustomerCPF(blockedCustomer.uid.value, cpf)

          // Assert
          expect(result).toBeInvalidResultWithSingleFailure(FailureCode.CUSTOMER_WRITE_OPERATION_NOT_ALLOWED)
          expect(repositoryMock.update).not.toHaveBeenCalled()
        })
      })
    })
  })

  describe('removeCustomerCPF', () => {
    it('deve remover o CPF do cliente', async () => {
      // Arrange
      const customerWithCpf = CloneTestCustomerWithOverrides(customerMock, { cpf: '123.123.123-12' })
      const updatedCustomer = CloneTestCustomerWithOverrides(customerWithCpf, { cpf: undefined })
      jest.spyOn(customerWithCpf, 'removeCPF').mockReturnValue(success(updatedCustomer))
      repositoryMock.findById.mockResolvedValue(customerWithCpf)
      repositoryMock.update.mockResolvedValue(updatedCustomer)

      // Act
      const result = await service.removeCustomerCPF(customerWithCpf.uid.value)

      // Assert
      expect(repositoryMock.findById).toHaveBeenCalledWith(customerMock.uid)
      expect(repositoryMock.update).toHaveBeenCalledWith(customerMock.uid, { cpf: undefined })
      expect(customerWithCpf.removeCPF).toHaveBeenCalled()
      expect(result).toBeValidResultWithValue(updatedCustomer)
    })

    describe('cenários com status adversos', () => {
      const cases = [
        { scenario: 'cliente bloqueado', status: CustomerStatusEnum.BLOCKED },
        { scenario: 'cliente suspenso', status: CustomerStatusEnum.SUSPENDED },
        { scenario: 'cliente com deleção pendente', status: CustomerStatusEnum.PENDING_DELETION },
      ]

      cases.forEach(async ({ scenario, status }) => {
        it(`deve falhar quando ${scenario}`, async () => {
          // Arrange
          const blockedCustomer = CreateTestCustomer({ status })
          repositoryMock.findById.mockResolvedValue(blockedCustomer)

          // Act
          const result = await service.removeCustomerCPF(blockedCustomer.uid.value)

          // Assert
          expect(result).toBeInvalidResultWithSingleFailure(FailureCode.CUSTOMER_WRITE_OPERATION_NOT_ALLOWED)
          expect(repositoryMock.update).not.toHaveBeenCalled()
        })
      })
    })
  })

  describe('assignStudentCard', () => {
    const studentCardCommand = { ...CreateTestStudentCard() }
    const studentCard = StudentCard.hydrate(studentCardCommand)

    it('deve atribuir carteira de estudante quando válida e única', async () => {
      // Arrange
      const updatedCustomer = CloneTestCustomerWithOverrides(customerMock, { studentCard })
      jest.spyOn(StudentCard, 'create').mockReturnValue(success(studentCard))
      repositoryMock.findById.mockResolvedValue(customerMock)
      repositoryMock.hasStudentCard.mockResolvedValue(false)
      jest.spyOn(customerMock, 'assignStudentCard').mockReturnValue(success(updatedCustomer))
      repositoryMock.update.mockResolvedValue(updatedCustomer)

      // Act
      const result = await service.assignCustomerStudentCard(customerMock.uid.value, studentCardCommand)

      // Assert
      expect(repositoryMock.findById).toHaveBeenCalledWith(customerMock.uid)
      expect(repositoryMock.update).toHaveBeenCalledWith(customerMock.uid, { studentCard: updatedCustomer.studentCard })
      expect(result).toBeValidResultWithValue(updatedCustomer)
    })

    it('deve retornar falha quando a carteira já estiver em uso', async () => {
      // Arrange
      jest.spyOn(StudentCard, 'create').mockReturnValue(success(studentCard))
      repositoryMock.findById.mockResolvedValue(customerMock)
      repositoryMock.hasStudentCard.mockResolvedValue(true)

      // Act
      const result = await service.assignCustomerStudentCard(customerMock.uid.value, studentCardCommand)

      // Assert
      expect(repositoryMock.hasStudentCard).toHaveBeenCalledWith(studentCardCommand.registrationNumber)
      expect(repositoryMock.findById).toHaveBeenCalledWith(customerMock.uid)
      expect(repositoryMock.update).not.toHaveBeenCalled()
      expect(result).toBeInvalidResultWithSingleFailure(FailureCode.STUDENT_CARD_ALREADY_IN_USE)
    })

    it('deve retornar falha quando os dados da carteira do estudante forem inválidos', async () => {
      // Arrange
      repositoryMock.findById.mockResolvedValue(customerMock)
      repositoryMock.hasStudentCard.mockResolvedValue(false)
      jest.spyOn(customerMock, 'assignStudentCard').mockReturnValue(failure(simpleFailureMock))

      // Act
      const result = await service.assignCustomerStudentCard(customerMock.uid.value, studentCardCommand)

      // Assert
      expect(repositoryMock.findById).toHaveBeenCalledWith(customerMock.uid)
      expect(repositoryMock.hasStudentCard).toHaveBeenCalledWith(studentCardCommand.registrationNumber)
      expect(repositoryMock.update).not.toHaveBeenCalled()
      expect(result).toBeInvalidResultWithFailure(simpleFailureMock)
    })

    describe('cenários com status adversos', () => {
      const cases = [
        { scenario: 'cliente bloqueado', status: CustomerStatusEnum.BLOCKED },
        { scenario: 'cliente suspenso', status: CustomerStatusEnum.SUSPENDED },
        { scenario: 'cliente com deleção pendente', status: CustomerStatusEnum.PENDING_DELETION },
      ]

      cases.forEach(async ({ scenario, status }) => {
        it(`deve falhar quando ${scenario}`, async () => {
          // Arrange
          const blockedCustomer = CreateTestCustomer({ status })
          jest.spyOn(StudentCard, 'create').mockReturnValue(success(studentCard))
          repositoryMock.findById.mockResolvedValue(blockedCustomer)
          repositoryMock.hasStudentCard.mockResolvedValue(false)

          // Act
          const result = await service.assignCustomerStudentCard(blockedCustomer.uid.value, studentCardCommand)

          // Assert
          expect(result).toBeInvalidResultWithSingleFailure(FailureCode.CUSTOMER_WRITE_OPERATION_NOT_ALLOWED)
          expect(repositoryMock.update).not.toHaveBeenCalled()
        })
      })
    })
  })

  describe('removeCustomerStudentCard', () => {
    it('deve remover a carteira de estudante do cliente', async () => {
      // Arrange
      const customerWithStudentCard = CloneTestCustomerWithOverrides(customerMock, {
        studentCard: { registrationNumber: '123ac1', expirationDate: new Date(), institution: 'Test School' },
      })
      const updatedInstance = CloneTestCustomerWithOverrides(customerWithStudentCard, { studentCard: undefined })
      jest.spyOn(customerWithStudentCard, 'removeStudentCard').mockReturnValue(success(updatedInstance))
      repositoryMock.findById.mockResolvedValue(customerWithStudentCard)
      repositoryMock.update.mockResolvedValue(updatedInstance)

      // Act
      const result = await service.removeCustomerStudentCard(customerWithStudentCard.uid.value)

      // Assert
      expect(repositoryMock.update).toHaveBeenCalledWith(customerWithStudentCard.uid, {
        studentCard: updatedInstance.studentCard,
      })
      expect(result).toBeValidResultWithValue(updatedInstance)
    })

    it('deve retornar falha quando a remoção da carteira de estudante falhar', async () => {
      // Arrange
      const customerWithStudentCard = CloneTestCustomerWithOverrides(customerMock, {
        studentCard: { registrationNumber: '123ac1', expirationDate: new Date(), institution: 'Test School' },
      })
      repositoryMock.findById.mockResolvedValue(customerWithStudentCard)
      jest.spyOn(customerWithStudentCard, 'removeStudentCard').mockReturnValue(failure(simpleFailureMock))

      // Act
      const result = await service.removeCustomerStudentCard(customerWithStudentCard.uid.value)

      // Assert
      expect(result).toBeInvalidResultWithFailure(simpleFailureMock)
      expect(repositoryMock.update).not.toHaveBeenCalled()
    })

    describe('cenários com status adversos', () => {
      const cases = [
        { scenario: 'cliente bloqueado', status: CustomerStatusEnum.BLOCKED },
        { scenario: 'cliente suspenso', status: CustomerStatusEnum.SUSPENDED },
        { scenario: 'cliente com deleção pendente', status: CustomerStatusEnum.PENDING_DELETION },
      ]

      cases.forEach(async ({ scenario, status }) => {
        it(`deve falhar quando ${scenario}`, async () => {
          // Arrange
          const blockedCustomer = CreateTestCustomer({ status: CustomerStatusEnum.BLOCKED })
          repositoryMock.findById.mockResolvedValue(blockedCustomer)

          // Act
          const result = await service.removeCustomerStudentCard(blockedCustomer.uid.value)

          // Assert
          expect(result).toBeInvalidResultWithSingleFailure(FailureCode.CUSTOMER_WRITE_OPERATION_NOT_ALLOWED)
          expect(repositoryMock.update).not.toHaveBeenCalled()
        })
      })
    })
  })

  describe('requestAccountDeletion', () => {
    it('deve solicitar deleção da conta com sucesso', async () => {
      // Arrange
      const activeCustomer = customerMock
      const pendingDeletionCustomer = CloneTestCustomerWithOverrides(activeCustomer, {
        status: CustomerStatusEnum.PENDING_DELETION,
      })
      repositoryMock.findById.mockResolvedValue(activeCustomer)
      repositoryMock.update.mockResolvedValue(pendingDeletionCustomer)

      // Act
      const result = await service.requestAccountDeletion(activeCustomer.uid.value)

      // Assert
      expect(repositoryMock.findById).toHaveBeenCalledWith(activeCustomer.uid)
      expect(repositoryMock.update).toHaveBeenCalledWith(activeCustomer.uid, {
        status: CustomerStatusEnum.PENDING_DELETION,
      })
      expect(result).toBeValidResultWithValue(pendingDeletionCustomer)
    })

    it('deve retornar erro quando cliente não for encontrado', async () => {
      // Arrange
      repositoryMock.findById.mockResolvedValue(null)

      // Act
      const result = await service.requestAccountDeletion(customerMock.uid.value)

      // Assert
      expect(repositoryMock.findById).toHaveBeenCalledWith(customerMock.uid)
      expect(result).toBeInvalidResultWithSingleFailure(FailureCode.RESOURCE_NOT_FOUND)
      expect(repositoryMock.update).not.toHaveBeenCalled()
    })

    it('deve retornar erro quando transição não for permitida', async () => {
      // Arrange
      const blockedCustomer = CreateTestCustomer({ status: CustomerStatusEnum.BLOCKED })
      repositoryMock.findById.mockResolvedValue(blockedCustomer)

      // Act
      const result = await service.requestAccountDeletion(blockedCustomer.uid.value)

      // Assert
      expect(result).toBeInvalidResultWithSingleFailure(FailureCode.INVALID_STATUS_TRANSITION)
      expect(repositoryMock.update).not.toHaveBeenCalled()
    })

    /*    it('deve retornar erro quando execução da transição falhar', async () => {
      // Arrange
      const activeCustomer = CreateTestCustomer({ status: CustomerStatusEnum.ACTIVE })
      repositoryMock.findById.mockResolvedValue(activeCustomer)
      jest.spyOn()
      customerStatusStateMachineMock.canTransition.mockReturnValue(true)
      customerStatusStateMachineMock.executeTransition.mockReturnValue(failure(simpleFailureMock))

      // Act
      const result = await service.requestAccountDeletion(activeCustomer.uid.value)

      // Assert
      expect(customerStatusStateMachineMock.executeTransition).toHaveBeenCalledWith(
        activeCustomer.status,
        'delete',
        CustomerStatusTransitionActorEnum.CUSTOMER
      )
      expect(result).toBeInvalidResultWithFailure(simpleFailureMock)
      expect(repositoryMock.update).not.toHaveBeenCalled()
    })*/
  })

  describe('reactivateAccount', () => {
    it('deve reativar conta com pedido de deleção com sucesso', async () => {
      // Arrange
      const suspendedCustomer = CreateTestCustomer({ status: CustomerStatusEnum.PENDING_DELETION })
      const activatedCustomer = CloneTestCustomerWithOverrides(suspendedCustomer, { status: CustomerStatusEnum.ACTIVE })

      repositoryMock.findById.mockResolvedValue(suspendedCustomer)
      repositoryMock.update.mockResolvedValue(activatedCustomer)

      // Act
      const result = await service.reactivateAccount(suspendedCustomer.uid.value)
      console.log(suspendedCustomer.uid.value)

      // Assert
      expect(repositoryMock.findById).toHaveBeenCalledWith(suspendedCustomer.uid)
      expect(repositoryMock.update).toHaveBeenCalledWith(activatedCustomer.uid, { status: CustomerStatusEnum.ACTIVE })
      expect(result).toBeValidResultWithValue(activatedCustomer)
    })

    it('deve retornar erro quando cliente não for encontrado', async () => {
      // Arrange
      repositoryMock.findById.mockResolvedValue(null)

      // Act
      const result = await service.reactivateAccount(customerMock.uid.value)

      // Assert
      expect(repositoryMock.findById).toHaveBeenCalledWith(customerMock.uid)
      expect(result).toBeInvalidResultWithSingleFailure(FailureCode.RESOURCE_NOT_FOUND)
      expect(repositoryMock.update).not.toHaveBeenCalled()
    })

    it('deve retornar erro quando transição não for permitida', async () => {
      // Arrange
      const activeCustomer = CreateTestCustomer({ status: CustomerStatusEnum.BLOCKED })
      repositoryMock.findById.mockResolvedValue(activeCustomer)

      // Act
      const result = await service.reactivateAccount(activeCustomer.uid.value)

      // Assert
      expect(result).toBeInvalidResultWithSingleFailure(FailureCode.INVALID_STATUS_TRANSITION)
      expect(repositoryMock.update).not.toHaveBeenCalled()
    })

    /*    it('deve retornar erro quando execução da transição falhar', async () => {
      // Arrange
      const suspendedCustomer = CreateTestCustomer({ status: CustomerStatusEnum.SUSPENDED })
      repositoryMock.findById.mockResolvedValue(suspendedCustomer)
      customerStatusStateMachineMock.canTransition.mockReturnValue(true)
      customerStatusStateMachineMock.executeTransition.mockReturnValue(failure(simpleFailureMock))

      // Act
      const result = await service.reactivateAccount(suspendedCustomer.uid.value)

      // Assert
      expect(customerStatusStateMachineMock.executeTransition).toHaveBeenCalledWith(
        suspendedCustomer.status,
        'activate',
        CustomerStatusTransitionActorEnum.CUSTOMER
      )
      expect(result).toBeInvalidResultWithFailure(simpleFailureMock)
      expect(repositoryMock.update).not.toHaveBeenCalled()
    })*/
  })
})
