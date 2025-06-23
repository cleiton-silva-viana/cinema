import { CustomerRepository } from '@modules/customer/repository/customer.repository'
import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm'
import { CustomerModel } from '@modules/customer/repository/model/customer.model'
import { CredentialModel } from '@modules/customer/repository/model/credential.model'
import { StudentCardModel } from '@modules/customer/repository/model/student.card.model'
import { faker } from '@faker-js/faker/locale/pt_PT'
import { CustomerMapper } from '@modules/customer/repository/mapper/customer.mapper'
import { CredentialMapper } from '@modules/customer/repository/mapper/credential.mapper'
import { CUSTOMER_MAPPER, CREDENTIAL_MAPPER } from '@modules/customer/constant/customer.constants'
import { CloneTestCustomerWithOverrides, CreateTestCustomer } from '@test/builder/customer.builder'
import { CreateTestStudentCard } from '@test/builder/student.card.builder'
import { Email } from '@modules/customer/entity/value-object/email'
import { CPF } from '@modules/customer/entity/value-object/cpf'
import { Password } from '@modules/customer/entity/value-object/password'
import { Name } from '@shared/value-object/name'
import { Customer } from '@modules/customer/entity/customer'
import { v7 } from 'uuid'
import { CustomerStatusEnum } from '@modules/customer/enum/customer.status.enum'
import { DataSource, DataSourceOptions, Repository } from 'typeorm'
import { DateHelper } from '@shared/helper/date.helper'

const testDataSourceOptions: DataSourceOptions = {
  type: 'sqlite',
  database: ':memory:',
  entities: [CustomerModel, CredentialModel, StudentCardModel],
  synchronize: true,
  dropSchema: true,
  logging: ['error', 'warn'], // Logs apenas erros e warnings
  // Configurações específicas para SQLite - Foreign keys desabilitadas para testes
  extra: {
    pragma: {
      foreign_keys: 'ON',
      journal_mode: 'MEMORY',
      synchronous: 'OFF',
    },
  },
}

