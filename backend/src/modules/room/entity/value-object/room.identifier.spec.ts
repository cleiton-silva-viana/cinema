import { RoomIdentifier } from './room.identifier'
import { FailureCode } from '@shared/failure/failure.codes.enum'
import { TechnicalError } from '@shared/error/technical.error'

describe('RoomIdentifier', () => {
  describe('create', () => {
    describe('casos de sucesso', () => {
      const successCase = [
        {
          scenario: 'ID igual oa valor mínimo permitido',
          input: 1,
        },
        {
          scenario: 'ID igual ao vlaor máximo permito',
          input: 100,
        },
      ]

      successCase.forEach(({ scenario, input }) => {
        it(scenario, () => {
          // Act
          const result = RoomIdentifier.create(input)

          // Assert
          expect(result).toBeValidResultMatching<RoomIdentifier>((r) => {
            expect(r.value).toBe(input)
          })
        })
      })
    })

    describe('casos de falha', () => {
      const successCase = [
        {
          scenario: 'ID for inválido',
          input: -1,
          code: FailureCode.VALUE_OUT_OF_RANGE,
        },
        {
          scenario: 'ID é exatamente o valor máximo permitido + 1',
          input: 101,
          code: FailureCode.VALUE_OUT_OF_RANGE,
        },
        {
          scenario: 'ID é um número decimal',
          input: 1.5,
          code: FailureCode.VALUE_NOT_INTEGER,
        },
      ]

      successCase.forEach(({ scenario, input, code }) => {
        it(scenario, () => {
          // Act
          const result = RoomIdentifier.create(input)

          // Assert
          expect(result).toBeInvalidResultWithSingleFailure(code)
        })
      })
    })
  })

  describe('hydrate', () => {
    it('deve instanciar com sucesso', () => {
      // Arrange
      const values = [1, 2, 99, 100]

      // Act
      values.forEach((value) => {
        const identifier = RoomIdentifier.hydrate(value)

        // Assert
        expect(identifier.value).toBe(value)
      })
    })

    it('deve lançar um erro ao receber parãmetro inválido', () => {
      expect(() => RoomIdentifier.hydrate(null as any)).toThrow(TechnicalError)
    })
  })

  describe('equal', () => {
    it('deve retornar true quando os identificadores são iguais', () => {
      // Arrange
      const id1 = RoomIdentifier.hydrate(10)
      const id2 = RoomIdentifier.hydrate(10)

      // Act
      const result = id1.equals(id2)

      // Assert
      expect(result).toBe(true)
    })

    it('deve retornar false quando os identificadores são diferentes', () => {
      // Arrange
      const id1 = RoomIdentifier.hydrate(10)
      const id2 = RoomIdentifier.hydrate(20)

      // Act
      const result = id1.equals(id2)

      // Assert
      expect(result).toBe(false)
    })

    it('deve retornar false quando o outro identificador é nulo', () => {
      // Arrange
      const id1 = RoomIdentifier.hydrate(10)

      // Act
      const result = id1.equals(null as any)

      // Assert
      expect(result).toBe(false)
    })

    it('deve retornar false quando o outro identificador é indefinido', () => {
      // Arrange
      const id1 = RoomIdentifier.hydrate(10)

      // Act
      const result = id1.equals(undefined)

      // Assert
      expect(result).toBe(false)
    })
  })
})
