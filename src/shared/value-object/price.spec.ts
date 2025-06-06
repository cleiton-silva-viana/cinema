import { Price } from './price'
import { FailureCode } from '../failure/failure.codes.enum'

describe('Price', () => {
  function createValidPrice(value: number): Price {
    const r = Price.create(value)
    if (r.isValid()) return r.value
    throw new Error('Invalid price')
  }

  const price = createValidPrice(10)

  describe('create', () => {
    it('deve criar um Price válido com número inteiro', () => {
      // Arrange
      const value = 10

      // Act
      const result = Price.create(value)

      // Assert
      expect(result).toBeValidResultMatching((price: Price) => {
        expect(price.value).toBe(value)
      })
    })

    it('deve criar um Price com valor 0', () => {
      // Arrange
      const value = 0

      // Act
      const result = Price.create(value)

      // Assert
      expect(result).toBeValidResultMatching((p: Price) => {
        expect(p.value).toBe(value)
      })
    })

    it('deve falhar quando receber um NaN', () => {
      // Act
      const result = Price.create(NaN)

      // Assert
      expect(result).toBeInvalidResultWithSingleFailure(FailureCode.PRICE_MUST_BE_INTEGER)
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
          const result = Price.create(value)

          // Assert
          expect(result).toBeInvalidResultWithSingleFailure(errorCodeExpected)
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
    describe('add', () => {
      it('deve adicionar dois preços corretamente', () => {
        // Arrange
        const price2 = createValidPrice(20)

        // Act
        const result = price.add(price2)

        // Assert
        expect(result).toBeValidResultMatching<Price>((p) => expect(p.value).toBe(price.value + price2.value))
      })

      it('deve falhar ao adicionar um valor que não é Price', () => {
        // Act
        const result = price.add(5 as any)

        // Assert
        expect(result).toBeInvalidResultWithSingleFailure(FailureCode.PRICE_INVALID_INSTANCE)
      })
    })

    describe('subtract', () => {
      it('deve subtrair dois preços corretamente quando o resultada a operação for 0', () => {
        // Arrange
        const price2 = createValidPrice(10)

        // Act
        const result = price.subtract(price2)

        // Assert
        expect(result).toBeValidResultMatching<Price>((p) => {
          expect(p.value).toBe(0)
        })
      })

      it('deve subtrair dois preços corretamente', () => {
        // Arrange
        const price2 = createValidPrice(9)

        // Act
        const result = price.subtract(price2)

        // Assert
        expect(result).toBeValidResultMatching<Price>((p) => {
          expect(p.value).toBe(price.value - price2.value)
        })
      })

      it('deve falhar quando a subtração resulta em valor negativo', () => {
        // Arrange
        const price2 = createValidPrice(20)

        // Act
        const result = price.subtract(price2)

        // Assert
        expect(result).toBeInvalidResultWithSingleFailure(FailureCode.PRICE_NEGATIVE_RESULT_NOT_ALLOWED)
      })

      it('deve falhar ao subtrair um valor que não é Price', () => {
        // Act
        const result = price.subtract(5 as any)

        // Assert
        expect(result).toBeInvalidResultWithSingleFailure(FailureCode.PRICE_INVALID_INSTANCE)
      })
    })

    describe('multiply', () => {
      it('deve multiplicar o preço por um fator positivo', () => {
        // Arrange
        const factor = 2.5

        // Act
        const result = price.multiply(factor)

        // Assert
        expect(result).toBeValidResultMatching<Price>((p) => {
          expect(p.value).toBe(price.value * factor)
        })
      })

      it('deve falhar quando o fator de multiplicação não é um número', () => {
        // Act
        const result = price.multiply('2' as any)

        // Assert
        expect(result).toBeInvalidResultWithSingleFailure(FailureCode.PRICE_INVALID_MULTIPLICATION_FACTOR)
      })

      it('deve falhar quando o fator de multiplicação é negativo', () => {
        // Arrange
        const factor = -2

        // Act
        const result = price.multiply(factor)

        // Assert
        expect(result).toBeInvalidResultWithSingleFailure(FailureCode.PRICE_NEGATIVE_FACTOR_NOT_ALLOWED)
      })
    })

    describe('divide', () => {
      it('deve dividir o preço por um divisor positivo', () => {
        // Arrange
        const divisor = 2

        // Act
        const result = price.divide(divisor)

        // Assert
        expect(result).toBeValidResultMatching<Price>((p) => {
          expect(p.value).toBe(price.value / divisor)
        })
      })

      it('deve arredondar o resultado para o centavo mais próximo', () => {
        // Arrange
        const divisor = 3

        // Act
        const result = price.divide(divisor)

        // Assert
        expect(result).toBeValidResultMatching<Price>((p) => {
          expect(p.value).toBe(Math.round(price.value / divisor))
        })
      })

      it('deve falhar quando o divisor não é um número', () => {
        // Act
        const result = price.divide('2' as any)

        // Assert
        expect(result).toBeInvalidResultWithSingleFailure(FailureCode.PRICE_INVALID_DIVISION_FACTOR)
      })

      it('deve falhar quando o divisor é zero', () => {
        // Arrange
        const divisor = 0

        // Act
        const result = price.divide(divisor)

        // Assert
        expect(result).toBeInvalidResultWithSingleFailure(FailureCode.PRICE_ZERO_OR_NEGATIVE_DIVISOR_NOT_ALLOWED)
      })

      it('deve falhar quando o divisor é negativo', () => {
        // Arrange
        const divisor = -2

        // Act
        const result = price.divide(divisor)

        // Assert
        expect(result).toBeInvalidResultWithSingleFailure(FailureCode.PRICE_ZERO_OR_NEGATIVE_DIVISOR_NOT_ALLOWED)
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
