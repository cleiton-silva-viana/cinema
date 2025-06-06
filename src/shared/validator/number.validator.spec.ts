import { FailureCode } from '../failure/failure.codes.enum'
import { SimpleFailure } from '../failure/simple.failure.type'
import { NumberValidator } from './number.validator'

describe('NumberValidator', () => {
  const MIN = 1
  const MAX = 10

  describe('isInRange', () => {
    it('não deve adicionar falha quando o número estiver dentro do intervalo', () => {
      // Arrange
      const failures: SimpleFailure[] = []
      const VALUE = 2

      // Act
      new NumberValidator({ valor: VALUE }, failures).isInRange(MIN, MAX)

      // Assert
      expect(failures.length).toBe(0)
    })

    it('deve adicionar falha quando o número for menor que o mínimo', () => {
      // Arrange
      const failures: SimpleFailure[] = []
      const VALUE = 0

      // Act
      new NumberValidator({ valor: VALUE }, failures).isInRange(MIN, MAX)

      // Assert
      expect(failures.length).toBe(1)
      expect(failures[0].code).toBe(FailureCode.VALUE_OUT_OF_RANGE)
      expect(failures[0].details?.min_value).toBe(MIN)
      expect(failures[0].details?.max_value).toBe(MAX)
      expect(failures[0].details?.value).toBe(VALUE)
    })

    it('deve adicionar falha quando o número for maior que o máximo', () => {
      // Arrange
      const failures: SimpleFailure[] = []
      const VALUE = 11

      // Act
      new NumberValidator({ valor: VALUE }, failures).isInRange(MIN, MAX)

      // Assert
      expect(failures.length).toBe(1)
      expect(failures[0].code).toBe(FailureCode.VALUE_OUT_OF_RANGE)
      expect(failures[0].details?.min_value).toBe(MIN)
      expect(failures[0].details?.max_value).toBe(MAX)
      expect(failures[0].details?.value).toBe(VALUE)
    })

    it('deve usar o código de erro personalizado', () => {
      // Arrange
      const failures: SimpleFailure[] = []
      const VALUE = 11
      const code = FailureCode.CONTENT_WITH_INVALID_TYPE

      // Act
      new NumberValidator({ valor: VALUE }, failures).isInRange(MIN, MAX, code)

      // Assert
      expect(failures.length).toBe(1)
      expect(failures[0].code).toBe(code)
    })

    it('deve incluir detalhes adicionais na falha', () => {
      // Arrange
      const failures: SimpleFailure[] = []
      const VALUE = 11
      const details = { message: 'Valor fora do intervalo permitido' }

      // Act
      new NumberValidator({ valor: VALUE }, failures).isInRange(MIN, MAX, FailureCode.VALUE_OUT_OF_RANGE, details)

      // Assert
      expect(failures.length).toBe(1)
      expect(failures[0].details?.min_value).toBe(MIN)
      expect(failures[0].details?.max_value).toBe(MAX)
      expect(failures[0].details?.value).toBe(VALUE)
    })
  })

  describe('isAtMost', () => {
    it('não deve adicionar falha quando o número for menor ou igual ao máximo', () => {
      // Arrange
      const failures: SimpleFailure[] = []
      const value = 9

      // Act
      new NumberValidator({ valor: value }, failures).isAtMost(MAX)

      // Assert
      expect(failures.length).toBe(0)
    })

    it('deve adicionar falha quando o número for maior que o máximo', () => {
      // Arrange
      const failures: SimpleFailure[] = []
      const value = 11

      // Act
      new NumberValidator({ valor: value }, failures).isAtMost(MAX)

      // Assert
      expect(failures.length).toBe(1)
      expect(failures[0].code).toBe(FailureCode.VALUE_GREATER_THAN_MAX)
      expect(failures[0].details?.max_value).toBe(MAX)
      expect(failures[0].details?.value).toBe(value)
    })

    it('deve usar o código de erro personalizado', () => {
      // Arrange
      const failures: SimpleFailure[] = []
      const value = 11
      const code = FailureCode.CONTENT_WITH_INVALID_TYPE

      // Act
      new NumberValidator({ valor: value }, failures).isAtMost(MAX, code)

      // Assert
      expect(failures.length).toBe(1)
      expect(failures[0].code).toBe(code)
    })

    it('deve incluir detalhes adicionais na falha', () => {
      // Arrange
      const failures: SimpleFailure[] = []
      const value = 11
      const details = { message: 'Valor excede o máximo permitido' }

      // Act
      new NumberValidator({ valor: value }, failures).isAtMost(MAX, FailureCode.VALUE_GREATER_THAN_MAX, details)

      // Assert
      expect(failures.length).toBe(1)
      expect(failures[0].details?.max_value).toBe(MAX)
      expect(failures[0].details?.value).toBe(value)
    })
  })

  describe('isAtLeast', () => {
    it('não deve adicionar falha quando o número for maior ou igual ao mínimo', () => {
      // Arrange
      const failures: SimpleFailure[] = []
      const value = 5
      const min = 5

      // Act
      new NumberValidator({ valor: value }, failures).isAtLeast(min)

      // Assert
      expect(failures.length).toBe(0)
    })

    it('deve adicionar falha quando o número for menor que o mínimo', () => {
      // Arrange
      const failures: SimpleFailure[] = []
      const value = 4
      const min = 5

      // Act
      new NumberValidator({ valor: value }, failures).isAtLeast(min)

      // Assert
      expect(failures.length).toBe(1)
      expect(failures[0].code).toBe(FailureCode.VALUE_LESS_THAN_MIN)
      expect(failures[0].details?.min_value).toBe(min)
      expect(failures[0].details?.value).toBe(value)
    })

    it('deve usar o código de erro personalizado', () => {
      // Arrange
      const failures: SimpleFailure[] = []
      const value = 4
      const min = 5
      const code = FailureCode.CONTENT_WITH_INVALID_TYPE

      // Act
      new NumberValidator({ valor: value }, failures).isAtLeast(min, code)

      // Assert
      expect(failures.length).toBe(1)
      expect(failures[0].code).toBe(code)
    })

    it('deve incluir detalhes adicionais na falha', () => {
      // Arrange
      const failures: SimpleFailure[] = []
      const value = 4
      const min = 5
      const details = { message: 'Valor abaixo do mínimo permitido' }

      // Act
      new NumberValidator({ valor: value }, failures).isAtLeast(min, FailureCode.VALUE_LESS_THAN_MIN, details)

      // Assert
      expect(failures.length).toBe(1)
      expect(failures[0].details?.min_value).toBe(min)
      expect(failures[0].details?.value).toBe(value)
    })
  })

  describe('isPositive', () => {
    it('não deve adicionar falha quando o número for positivo', () => {
      // Arrange
      const failures: SimpleFailure[] = []
      const value = 5

      // Act
      new NumberValidator({ valor: value }, failures).isPositive()

      // Assert
      expect(failures.length).toBe(0)
    })

    it('deve adicionar falha quando o número for zero', () => {
      // Arrange
      const failures: SimpleFailure[] = []
      const value = 0

      // Act
      new NumberValidator({ valor: value }, failures).isPositive()

      // Assert
      expect(failures.length).toBe(1)
      expect(failures[0].code).toBe(FailureCode.VALUE_NOT_POSITIVE)
      expect(failures[0].details?.value).toBe(value)
    })

    it('deve adicionar falha quando o número for negativo', () => {
      // Arrange
      const failures: SimpleFailure[] = []
      const value = -5

      // Act
      new NumberValidator({ valor: value }, failures).isPositive()

      // Assert
      expect(failures.length).toBe(1)
      expect(failures[0].code).toBe(FailureCode.VALUE_NOT_POSITIVE)
      expect(failures[0].details?.value).toBe(value)
    })

    it('deve usar o código de erro personalizado', () => {
      // Arrange
      const failures: SimpleFailure[] = []
      const value = -5
      const code = FailureCode.CONTENT_WITH_INVALID_TYPE

      // Act
      new NumberValidator({ valor: value }, failures).isPositive(code)

      // Assert
      expect(failures.length).toBe(1)
      expect(failures[0].code).toBe(code)
    })

    it('deve incluir detalhes adicionais na falha', () => {
      // Arrange
      const failures: SimpleFailure[] = []
      const value = -5
      const details = { message: 'Valor deve ser positivo' }

      // Act
      new NumberValidator({ valor: value }, failures).isPositive(FailureCode.VALUE_NOT_POSITIVE, details)

      // Assert
      expect(failures.length).toBe(1)
      expect(failures[0].details?.value).toBe(value)
    })
  })

  describe('isNegative', () => {
    it('não deve adicionar falha quando o número for negativo', () => {
      // Arrange
      const failures: SimpleFailure[] = []
      const value = -5

      // Act
      new NumberValidator({ valor: value }, failures).isNegative()

      // Assert
      expect(failures.length).toBe(0)
    })

    it('deve adicionar falha quando o número for zero', () => {
      // Arrange
      const failures: SimpleFailure[] = []
      const value = 0

      // Act
      new NumberValidator({ valor: value }, failures).isNegative()

      // Assert
      expect(failures.length).toBe(1)
      expect(failures[0].code).toBe(FailureCode.VALUE_CANNOT_BE_NEGATIVE)
      expect(failures[0].details?.value).toBe(value)
    })

    it('deve adicionar falha quando o número for positivo', () => {
      // Arrange
      const failures: SimpleFailure[] = []
      const value = 5

      // Act
      new NumberValidator({ valor: value }, failures).isNegative()

      // Assert
      expect(failures.length).toBe(1)
      expect(failures[0].code).toBe(FailureCode.VALUE_CANNOT_BE_NEGATIVE)
      expect(failures[0].details?.value).toBe(value)
    })

    it('deve usar o código de erro personalizado', () => {
      // Arrange
      const failures: SimpleFailure[] = []
      const value = 5
      const code = FailureCode.CONTENT_WITH_INVALID_TYPE

      // Act
      new NumberValidator({ valor: value }, failures).isNegative(code)

      // Assert
      expect(failures.length).toBe(1)
      expect(failures[0].code).toBe(code)
    })

    it('deve incluir detalhes adicionais na falha', () => {
      // Arrange
      const failures: SimpleFailure[] = []
      const value = 5
      const details = { message: 'Valor deve ser negativo' }

      // Act
      new NumberValidator({ valor: value }, failures).isNegative(FailureCode.VALUE_CANNOT_BE_NEGATIVE, details)

      // Assert
      expect(failures.length).toBe(1)
      expect(failures[0].details?.value).toBe(value)
    })
  })

  describe('isInteger', () => {
    it('não deve adicionar falha quando o número for inteiro', () => {
      // Arrange
      const failures: SimpleFailure[] = []
      const value = 5

      // Act
      new NumberValidator({ valor: value }, failures).isInteger()

      // Assert
      expect(failures.length).toBe(0)
    })

    it('deve adicionar falha quando o número for decimal', () => {
      // Arrange
      const failures: SimpleFailure[] = []
      const value = 5.5

      // Act
      new NumberValidator({ valor: value }, failures).isInteger()

      // Assert
      expect(failures.length).toBe(1)
      expect(failures[0].code).toBe(FailureCode.VALUE_NOT_INTEGER)
      expect(failures[0].details?.value).toBe(value)
    })

    it('deve usar o código de erro personalizado', () => {
      // Arrange
      const failures: SimpleFailure[] = []
      const value = 5.5
      const code = FailureCode.CONTENT_WITH_INVALID_TYPE

      // Act
      new NumberValidator({ valor: value }, failures).isInteger(code)

      // Assert
      expect(failures.length).toBe(1)
      expect(failures[0].code).toBe(code)
    })

    it('deve incluir detalhes adicionais na falha', () => {
      // Arrange
      const failures: SimpleFailure[] = []
      const value = 5.5
      const details = { message: 'Valor deve ser um número inteiro' }

      // Act
      new NumberValidator({ valor: value }, failures).isInteger(FailureCode.VALUE_NOT_INTEGER, details)

      // Assert
      expect(failures.length).toBe(1)
      expect(failures[0].details?.value).toBe(value)
    })
  })
})
