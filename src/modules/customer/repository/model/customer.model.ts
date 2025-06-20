import { Entity, PrimaryColumn, Column, OneToOne } from 'typeorm'
import { StudentCardModel } from './student.card.model'

@Entity('customer')
export class CustomerModel {
  @PrimaryColumn({ type: 'varchar', nullable: false, unique: true })
  public readonly uid: string

  @Column({ type: 'varchar', unique: true })
  public readonly email: string

  @Column({ type: 'char', length: 11, unique: true, nullable: true })
  public readonly cpf?: string

  @Column({ type: 'varchar' })
  public readonly name: string

  @Column({ type: 'date' })
  public readonly birthDate: Date

  @Column({ type: 'datetime' })
  public readonly createdAt: Date

  @Column({ type: 'datetime' })
  public readonly updatedAt: Date

  @OneToOne(() => StudentCardModel, (studentCard) => studentCard.customer, {
    nullable: true,
    cascade: true, // Permite operações em cascata
  })
  public studentCard?: StudentCardModel

  constructor(
    uid: string,
    name: string,
    email: string,
    birthDate: Date,
    createdAt: Date,
    updatedAt: Date,
    cpf?: string
  ) {
    this.uid = uid
    this.name = name
    this.email = email
    this.birthDate = birthDate
    this.createdAt = createdAt
    this.updatedAt = updatedAt
    this.cpf = cpf
  }
}