describe('CustomerRepository - Testes de Integração', () => {
  let customerRepository: CustomerRepository
  let typeOrmRepository: Repository<CustomerModel>
  let credentialRepository: Repository<CredentialModel>
  let module: TestingModule

  const mapper = new CustomerMapper()
  const customerMock = CreateTestCustomer({ cpf: '123.456.789-01' })
  const modelMock = new CustomerModel(
    customerMock.uid.unformattedValue,
    customerMock.name.value,
    customerMock.email.value,
    customerMock.birthDate.value,
    CustomerStatusEnum.ACTIVE,
    customerMock.createdAt,
    customerMock.updatedAt,
    customerMock.cpf?.unformattedValue
  )

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot(testDataSourceOptions),
        TypeOrmModule.forFeature([CustomerModel, CredentialModel, StudentCardModel]),
      ],
      providers: [
        CustomerRepository,
        {
          provide: CUSTOMER_MAPPER,
          useClass: CustomerMapper,
        },
        {
          provide: CREDENTIAL_MAPPER,
          useClass: CredentialMapper,
        },
      ],
    }).compile()

    // Aguardar inicialização completa
    await module.init()

    customerRepository = module.get<CustomerRepository>(CustomerRepository)
    typeOrmRepository = module.get<Repository<CustomerModel>>(getRepositoryToken(CustomerModel))
    credentialRepository = module.get<Repository<CredentialModel>>(getRepositoryToken(CredentialModel))

    // Verificar se as tabelas foram criadas corretamente
    const dataSource = module.get<DataSource>(DataSource)
    await dataSource.query('PRAGMA foreign_keys = OFF')
  }, 30000)

  afterEach(async () => {
    await module.close()
  })

  it('deve estar definido', () => {
    expect(customerRepository).toBeDefined()
  })

  describe('hasEmail', () => {
    it('deve retornar true quando o email já existe', async () => {
      // Arrange
      await typeOrmRepository.save(modelMock)

      // Act
      const result = await customerRepository.hasEmail(customerMock.email)

      // Assert
      expect(result).toBe(true)
    })

    it('deve retornar false quando o email não existe', async () => {
      // Arrange
      const email = Email.hydrate(faker.internet.email())

      // Act
      const result = await customerRepository.hasEmail(email)

      // Assert
      expect(result).toBe(false)
    })
  })

  describe('hasCPF', () => {
    it('deve retornar true quando o CPF já existe', async () => {
      // Arrange
      await typeOrmRepository.save(modelMock)

      // Act
      const result = await customerRepository.hasCPF(customerMock.cpf!)

      // Assert
      expect(result).toBe(true)
    })

    it('deve retornar false quando o CPF não existe', async () => {
      // Arrange
      const cpf = CPF.hydrate('987.654.321-23')

      // Act
      const result = await customerRepository.hasCPF(cpf)

      // Assert
      expect(result).toBe(false)
    })
  })

  describe('hasStudentCard', () => {
    it('deve retornar true quando o número de matrícula já existe', async () => {
      // Arrange
      const card = CreateTestStudentCard()
      const customerWithStudentCard = CloneTestCustomerWithOverrides(customerMock, { studentCard: card })
      const customerModel: CustomerModel = {
        ...modelMock,
        studentCard: {
          customerUID: customerWithStudentCard.uid.value,
          institution: card.institution,
          registrationNumber: card.registrationNumber,
          expiresAt: card.expirationDate,
        },
      }
      await typeOrmRepository.save(customerModel)

      // Act
      const result = await customerRepository.hasStudentCard(card.registrationNumber)

      // Assert
      expect(result).toBe(true)
    })

    it('deve retornar false quando o número de matrícula não existe', async () => {
      // Arrange
      const registrationNumber = faker.string.alphanumeric(8)

      // Act
      const result = await customerRepository.hasStudentCard(registrationNumber)

      // Assert
      expect(result).toBe(false)
    })
  })

  describe('findById', () => {
    it('deve retornar o cliente quando encontrado pelo UID', async () => {
      // Arrange
      await typeOrmRepository.save(modelMock)

      // Act
      const result = await customerRepository.findById(customerMock.uid)

      // Assert
      expect(result).not.toBeNull()
      expect(result!.uid.value).toBe(customerMock.uid.value)
      expect(result!.name.value).toBe(customerMock.name.value)
      expect(result!.email.value).toBe(customerMock.email.value)
    })

    it('deve retornar null quando cliente não é encontrado', async () => {
      // Act
      const result = await customerRepository.findById(customerMock.uid)

      // Assert
      expect(result).toBeNull()
    })

    it('deve incluir student card quando existente', async () => {})
  })

  describe('findByEmail', () => {
    it('deve retornar o cliente quando encontrado pelo email', async () => {
      // Arrange
      await typeOrmRepository.save(modelMock)

      // Act
      const result = await customerRepository.findByEmail(customerMock.email)

      // Assert
      expect(result).not.toBeNull()
      expect(result!.uid.value).toBe(customerMock.uid.value)
      expect(result!.email.value).toBe(customerMock.email.value)
    })

    it('deve retornar null quando cliente não é encontrado pelo email', async () => {
      // Act
      const result = await customerRepository.findByEmail(customerMock.email)

      // Assert
      expect(result).toBeNull()
    })

    it('deve ser case-insensitive', async () => {})

    it('deve incluir student card quando existente', async () => {})
  })

  describe('create', () => {
    it('deve criar um cliente com credencial com sucesso', async () => {
      // Arrange
      const customer = CreateTestCustomer()
      const password = await Password.hydrate('MinhaSenh@123')

      // Act
      const result = await customerRepository.create(customer, password)

      // Assert
      expect(result).toEqual(customer)

      // Verificar se foi salvo no banco
      const savedCustomer = await typeOrmRepository.findOne({
        where: { uid: customer.uid.unformattedValue },
      })
      expect(savedCustomer).not.toBeNull()

      const savedCredential = await credentialRepository.findOne({
        where: { customerUID: customer.uid.unformattedValue },
      })
      expect(savedCredential).not.toBeNull()
    })

    it('deve criar um cliente com cartão estudantil', async () => {
      // Arrange
      const studentCard = CreateTestStudentCard()
      const customer = CreateTestCustomer({ studentCard })
      const password = Password.hydrate('MinhaSenh@123')

      // Act
      const result = await customerRepository.create(customer, password)

      // Assert
      expect(result).toEqual(customer)

      const savedCustomer = await typeOrmRepository.findOne({
        where: { uid: customer.uid.unformattedValue },
        relations: ['studentCard'],
      })
      expect(savedCustomer?.studentCard).toBeDefined()
      expect(savedCustomer?.studentCard?.registrationNumber).toBe(studentCard.registrationNumber)
    })

    it('deve lançar erro ao tentar criar customer com email já em uso', async () => {
      // Arrange
      const customer1 = CreateTestCustomer()
      const password = Password.hydrate('MinhaSenh@123')
      await customerRepository.create(customer1, password)

      const customer2 = CreateTestCustomer({ email: customer1.email.value })

      // Act & Assert
      await expect(customerRepository.create(customer2, password)).rejects.toThrow()
    })

    it('deve lançar erro ao tentar criar customer com CPF duplicado', async () => {
      // Arrange
      const cpf = CPF.hydrate('123.456.789-01')
      const customer1 = CreateTestCustomer({ cpf: cpf.value })
      const customer2 = CreateTestCustomer({ cpf: cpf.value })
      const password = Password.hydrate('MinhaSenh@123')

      await customerRepository.create(customer1, password)

      // Act & Assert
      await expect(customerRepository.create(customer2, password)).rejects.toThrow()
    })

    it('deve lançar erro ao tentar criar customers com mesmo número de matrícula', async () => {
      // Arrange
      const studentCard1 = CreateTestStudentCard()
      const studentCard2 = CreateTestStudentCard({ registrationNumber: studentCard1.registrationNumber })

      const customer1 = CreateTestCustomer({ studentCard: studentCard1 })
      const customer2 = CreateTestCustomer({ studentCard: studentCard2 })
      const password = Password.hydrate('MinhaSenh@123')

      await customerRepository.create(customer1, password)

      // Act & Assert
      await expect(customerRepository.create(customer2, password)).rejects.toThrow()
    })
  })

  describe('update', () => {
    const newName = Name.hydrate(faker.person.fullName())
    const overrides: Partial<Customer> = { name: newName }

    it('deve atualizar um cliente existente', async () => {
      // Arrange
      await typeOrmRepository.save(modelMock)

      // Act
      const result = await customerRepository.update(customerMock.uid, overrides)

      // Assert
      expect(result).toBeDefined()
      expect(result!.name.value).toBe(newName.value)
      expect(result!.uid.value).toBe(customerMock.uid.value)
    })

    it('deve retornar null quando cliente não existe', async () => {
      // Act
      const result = await customerRepository.update(customerMock.uid, overrides)

      // Assert
      expect(result).toBeNull()
    })

    it('deve fazer rollback quando criação na tabela credencial falhar', async () => {
      // Arrange
      const customer = CreateTestCustomer()
      const password = Password.hydrate('MinhaSenh@123')
      await customerRepository.create(customer, password)

      // Simular falha mockando o método save do repository
      const originalSave = typeOrmRepository.save
      let saveCallCount = 0

      jest.spyOn(typeOrmRepository, 'save').mockImplementation(async (entity) => {
        saveCallCount++
        if (saveCallCount === 1) {
          // Primeira chamada falha
          throw new Error('Erro simulado durante update')
        }
        return originalSave.call(typeOrmRepository, entity)
      })

      try {
        // Act & Assert
        await expect(customerRepository.update(customer.uid, overrides)).rejects.toThrow('Erro simulado durante update')

        // Verificar que o customer não foi atualizado devido ao rollback
        const unchangedCustomer = await customerRepository.findById(customer.uid)
        expect(unchangedCustomer).not.toBeNull()
        expect(unchangedCustomer!.name.value).toBe(customer.name.value) // Nome original
        expect(unchangedCustomer!.name.value).not.toBe(newName.value) // Não foi atualizado
      } finally {
        // Restaurar o método original
        typeOrmRepository.save = originalSave
      }
    })

    describe('deve lançar erro quando unique constraint forem violadas', () => {
      it('deve lançar erro ao tentar atualizar customer com email já existente', async () => {
        // Arrange
        const customer1 = CreateTestCustomer()
        const customer2 = CreateTestCustomer()
        const password = Password.hydrate('MinhaSenh@123')

        await customerRepository.create(customer1, password)
        await customerRepository.create(customer2, password)

        // Act & Assert
        await expect(customerRepository.update(customer2.uid, { email: customer1.email })).rejects.toThrow()
      })

      it('deve lançar erro ao tentar atualizar customer com CPF já existente', async () => {
        // Arrange
        const cpf1 = CPF.hydrate('123.456.789-01')
        const cpf2 = CPF.hydrate('987.654.321-23')
        const customer1 = CreateTestCustomer({ cpf: cpf1.value })
        const customer2 = CreateTestCustomer({ cpf: cpf2.value })
        const password = Password.hydrate('MinhaSenh@123')

        await customerRepository.create(customer1, password)
        await customerRepository.create(customer2, password)

        // Act & Assert
        await expect(customerRepository.update(customer2.uid, { cpf: cpf1 })).rejects.toThrow()
      })
    })
  })

  describe('permanentlyDelete', () => {
    it('deve deletar permanentemente um cliente existente e dados relacionados', async () => {
      // Arrange
      const customer = CreateTestCustomer()
      const password = Password.hydrate('MinhaSenh@123')
      await customerRepository.create(customer, password)

      // Verificar que customer e credencial foram criados
      const customerBefore = await typeOrmRepository.findOne({
        where: { uid: customer.uid.unformattedValue },
      })
      const credentialBefore = await credentialRepository.findOne({
        where: { customerUID: customer.uid.unformattedValue },
      })
      expect(customerBefore).not.toBeNull()
      expect(credentialBefore).not.toBeNull()

      // Act
      const result = await customerRepository.permanentlyDelete(customer.uid)

      // Assert
      expect(result.affected).toBe(1)

      // Verificar que customer foi deletado
      const deletedCustomer = await typeOrmRepository.findOne({
        where: { uid: customer.uid.value },
      })
      expect(deletedCustomer).toBeNull()

      // Verificar que credencial foi deletada
      const deletedCredential = await credentialRepository.findOne({
        where: { customerUID: customer.uid.value },
      })
      expect(deletedCredential).toBeNull()
    })

    it('deve deletar cartão de estudante relacionado', async () => {
      // Arrange
      const studentCard = CreateTestStudentCard()
      const customer = CreateTestCustomer({ studentCard })
      const password = Password.hydrate('MinhaSenh@123')
      await customerRepository.create(customer, password)

      // Verificar que o cartão foi criado
      const studentCardRepository = module.get<Repository<StudentCardModel>>(getRepositoryToken(StudentCardModel))
      const cardBefore = await studentCardRepository.findOne({
        where: { customerUID: customer.uid.unformattedValue },
      })
      expect(cardBefore).not.toBeNull()

      // Act
      await customerRepository.permanentlyDelete(customer.uid)

      // Assert
      const deletedCard = await studentCardRepository.findOne({
        where: { customerUID: customer.uid.value },
      })
      expect(deletedCard).toBeNull()
    })

    it('deve retornar 0 affected quando cliente não existe', async () => {
      // Act
      const result = await customerRepository.permanentlyDelete(customerMock.uid)

      // Assert
      expect(result.affected).toBe(0)
    })
  })

  describe('findInactiveCustomersSince', () => {
    it('deve encontrar clientes inativos desde uma data específica', async () => {
      // Arrange
      const password = Password.hydrate('MinhaSenh@123')
      const cutoffDate = new Date('2023-01-01') // esta data não é inclusiva!
      const oldDate = new Date('2022-12-01')

      // Criar customer inativo antigo
      const inactiveCustomer = CreateTestCustomer({
        status: CustomerStatusEnum.INACTIVE,
        createdAt: new Date(oldDate),
        updatedAt: DateHelper.past({ days: 10 }, cutoffDate),
      })
      await customerRepository.create(inactiveCustomer, password)

      // Criar customer ativo para controle
      const activeCustomer = CreateTestCustomer({ status: CustomerStatusEnum.ACTIVE })
      await customerRepository.create(activeCustomer, password)

      // Act
      const result = await customerRepository.findInactiveCustomersSince(cutoffDate)

      // Assert
      expect(result).toHaveLength(1)
      expect(result[0].uid.value).toBe(inactiveCustomer.uid.value)
      expect(result[0].status).toBe(CustomerStatusEnum.INACTIVE)
    })

    it('deve retornar array vazio quando nenhum cliente inativo é encontrado', async () => {
      // Arrange
      const cutoffDate = new Date('2020-01-01')

      // Act
      const result = await customerRepository.findInactiveCustomersSince(cutoffDate)

      // Assert
      expect(result).toHaveLength(0)
    })

    it('deve ordenar resultados por updatedAt crescente', async () => {
      // Arrange
      const password = Password.hydrate('MinhaSenh@123')
      const cutoffDate = new Date('2023-01-01')

      // Criar múltiplos customers inativos
      const customer1 = CreateTestCustomer({
        status: CustomerStatusEnum.INACTIVE,
        updatedAt: DateHelper.past({ days: 10 }, cutoffDate),
      }) // mais recente
      const customer2 = CreateTestCustomer({
        status: CustomerStatusEnum.INACTIVE,
        updatedAt: DateHelper.past({ years: 1 }, cutoffDate),
      }) // mais antigo

      await customerRepository.create(customer1, password)
      await customerRepository.create(customer2, password)

      // Act
      const result = await customerRepository.findInactiveCustomersSince(cutoffDate)

      // Assert
      expect(result).toHaveLength(2)
      expect(result[0].uid.value).toBe(customer2.uid.value) // Mais antigo primeiro
      expect(result[1].uid.value).toBe(customer1.uid.value)
    })
  })

  describe('Nullable Constraints', () => {
    describe('Campos obrigatórios não devem aceitar null', () => {
      const validModel = new CustomerModel(
        v7(),
        faker.person.fullName(),
        faker.internet.email(),
        faker.date.past(),
        CustomerStatusEnum.ACTIVE,
        new Date(),
        new Date()
      )

      const cases = [
        { scenario: 'UID é null', property: 'uid' },
        { scenario: 'name é null', property: 'name' },
        { scenario: 'email é null', property: 'email' },
        { scenario: 'birthDate é null', property: 'birthDate' },
        { scenario: 'createdAt é null', property: 'createdAt' },
        { scenario: 'updatedAt é null', property: 'updatedAt' },
      ]

      cases.forEach(({ scenario, property }) => {
        it(`deve lançar erro se ${scenario}`, async () => {
          // Arrange
          const customer = CreateTestCustomer()
          const password = Password.hydrate('MinhaSenh@123')
          await customerRepository.create(customer, password)

          const invalidModel = { ...validModel }
          ;(invalidModel as any)[property] = null

          // Assert
          await expect(typeOrmRepository.save(invalidModel)).rejects.toThrow()
        })
      })
    })

    describe('Campos opcionais não devem lançar erro', () => {
      it('deve permitir criar customer sem CPF', async () => {
        // Arrange
        const customer = CreateTestCustomer({ cpf: undefined })
        const password = Password.hydrate('MinhaSenh@123')

        // Act
        const result = await customerRepository.create(customer, password)

        // Assert
        expect(result).toEqual(customer)
        expect(result.cpf).toBeUndefined()
      })

      it('deve permitir criar customer sem cartão estudantil', async () => {
        // Arrange
        const customer = CreateTestCustomer({ studentCard: undefined })
        const password = Password.hydrate('MinhaSenh@123')

        // Act
        const result = await customerRepository.create(customer, password)

        // Assert
        expect(result).toEqual(customer)
        expect(result.studentCard).toBeUndefined()
      })
    })
  })

  describe('Testes de Performance', () => {
    describe('Deve usar índices para buscas por email e CPF', () => {
      it('deve executar busca por email rapidamente', async () => {
        // Arrange
        const customers = Array.from({ length: 10 }, () => CreateTestCustomer())
        const password = Password.hydrate('MinhaSenh@123')

        for (const customer of customers) {
          await customerRepository.create(customer, password)
        }

        const targetCustomer = customers[5]

        // Act
        const startTime = Date.now()
        const result = await customerRepository.findByEmail(targetCustomer.email)
        const endTime = Date.now()

        // Assert
        expect(result).not.toBeNull()
        expect(result?.uid.value).toBe(targetCustomer.uid.value)
        expect(endTime - startTime).toBeLessThan(100) // Menos de 100ms
      })

      it('deve executar verificação de CPF rapidamente', async () => {
        // Arrange
        const baseCPFs = [
          '11144477735',
          '22255588846',
          '33366699957',
          '44477700068',
          '55588811179',
          '66699922280',
          '77700033391',
          '88811144402',
          '99922255513',
          '10033366624',
        ]

        const customers = Array.from({ length: 10 }, (_, index) => CreateTestCustomer({ cpf: baseCPFs[index] }))
        const password = Password.hydrate('MinhaSenh@123')

        for (const customer of customers) {
          await customerRepository.create(customer, password)
        }

        const targetCPF = customers[5].cpf!

        // Act
        const startTime = Date.now()
        const result = await customerRepository.hasCPF(targetCPF)
        const endTime = Date.now()

        // Assert
        expect(result).toBe(true)
        expect(endTime - startTime).toBeLessThan(100) // Menos de 100ms
      })
    })
  })
})
