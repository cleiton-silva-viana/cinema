import .{ v4 } from 'uuid'
import { HttpStatus } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { faker } from '@faker-js/faker/locale/pt_PT'
import { CustomerController } from './customer.controller'
import { Customer } from '../entity/customer'
import { CUSTOMER_APPLICATION_SERVICE, CUSTOMER_REPOSITORY } from '../constant/customer.constants'
import { ICustomerRepository } from '../repository/customer.repository.interface'
import { CustomerUID } from '../entity/value-object/customer.uid'
import { ResourceTypes } from '@shared/constant/resource.types'
import { FailureCode } from '@shared/failure/failure.codes.enum'
import { JsonApiResponse, ResponseResource } from '@/shared/response/json.api.response'
import { ICreateCustomerDTO } from './dto/create.customer.dto'
import { CustomerApplicationService } from '@modules/customer/service/customer.application.service'

describe('CustomerController', () => {
  let controller: CustomerController
  let repositoryMock: jest.Mocked<ICustomerRepository>
  let customer: Customer

  beforeEach(async () => {
    repositoryMock = {
      hasEmail: jest.fn(),
      hasCPF: jest.fn(),
      hasStudentCardID: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CustomerController],
      providers: [
        {
          provide: CUSTOMER_APPLICATION_SERVICE,
          useClass: CustomerApplicationService,
        },
        {
          provide: CUSTOMER_REPOSITORY,
          useValue: repositoryMock,
        },
      ],
    }).compile()

    controller = module.get<CustomerController>(CustomerController)

    customer = Customer.hydrate({
      uid: CustomerUID.create().value,
      name: faker.person.firstName(),
      birthDate: faker.date.birthdate({ mode: 'age', min: 18, max: 90 }),
      email: faker.internet.email(),
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  function createCustomCustomer(
    baseCustomer: Customer,
    newAttributes: Partial<{
      name?: string
      email?: string
      birthDate?: Date
      password?: string
      cpf?: string
      studentCard?: { id: string; validity: Date }
    }>
  ): Customer {
    return Customer.hydrate({
      uid: baseCustomer.uid.value,
      name: newAttributes.name ?? baseCustomer.name.value,
      birthDate: newAttributes.birthDate ?? baseCustomer.birthDate.value,
      email: newAttributes.email ?? baseCustomer.email.value,
      cpf: newAttributes.cpf ?? null,
      studentCard: newAttributes.studentCard
        ? { id: newAttributes.studentCard?.id, validity: newAttributes.studentCard?.validity }
        : null,
    })
  }

  function defaultAssertions(statusCode: HttpStatus, response: JsonApiResponse, customerExpected: Customer): void {
    // Arrange
    const res = response.getAllDatas()

    // Assert
    expect(response.status).toBe(statusCode)
    expect(response.data).toBeDefined()
    expect(Array.isArray(res.data)).toBe(false)
    const data = res.data as ResponseResource
    expect(data).toBeDefined()
    expect(data.id).toBe(customerExpected.uid.value)
    expect(data.attributes).toBeDefined()
    expect(data.attributes?.email).toBe(customerExpected.email.value)
    expect(data.attributes?.name).toBe(customerExpected.name.value)
    expect(data.attributes?.birthDate).toBe(customerExpected.birthDate.value.toISOString().split('T')[0])
    expect(data.links).toBeDefined()
    expect(data.links?.self).toBe(`/${ResourceTypes.CUSTOMER}/${customerExpected.uid.value}`)
  }

  describe('findById', () => {
    it('deve retornar dados do cliente quando ele existe', async () => {
      // Arrange
      repositoryMock.findById.mockResolvedValue(customer)

      // Act
      const result = await controller.findById(customer.uid.value)

      // Assert
      defaultAssertions(HttpStatus.OK, result, customer)
    })

    it('deve retornar erro quando o cliente não existe', async () => {
      // Arrange
      repositoryMock.findById.mockResolvedValue(null)

      // Act
      const result = (await controller.findById(customer.uid.value)).getAllDatas()

      // Assert
      expect(result.status).toBe(HttpStatus.NOT_FOUND)
      expect(result.errors).toBeDefined()
      expect(result.errors.length).toBe(1)
      expect(result.errors[0].code).toBe(FailureCode.RESOURCE_NOT_FOUND)
    })

    it('deve lidar com parâmetro de ID inválido', async () => {
      // Arrange
      const invalidUid = v4()

      // Act
      const result = (await controller.findById(invalidUid)).getAllDatas()

      // Assert
      expect(result.status).toBe(HttpStatus.BAD_REQUEST)
      expect(result.errors[0].code).toBe(FailureCode.UID_WITH_INVALID_FORMAT)
    })
  })

  describe('findByEmail', () => {
    it('deve retornar dados do cliente quando encontrado pelo email', async () => {
      // Arrange
      repositoryMock.findByEmail.mockResolvedValue(customer)

      // Act
      const response = await controller.findByEmail(customer.email.value)

      // Assert
      defaultAssertions(HttpStatus.OK, response, customer)
    })

    it('deve retornar erro quando o cliente não é encontrado pelo email', async () => {
      // Arrange
      repositoryMock.findByEmail.mockResolvedValue(null)

      // Act
      const response = (await controller.findByEmail(customer.email.value)).getAllDatas()

      // Assert
      expect(response.status).toBe(HttpStatus.NOT_FOUND)
      expect(response.errors).toBeDefined()
      expect(response.errors.length).toBeGreaterThan(0)
      expect(response.errors.some((e) => e.code === FailureCode.RESOURCE_NOT_FOUND)).toBe(true)
    })

    it('deve lidar corretamente quando atributo email for nulo', async () => {
      // Act
      const response = (await controller.findByEmail('')).getAllDatas()

      // Assert
      expect(response.status).toBe(HttpStatus.BAD_REQUEST)
    })
  })

  describe('create', () => {
    it('deve criar um cliente com sucesso', async () => {
      // Arrange
      const createDTO: ICreateCustomerDTO = {
        name: customer.name.value,
        email: customer.email.value,
        birthDate: customer.birthDate.value,
        password: '2365@R@fvwRGT$%',
      }
      repositoryMock.findByEmail.mockResolvedValue(null)
      repositoryMock.create.mockResolvedValue(customer)

      // Act
      const result = await controller.create(createDTO)

      // Assert
      defaultAssertions(HttpStatus.CREATED, result, customer)
    })

    it('deve retornar erro quando dados estão ausentes', async () => {
      // Arrange
      const createDto = {} as ICreateCustomerDTO

      // Act
      const result = (await controller.create(createDto)).getAllDatas()

      // Assert
      expect(result.status).toBe(HttpStatus.BAD_REQUEST)
      expect(result.errors).toBeDefined()
    })

    it('deve retornar erro quando o serviço falha', async () => {
      // Arrange
      const invalidDatasDTO = {
        name: customer.name.value,
        birthDate: customer.birthDate.value,
        email: 'invalid@mail',
        password: 'a',
      }

      // Act
      const result = (await controller.create(invalidDatasDTO)).getAllDatas()

      // Assert
      expect(result.status).toBe(HttpStatus.BAD_REQUEST)
      expect(result.errors).toBeDefined()
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('deve definir o status HTTP correto para BAD_REQUEST quando DTO é null', async () => {
      // Arrange
      const createDto = null

      // Act
      const response = await controller.create(createDto as any)
      const result = response.getAllDatas()

      // Assert
      expect(result.status).toBe(HttpStatus.BAD_REQUEST)
      expect(result.errors[0].code).toBe(FailureCode.MISSING_REQUIRED_DATA)
    })
  })

  describe('updateCustomerName', () => {
    it('deve atualizar o nome do cliente com sucesso', async () => {
      // Arrange
      const newName = faker.person.fullName()
      const dto = { name: newName }
      const updatedCustomer = createCustomCustomer(customer, dto)

      repositoryMock.findById.mockResolvedValue(customer)
      repositoryMock.update.mockResolvedValue(updatedCustomer)

      // Act
      const response = await controller.updateCustomerName(customer.uid.value, dto)

      // Assert
      defaultAssertions(HttpStatus.OK, response, updatedCustomer)
    })

    it('deve retornar erro se a atualização do nome falhar', async () => {
      const dto = { name: 'Sh' } // nome muito curto

      repositoryMock.findById.mockResolvedValue(customer)

      // Act
      const response = (await controller.updateCustomerName(customer.uid.value, dto)).getAllDatas()

      // Assert
      expect(response.status).toBe(HttpStatus.BAD_REQUEST)
      expect(response.errors).toBeDefined()
      expect(response.errors.length).toBeGreaterThan(0)
    })

    it('deve lidar corretamente quando o ID do cliente é inválido', async () => {
      // Arrange
      const dto = { name: faker.person.firstName() }
      const invalidUid = 'invalid-uid'

      // Act
      const response = (await controller.updateCustomerName(invalidUid, dto)).getAllDatas()

      // Assert
      expect(response.status).toBe(HttpStatus.BAD_REQUEST)
      expect(response.errors[0].code).toBe(FailureCode.UID_WITH_INVALID_FORMAT)
    })
  })

  describe('updateCustomerBirthDate', () => {
    it('deve atualizar a data de nascimento do cliente com sucesso', async () => {
      // Arrange
      const newBirthDate = faker.date.birthdate({ min: 20, max: 50, mode: 'age' })
      const dto = { birthDate: newBirthDate }
      const updatedCustomer = createCustomCustomer(customer, dto)

      repositoryMock.findById.mockResolvedValue(customer)
      repositoryMock.update.mockResolvedValue(updatedCustomer)

      // Act
      const response = await controller.updateCustomerBirthDate(customer.uid.value, dto)

      // Assert
      defaultAssertions(HttpStatus.OK, response, updatedCustomer)
    })

    it('deve retornar erro se a atualização da data de nascimento falhar', async () => {
      // Arrange
      const dto = { birthDate: new Date() }
      repositoryMock.findById.mockResolvedValue(customer)

      // Act
      const response = (await controller.updateCustomerBirthDate(customer.uid.value, dto)).getAllDatas()

      // Assert
      expect(response.status).toBe(HttpStatus.BAD_REQUEST)
      expect(response.errors).toBeDefined()
      expect(response.errors.length).toBeGreaterThan(0)
    })
  })

  describe('assignCustomerCPF', () => {
    it('deve atribuir CPF ao cliente com sucesso', async () => {
      // Arrange
      const newCpf = '123.123.123-98'
      const dto = { cpf: newCpf }
      const updatedCustomer = createCustomCustomer(customer, dto)

      repositoryMock.findById.mockResolvedValue(customer)
      repositoryMock.update.mockResolvedValue(updatedCustomer)

      // Act
      const response = await controller.assignCustomerCPF(customer.uid.value, dto)

      // Assert
      defaultAssertions(HttpStatus.OK, response, updatedCustomer)
    })

    it('deve retornar erro se a atribuição do CPF falhar', async () => {
      // Arrange
      const dto = { cpf: '123' }

      repositoryMock.findById.mockResolvedValue(customer)

      // Act
      const response = (await controller.assignCustomerCPF(customer.uid.value, dto)).getAllDatas()

      // Assert
      expect(response.status).toBe(HttpStatus.BAD_REQUEST)
      expect(response.errors).toBeDefined()
      expect(response.errors.length).toBeGreaterThan(0)
    })
  })

  describe('removeCustomerCPF', () => {
    it('deve remover CPF do cliente com sucesso', async () => {
      // Arrange
      const updatedCustomer = createCustomCustomer(customer, { cpf: undefined })

      repositoryMock.findById.mockResolvedValue(customer)
      repositoryMock.update.mockResolvedValue(updatedCustomer)

      // Act
      const response = await controller.removeCustomerCPF(customer.uid.value)

      // Assert
      defaultAssertions(HttpStatus.OK, response, updatedCustomer)
    })

    it('deve retornar erro se a remoção do CPF falhar (ex: cliente não encontrado)', async () => {
      // Arrange
      repositoryMock.findById.mockResolvedValue(null)

      // Act
      const response = (await controller.removeCustomerCPF(customer.uid.value)).getAllDatas()

      // Assert
      expect(response.status).toBe(HttpStatus.NOT_FOUND)
      expect(response.errors).toBeDefined()
      expect(response.errors.length).toBeGreaterThan(0)
    })
  })

  describe('assignCustomerStudentCard', () => {
    const dto = {
      studentCard: {
        id: faker.string.alphanumeric(14),
        validity: faker.date.future(),
      },
    }

    it('deve atribuir o cartão de estudante ao cliente com sucesso', async () => {
      // Arrange
      const updatedCustomer = createCustomCustomer(customer, dto)

      repositoryMock.hasStudentCardID.mockResolvedValue(false)
      repositoryMock.findById.mockResolvedValue(customer)
      repositoryMock.update.mockResolvedValue(updatedCustomer)

      // Act
      const response = await controller.assignCustomerStudentCard(customer.uid.value, dto.studentCard)

      // Assert
      defaultAssertions(HttpStatus.OK, response, updatedCustomer)
    })

    it('deve retornar erro se a atribuição do cartão de estudante falhar', async () => {
      // Arrange
      const studentCardDTO = { ...dto.studentCard, id: '' }

      repositoryMock.hasStudentCardID.mockResolvedValue(false)
      repositoryMock.findById.mockResolvedValue(customer)
      // repositoryMock.update.mockResolvedValue(updatedCustomer);

      // Act
      const response = await controller.assignCustomerStudentCard(customer.uid.value, studentCardDTO)

      // Assert
      expect(response.status).toBe(HttpStatus.BAD_REQUEST)
      expect(response.errors).toBeDefined()
      expect(response.errors.length).toBeGreaterThan(0)
    })
  })

  describe('removeCustomerStudentCard', () => {
    it('deve remover o cartão de estudante do cliente com sucesso', async () => {
      // Arrange
      const updatedCustomer = createCustomCustomer(customer, { studentCard: undefined })

      repositoryMock.findById.mockResolvedValue(customer)
      repositoryMock.update.mockResolvedValue(updatedCustomer)

      // Act
      const response = await controller.removeCustomerStudentCard(customer.uid.value)

      // Assert
      defaultAssertions(HttpStatus.OK, response, updatedCustomer)
    })

    it('deve retornar erro se a remoção do cartão de estudante falhar (ex: cliente não encontrado)', async () => {
      // Arrange
      repositoryMock.findById.mockResolvedValue(null)

      // Act
      const response = (await controller.removeCustomerStudentCard(customer.uid.value)).getAllDatas()

      // Assert
      expect(response.status).toBe(HttpStatus.NOT_FOUND)
      expect(response.errors).toBeDefined()
      expect(response.errors.length).toBeGreaterThan(0)
    })
  })
})
