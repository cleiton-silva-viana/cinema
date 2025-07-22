import { Injectable } from '@nestjs/common'
import { Customer } from '../../entity/customer'
import { CustomerModel } from '@modules/customer/repository/model/customer.model'
import { IStudentCardCommand } from '@modules/customer/interface/customer.command.interface'
import { StudentCardModel } from '@modules/customer/repository/model/student.card.model'
import { CredentialModel } from '@modules/customer/repository/model/credential.model'

/**
 * @class CustomerMapper
 * @description Classe responsável por mapear entre a entidade de domínio Customer e o modelo de banco de dados CustomerModel.
 */
@Injectable()
export class CustomerMapper {
  /**
   * @method toDomain
   * @description Converte um CustomerModel (modelo de banco de dados) para uma entidade de domínio Customer.
   * @param {CustomerModel} model - O modelo CustomerModel a ser convertido.
   * @returns {Customer} A entidade de domínio Customer resultante.
   */
  public toDomain(model: CustomerModel): Customer {
    const card: IStudentCardCommand | undefined = model.studentCard
      ? {
          registrationNumber: model.studentCard.registrationNumber,
          institution: model.studentCard.institution,
          expirationDate: model.studentCard.expiresAt,
        }
      : undefined

    return Customer.hydrate({
      uid: model.uid,
      name: model.name,
      email: model.email,
      birthDate: model.birthDate,
      status: model.status,
      cpf: model.cpf,
      studentCard: card,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    })
  }

  /**
   * @method toModel
   * @description Converte uma entidade de domínio Customer para um CustomerModel e, opcionalmente, um StudentCardModel.
   * @param {Customer} customer - A entidade de domínio Customer a ser convertida.
   * @returns {{ customerModel: CustomerModel; studentCardModel: StudentCardModel | undefined; credentialModel?: CredentialModel }} Um objeto contendo o CustomerModel e, se aplicável, o StudentCardModel e o CredentialModel.
   */
  public toModel(customer: Customer): {
    customerModel: CustomerModel
    studentCardModel: StudentCardModel | undefined
    credentialModel?: CredentialModel
  } {
    const { uid, name, email, birthDate, status, cpf, studentCard, createdAt, updatedAt } = customer

    const customerModel = new CustomerModel(
      uid.unformattedValue,
      name.value,
      email.value,
      birthDate.value,
      status,
      createdAt,
      updatedAt,
      cpf?.unformattedValue
    )

    let studentCardModel: StudentCardModel | undefined
    if (studentCard) {
      studentCardModel = new StudentCardModel(
        customer.uid.value,
        studentCard.registrationNumber,
        studentCard.institution,
        studentCard.expirationDate
      )
      studentCardModel.customer = customerModel
    }

    return {
      customerModel,
      studentCardModel,
    }
  }

  /**
   * @method toPartialModel
   * @description Converte um Customer parcial para um CustomerModel, aplicando apenas as mudanças
   *              sobre um modelo existente. Usado para operações de update.
   * @param {CustomerModel} model - O modelo CustomerModel existente no banco de dados.
   * @param {Partial<Customer>} overrides - Um objeto Customer parcial com as propriedades a serem atualizadas.
   * @returns {CustomerModel} O CustomerModel atualizado com as mudanças aplicadas.
   */
  public toPartialModel(model: CustomerModel, overrides: Partial<Customer>): CustomerModel {
    let cpf

    if ('cpf' in overrides) {
      if (!overrides.cpf) cpf = undefined
      else cpf = overrides.cpf.unformattedValue
    } else {
      cpf = model.cpf
    }

    return new CustomerModel(
      model.uid,
      overrides.name?.value ?? model.name,
      overrides.email?.value ?? model.email,
      overrides.birthDate?.value ?? model.birthDate,
      overrides.status ?? model.status,
      model.createdAt,
      new Date(),
      cpf
    )
  }
}
