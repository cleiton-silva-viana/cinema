import { v4 } from 'uuid'
import { faker } from '@faker-js/faker/locale/pt_PT'
import { PersonApplicationService } from './person.application.service'
import { Person } from '../entity/person'
import { PersonUID } from '../entity/value-object/person.uid'
import { IPersonRepository } from '../repository/person.repository.interface'
import { FailureCode } from '@shared/failure/failure.codes.enum'
import { CloneTestPersonWithOverrides, CreateTestPerson } from '@test/builder/person.builder'

describe('PersonService', () => {
  let repository: jest.Mocked<IPersonRepository>
  let service: PersonApplicationService
  let validPerson: Person

  beforeEach(() => {
    repository = {
      findById: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<IPersonRepository>

    service = new PersonApplicationService(repository)
    validPerson = CreateTestPerson()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('findById', () => {
    it('deve retornar a pessoa se encontrada', async () => {
      // Arrange
      repository.findById.mockResolvedValue(validPerson)

      // Act
      const result = await service.findById(validPerson.uid.value)

      // Assert
      expect(result).toBeValidResultWithValue(validPerson)
    })

    it('deve retornar falha se uid for inválido', async () => {
      // Act
      const result = await service.findById('INVALID-UID')

      // Assert
      expect(result).toBeInvalidResult()
    })

    it('deve retornar falha se pessoa não encontrada', async () => {
      // Arrange
      repository.findById.mockResolvedValue(undefined as any)
      const uid = PersonUID.create().value

      // Act
      const result = await service.findById(uid)

      // Assert
      expect(result).toBeInvalidResultWithSingleFailure(FailureCode.RESOURCE_NOT_FOUND)
    })
  })

  describe('create', () => {
    it('deve criar uma pessoa válida', async () => {
      // Arrange
      const name = 'JOSE JOSE'
      const birthDate = faker.date.birthdate()
      const instance = Person.hydrate(v4(), name, birthDate)

      repository.save.mockResolvedValue(instance)

      // Act
      const result = await service.create(name, birthDate)

      // Assert
      expect(repository.save).toHaveBeenCalledTimes(1)
      expect(result).toBeValidResultMatching<Person>((p) => {
        expect(p.name.value).toBe(name)
        expect(p.birthDate.value).toEqual(birthDate)
      })
    })

    it('deve retornar falha se dados inválidos', async () => {
      // Act
      const result = await service.create('', new Date())

      // Assert
      expect(repository.save).not.toHaveBeenCalled()
      expect(result).toBeInvalidResult()
    })
  })

  describe('update', () => {
    it('deve atualizar nome e data de nascimento', async () => {
      // Arrange
      const person = CreateTestPerson()
      const newName = faker.person.fullName()
      const newBirth = faker.date.birthdate()
      const updatedPerson = CloneTestPersonWithOverrides(person, { name: newName, birthDate: newBirth })
      repository.findById.mockResolvedValue(person)
      repository.update.mockResolvedValue(updatedPerson)

      // Act
      const result = await service.update(person.uid.value, newName, newBirth)

      // Assert
      expect(repository.findById).toHaveBeenCalledTimes(1)
      expect(repository.findById).toHaveBeenCalledWith(person.uid)
      expect(repository.update).toHaveBeenCalledTimes(1)
      expect(result).toBeValidResultMatching<Person>((p) => {
        expect(p.name.value).toBe(newName)
        expect(p.birthDate.value).toEqual(newBirth)
      })
    })

    it('deve retornar falha se uid inválido', async () => {
      // Act
      const result = await service.update('INVALID', 'Nome', new Date())

      // Assert
      expect(repository.update).not.toHaveBeenCalled()
      expect(result).toBeInvalidResult()
    })

    it('deve retornar falha se pessoa não encontrada', async () => {
      // Arrange
      repository.findById.mockResolvedValue(null as any)
      const uid = PersonUID.create()

      // Act
      const result = await service.update(uid.value, faker.person.firstName(), new Date())

      // Assert
      expect(repository.findById).toHaveBeenCalledTimes(1)
      expect(repository.findById).toHaveBeenCalledWith(uid)
      expect(repository.update).not.toHaveBeenCalled()
      expect(result).toBeInvalidResultWithSingleFailure(FailureCode.RESOURCE_NOT_FOUND)
    })

    it('deve retornar falha se atualização inválida', async () => {
      // Arrange
      repository.findById.mockResolvedValue(validPerson)
      const uid = PersonUID.create().value

      // Act
      const result = await service.update(uid, '3#@$#@vd', new Date())

      // Assert
      expect(result.isInvalid()).toBeTruthy()
      expect(repository.findById).toHaveBeenCalledTimes(1)
      expect(repository.update).not.toHaveBeenCalled()
    })
  })

  describe('delete', () => {
    it('deve deletar com sucesso o recurso', async () => {
      // Arrange
      repository.findById.mockResolvedValue(validPerson)
      repository.delete.mockResolvedValue(null)

      // Act
      const result = await service.delete(validPerson.uid.value)

      // Assert
      expect(result.isValid()).toBeTruthy()
      expect(repository.findById).toHaveBeenCalledTimes(1)
      expect(repository.delete).toHaveBeenCalledTimes(1)
    })

    it('deve retornar falha se recurso não encontrado', async () => {
      // Arrange
      repository.findById.mockResolvedValue(null as any)

      // Act
      const result = await service.delete(validPerson.uid.value)

      // Assert
      expect(repository.delete).not.toHaveBeenCalled()
      expect(repository.findById).toHaveBeenCalledWith(validPerson.uid)
      expect(repository.findById).toHaveBeenCalledTimes(1)
      expect(result).toBeInvalidResultWithSingleFailure(FailureCode.RESOURCE_NOT_FOUND)
    })
  })
})
