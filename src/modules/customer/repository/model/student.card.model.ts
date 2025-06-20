import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm'
import { CustomerModel } from './customer.model'

@Entity('student_card')
export class StudentCardModel {
  @PrimaryColumn({ type: 'varchar', nullable: false, unique: true })
  public readonly customerUID: string

  @Column({ type: 'varchar', nullable: false, unique: true })
  public readonly registrationNumber: string

  @Column({ type: 'varchar', nullable: false })
  public readonly institution: string

  @Column({ type: 'datetime', nullable: false })
  public readonly expiresAt: Date

  @OneToOne(() => CustomerModel, (customer) => customer.studentCard)
  @JoinColumn({ name: 'customerUID' })
  public customer?: CustomerModel

  constructor(customerUID: string, number: string, institution: string, expiresAt: Date) {
    this.customerUID = customerUID
    this.registrationNumber = number
    this.institution = institution
    this.expiresAt = expiresAt
  }
}
