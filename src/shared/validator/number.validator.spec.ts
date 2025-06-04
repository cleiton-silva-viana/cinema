import { FailureFactory } from '../failure/failure.factory'
import { FailureCode } from '../failure/failure.codes.enum'
import { SimpleFailure } from '../failure/simple.failure.type'
import { NumberValidator } from './number.validator'

describe('NumberValidator', () => {
  const MIN = 1
  const MAX = 10
  const FAILURE = FailureFactory.MISSING_VALID_ITEM('error gfor test')

  let failures: SimpleFailure[]

  beforeEach(() => (failures = []))

  describe('isInRange', () => {
    it('não deve adicionar falha quando o número estiver dentro do intervalo', () => {
      // Arrange
      const VALUE = 2

      // Act
      new NumberValidator({ valor: VALUE }, failures).isInRange(MIN, MAX)

      // Assert
      expect(failures).toHaveLength(0)
    })

    it('deve adicionar falha quando o número for menor que o mínimo', () => {
      // Arrange
      const VALUE = 0

      // Act
      new NumberValidator({ valor: VALUE }, failures).isInRange(MIN, MAX)

      // Assert
      expect(failures).toHaveLength(1)
      expect(failures[0].code).toBe(FailureCode.VALUE_OUT_OF_RANGE)
    })

    it('deve adicionar falha quando o número for maior que o máximo', () => {
      // Arrange
      const VALUE = 11

      // Act
      new NumberValidator({ valor: VALUE }, failures).isInRange(MIN, MAX)

      // Assert
      expect(failures).toHaveLength(1)
      expect(failures[0].code).toBe(FailureCode.VALUE_OUT_OF_RANGE)
    })

    it('deve usar falha personalizada', () => {
      // Arrange
      const VALUE = 11

      // Act
      new NumberValidator({ valor: VALUE }, failures).isInRange(MIN, MAX, () => FAILURE)

      // Assert
      expect(failures).toHaveLength(1)
      expect(failures[0]).toEqual(FAILURE)
    })
  })

  describe('isAtMost', () => {
    it('não deve adicionar falha quando o número for menor ou igual ao máximo', () => {
      // Arrange
      const value = 9

      // Act
      new NumberValidator({ valor: value }, failures).isAtMost(MAX)

      // Assert
      expect(failures).toHaveLength(0)
    })

    it('deve adicionar falha quando o número for maior que o máximo', () => {
      // Arrange
      const value = 11

      // Act
      new NumberValidator({ valor: value }, failures).isAtMost(MAX)

      // Assert
      expect(failures).toHaveLength(1)
      expect(failures[0].code).toBe(FailureCode.VALUE_GREATER_THAN_MAX)
    })

    it('deve usar o código de erro personalizado', () => {
      // Arrange
      const value = 11

      // Act
      new NumberValidator({ valor: value }, failures).isAtMost(MAX, () => FAILURE)

      // Assert
      expect(failures).toHaveLength(1)
      expect(failures[0]).toEqual(FAILURE)
    })
  })

  describe('isAtLeast', () => {
    it('não deve adicionar falha quando o número for maior ou igual ao mínimo', () => {
      // Arrange
      const value = 5

      // Act
      new NumberValidator({ value }, failures).isAtLeast(MIN)

      // Assert
      expect(failures).toHaveLength(0)
    })

    it('deve adicionar falha quando o número for menor que o mínimo', () => {
      // Arrange
      const value = 0

      // Act
      new NumberValidator({ value }, failures).isAtLeast(MIN)

      // Assert
      expect(failures).toHaveLength(1)
      expect(failures[0].code).toBe(FailureCode.VALUE_LESS_THAN_MIN)
    })

    it('deve usar o código de erro personalizado', () => {
      // Arrange
      const value = -1

      // Act
      new NumberValidator({ valor: value }, failures).isAtLeast(MIN, () => FAILURE)

      // Assert
      expect(failures).toHaveLength(1)
      expect(failures[0]).toEqual(FAILURE)
    })
  })

  describe('isPositive', () => {
    it('não deve adicionar falha quando o número for positivo', () => {
      // Arrange
      const value = 5

      // Act
      new NumberValidator({ value }, failures).isPositive()

      // Assert
      expect(failures).toHaveLength(0)
    })

    it('deve adicionar falha quando o número for zero', () => {
      // Arrange
      const value = 0

      // Act
      new NumberValidator({ valor: value }, failures).isPositive()

      // Assert
      expect(failures).toHaveLength(1)
      expect(failures[0].code).toBe(FailureCode.VALUE_CANNOT_BE_NEGATIVE)
    })

    it('deve adicionar falha quando o número for negativo', () => {
      // Arrange
      const value = -5

      // Act
      new NumberValidator({ value }, failures).isPositive()

      // Assert
      expect(failures).toHaveLength(1)
      expect(failures[0].code).toBe(FailureCode.VALUE_CANNOT_BE_NEGATIVE)
    })

    it('deve usar falha personalizada', () => {
      // Arrange
      const value = -5

      // Act
      new NumberValidator({ valor: value }, failures).isPositive(() => FAILURE)

      // Assert
      expect(failures).toHaveLength(1)
      expect(failures[0]).toEqual(FAILURE)
    })
  })

  describe('isNegative', () => {
    it('não deve adicionar falha quando o número for negativo', () => {
      // Arrange
      const value = -5

      // Act
      new NumberValidator({ valor: value }, failures).isNegative()

      // Assert
      expect(failures).toHaveLength(0)
    })

    it('deve adicionar falha quando o número for zero', () => {
      // Arrange
      const value = 0

      // Act
      new NumberValidator({ valor: value }, failures).isNegative()

      // Assert
      expect(failures).toHaveLength(1)
      expect(failures[0].code).toBe(FailureCode.VALUE_MUST_BE_NEGATIVE)
    })

    it('deve adicionar falha quando o número for positivo', () => {
      // Arrange
      const value = 5

      // Act
      new NumberValidator({ value }, failures).isNegative()

      // Assert
      expect(failures).toHaveLength(1)
      expect(failures[0].code).toBe(FailureCode.VALUE_MUST_BE_NEGATIVE)
    })

    it('deve usar falha personalizada', () => {
      // Arrange
      const value = 5

      // Act
      new NumberValidator({ valor: value }, failures).isNegative(() => FAILURE)

      // Assert
      expect(failures).toHaveLength(1)
      expect(failures[0]).toEqual(FAILURE)
    })
  })

  describe('isInteger', () => {
    it('não deve adicionar falha quando o número for inteiro', () => {
      // Arrange
      const value = 5

      // Act
      new NumberValidator({ value }, failures).isInteger()

      // Assert
      expect(failures).toHaveLength(0)
    })

    it('deve adicionar falha quando o número for decimal', () => {
      // Arrange
      const value = 5.5

      // Act
      new NumberValidator({ value }, failures).isInteger()

      // Assert
      expect(failures).toHaveLength(1)
      expect(failures[0].code).toBe(FailureCode.VALUE_NOT_INTEGER)
    })

    it('deve usar falha personalizada', () => {
      // Arrange
      const value = 5.5

      // Act
      new NumberValidator({ valor: value }, failures).isInteger(() => FAILURE)

      // Assert
      expect(failures).toHaveLength(1)
      expect(failures[0]).toEqual(FAILURE)
    })
  })
})
