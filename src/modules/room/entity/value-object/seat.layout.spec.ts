import { SeatLayout } from './seat.layout'
import { ISeatRowConfiguration } from '../room'
import { SeatRow } from './seat.row'
import { FailureCode } from '@shared/failure/failure.codes.enum'

describe('SeatLayout', () => {
  describe('Métodos Estáticos', () => {
    describe('create', () => {
      describe('Cenários de sucesso', () => {
        const createValidLayout: () => ISeatRowConfiguration[] = () => [
          {
            rowNumber: 1,
            lastColumnLetter: 'E', // 5 assentos (A-E)
            preferentialSeatLetters: ['A', 'B'],
          },
          {
            rowNumber: 2,
            lastColumnLetter: 'F', // 6 assentos (A-F)
            preferentialSeatLetters: ['C'],
          },
          {
            rowNumber: 3,
            lastColumnLetter: 'G', // 7 assentos (A-G)
          },
          {
            rowNumber: 4,
            lastColumnLetter: 'H', // 8 assentos (A-H)
          },
        ]
        it('deve criar um layout de assentos válido com valores mínimos', () => {
          // Arrange
          const layout = createValidLayout()

          // Act
          const result = SeatLayout.create(layout)

          // Assert
          expect(result).toBeValidResultMatching<SeatLayout>(s => {
            expect(s.seatRows.size).toBe(4)
            expect(s.totalCapacity).toBe(26) // 5+6+7+8 = 26
            expect(s.preferentialSeatsByRow.size).toBe(2)
            expect(s.preferentialSeatsByRow.get(1)).toEqual(['A', 'B'])
            expect(s.preferentialSeatsByRow.get(2)).toEqual(['C'])
            expect(s.preferentialSeatsByRow.has(3)).toBe(false)
            expect(s.preferentialSeatsByRow.has(4)).toBe(false)
          })
        })

        it('deve criar um layout com o número máximo de fileiras', () => {
          // Arrange
          const maxRows = 20
          const layout: ISeatRowConfiguration[] = []

          for (let i = 1; i <= maxRows; i++) {
            layout.push({
              rowNumber: i,
              lastColumnLetter: 'E', // 5 assentos por fileira (A-E)
              preferentialSeatLetters: i <= 5 ? ['A'] : [], // Adiciona assentos preferenciais nas primeiras 5 fileiras
            })
          }

          // Act
          const result = SeatLayout.create(layout)

          // Assert
          expect(result).toBeValidResultMatching<SeatLayout>(s => {
            expect(s.seatRows.size).toBe(maxRows)
            expect(s.totalCapacity).toBe(maxRows * 5) // 20 fileiras * 5 assentos = 100
          })
        })

        // deve criar um com quantidade mínima de linhas
        // deve criar com quantidade máxima de linhas
        // deve criar com quantidade mínima de assentos preferenciais
        // deve criar com quantidade máxima de assentos preferenciais
      })

      describe('Cenários de falha', () => {
        describe('Validação do layout', () => {
          const failureCases = [
            {
              scenario: 'layout nulo',
              layout: null as any,
              code: FailureCode.MISSING_REQUIRED_DATA,
            },
            {
              scenario: 'layout vazio',
              layout: [],
              code: FailureCode.MISSING_REQUIRED_DATA,
            },
            {
              scenario: 'layout com menos fileiras que o mínimo',
              layout: Array(3)
                .fill(0)
                .map((_, i) => ({
                  rowId: i + 1,
                  columns: 'E',
                })),
              code: FailureCode.ARRAY_LENGTH_IS_OUT_OF_RANGE,
            },
            {
              scenario: 'layout com mais fileiras que o máximo',
              layout: Array(21)
                .fill(0)
                .map((_, i) => ({
                  rowId: i + 1,
                  columns: 'E',
                })),
              code: FailureCode.ARRAY_LENGTH_IS_OUT_OF_RANGE,
            },
          ]

          failureCases.forEach(({ scenario, layout, code }) => {
            it(`deve falhar quando o ${scenario}`, () => {
              // Act
              const result = SeatLayout.create(layout)

              // Assert
              expect(result).toBeInvalidResultWithSingleFailure(code)
            })
          })
        })

        describe('Validação da capacidade da sala', () => {
          it('deve falhar quando a capacidade total é menor que o mínimo permitido', () => {
            // Arrange - 4 fileiras com 4 assentos cada = 16 assentos (mínimo é 20)
            const layout: ISeatRowConfiguration[] = [
              { rowNumber: 1, lastColumnLetter: 'D' }, // 4 assentos
              { rowNumber: 2, lastColumnLetter: 'D' }, // 4 assentos
              { rowNumber: 3, lastColumnLetter: 'D' }, // 4 assentos
              { rowNumber: 4, lastColumnLetter: 'D' }, // 4 assentos
            ]

            // Act
            const result = SeatLayout.create(layout)

            // Assert
            expect(result).toBeInvalidResultWithSingleFailure(FailureCode.ROOM_WITH_INVALID_CAPACITY)
          })

          it('deve falhar quando a capacidade total é maior que o máximo permitido', () => {
            // Arrange - 20 fileiras com 15 assentos cada = 300 assentos (máximo é 250)
            const layout: ISeatRowConfiguration[] = Array(20)
              .fill(0)
              .map((_, i) => ({
                rowNumber: i + 1,
                lastColumnLetter: 'O', // 15 assentos (A-O)
              }))

            // Act
            const result = SeatLayout.create(layout)

            // Assert
            expect(result).toBeInvalidResultWithSingleFailure(FailureCode.ROOM_WITH_INVALID_CAPACITY)
          })
        })

        describe('Validação de assentos preferenciais', () => {
          it('deve falhar quando a quantidade de assentos preferenciais é menor que o mínimo permitido', () => {
            // Arrange - 100 assentos totais, 0 preferenciais (mínimo seria 5%)
            const layout: ISeatRowConfiguration[] = Array(20)
              .fill(0)
              .map((_, i) => ({
                rowNumber: i + 1,
                lastColumnLetter: 'E', // 5 assentos por fileira
                preferentialSeatLetters: [] as string[], // Sem assentos preferenciais
              }))

            // Act
            const result = SeatLayout.create(layout)

            // Assert
            expect(result).toBeInvalidResultWithSingleFailure(FailureCode.ROOM_WITH_INVALID_NUMBER_OF_PREFERENTIAL_SEATS)
          })

          it('deve falhar quando a quantidade de assentos preferenciais é maior que o máximo permitido', () => {
            // Arrange - 100 assentos totais, 30 preferenciais (máximo seria 20% = 20 assentos)
            const layout: ISeatRowConfiguration[] = Array(10)
              .fill(0)
              .map((_, i) => ({
                rowNumber: i + 1,
                lastColumnLetter: 'j', // 10 assentos por fileira
                preferentialSeatLetters: ['A', 'B', 'C'], // 30 assentos preferenciais (10 fileiras x 3 assentos)
              }))

            // Act
            const result = SeatLayout.create(layout)

            // Assert
            expect(result).toBeInvalidResultWithSingleFailure(FailureCode.ROOM_WITH_INVALID_NUMBER_OF_PREFERENTIAL_SEATS)
          })
        })
      })
    })

    describe('hydrate', () => {
      it('deve recriar uma instância de SeatLayout a partir de dados existentes', () => {
        // Arrange
        const seatRows = new Map<number, SeatRow>()

        const row1 = SeatRow.hydrate('E', ['A', 'B']) // Fileira 1: A-E, com A e B preferenciais
        const row2 = SeatRow.hydrate('F', ['C']) // Fileira 2: A-F, com C preferencial
        const row3 = SeatRow.hydrate('G', []) // Fileira 3: A-G, sem preferenciais

        seatRows.set(1, row1)
        seatRows.set(2, row2)
        seatRows.set(3, row3)

        // Act
        const result = SeatLayout.hydrate(seatRows)

        // Assert
        expect(result.seatRows).toBe(seatRows)
        expect(result.totalCapacity).toBe(18) // 5 + 6 + 7 = 18 assentos
        expect(result.preferentialSeatsByRow.size).toBe(2)
        expect(result.preferentialSeatsByRow.get(1)).toEqual(['A', 'B'])
        expect(result.preferentialSeatsByRow.get(2)).toEqual(['C'])
        expect(result.preferentialSeatsByRow.has(3)).toBe(false)
      })

      it('deve calcular corretamente a capacidade total com base nas fileiras', () => {
        // Arrange
        const seatRows = new Map<number, SeatRow>()

        // fileiras com diferentes capacidades
        seatRows.set(1, SeatRow.hydrate('D', [])) // 4 assentos
        seatRows.set(2, SeatRow.hydrate('F', [])) // 6 assentos
        seatRows.set(3, SeatRow.hydrate('J', [])) // 10 assentos

        // Act
        const result = SeatLayout.hydrate(seatRows)

        // Assert
        expect(result.totalCapacity).toBe(20) // 4 + 6 + 10 = 20 assentos
      })

      it('deve calcular corretamente os assentos preferenciais com base nas fileiras', () => {
        // Arrange
        const seatRows = new Map<number, SeatRow>()

        // fileiras com diferentes configurações de assentos preferenciais
        seatRows.set(1, SeatRow.hydrate('E', ['A', 'B', 'C']))
        seatRows.set(2, SeatRow.hydrate('F', ['D', 'E']))
        seatRows.set(3, SeatRow.hydrate('G', []))

        // Act
        const result = SeatLayout.hydrate(seatRows)

        // Assert
        expect(result.preferentialSeatsByRow.size).toBe(2)
        expect(result.preferentialSeatsByRow.get(1)).toEqual(['A', 'B', 'C'])
        expect(result.preferentialSeatsByRow.get(2)).toEqual(['D', 'E'])
        expect(result.preferentialSeatsByRow.has(3)).toBe(false)
      })

      it('deve lançar erro técnico quando o mapa de fileiras for nulo', () => {
        // Act & Assert
        expect(() => SeatLayout.hydrate(null as any)).toThrow()
      })
    })
  })

  describe('Métodos de Instancia', () => {
    let instance: SeatLayout
    let seatRows: Map<number, SeatRow>

    beforeEach(() => {
      seatRows = new Map()

      // Adicionar fileiras de teste
      const row1 = SeatRow.hydrate('E', ['A', 'B']) // Fileira 1: A-E, com A e B preferenciais
      const row2 = SeatRow.hydrate('F', ['C']) // Fileira 2: A-F, com C preferencial
      const row3 = SeatRow.hydrate('G', []) // Fileira 3: A-G, sem preferenciais

      seatRows.set(1, row1)
      seatRows.set(2, row2)
      seatRows.set(3, row3)

      // Criar instância para testes usando o novo método hydrate
      instance = SeatLayout.hydrate(seatRows)
    })

    describe('hasSeat', () => {
      it('deve retornar true quando há um assento correspondente', () => {
        // Act & Assert
        expect(instance.hasSeat(1, 'A')).toBe(true)
        expect(instance.hasSeat(1, 'E')).toBe(true)
        expect(instance.hasSeat(2, 'F')).toBe(true)
        expect(instance.hasSeat(3, 'G')).toBe(true)
      })

      it('deve retornar false quando não há um assento correspondente', () => {
        // Act & Assert
        expect(instance.hasSeat(1, 'F')).toBe(false) // Coluna F não existe na fileira 1
        expect(instance.hasSeat(2, 'G')).toBe(false) // Coluna G não existe na fileira 2
        expect(instance.hasSeat(4, 'A')).toBe(false) // Fileira 4 não existe
        expect(instance.hasSeat(1, 'Z')).toBe(false) // Coluna Z não existe em nenhuma fileira
      })
    })

    describe('isPreferentialSeat', () => {
      it('deve retornar true quando o assento é preferencial', () => {
        // Act & Assert
        expect(instance.isPreferentialSeat(1, 'A')).toBe(true)
        expect(instance.isPreferentialSeat(1, 'B')).toBe(true)
        expect(instance.isPreferentialSeat(2, 'C')).toBe(true)
      })

      it('deve retornar false quando o assento não é preferencial', () => {
        // Act & Assert
        expect(instance.isPreferentialSeat(1, 'C')).toBe(false) // Assento existe mas não é preferencial
        expect(instance.isPreferentialSeat(2, 'A')).toBe(false) // Assento existe mas não é preferencial
        expect(instance.isPreferentialSeat(3, 'A')).toBe(false) // Fileira sem assentos preferenciais
        expect(instance.isPreferentialSeat(4, 'A')).toBe(false) // Fileira não existe
        expect(instance.isPreferentialSeat(1, 'Z')).toBe(false) // Assento não existe
      })
    })

    describe('preferentialSeatsCount', () => {
      it('deve retornar zero quando não há assentos preferenciais', () => {
        // Arrange
        const seatRows = new Map<number, SeatRow>()
        seatRows.set(1, SeatRow.hydrate('E', []))
        seatRows.set(2, SeatRow.hydrate('F', []))
        const layoutSemPreferenciais = SeatLayout.hydrate(seatRows)

        // Act
        const count = layoutSemPreferenciais.preferentialSeatsCount

        // Assert
        expect(count).toBe(0)
      })

      it('deve retornar a soma total de assentos preferenciais de todas as fileiras', () => {
        // Arrange
        const seatRows = new Map<number, SeatRow>()
        seatRows.set(1, SeatRow.hydrate('E', ['A', 'B'])) // 2 assentos preferenciais
        seatRows.set(2, SeatRow.hydrate('F', ['C', 'D'])) // 2 assentos preferenciais
        seatRows.set(3, SeatRow.hydrate('G', ['A'])) // 1 assento preferencial
        const layout = SeatLayout.hydrate(seatRows)

        // Act
        const count = layout.preferentialSeatsCount

        // Assert
        expect(count).toBe(5) // Total: 2 + 2 + 1 = 5 assentos preferenciais
      })

      it('deve retornar o valor correto usando a instância de teste padrão', () => {
        // Act
        const count = instance.preferentialSeatsCount

        // Assert
        expect(count).toBe(3) // 2 na primeira fileira (A,B) + 1 na segunda fileira (C)
      })
    })
  })
})
