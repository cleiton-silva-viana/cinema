import { Seat } from './seat'
import { FailureCode } from '@shared/failure/failure.codes.enum'

describe('Seat', () => {
  describe('Métodos Estáticos', () => {
    describe('create', () => {
      describe('Cenários de sucesso', () => {
        const successCases = [
          {
            column: 'A',
            row: 1,
            preferential: false,
            scenario: 'primeiro assento, não preferencial',
          },
          {
            column: 'B',
            row: 10,
            preferential: true,
            scenario: 'assento válido, preferencial',
          },
          {
            column: 'Z',
            row: 250,
            preferential: false,
            scenario: 'última fileira e coluna válidas',
          },
          {
            column: 'c',
            row: 5,
            preferential: false,
            scenario: 'coluna em minúsculo (deve normalizar)',
          },
          {
            column: ' D ',
            row: 2,
            preferential: true,
            scenario: 'coluna com espaços (deve normalizar)',
          },
        ]

        successCases.forEach(({ column, row, preferential, scenario }) => {
          it(`deve criar um assento válido: ${scenario}`, () => {
            // Act
            const result = Seat.create(column, row, preferential)

            // Assert
            expect(result).toBeValidResultMatching<Seat>((s) => {
              expect(s.column).toBe(column.trim().toUpperCase())
              expect(s.row).toBe(row)
              expect(s.preferential).toBe(preferential)
            })
          })
        })
      })

      describe('Cenários de falha', () => {
        describe('Validação de dados nulos', () => {
          const failureCases = [
            {
              column: null as any,
              row: 10,
              scenario: 'coluna nula',
            },
            {
              column: 'A',
              row: null as any,
              scenario: 'fileira nula',
            },
          ]

          failureCases.forEach(({ scenario, column, row }) => {
            it(`deve falhar quando ${scenario}`, () => {
              // Act
              const result = Seat.create(column, row, true)

              // Assert
              expect(result).toBeInvalidResultWithSingleFailure(FailureCode.MISSING_REQUIRED_DATA)
            })
          })
        })

        it('Deve acumular erros com sucesso', () => {
          // Act
          const result = Seat.create(null as any, null as any, true)

          // Assert
          expect(result).toBeInvalidResultWithFailureCount(2)
        })

        describe('Validação da coluna', () => {
          const failureCases = [
            {
              column: '',
              scenario: 'coluna vazia',
            },
            {
              column: 'AA',
              scenario: 'coluna com mais de uma letra',
            },
            {
              column: '1',
              scenario: 'coluna não é uma letra',
            },
          ]

          failureCases.forEach(({ scenario, column }) => {
            it(`deve falhar quando a ${scenario}`, () => {
              // Act
              const result = Seat.create(column, 2, false)

              // Assert
              expect(result).toBeInvalidResultWithSingleFailure(FailureCode.SEAT_WITH_INVALID_COLUMN_IDENTIFIER)
            })
          })
        })

        describe('Validação da fileira', () => {
          const failureCases = [
            {
              row: -10,
              scenario: 'fileira com número negativo',
              errorCode: FailureCode.SEAT_WITH_INVALID_ROW_NUMBER,
            },
            {
              row: 0,
              scenario: 'fileira com valor zero',
              errorCode: FailureCode.SEAT_WITH_INVALID_ROW_NUMBER,
            },
            {
              row: 251,
              scenario: 'fileira acima do valor máximo permitido',
              errorCode: FailureCode.VALUE_OUT_OF_RANGE,
            },
            {
              row: 1.5,
              scenario: 'fileira com número decimal',
              errorCode: FailureCode.SEAT_WITH_INVALID_ROW_NUMBER,
            },
          ]

          failureCases.forEach(({ row, scenario, errorCode }) => {
            it(`deve falhar quando a ${scenario}`, () => {
              // Act
              const result = Seat.create('L', row, false)

              // Assert
              expect(result).toBeInvalidResultWithSingleFailure(errorCode)
            })
          })
        })

        it('deve falhar quando a fileira não é um valor numérico', () => {
          // Act
          const result = Seat.create('H', 'abc' as any, false)

          // Assert
          expect(result).toBeInvalidResultWithSingleFailure(FailureCode.SEAT_WITH_INVALID_ROW_NUMBER)
        })
      })
    })

    describe('hydrate', () => {
      describe('Cenários de sucesso', () => {
        it('deve recriar um assento com dados básicos válidos', () => {
          // Arrange
          const column = 'A'
          const row = 1
          const preferential = false

          // Act
          const seat = Seat.hydrate(column, row, preferential)

          // Assert
          expect(seat).toBeInstanceOf(Seat)
          expect(seat.column).toBe('A')
          expect(seat.row).toBe(1)
          expect(seat.preferential).toBe(false)
          expect(seat.identifier).toBe('A1')
        })

        it('deve normalizar a coluna para maiúscula e remover espaços', () => {
          // Arrange
          const column = ' b '
          const row = 2
          const preferential = true

          // Act
          const seat = Seat.hydrate(column, row, preferential)

          // Assert
          expect(seat).toBeInstanceOf(Seat)
          expect(seat.column).toBe('B')
          expect(seat.row).toBe(2)
          expect(seat.preferential).toBe(true)
          expect(seat.identifier).toBe('B2')
        })

        it('deve recriar corretamente um assento preferencial', () => {
          // Arrange
          const column = 'C'
          const row = 15
          const preferential = true

          // Act
          const seat = Seat.hydrate(column, row, preferential)

          // Assert
          expect(seat).toBeInstanceOf(Seat)
          expect(seat.column).toBe('C')
          expect(seat.row).toBe(15)
          expect(seat.preferential).toBe(true)
          expect(seat.identifier).toBe('C15')
        })
      })

      describe('Validação de erros', () => {
        it('deve lançar erro quando a fileira é nula', () => {
          expect(() => Seat.hydrate('D', null as any, false)).toThrow(FailureCode.MISSING_REQUIRED_DATA)
        })

        it('deve lançar erro quando a coluna é indefinida', () => {
          expect(() => Seat.hydrate(undefined as any, 1, false)).toThrow(FailureCode.MISSING_REQUIRED_DATA)
        })

        it('deve lançar erro quando o status preferencial é nulo', () => {
          expect(() => Seat.hydrate('G', 1, null as any)).toThrow(FailureCode.MISSING_REQUIRED_DATA)
        })
      })
    })
  })

  describe('Métodos de Instância', () => {
    describe('identifier', () => {
      it("deve retornar o identificador no formato 'coluna+fileira'", () => {
        // Arrange
        const seat = Seat.hydrate('B', 12, false)

        // Act
        const result = seat.identifier

        // Assert
        expect(result).toBe('B12')
      })

      it('deve normalizar a coluna antes de gerar o identificador', () => {
        // Arrange
        const seat = Seat.hydrate(' c ', 7, false)

        // Act
        const result = seat.identifier

        // Assert
        expect(result).toBe('C7')
      })
    })

    describe('equals', () => {
      it('deve retornar true para assentos idênticos', () => {
        // Arrange
        const s1 = Seat.hydrate('A', 1, false)
        const s2 = Seat.hydrate('A', 1, false)

        // Act
        const result = s1.equals(s2)

        // Assert
        expect(result).toBe(true)
      })

      it('deve retornar false para assentos com colunas diferentes', () => {
        // Arrange
        const s1 = Seat.hydrate('A', 1, false)
        const s2 = Seat.hydrate('B', 1, false)

        // Act
        const result = s1.equals(s2)

        // Assert
        expect(result).toBe(false)
      })

      it('deve retornar false para assentos com fileiras diferentes', () => {
        // Arrange
        const s1 = Seat.hydrate('A', 1, false)
        const s2 = Seat.hydrate('A', 2, false)

        // Act
        const result = s1.equals(s2)

        // Assert
        expect(result).toBe(false)
      })

      it('deve retornar false para assentos com status preferencial diferente', () => {
        // Arrange
        const s1 = Seat.hydrate('A', 1, false)
        const s2 = Seat.hydrate('A', 1, true)

        // Act
        const result = s1.equals(s2)

        // Assert
        expect(result).toBe(false)
      })

      it('deve retornar false quando comparado com null', () => {
        // Arrange
        const seat = Seat.hydrate('A', 1, false)

        // Act
        const result = seat.equals(null as any)

        // Assert
        expect(result).toBe(false)
      })

      it('deve retornar false quando comparado com undefined', () => {
        // Arrange
        const seat = Seat.hydrate('A', 1, false)

        // Act
        const result = seat.equals(undefined as any)

        // Assert
        expect(result).toBe(false)
      })
    })

    describe('withPreferentialStatus', () => {
      it('deve retornar a mesma instância quando o status não muda', () => {
        // Arrange
        const seat = Seat.hydrate('A', 1, false)

        // Act
        const result = seat.withPreferentialStatus(false)

        // Assert
        expect(result).toBe(seat)
      })

      it('deve retornar uma nova instância quando o status muda', () => {
        // Arrange
        const seat = Seat.hydrate('A', 1, false)

        // Act
        const result = seat.withPreferentialStatus(true)

        // Assert
        expect(result).not.toBe(seat)
        expect(result.preferential).toBe(true)
        expect(result.column).toBe('A')
        expect(result.row).toBe(1)
      })
    })
  })
})
