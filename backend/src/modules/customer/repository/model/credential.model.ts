import { Column, Entity, Index, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm'
import { CustomerModel } from '@modules/customer/repository/model/customer.model'

/**
 * @class CredentialModel
 * @description Representa o modelo de credencial do cliente no banco de dados.
 *              Armazena o hash da senha e está relacionado um-para-um com o CustomerModel.
 */
@Entity('customer_credential')
@Index(['customerUID'])
export class CredentialModel {
  /**
   * @property {string} customerUID - O UID do cliente, que também é a chave primária e estrangeira.
   */
  @PrimaryColumn({
    type: 'varchar',
    length: 36,
    nullable: false,
    comment: 'UUID v7 do cliente sem o prefixo (chave estrangeira)',
  })
  public readonly customerUID: string

  /**
   * @property {string} passwordHash - O hash da senha do cliente.
   */
  @Column({
    type: 'varchar',
    length: 128,
    nullable: false,
    comment: 'Hash bcrypt da senha (máximo 128 caracteres)',
  })
  public readonly passwordHash: string

  /**
   * @property {Date} createdAt - A data e hora de criação da credencial.
   */
  @Column({
    type: 'datetime',
    nullable: false,
    comment: 'Data de criação da credencial',
  })
  public readonly createdAt: Date

  /**
   * @property {Date} updatedAt - A data e hora da última atualização da credencial.
   */
  @Column({
    type: 'datetime',
    nullable: false,
    comment: 'Data da última atualização da credencial',
  })
  public readonly updatedAt: Date

  /**
   * @property {Promise<CustomerModel>} customer - Relação um-para-um com o CustomerModel.
   *                                             Carregamento lazy para evitar carregamento automático.
   */
  @OneToOne(() => CustomerModel, {
    lazy: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({
    name: 'customerUID',
    foreignKeyConstraintName: 'FK_credential_customer',
  })
  public customer?: Promise<CustomerModel>

  /**
   * @constructor
   * @param {string} customerUID - O UID do cliente.
   * @param {string} passwordHash - O hash da senha.
   * @param {Date} createdAt - A data de criação.
   * @param {Date} updatedAt - A data de atualização.
   */
  constructor(customerUID: string, passwordHash: string, createdAt: Date, updatedAt: Date) {
    this.customerUID = customerUID
    this.passwordHash = passwordHash
    this.createdAt = createdAt
    this.updatedAt = updatedAt
  }
}
