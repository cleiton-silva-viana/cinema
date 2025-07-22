import { Injectable } from '@nestjs/common'
import { Password } from '../../entity/value-object/password'
import { CredentialModel } from '../model/credential.model'
import { CustomerUID } from '@modules/customer/entity/value-object/customer.uid'

/**
 * Classe responsável por mapear entre a entidade de domínio Credential e o modelo de persistência CredentialModel.
 */
@Injectable()
export class CredentialMapper {
  /**
   * Converte um CustomerUID, Password, createdAt e updatedAt para um CredentialModel (modelo de persistência).
   * @param uid - O CustomerUID do cliente.
   * @param password - A senha do cliente.
   * @param createdAt - A data de criação da credencial.
   * @param updatedAt - A data da última atualização da credencial.
   * @returns O modelo de persistência CredentialModel.
   */
  public toModel(uid: CustomerUID, password: Password, createdAt: Date, updatedAt: Date): CredentialModel {
    return new CredentialModel(uid.unformattedValue, password.value, createdAt, updatedAt)
  }
}
