import { Entity, PrimaryColumn, Column, OneToOne, Check } from 'typeorm'
import { StudentCardModel } from './student.card.model'
import { CredentialModel } from './credential.model'
import { CustomerStatusEnum } from '@modules/customer/enum/customer.status.enum'

@Entity('customer')
@Check('CHK_customer_name_length', 'LENGTH(name) >= 3')
export class CustomerModel {
  @PrimaryColumn({
    type: 'varchar',
    length: 36,
    nullable: false,
    unique: true,
    comment: 'UUID em formato v7 do cliente (sem o prefixo)',
  })
  public readonly uid: string

  @Column({
    type: 'varchar',
    length: 254,
    nullable: false,
    unique: true,
    comment: 'Email do cliente (máximo 254 caracteres conforme RFC)',
  })
  public readonly email: string

  @Column({
    type: 'varchar',
    length: 11,
    nullable: true,
    unique: true,
    comment: 'CPF sem formatação (somente números)',
  })
  public readonly cpf?: string

  @Column({
    type: 'varchar',
    length: 128,
    nullable: false,
    comment: 'Nome completo do cliente',
  })
  public readonly name: string

  @Column({
    type: 'date',
    nullable: false,
    comment: 'Data de nascimento',
  })
  public readonly birthDate: Date

  @Column({
    type: 'varchar',
    length: 20,
    default: CustomerStatusEnum.ACTIVE,
    nullable: false,
    comment: 'Status do cliente no sistema',
  })
  public readonly status: string

  @Column({
    type: 'datetime',
    nullable: false,
    comment: 'Data de criação do registro',
  })
  public readonly createdAt: Date

  @Column({
    type: 'datetime',
    nullable: false,
    comment: 'Data da última atualização',
  })
  public readonly updatedAt: Date

  @OneToOne(() => StudentCardModel, (studentCard) => studentCard.customer, {
    nullable: true,
    cascade: ['insert', 'update', 'remove'],
    onDelete: 'CASCADE',
  })
  public studentCard?: StudentCardModel | null

  @OneToOne(() => CredentialModel, (credential) => credential.customer, {
    cascade: ['insert', 'update', 'remove'],
    onDelete: 'CASCADE',
  })
  public credential?: CredentialModel

  constructor(
    uid: string,
    name: string,
    email: string,
    birthDate: Date,
    status: string,
    createdAt: Date,
    updatedAt: Date,
    cpf?: string
  ) {
    this.uid = uid
    this.name = name
    this.email = email
    this.birthDate = birthDate
    this.status = status
    this.createdAt = createdAt
    this.updatedAt = updatedAt
    this.cpf = cpf
  }
}
