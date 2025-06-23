import { CredentialMapper } from './credential.mapper'
import { CustomerUID } from '@modules/customer/entity/value-object/customer.uid'
import { Password } from '@modules/customer/entity/value-object/password'
import { CredentialModel } from '../model/credential.model'
import { faker } from '@faker-js/faker'

describe('CredentialMapper', () => {
  const mapper = new CredentialMapper()

  describe('toModel', () => {
    it('deve mapear CustomerUID, Password, createdAt e updatedAt para CredentialModel', () => {
      // Arrange
      const uid = CustomerUID.create()
      const password = Password.hydrate(faker.internet.password())
      const createdAt = faker.date.past()
      const updatedAt = faker.date.recent()

      // Act
      const result = mapper.toModel(uid, password, createdAt, updatedAt)

      // Assert
      expect(result).toBeInstanceOf(CredentialModel)
      expect(result.customerUID).toBe(uid.unformattedValue)
      expect(result.passwordHash).toBe(password.value)
      expect(result.createdAt).toEqual(createdAt)
      expect(result.updatedAt).toEqual(updatedAt)
    })
  })
})
