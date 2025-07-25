import { SeatRow } from './seat.row'
import { FailureCode } from '@shared/failure/failure.codes.enum'
import { TechnicalError } from '@shared/error/technical.error'

describe('SeatRow', () => {
  describe('Métodos Estáticos', () => {
    describe('create', () => {
      const ID = 1
      const COLUMNS = 'F'
      const PREFERENTIAL: string[] = []

      describe('Cenários de sucesso', () => {
        const successCases = [
          {
            columns: 'D',
            preferentialSeats: ['A', 'B'],
            scenario: 'com colunas mínimas e assentos preferenciais',
          },
          {
            columns: 'T',
            preferentialSeats: ['A', 'B', 'C', 'D'],
            scenario: 'com colunas válidas e máximo de assentos preferenciais',
          },
          {
            columns: 'G',
            preferentialSeats: [],
            scenario: 'com colunas válidas e sem assentos preferenciais',
          },
          {
            columns: 'Z',
            scenario: 'com colunas máximas permitidas',
          },
          {
            columns: 'h',
            scenario: 'com colunas com letras minúsculas',
          },
        ]

        successCases.forEach(({ columns, preferentialSeats, scenario }) => {
          it(`deve criar uma fileira válida ${scenario}`, () => {
            // Act
            const result = SeatRow.create(ID, columns, preferentialSeats)

            // Assert
            expect(result).toBeValidResultMatching<SeatRow>((s) => {
              expect(s.lastColumnLetter).toBe(columns.toUpperCase())
              expect(s.preferentialSeatLetters).toEqual(preferentialSeats ?? [])
            })
          })
        })
      })

      describe('Cenários de falha', () => {
        describe('Validação das colunas', () => {
          const failureCases = [
            {
              columns: '2',
              scenario: 'quando a coluna final é inválida',
              code: FailureCode.SEAT_WITH_INVALID_COLUMN_IDENTIFIER,
            },
            {
              columns: 'AA',
              scenario: 'quando a coluna final tem mais de um caractere',
              code: FailureCode.SEAT_WITH_INVALID_COLUMN_IDENTIFIER,
            },
            {
              columns: 'C',
              scenario: 'quando a quantidade de colunas é menor que o mínimo',
              code: FailureCode.SEAT_COLUMN_OUT_OF_RANGE,
            },
          ]

          failureCases.forEach(({ scenario, columns, code }) => {
            it(`deve falhar ${scenario}`, () => {
              // Act
              const result = SeatRow.create(ID, columns, PREFERENTIAL)

              // Assert
              expect(result).toBeInvalidResultWithSingleFailure(code)
            })
          })
        })

        describe('Validação dos assentos preferenciais', () => {
          it('deve falhar quando há mais assentos preferenciais que o permitido', () => {
            // Arrange
            const pref = ['A', 'B', 'C', 'D', 'E']

            // Act
            const result = SeatRow.create(ID, COLUMNS, pref)

            // Assert
            expect(result).toBeInvalidResultWithSingleFailure(FailureCode.SEAT_WITH_PREFERENTIAL_LIMIT_EXCEEDED)
          })

          it('deve falhar quando um assento preferencial não existe na fileira', () => {
            // Arrange
            const pref = ['G']

            // Act
            const result = SeatRow.create(ID, COLUMNS, pref)

            // Assert
            expect(result).toBeInvalidResultWithSingleFailure(FailureCode.SEAT_PREFERENTIAL_IN_ROW_IS_NOT_FOUND)
          })

          it('deve falhar quando um assento preferencial é duplicado', () => {
            // Arrange
            const pref = ['A', 'B', 'A']

            // Act
            const result = SeatRow.create(ID, COLUMNS, pref)

            // Assert
            expect(result).toBeInvalidResultWithSingleFailure(FailureCode.SEAT_PREFERENTIAL_IS_DUPLICATED)
          })
        })
      })
    })

    describe('hydrate', () => {
      describe('Cenários de sucesso', () => {
        it('deve recriar uma fileira com dados básicos válidos', () => {
          // Arrange
          const lastColumn = 'F'
          const preferentialSeats = ['A', 'C']

          // Act
          const seatRow = SeatRow.hydrate(lastColumn, preferentialSeats)

          // Assert
          expect(seatRow).toBeInstanceOf(SeatRow)
          expect(seatRow.lastColumnLetter).toBe('F')
          expect(seatRow.preferentialSeatLetters).toEqual(['A', 'C'])
          expect(seatRow.capacity).toBe(6) // A até F = 6 assentos
        })

        it('deve normalizar a última coluna para maiúscula', () => {
          // Arrange
          const lastColumn = 'd'
          const preferentialSeats = ['A']

          // Act
          const seatRow = SeatRow.hydrate(lastColumn, preferentialSeats)

          // Assert
          expect(seatRow.lastColumnLetter).toBe('D')
        })

        it('deve normalizar os assentos preferenciais para maiúscula', () => {
          // Arrange
          const lastColumn = 'E'
          const preferentialSeats = ['a', 'b', 'c']

          // Act
          const seatRow = SeatRow.hydrate(lastColumn, preferentialSeats)

          // Assert
          expect(seatRow.preferentialSeatLetters).toEqual(['A', 'B', 'C'])
        })
      })

      describe('Validação de erros', () => {
        const failureCases = [
          {
            scenario: 'última coluna é nula',
            column: null as any,
          },
          {
            scenario: 'a última coluna é indefinida',
            column: undefined as any,
          },
        ]

        failureCases.forEach(({ scenario, column }) => {
          it(`deve lançar erro técnico quando ${scenario}`, () => {
            // Act & Assert
            expect(() => SeatRow.hydrate(column, [])).toThrow(TechnicalError)
          })
        })
      })
    })
  })

  describe('Métodos de Instância', () => {
    let instance: SeatRow

    beforeEach(() => {
      instance = SeatRow.hydrate('f', ['a', 'b'])
    })

    describe('capacity', () => {
      it('deve retornar a capacidade correta da fileira', () => {
        // Act
        const capacity = instance.capacity

        // Assert
        expect(capacity).toBe(6) // A até F = 6 assentos
      })
    })

    describe('isPreferentialSeat', () => {
      it('deve retornar true para um assento preferencial', () => {
        // Act & Assert
        expect(instance.isPreferentialSeat('B')).toBe(true)
        expect(instance.isPreferentialSeat('b')).toBe(true) // Deve ser case-insensitive
      })

      it('deve retornar false para um assento não preferencial', () => {
        // Act & Assert
        expect(instance.isPreferentialSeat('C')).toBe(false)
        expect(instance.isPreferentialSeat('d')).toBe(false)
      })
    })

    describe('hasSeat', () => {
      it('deve retornar true para um assento que existe na fileira', () => {
        // Act & Assert
        expect(instance.hasSeat('A')).toBe(true)
        expect(instance.hasSeat('C')).toBe(true)
        expect(instance.hasSeat('E')).toBe(true)
        expect(instance.hasSeat('e')).toBe(true) // Deve ser case-insensitive
        expect(instance.hasSeat('f')).toBe(true) // Deve ser case-insensitive
      })

      it('deve retornar false para um assento que não existe na fileira', () => {
        // Act & Assert
        expect(instance.hasSeat('G')).toBe(false)
        expect(instance.hasSeat('Z')).toBe(false)
      })
    })
  })
})
