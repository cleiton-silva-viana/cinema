import { v4 } from 'uuid'
import { faker } from '@faker-js/faker/locale/pt_PT'
import { Person } from './person'
import { SimpleFailure } from '@shared/failure/simple.failure.type'
import { validateAndCollect } from '@shared/validator/common.validators'

describe('Person', () => {
  const fullName = faker.person.firstName()
  const birthDate = faker.date.between({
    from: new Date(1940, 0, 1),
    to: new Date(2005, 0, 1),
  })

  describe('Static Methods', () => {
    describe('create', () => {
      let failures: SimpleFailure[]

      beforeEach(() => {
        failures = []
      })

      it('deve criar uma pessoa válida', () => {
        // Act
        const result = validateAndCollect(Person.create(fullName, birthDate), failures)

        // Assert
        expect(result).toBeDefined()
        expect(result.name.value).toBe(fullName)
        expect(result.birthDate.value.toISOString()).toEqual(birthDate.toISOString())
      })

      it('deve falhar ao criar pessoa com nome inválido', () => {
        // Arrange
        const invalidName = ''

        // Act
        const result = validateAndCollect(Person.create(invalidName, birthDate), failures)

        // Assert
        expect(result).toBeNull()
        expect(failures).toHaveLength(1)
      })

      it('deve falhar ao criar pessoa com data de nascimento inválida', () => {
        // Arrange
        const futureDate = faker.date.soon({ days: 365 }) // data futura

        // Act
        const result = validateAndCollect(Person.create(fullName, futureDate), failures)

        // Assert
        expect(result).toBeNull()
        expect(failures.length).toBeGreaterThan(0)
      })
    })

    describe('hydrate', () => {
      it('deve hidratar uma pessoa corretamente', () => {
        // Arrange
        const uid = 'PRSN.' + faker.string.alphanumeric(8)

        // Act
        const person = Person.hydrate(uid, fullName, birthDate)

        // Assert
        expect(person.uid.value).toBe(uid)
        expect(person.name.value).toBe(fullName)
        expect(person.birthDate.value).toEqual(birthDate)
      })
    })
  })

  describe('Instance Methods', () => {
    describe('update', () => {
      let failures: SimpleFailure[]
      let personInstance: Person

      beforeEach(() => {
        failures = []
        personInstance = Person.hydrate(v4(), fullName, birthDate)
      })

      it('deve atualizar o nome da pessoa', () => {
        // Arrange
        const newName = faker.person.fullName()

        // Act
        const result = validateAndCollect(personInstance.update({ name: newName }), failures)

        // Assert
        expect(result).toBeDefined()
        expect(result.name.value).toBe(newName)
        expect(result.birthDate.value).toEqual(birthDate)
        expect(result.uid).toEqual(personInstance.uid)
      })

      it('deve atualizar a data de nascimento', () => {
        // Arrange
        const newDate = faker.date.between({
          from: new Date(1940, 0, 1),
          to: new Date(2005, 0, 1),
        })

        // Act
        const result = validateAndCollect(personInstance.update({ birthDate: newDate }), failures)

        // Assert
        expect(result).toBeDefined()
        expect(result.birthDate.value).toEqual(newDate)
        expect(result.name.value).toBe(fullName)
        expect(result.uid).toEqual(personInstance.uid)
      })

      it('deve atualizar múltiplas propriedades simultaneamente', () => {
        // Arrange
        const newName = faker.person.fullName()
        const newDate = faker.date.between({
          from: new Date(1940, 0, 1),
          to: new Date(2005, 0, 1),
        })

        // Act
        const result = validateAndCollect(personInstance.update({ name: newName, birthDate: newDate }), failures)

        // Assert
        expect(result).toBeDefined()
        expect(result.name.value).toBe(newName)
        expect(result.birthDate.value).toEqual(newDate)
        expect(result.uid).toEqual(personInstance.uid)
      })

      it('deve falhar ao atualizar o nome para inválido', () => {
        // Arrange
        const invalidName = ''

        // Act
        const result = validateAndCollect(personInstance.update({ name: invalidName }), failures)

        // Assert
        expect(result).toBeNull()
        expect(failures.length).toBeGreaterThan(0)
        expect(personInstance.name.value).toBe(fullName)
        expect(personInstance.birthDate.value.toISOString()).toBe(birthDate.toISOString())
      })

      it('deve falhar ao atualizar para data de nascimento inválida', () => {
        // Arrange
        const invalidDate = faker.date.soon({ days: 365 }) // data futura

        // Act
        const result = validateAndCollect(personInstance.update({ birthDate: invalidDate }), failures)

        // Assert
        expect(result).toBeNull()
        expect(failures.length).toBeGreaterThan(0)
        expect(personInstance.birthDate.value.toISOString()).toEqual(birthDate.toISOString())
      })

      it('deve falhar quando props for null', () => {
        // Act
        const result = validateAndCollect(personInstance.update(null as any), failures)

        // Assert
        expect(result).toBeNull()
        expect(failures[0].code).toBe('MISSING_REQUIRED_DATA')
      })

      it('deve manter os valores originais quando nenhuma propriedade for fornecida', () => {
        // Act
        const result = validateAndCollect(personInstance.update({}), failures)

        // Assert
        expect(result).toBeDefined()
        expect(result.name.value).toBe(fullName)
        expect(result.birthDate.value).toEqual(birthDate)
        expect(result.uid).toEqual(personInstance.uid)
      })
    })
  })
})
