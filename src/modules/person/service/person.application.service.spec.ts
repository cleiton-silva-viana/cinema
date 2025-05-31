import { v4 } from 'uuid'
import { faker } from '@faker-js/faker/locale/pt_PT'
import { PersonApplicationService } from './person.application.service'
import { Person } from '../entity/person'
import { PersonUID } from '../entity/value-object/person.uid'
import { IPersonRepository } from '../repository/person.repository.interface'
import { FailureCode } from '@shared/failure/failure.codes.enum'
import { SimpleFailure } from '@shared/failure/simple.failure.type'
import { validateAndCollect } from '@shared/validator/common.validators'
import {CreateTestPerson} from "@test/builder/person.builder";

describe('PersonService', () => {
  let repository: jest.Mocked<IPersonRepository>
  let service: PersonApplicationService
  let validPerson: Person
  let failures: SimpleFailure[]

  beforeEach(() => {
    failures = []
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
      const result = validateAndCollect(await service.findById(validPerson.uid.value), failures)

      // Assert
      expect(result).toBeDefined()
      expect(result).toBe(validPerson)
    })

    it('deve retornar falha se uid for inválido', async () => {
      // Act
      const result = validateAndCollect(await service.findById('INVALID-UID'), failures)

      // Assert
      expect(result).toBeNull()
      expect(failures.length).toBeGreaterThan(0)
    })

    it('deve retornar falha se pessoa não encontrada', async () => {
      // Arrange
      repository.findById.mockResolvedValue(undefined as any)
      const uid = PersonUID.create().value

      // Act
      const result = validateAndCollect(await service.findById(uid), failures)

      // Assert
      expect(result).toBeNull()
      expect(failures[0].code).toBe(FailureCode.RESOURCE_NOT_FOUND)
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
      const result = validateAndCollect(await service.create(name, birthDate), failures)

      // Assert
      expect(result).toBeDefined()
      expect(result.name.value).toBe(name)
      expect(result.birthDate.value).toEqual(birthDate)
      expect(repository.save).toHaveBeenCalledTimes(1)
    })

    it('deve retornar falha se dados inválidos', async () => {
      // Act
      const result = validateAndCollect(await service.create('', new Date()), failures)

      // Assert
      expect(result).toBeNull()
      expect(failures.length).toBeGreaterThan(0)
      expect(repository.save).not.toHaveBeenCalled()
    })
  })

  describe('update', () => {
    it('deve atualizar nome e data de nascimento', async () => {
      // Arrange
      const originalName = 'Nome Original'
      const originalBirthDate = new Date('1990-01-01')
      const person = Person.hydrate(PersonUID.create().value, originalName, originalBirthDate)
      const newName = faker.person.fullName()
      const newBirth = faker.date.birthdate()
      const updatedPerson = Person.hydrate(person.uid.value, newName, newBirth)
      repository.findById.mockResolvedValue(person)
      repository.update.mockResolvedValue(updatedPerson)

      // Act
      const result = validateAndCollect(await service.update(person.uid.value, newName, newBirth), failures)

      // Assert
      expect(result).toBeDefined()
      expect(result.name.value).toBe(newName)
      expect(result.birthDate.value).toEqual(newBirth)
      expect(repository.findById).toHaveBeenCalledTimes(1)
      expect(repository.update).toHaveBeenCalledTimes(1)
    })

    it('deve retornar falha se uid inválido', async () => {
      // Act
      const result = validateAndCollect(await service.update('INVALID', 'Nome', new Date()), failures)

      // Assert
      expect(result).toBeNull()
      expect(failures.length).toBeGreaterThan(0)
      expect(repository.update).not.toHaveBeenCalled()
    })

    it('deve retornar falha se pessoa não encontrada', async () => {
      // Arrange
      repository.findById.mockResolvedValue(null as any)
      const uid = PersonUID.create().value

      // Act
      const result = validateAndCollect(await service.update(uid, faker.person.firstName(), new Date()), failures)

      // Assert
      expect(result).toBeNull()
      expect(failures[0].code).toBe(FailureCode.RESOURCE_NOT_FOUND)
      expect(repository.findById).toHaveBeenCalledTimes(1)
      expect(repository.update).not.toHaveBeenCalled()
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

    it('deve retornar falha se não for fornecido nenhuma propriedade para atualização', async () => {
      // Arrange
      repository.findById.mockResolvedValue(validPerson)
      const uid = PersonUID.create().value

      // Act
      const result = await service.update(uid, null as any, null as any)

      // Assert
      expect(result.isInvalid()).toBeTruthy()
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
      const result = validateAndCollect(await service.delete(validPerson.uid.value), failures)

      // Assert
      expect(failures[0].code).toBe(FailureCode.RESOURCE_NOT_FOUND)
      expect(repository.delete).not.toHaveBeenCalled()
    })
  })
})
