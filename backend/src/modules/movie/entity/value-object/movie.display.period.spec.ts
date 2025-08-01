import { MovieDisplayPeriod, ScreeningStatus } from './movie.display.period'
import { FailureCode } from '@shared/failure/failure.codes.enum'

describe('MovieDisplayPeriod', () => {
  const ONE_DAY = 1000 * 60 * 60 * 24
  const NOW = new Date()
  const FUTURE_DATE = new Date(Date.now() + 10 * ONE_DAY) // 10 dias no futuro
  const FAR_FUTURE_DATE = new Date(Date.now() + 20 * ONE_DAY) // 20 dias no futuro
  const PAST_DATE = new Date(Date.now() - 10 * ONE_DAY) // 10 dias no passado

  let originalDateNow: () => number

  beforeEach(() => {
    originalDateNow = Date.now
  })

  afterEach(() => {
    Date.now = originalDateNow
  })

  describe('Métodos Estáticos', () => {
    describe('create', () => {
      describe('períodos válidos', () => {
        const minEndDate = new Date(FUTURE_DATE.getTime() + 14 * ONE_DAY) // 14 dias exatos
        const midEndDate = new Date(FUTURE_DATE.getTime() + 20 * ONE_DAY) // 20 dias (intermediário)
        const maxEndDate = new Date(FUTURE_DATE.getTime() + 30 * ONE_DAY) // 30 dias exatos

        const successCases = [
          {
            startDate: FUTURE_DATE,
            endDate: minEndDate,
            scenario: 'com diferença mínima exata de 14 dias',
          },
          {
            startDate: FUTURE_DATE,
            endDate: midEndDate,
            scenario: 'com diferença intermediária de 20 dias',
          },
          {
            startDate: FUTURE_DATE,
            endDate: maxEndDate,
            scenario: 'com diferença máxima exata de 30 dias',
          },
        ]

        successCases.forEach(({ startDate, endDate, scenario }) => {
          it(`deve criar um período de exibição ${scenario}`, () => {
            // Act
            const result = MovieDisplayPeriod.create(startDate, endDate)

            // Assert
            expect(result).toBeValidResultMatching<MovieDisplayPeriod>((m) => {
              expect(m.startDate).toBe(startDate)
              expect(m.endDate).toBe(endDate)
            })
          })
        })
      })

      describe('deve retornar um erro quando o período é inválido', () => {
        const failureCases = [
          {
            scenario: 'com data de início no passado',
            startDate: PAST_DATE,
            endDate: FAR_FUTURE_DATE,
            code: FailureCode.DATE_CANNOT_BE_PAST,
          },
          {
            scenario: 'com data de início nula',
            startDate: null as unknown as Date,
            endDate: FAR_FUTURE_DATE,
            code: FailureCode.MISSING_REQUIRED_DATA,
          },
          {
            scenario: 'com data de término nula',
            startDate: FUTURE_DATE,
            endDate: null as unknown as Date,
            code: FailureCode.MISSING_REQUIRED_DATA,
          },
          {
            scenario: 'com data de término igual à data de início',
            startDate: FUTURE_DATE,
            endDate: FUTURE_DATE,
            code: FailureCode.DATE_WITH_INVALID_SEQUENCE,
          },
          {
            scenario: 'com data de término anterior ao mínimo (14 dias)',
            startDate: NOW,
            endDate: FUTURE_DATE,
            code: FailureCode.DATE_WITH_INVALID_SEQUENCE,
          },
          {
            scenario: 'com data de término muito distante',
            startDate: FUTURE_DATE,
            endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 60), // 60 dias no futuro
            code: FailureCode.DATE_NOT_BEFORE_LIMIT,
          },
        ]

        failureCases.forEach(({ startDate, endDate, scenario, code }) => {
          it(`deve rejeitar um período ${scenario}`, () => {
            // Act
            const result = MovieDisplayPeriod.create(startDate, endDate)

            // Assert
            expect(result).toBeInvalidResultWithSingleFailure(code)
          })
        })
      })
    })

    describe('hydrate', () => {
      it('deve hidratar um período corretamente', () => {
        // Act
        const hydrated = MovieDisplayPeriod.hydrate(FUTURE_DATE, FAR_FUTURE_DATE)

        // Assert
        expect(hydrated.startDate).toBe(FUTURE_DATE)
        expect(hydrated.endDate).toBe(FAR_FUTURE_DATE)
      })

      it('deve lançar erro técnico quando houver algum input nulo', () => {
        expect(() => MovieDisplayPeriod.hydrate(null as any, FUTURE_DATE)).toThrow(FailureCode.MISSING_REQUIRED_DATA)
        expect(() => MovieDisplayPeriod.hydrate(FUTURE_DATE, null as any)).toThrow(FailureCode.MISSING_REQUIRED_DATA)
        expect(() => MovieDisplayPeriod.hydrate(null as any, undefined as any)).toThrow(
          FailureCode.MISSING_REQUIRED_DATA
        )
      })
    })
  })

  describe('Métodos de Instância', () => {
    describe('getScreeningStatus', () => {
      const testCases = [
        {
          scenario: 'deve retornar PRESALE quando a data atual é anterior à data de início',
          startDate: FUTURE_DATE,
          endDate: FAR_FUTURE_DATE,
          expectedStatus: ScreeningStatus.PRESALE,
        },
        {
          scenario: 'deve retornar SHOWING quando a data atual está entre as datas de início e fim',
          startDate: new Date(Date.now() - ONE_DAY), // 1 dia atrás
          endDate: new Date(Date.now() + ONE_DAY), // 1 dia à frente
          expectedStatus: ScreeningStatus.SHOWING,
        },
        {
          scenario: 'deve retornar ENDED quando a data atual é posterior à data de término',
          startDate: new Date(Date.now() - 2 * ONE_DAY), // 2 dias atrás
          endDate: new Date(Date.now() - ONE_DAY), // 1 dia atrás
          expectedStatus: ScreeningStatus.ENDED,
        },
      ]

      testCases.forEach(({ scenario, startDate, endDate, expectedStatus }) => {
        it(scenario, () => {
          // Arrange
          const displayPeriod = MovieDisplayPeriod.hydrate(startDate, endDate)

          // Act
          const result = displayPeriod.screeningStatus

          // Assert
          expect(result).toBe(expectedStatus)
        })
      })
    })

    describe('isActive', () => {
      it('deve retornar true quando o período está ativo', () => {
        // Arrange
        const startDate = new Date(Date.now() - ONE_DAY) // 1 dia atrás
        const endDate = new Date(Date.now() + ONE_DAY) // // 1 dia à frente
        const displayPeriod = MovieDisplayPeriod.hydrate(startDate, endDate)

        // Act
        const result = displayPeriod.isActive

        // Assert
        expect(result).toBe(true)
      })

      const testCases = [
        {
          scenario: 'deve retornar false quando o período ainda não começou',
          startDate: FUTURE_DATE,
          endDate: FAR_FUTURE_DATE,
        },
        {
          scenario: 'deve retornar false quando o período já terminou',
          startDate: new Date(Date.now() - 2 * ONE_DAY), // 2 dias atrás
          endDate: new Date(Date.now() - ONE_DAY), // 1 dia atrás
        },
      ]

      testCases.forEach(({ scenario, startDate, endDate }) => {
        it(scenario, () => {
          // Arrange
          const displayPeriod = MovieDisplayPeriod.hydrate(startDate, endDate)

          // Act
          const result = displayPeriod.isActive

          // Assert
          expect(result).toBe(false)
        })
      })
    })

    describe('hasEnded', () => {
      const testCases = [
        {
          scenario: 'deve retornar true quando o período já terminou',
          startDate: new Date(Date.now() - 2 * ONE_DAY), // 2 dias atrás
          endDate: new Date(Date.now() - ONE_DAY), // 1 dia atrás
          expected: true,
        },
        {
          scenario: 'deve retornar false quando o período ainda não terminou',
          startDate: new Date(Date.now() - ONE_DAY), // 1 dia atrás
          endDate: new Date(Date.now() + ONE_DAY), // 1 dia à frente
          expected: false,
        },
      ]

      testCases.forEach(({ scenario, startDate, endDate, expected }) => {
        it(scenario, () => {
          // Arrange
          const displayPeriod = MovieDisplayPeriod.hydrate(startDate, endDate)

          // Act
          const result = displayPeriod.hasEnded

          // Assert
          expect(result).toBe(expected)
        })
      })
    })

    describe('hasNotStarted', () => {
      const testCases = [
        {
          scenario: 'deve retornar true quando o período ainda não começou',
          startDate: FUTURE_DATE,
          endDate: FAR_FUTURE_DATE,
          expected: true,
        },
        {
          scenario: 'deve retornar false quando o período já começou',
          startDate: new Date(Date.now() - ONE_DAY), // 1 dia atrás
          endDate: new Date(Date.now() + ONE_DAY), // 1 dia à frente
          expected: false,
        },
      ]

      testCases.forEach(({ scenario, startDate, endDate, expected }) => {
        it(scenario, () => {
          // Arrange
          const displayPeriod = MovieDisplayPeriod.hydrate(startDate, endDate)

          // Act
          const result = displayPeriod.hasNotStarted

          // Assert
          expect(result).toBe(expected)
        })
      })
    })

    describe('isAvailableInRange', () => {
      describe('períodos válidos', () => {
        const successCases = [
          {
            scenario: 'quando o período solicitado se sobrepõe ao início do período de exibição',
            rangeStart: new Date(FUTURE_DATE.getTime() - ONE_DAY),
            rangeEnd: new Date(FUTURE_DATE.getTime() + ONE_DAY),
          },
          {
            scenario: 'quando o período solicitado se sobrepõe ao fim do período de exibição',
            rangeStart: new Date(FAR_FUTURE_DATE.getTime() - ONE_DAY),
            rangeEnd: new Date(FAR_FUTURE_DATE.getTime() + ONE_DAY),
          },
          {
            scenario: 'quando o período solicitado está totalmente contido no período de exibição',
            rangeStart: new Date(FUTURE_DATE.getTime() + ONE_DAY),
            rangeEnd: new Date(FAR_FUTURE_DATE.getTime() - ONE_DAY),
          },
          {
            scenario: 'quando o período de exibição está totalmente contido no período solicitado',
            rangeStart: new Date(FUTURE_DATE.getTime() - ONE_DAY),
            rangeEnd: new Date(FAR_FUTURE_DATE.getTime() + ONE_DAY),
          },
          {
            scenario: 'quando os períodos têm exatamente as mesmas datas de início e fim',
            rangeStart: FUTURE_DATE,
            rangeEnd: FAR_FUTURE_DATE,
          },
        ]

        successCases.forEach(({ scenario, rangeStart, rangeEnd }) => {
          it(`deve retornar true ${scenario}`, () => {
            // Arrange
            const displayPeriod = MovieDisplayPeriod.hydrate(FUTURE_DATE, FAR_FUTURE_DATE)

            // Act
            const result = displayPeriod.isAvailableInRange(rangeStart, rangeEnd)

            // Assert
            expect(result).toBe(true)
          })
        })
      })
      describe('períodos inválidos', () => {
        const failureCases = [
          {
            scenario: 'quando o período solicitado é anterior ao período de exibição',
            rangeStart: PAST_DATE,
            rangeEnd: new Date(PAST_DATE.getTime() + ONE_DAY),
          },
          {
            scenario: 'quando o período solicitado é posterior período de exibição',
            rangeStart: new Date(FAR_FUTURE_DATE.getTime() + ONE_DAY),
            rangeEnd: new Date(FAR_FUTURE_DATE.getTime() + 2 * ONE_DAY),
          },
          {
            scenario: 'quando a data inicial é inválida',
            rangeStart: null as any,
            rangeEnd: FAR_FUTURE_DATE,
          },
          {
            scenario: 'quando a data final é inválida',
            rangeStart: FUTURE_DATE,
            rangeEnd: undefined as any,
          },
        ]

        failureCases.forEach(({ scenario, rangeStart, rangeEnd }) => {
          it(`deve retornar false ${scenario}`, () => {
            // Arrange
            const displayPeriod = MovieDisplayPeriod.hydrate(FUTURE_DATE, FAR_FUTURE_DATE)

            // Act
            const result = displayPeriod.isAvailableInRange(rangeStart, rangeEnd)

            // Assert
            expect(result).toBe(false)
          })
        })
      })
    })
  })
})
