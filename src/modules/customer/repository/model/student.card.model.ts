import {Column, Entity, JoinColumn, OneToOne, PrimaryColumn} from 'typeorm'
import {CustomerModel} from './customer.model'

@Entity('student_card')
export class StudentCardModel {
    @PrimaryColumn({type: 'varchar', nullable: false, unique: true})
    public readonly uid: string

    @Column({type: 'varchar', nullable: false})
    public readonly registrationNumber: string

    @Column({type: 'varchar', nullable: false})
    public readonly institution: string

    @Column({type: 'datetime', nullable: false})
    public readonly expiresAt: Date

    @Column({type: 'datetime'})
    public readonly createdAt: Date

    @Column({type: 'datetime'})
    public readonly updatedAt: Date

    @OneToOne(() => CustomerModel, (customer) => customer.studentCard)
    @JoinColumn({name: 'customerUID'})
    public customer?: CustomerModel

    constructor(uid: string, number: string, institution: string, expiresAt: Date, createdAt: Date, updatedAt: Date) {
        this.uid = uid
        this.registrationNumber = number
        this.institution = institution
        this.expiresAt = expiresAt
        this.createdAt = createdAt
        this.updatedAt = updatedAt
    }
}
