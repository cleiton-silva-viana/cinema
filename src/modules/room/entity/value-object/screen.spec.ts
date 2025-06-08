import { Screen } from './screen'
import { FailureCode } from '@shared/failure/failure.codes.enum'
import { TechnicalError } from '@shared/error/technical.error'

describe('Screen', () => {
  const VALID_SIZE = 20

  describe('Métodos Estáticos', () => {
    describe('create', () => {
      describe('telas válidas', () => {
        const successCases = [
          {
            size: 10,
            type: '2D',
            scenario: 'com tamanho mínimo exato',
          },
          {
            size: 50,
            type: '2D',
            scenario: 'com tamanho máximo exato',
          },
          {
            size: VALID_SIZE,
            type: '2D',
            scenario: 'com tipo 2D',
          },
          {
            size: VALID_SIZE,
            type: '3D',
            scenario: 'com tipo 3D',
          },
          {
            size: VALID_SIZE,
            type: '2D_3D',
            scenario: 'com tipo 2D_3D',
          },
          {
            size: VALID_SIZE,
            type: '   3D  ',
            scenario: 'com espaços em branco',
          },
          {
            size: VALID_SIZE,
            type: '   2d  ',
            scenario: 'com espaços letras em minusculas',
          },
        ]

        successCases.forEach(({ size, type, scenario }) => {
          it(`deve criar uma tela ${scenario}`, () => {
            // Act
            const result = Screen.create(size, type)

            // Assert
            expect(result).toBeValidResultMatching<Screen>(s => {
              expect(s.size).toBe(size)
              expect(s.type).toBe(type.trim().toUpperCase())
            })
          })
        })
      })

      describe('deve retornar um erro quando a tela é inválida', () => {
        const failureCases = [
          {
            size: null,
            type: '2D',
            scenario: 'com tamanho nulo',
            errorCode: FailureCode.MISSING_REQUIRED_DATA,
          },
          {
            size: '20' as any,
            type: '2D',
            scenario: 'com tamanho não numérico',
            errorCode: FailureCode.VALUE_NOT_INTEGER,
          },
          {
            size: 5,
            type: '2D',
            scenario: 'com tamanho menor que o mínimo',
            errorCode: FailureCode.VALUE_OUT_OF_RANGE,
          },
          {
            size: 60,
            type: '2D',
            scenario: 'com tamanho maior que o máximo',
            errorCode: FailureCode.VALUE_OUT_OF_RANGE,
          },
          {
            size: VALID_SIZE,
            type: null,
            scenario: 'com tipo nulo',
            errorCode: FailureCode.MISSING_REQUIRED_DATA,
          },
          {
            size: VALID_SIZE,
            type: '4D',
            scenario: 'com tipo inválido',
            errorCode: FailureCode.INVALID_ENUM_VALUE,
          },
        ]

        failureCases.forEach(({ size, type, scenario, errorCode }) => {
          it(`deve rejeitar uma tela ${scenario}`, () => {
            // Act
            const result = Screen.create(size, type as unknown as string)

            // Assert
            expect(result).toBeInvalidResultWithSingleFailure(errorCode)
          })
        })
      })
    })

    describe('hydrate', () => {
      it('deve hidratar uma tela corretamente', () => {
        // Act
        const hydrated = Screen.hydrate(VALID_SIZE, '2D')

        // Assert
        expect(hydrated.size).toBe(VALID_SIZE)
        expect(hydrated.type).toBe('2D')
      })

      it('deve lançar error quando argumento for nulo', () => {
        expect(() => Screen.hydrate(null as any, '2D')).toThrow(TechnicalError)
        expect(() => Screen.hydrate(30, null as any)).toThrow(TechnicalError)
      })
    })
    describe('Métodos de Instância', () => {
      describe('equals', () => {
        it('deve retornar true para telas com mesmo tamanho e tipo', () => {
          // Arrange
          const screen1 = Screen.hydrate(VALID_SIZE, '2D')
          const screen2 = Screen.hydrate(VALID_SIZE, '2D')

          // Act
          const result = screen1.equals(screen2)

          // Assert
          expect(result).toBe(true)
        })

        it('deve retornar false para telas com tamanhos diferentes', () => {
          // Arrange
          const screen1 = Screen.hydrate(VALID_SIZE, '2D')
          const screen2 = Screen.hydrate(VALID_SIZE + 5, '2D')

          // Act
          const result = screen1.equals(screen2)

          // Assert
          expect(result).toBe(false)
        })

        it('deve retornar false para telas com tipos diferentes', () => {
          // Arrange
          const screen1 = Screen.hydrate(VALID_SIZE, '2D')
          const screen2 = Screen.hydrate(VALID_SIZE, '3D')

          // Act
          const result = screen1.equals(screen2)

          // Assert
          expect(result).toBe(false)
        })

        it('deve retornar false quando comparado com null', () => {
          // Arrange
          const screen = Screen.hydrate(VALID_SIZE, '2D')

          // Act
          const result = screen.equals(null as any)

          // Assert
          expect(result).toBe(false)
        })

        it('deve retornar false quando comparado com undefined', () => {
          // Arrange
          const screen = Screen.hydrate(VALID_SIZE, '2D')

          // Act
          const result = screen.equals(undefined as any)

          // Assert
          expect(result).toBe(false)
        })
      })
    })
  })
})
