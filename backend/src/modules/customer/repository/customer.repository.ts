import { Injectable, Inject } from '@nestjs/common'
import { CustomerModel } from './model/customer.model'
import { CredentialModel } from './model/credential.model'
import { StudentCardModel } from './model/student.card.model'
import { Customer } from '../entity/customer'
import { CustomerUID } from '../entity/value-object/customer.uid'
import { Email } from '../entity/value-object/email'
import { CPF } from '../entity/value-object/cpf'
import { Password } from '../entity/value-object/password'
import { CustomerMapper } from './mapper/customer.mapper'
import { DataSource, EntityManager, Repository, LessThan } from 'typeorm'
import { CredentialMapper } from '@modules/customer/repository/mapper/credential.mapper'
import { CREDENTIAL_MAPPER, CUSTOMER_MAPPER } from '@modules/customer/constant/customer.constants'
import { InjectRepository } from '@nestjs/typeorm'
import { ICustomerRepository } from '@modules/customer/repository/customer.repository.interface'
import { CustomerStatusEnum } from '@modules/customer/enum/customer.status.enum'

@Injectable()
export class CustomerRepository implements ICustomerRepository {
  constructor(
    @InjectRepository(CustomerModel)
    private readonly repository: Repository<CustomerModel>,
    @Inject(CUSTOMER_MAPPER)
    private readonly customerMapper: CustomerMapper,
    @Inject(CREDENTIAL_MAPPER)
    private readonly credentialMapper: CredentialMapper,
    private readonly dataSource: DataSource
  ) {}

  /**
   * Verifica se já existe um cliente cadastrado com o email fornecido
   * @param email Email a ser verificado
   * @returns true se o email já existe, false caso contrário
   */
  public async hasEmail(email: Email): Promise<boolean> {
    const count = await this.repository.count({
      where: { email: email.value },
    })

    return count > 0
  }

  /**
   * Verifica se já existe um cliente cadastrado com o CPF fornecido
   * @param cpf CPF a ser verificado
   * @returns true se o CPF já existe, false caso contrário
   */
  public async hasCPF(cpf: CPF): Promise<boolean> {
    const count = await this.repository.count({
      where: { cpf: cpf.unformattedValue },
    })

    return count > 0
  }

  /**
   * Verifica se já existe um cliente cadastrado com o número de matrícula estudantil fornecido
   * @param registrationNumber Número de matrícula a ser verificado
   * @returns true se o número de matrícula já existe, false caso contrário
   */
  public async hasStudentCard(registrationNumber: string): Promise<boolean> {
    const count = await this.repository.count({
      where: {
        studentCard: {
          registrationNumber: registrationNumber,
        },
      },
      relations: ['studentCard'],
    })

    return count > 0
  }

  /**
   * Busca um cliente pelo seu identificador único
   * @param uid Identificador único do cliente
   * @returns Cliente encontrado ou null se não existir
   */
  public async findById(uid: CustomerUID): Promise<Customer | null> {
    const model = await this.repository.findOne({
      where: { uid: uid.unformattedValue },
      relations: ['studentCard'],
    })

    return model ? this.customerMapper.toDomain(model) : null
  }

  /**
   * Busca um cliente pelo seu email
   * @param email Email do cliente
   * @returns Cliente encontrado ou null se não existir
   */
  public async findByEmail(email: Email): Promise<Customer | null> {
    const model = await this.repository.findOne({
      where: { email: email.value },
      relations: ['studentCard'],
    })

    return model ? this.customerMapper.toDomain(model) : null
  }

  /**
   * Cria um novo cliente no sistema
   * @param customer Dados do cliente a ser criado
   * @param password Senha do cliente
   * @returns Cliente criado
   */
  public async create(customer: Customer, password: Password): Promise<Customer> {
    const { customerModel, studentCardModel } = this.customerMapper.toModel(customer)
    const credentialModel = this.credentialMapper.toModel(
      customer.uid,
      password,
      customer.createdAt,
      customer.updatedAt
    )

    await this.dataSource.transaction(async (transactionalEntityManager: EntityManager) => {
      await transactionalEntityManager.save(CustomerModel, customerModel)
      await transactionalEntityManager.save(CredentialModel, credentialModel)
      if (studentCardModel) await transactionalEntityManager.save(StudentCardModel, studentCardModel)
    })

    return customer
  }

  /**
   * Atualiza os dados de um cliente existente
   * @param uid Identificador único do cliente
   * @param overrides Dados a serem atualizados
   * @returns Cliente atualizado ou null se não encontrado
   */
  public async update(uid: CustomerUID, overrides: Partial<Customer>): Promise<Customer | null> {
    const customer = await this.repository.findOne({
      where: { uid: uid.unformattedValue },
      relations: ['studentCard'],
    })

    if (!customer) {
      return null
    }

    const updatedModel = this.customerMapper.toPartialModel(customer, overrides)
    await this.repository.save(updatedModel)

    const refreshedModel = await this.repository.findOne({
      where: { uid: uid.unformattedValue },
      relations: ['studentCard'],
    })

    return refreshedModel ? this.customerMapper.toDomain(refreshedModel) : null
  }

  /**
   * Remove permanentemente um cliente do sistema (HARD DELETE).
   * ⚠️ OPERAÇÃO IRREVERSÍVEL - Use apenas para compliance LGPD/GDPR
   * @param uid UID do cliente a ser removido permanentemente
   * @returns Resultado da operação de delete
   */
  public async permanentlyDelete(uid: CustomerUID): Promise<{ affected: number }> {
    const result = await this.repository.delete({ uid: uid.unformattedValue })
    return { affected: result.affected || 0 }
  }

  /**
   * Busca clientes inativos desde uma data específica.
   * Usado para identificar clientes elegíveis para purge.
   * @param date Data de corte para buscar clientes inativos
   * @returns Lista de clientes inativos desde a data especificada
   */
  public async findInactiveCustomersSince(date: Date): Promise<Customer[]> {
    const models = await this.repository.find({
      where: {
        status: CustomerStatusEnum.INACTIVE,
        updatedAt: LessThan(date),
      },
      relations: ['studentCard'],
      order: {
        updatedAt: 'ASC',
      },
    })

    return models.map((model) => this.customerMapper.toDomain(model))
  }
}
