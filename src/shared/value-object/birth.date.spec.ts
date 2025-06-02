import { BirthDate } from './birth.date'
import { TechnicalError } from '../error/technical.error'
import { FailureCode } from '../failure/failure.codes.enum'
import { validateAndCollect } from '../validator/common.validators'
import { SimpleFailure } from '../failure/simple.failure.type'

describe('BirthDate', () => {
  const originalDateNow = Date.now

  beforeAll(() => {
    global.Date.now = jest.fn(() => new Date(2023, 0, 1).getTime())
  })

  afterAll(() => {
    global.Date.now = originalDateNow
  })

  describe('create', () => {
    let failures: SimpleFailure[]

    beforeEach(() => {
      failures = []
    })

    describe('deve criar um objeto válido', () => {
      const successCases = [
        {
          date: new Date(1990, 0, 1),
          scenario: 'com data de 1990',
        },
        {
          date: new Date(1980, 5, 15),
          scenario: 'com data de 1980',
        },
        {
          date: new Date(2000, 11, 31),
          scenario: 'com data de 2000',
        },
      ]

      successCases.forEach(({ date, scenario }) => {
        it(`objeto BirthDate ${scenario}`, () => {
          // Act
          const result = validateAndCollect(BirthDate.create(date), failures)

          // Assert
          expect(result).toBeDefined()
          expect(result.value.getTime()).toBe(date.getTime())
        })
      })
    })

    describe('deve falhar ao criar um objeto inválido', () => {
      const minAge = 18
      const minBirthDate = new Date()
      minBirthDate.setFullYear(minBirthDate.getFullYear() - minAge)

      const failureCases = [
        {
          date: new Date(1899, 0, 0, 0, 0, 0, 0),
          scenario: 'quando a data de nascimento é anterior a 1900',
          errorCodeExpected: FailureCode.DATE_NOT_AFTER_LIMIT,
        },
        {
          date: new Date(),
          scenario: 'quando a pessoa tem menos de 18 anos',
          errorCodeExpected: FailureCode.DATE_NOT_BEFORE_LIMIT,
        },
      ]

      failureCases.forEach(({ date, scenario, errorCodeExpected }) => {
        it(`objeto BirthDate ${scenario}`, () => {
          // Act
          const result = validateAndCollect(BirthDate.create(date), failures)

          // Assert
          expect(result).toBeNull()
          expect(failures).toHaveLength(1)
          expect(failures[0].code).toBe(errorCodeExpected)
        })
      })
    })

    it('deve falhar quando for passado um valor nulo ou indefinido para a data', () => {
      // Arrange
      const invalidValues: any[] = [null, undefined]

      // Act
      for (const date of invalidValues) {
        const result = validateAndCollect(BirthDate.create(date), failures)

        // Assert
        expect(result).toBeNull()
        expect(failures[0].code).toBe(FailureCode.MISSING_REQUIRED_DATA)
      }
    })
  })

  describe('hydrate', () => {
    it('deve criar um objeto BirthDate sem validação', () => {
      // Arrange
      const birthDate = new Date(1990, 0, 1)

      // Act
      const result = BirthDate.hydrate(birthDate)

      // Assert
      expect(result).toBeInstanceOf(BirthDate)
      expect(result.value.toISOString()).toBe(birthDate.toISOString())
    })

    it('deve lançar um erro quando a data de nascimento é nula ou indefinida', () => {
      // Arrange
      const values: Array<Date> = [null as any, undefined as any]

      // Act & Assert
      values.forEach((value) => {
        expect(() => BirthDate.hydrate(value)).toThrow(TechnicalError)
      })
    })
  })

  describe('equal', () => {
    it('deve retornar verdadeiro quando as datas de nascimento são iguais', () => {
      // Arrange
      const birthDate = new Date(1990, 0, 1)
      const result1 = BirthDate.hydrate(birthDate)
      const result2 = BirthDate.hydrate(birthDate)

      // Assert
      expect(result1.equal(result2)).toBe(true)
    })

    it('deve retornar falso quando as datas de nascimento são diferentes', () => {
      // Arrange
      const result1 = BirthDate.hydrate(new Date(1990, 0, 1))
      const result2 = BirthDate.hydrate(new Date(1991, 0, 1))

      // Assert
      expect(result1.equal(result2)).toBe(false)
    })

    it('deve retornar falso quando comparado com null', () => {
      // Arrange
      const result = BirthDate.hydrate(new Date(1990, 0, 1))

      // Assert
      expect(result.equal(null as unknown as BirthDate)).toBe(false)
    })

    it('deve retornar falso quando comparado com um objeto que não é BirthDate', () => {
      // Arrange
      const result = BirthDate.hydrate(new Date(1990, 0, 1))
      const notBirthDateObject = { value: new Date(1990, 0, 1) }

      // Assert
      expect(result.equal(notBirthDateObject as unknown as BirthDate)).toBe(false)
    })
  })
})
