import { Price } from './price'
import { FailureCode } from '../failure/failure.codes.enum'
import { validateAndCollect } from '../validator/common.validators'
import { SimpleFailure } from '../failure/simple.failure.type'

describe('Price', () => {
  function createValidPrice(value: number): Price {
    return validateAndCollect(Price.create(value), [])
  }

  const price = createValidPrice(10)

  describe('create', () => {
    let failures: SimpleFailure[]

    beforeEach(() => {
      failures = []
    })

    it('deve criar um Price válido com número inteiro', () => {
      // Arrange
      const value = 10

      // Act
      const result = validateAndCollect(Price.create(value), failures)

      // Assert
      expect(result).not.toBeNull()
      expect(result.value).toBe(value) // Valor armazenado em centavos
    })

    it('deve criar um Price com valor 0', () => {
      // Arrange
      const value = 0

      // Act
      const result = validateAndCollect(Price.create(value), failures)

      // Assert
      expect(result).toBeDefined()
      expect(result.value).toBe(value)
    })

    it('deve falhar quando receber um NaN', () => {
      // Act
      const result = validateAndCollect(Price.create(NaN), failures)

      // Assert
      expect(result).toBeNull()
      expect(failures.length).toBeGreaterThan(0)
    })

    describe('deve falhar ao criar um Price inválido', () => {
      const failureCases = [
        {
          value: null as any,
          scenario: 'quando o valor é nulo',
          errorCodeExpected: FailureCode.MISSING_REQUIRED_DATA,
        },
        {
          value: undefined as any,
          scenario: 'quando o valor é indefinido',
          errorCodeExpected: FailureCode.MISSING_REQUIRED_DATA,
        },
        {
          value: -1,
          scenario: 'quando o valor é negativo',
          errorCodeExpected: FailureCode.PRICE_MUST_BE_POSITIVE,
        },
        {
          value: 10.5,
          scenario: 'quando o valor é decimal',
          errorCodeExpected: FailureCode.PRICE_MUST_BE_INTEGER,
        },
      ]

      failureCases.forEach(({ value, scenario, errorCodeExpected }) => {
        it(`objeto Price ${scenario}`, () => {
          // Act
          const result = validateAndCollect(Price.create(value), failures)

          // Assert
          expect(result).toBeNull()
          expect(failures.length).toBeGreaterThan(0)
          expect(failures.some((e) => e.code === errorCodeExpected)).toBe(true)
        })
      })
    })
  })

  describe('equals', () => {
    it('deve retornar verdadeiro quando os preços são iguais', () => {
      // Arrange
      const price2 = createValidPrice(10)

      // Assert
      expect(price.equals(price2)).toBe(true)
    })

    it('deve retornar falso quando os preços são diferentes', () => {
      // Arrange
      const price2 = createValidPrice(20)

      // Assert
      expect(price.equals(price2)).toBe(false)
    })

    it('deve retornar falso quando comparado com null ou undefined', () => {
      // Assert
      expect(price.equals(null as any)).toBe(false)
      expect(price.equals(undefined as any)).toBe(false)
    })

    it('deve retornar falso quando comparado com um objeto que não é Price', () => {
      // Arrange
      const notPriceObject = { value: 1000 }

      // Assert
      expect(price.equals(notPriceObject as any)).toBe(false)
    })
  })

  describe('format', () => {
    it('deve formatar o preço com a localização e moeda padrão', () => {
      // Act
      const formatted = price.format

      // Assert
      expect(formatted).toContain('R$')
      expect(formatted).toContain('10,00')
    })
  })

  describe('operations', () => {
    let failures: SimpleFailure[]

    beforeEach(() => {
      failures = []
    })

    describe('add', () => {
      it('deve adicionar dois preços corretamente', () => {
        // Arrange
        const price2 = createValidPrice(20)

        // Act
        const sum = validateAndCollect(price.add(price2), failures)

        // Assert
        expect(sum).not.toBeNull()
        expect(sum.value).toBe(30) // 30 em centavos
      })

      it('deve falhar ao adicionar um valor que não é Price', () => {
        // Act
        const result = validateAndCollect(price.add(5 as any), failures)

        // Assert
        expect(result).toBeNull()
        expect(failures).toHaveLength(1)
        expect(failures[0].code).toBe(FailureCode.PRICE_INVALID_INSTANCE)
      })
    })

    describe('subtract', () => {
      it('deve subtrair dois preços corretamente quando o resultada a operação for 0', () => {
        // Arrange
        const price2 = createValidPrice(10)

        // Act
        const result = validateAndCollect(price.subtract(price2), failures)

        // Assert
        expect(result).not.toBeNull()
        expect(result.value).toBe(0)
      })

      it('deve subtrair dois preços corretamente', () => {
        // Arrange
        const price2 = createValidPrice(9)

        // Act
        const result = validateAndCollect(price.subtract(price2), failures)

        // Assert
        expect(result).not.toBeNull()
        expect(result.value).toBe(1)
      })

      it('deve falhar quando a subtração resulta em valor negativo', () => {
        // Arrange
        const price2 = createValidPrice(20)

        // Act
        const result = validateAndCollect(price.subtract(price2), failures)

        // Assert
        expect(result).toBeNull()
        expect(failures).toHaveLength(1)
        expect(failures[0].code).toBe(FailureCode.PRICE_NEGATIVE_RESULT_NOT_ALLOWED)
      })

      it('deve falhar ao subtrair um valor que não é Price', () => {
        // Act
        const result = validateAndCollect(price.subtract(5 as any), failures)

        // Assert
        expect(result).toBeNull()
        expect(failures).toHaveLength(1)
        expect(failures[0].code).toBe(FailureCode.PRICE_INVALID_INSTANCE)
      })
    })

    describe('multiply', () => {
      it('deve multiplicar o preço por um fator positivo', () => {
        // Arrange
        const factor = 2.5

        // Act
        const result = validateAndCollect(price.multiply(factor), failures)

        // Assert
        expect(result).not.toBeNull()
        expect(result.value).toBe(25)
      })

      it('deve falhar quando o fator de multiplicação não é um número', () => {
        // Act
        const result = validateAndCollect(price.multiply('2' as any), failures)

        // Assert
        expect(result).toBeNull()
        expect(failures).toHaveLength(1)
        expect(failures[0].code).toBe(FailureCode.PRICE_INVALID_MULTIPLICATION_FACTOR)
      })

      it('deve falhar quando o fator de multiplicação é negativo', () => {
        // Arrange
        const factor = -2

        // Act
        const result = validateAndCollect(price.multiply(factor), failures)

        // Assert
        expect(result).toBeNull()
        expect(failures).toHaveLength(1)
        expect(failures[0].code).toBe(FailureCode.PRICE_NEGATIVE_FACTOR_NOT_ALLOWED)
      })
    })

    describe('divide', () => {
      it('deve dividir o preço por um divisor positivo', () => {
        // Arrange
        const divisor = 2

        // Act
        const result = validateAndCollect(price.divide(divisor), failures)

        // Assert
        expect(result).not.toBeNull()
        expect(result.value).toBe(5)
      })

      it('deve arredondar o resultado para o centavo mais próximo', () => {
        // Arrange
        const divisor = 3

        // Act
        const result = validateAndCollect(price.divide(divisor), failures)

        // Assert
        expect(result).not.toBeNull()
        expect(result.value).toBe(3)
      })

      it('deve falhar quando o divisor não é um número', () => {
        // Act
        const result = validateAndCollect(price.divide('2' as any), failures)

        // Assert
        expect(result).toBeNull()
        expect(failures).toHaveLength(1)
        expect(failures[0].code).toBe(FailureCode.PRICE_INVALID_DIVISION_FACTOR)
      })

      it('deve falhar quando o divisor é zero', () => {
        // Arrange
        const divisor = 0

        // Act
        const result = validateAndCollect(price.divide(divisor), failures)

        // Assert
        expect(result).toBeNull()
        expect(failures).toHaveLength(1)
        expect(failures[0].code).toBe(FailureCode.PRICE_ZERO_OR_NEGATIVE_DIVISOR_NOT_ALLOWED)
      })

      it('deve falhar quando o divisor é negativo', () => {
        // Arrange
        const divisor = -2
        const failures: SimpleFailure[] = []

        // Act
        const result = validateAndCollect(price.divide(divisor), failures)

        // Assert
        expect(result).toBeNull()
        expect(failures).toHaveLength(1)
        expect(failures[0].code).toBe(FailureCode.PRICE_ZERO_OR_NEGATIVE_DIVISOR_NOT_ALLOWED)
      })
    })

    describe('compare', () => {
      it('deve retornar -1 quando o primeiro preço é menor', () => {
        // Arrange
        const price2 = createValidPrice(20)

        // Act & Assert
        expect(price.compare(price2)).toBe(-1)
      })

      it('deve retornar 0 quando os preços são iguais', () => {
        // Arrange
        const price2 = createValidPrice(10)

        // Act & Assert
        expect(price.compare(price2)).toBe(0)
      })

      it('deve retornar 1 quando o primeiro preço é maior', () => {
        // Arrange
        const price2 = createValidPrice(9)

        // Act & Assert
        expect(price.compare(price2)).toBe(1)
      })

      it('deve lançar erro quando comparado com um objeto que não é Price', () => {
        // Arrange
        const notPriceObject = { value: 1000 }

        // Act & Assert
        expect(() => price.compare(notPriceObject as any)).toThrow()
      })
    })
  })
})
