import { faker } from '@faker-js/faker'
import { Person } from './person'
import { CreateTestPerson } from '@test/builder/person.builder'
import { FailureCode } from '@shared/failure/failure.codes.enum'

describe('Person', () => {
  const fullName = faker.person.firstName()
  const birthDate = faker.date.between({
    from: new Date(1940, 0, 1),
    to: new Date(2005, 0, 1),
  })

  describe('Static Methods', () => {
    describe('create', () => {
      it('deve criar uma pessoa válida', () => {
        // Act
        const result = Person.create(fullName, birthDate)

        // Assert
        expect(result).toBeValidResultMatching<Person>((p) => {
          expect(p.name.value).toBe(fullName)
          expect(p.birthDate.value.toISOString()).toEqual(birthDate.toISOString())
        })
      })

      it('deve falhar ao criar pessoa com nome inválido', () => {
        // Arrange
        const invalidName = ''

        // Act
        const result = Person.create(invalidName, birthDate)

        // Assert
        expect(result).toBeInvalidResult()
      })

      it('deve falhar ao criar pessoa com data de nascimento inválida', () => {
        // Arrange
        const futureDate = faker.date.soon({ days: 365 }) // data futura

        // Act
        const result = Person.create(fullName, futureDate)

        // Assert
        expect(result).toBeInvalidResult()
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
      let personInstance: Person

      beforeEach(() => {
        personInstance = CreateTestPerson({ name: fullName, birthDate })
      })

      it('deve atualizar o nome da pessoa', () => {
        // Arrange
        const newName = faker.person.firstName()

        // Act
        const result = personInstance.update({ name: newName })

        // Assert
        expect(result).toBeValidResultMatching<Person>((p) => {
          expect(p.name.value).toBe(newName)
          expect(p.birthDate.value).toEqual(birthDate)
          expect(p.uid).toEqual(personInstance.uid)
        })
      })

      it('deve atualizar a data de nascimento', () => {
        // Arrange
        const newDate = faker.date.between({
          from: new Date(1940, 0, 1),
          to: new Date(2005, 0, 1),
        })

        // Act
        const result = personInstance.update({ birthDate: newDate })

        // Assert
        expect(result).toBeValidResultMatching<Person>((p) => {
          expect(p.birthDate.value).toEqual(newDate)
          expect(p.name.value).toBe(fullName)
          expect(p.uid).toEqual(personInstance.uid)
        })
      })

      it('deve atualizar múltiplas propriedades simultaneamente', () => {
        // Arrange
        const newName = faker.person.firstName()
        const newDate = faker.date.between({
          from: new Date(1940, 0, 1),
          to: new Date(2005, 0, 1),
        })

        // Act
        const result = personInstance.update({ name: newName, birthDate: newDate })

        // Assert
        expect(result).toBeValidResultMatching<Person>((p) => {
          expect(p.name.value).toBe(newName)
          expect(p.birthDate.value).toEqual(newDate)
          expect(p.uid).toEqual(personInstance.uid)
        })
      })

      it('deve falhar ao atualizar o nome para inválido', () => {
        // Arrange
        const invalidName = ''

        // Act
        const result = personInstance.update({ name: invalidName })

        // Assert
        expect(result).toBeInvalidResult()
      })

      it('deve falhar ao atualizar para data de nascimento inválida', () => {
        // Arrange
        const invalidDate = faker.date.soon({ days: 365 }) // data futura

        // Act
        const result = personInstance.update({ birthDate: invalidDate })

        // Assert
        expect(result).toBeInvalidResult()
      })

      it('deve falhar quando props for null', () => {
        // Act
        const result = personInstance.update(null as any)

        // Assert
        expect(result).toBeInvalidResultWithSingleFailure(FailureCode.MISSING_REQUIRED_DATA)
      })

      it('deve manter os valores originais quando nenhuma propriedade for fornecida', () => {
        // Act
        const result = personInstance.update({})

        // Assert
        expect(result).toBeValidResultMatching<Person>((p) => {
          expect(p.name.value).toBe(fullName)
          expect(p.birthDate.value).toEqual(birthDate)
          expect(p.uid).toEqual(personInstance.uid)
        })
      })
    })
  })
})
