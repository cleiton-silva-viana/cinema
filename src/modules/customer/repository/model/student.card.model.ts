import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm'
import { CustomerModel } from './customer.model'

@Entity('student_card')
export class StudentCardModel {
  @PrimaryColumn({
    type: 'varchar',
    length: 36,
    nullable: false,
    unique: true,
    comment: 'UUID v7 do cliente sem prefixo (chave estrangeira)',
  })
  public readonly customerUID: string

  @Column({
    type: 'varchar',
    length: 24,
    nullable: false,
    unique: true,
    comment: 'Número de registro (6-24 caracteres)',
  })
  public readonly registrationNumber: string

  @Column({
    type: 'varchar',
    length: 100,
    nullable: false,
    comment: 'Nome da instituição de ensino (3-100 caracteres)',
  })
  public readonly institution: string

  @Column({
    type: 'date',
    nullable: false,
    comment: 'Data de expiração da carteira estudantil',
  })
  public readonly expiresAt: Date

  @OneToOne(() => CustomerModel, (customer) => customer.studentCard, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customerUID' })
  public customer?: CustomerModel

  constructor(customerUID: string, number: string, institution: string, expiresAt: Date) {
    this.customerUID = customerUID
    this.registrationNumber = number
    this.institution = institution
    this.expiresAt = expiresAt
  }
}
