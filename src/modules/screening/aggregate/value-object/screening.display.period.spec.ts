import { ScreeningDisplayPeriod, ScreeningStatus } from './screening.display.period'
import { TechnicalError } from '@shared/error/technical.error'
import { FailureCode } from '@shared/failure/failure.codes.enum'
import '@test/setup/jest.setup'

describe('ScreeningDisplayPeriod', () => {
  const FIXED_CURRENT_TIME = new Date('2024-01-01T12:00:00.000Z')

  beforeEach(() => {
    jest.useFakeTimers()
    jest.setSystemTime(FIXED_CURRENT_TIME)
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('create', () => {
    describe('deve criar um período de exibição válido', () => {
      const successCases = [
        {
          startsIn: new Date('2024-01-01T13:00:00.000Z'), // 1 hora no futuro
          endsIn: new Date('2024-01-01T15:00:00.000Z'), // 3 horas no futuro
          scenario: 'com horários futuros válidos',
        },
        {
          startsIn: new Date('2024-01-01T12:00:00.000Z'), // exatamente agora
          endsIn: new Date('2024-01-01T14:30:00.000Z'), // 2h30 no futuro
          scenario: 'com início no momento atual',
        },
        {
          startsIn: new Date('2024-01-01T11:56:00.000Z'), // 4 minutos atrás (dentro da margem)
          endsIn: new Date('2024-01-01T13:56:00.000Z'), // 2 horas de duração
          scenario: 'com início dentro da margem de 5 minutos',
        },
        {
          startsIn: new Date('2024-01-02T09:00:00.000Z'), // amanhã
          endsIn: new Date('2024-01-02T11:30:00.000Z'), // amanhã + 2h30
          scenario: 'com sessão para o dia seguinte',
        },
      ]

      successCases.forEach(({ startsIn, endsIn, scenario }) => {
        it(`objeto ScreeningDisplayPeriod ${scenario}`, () => {
          // Act
          const result = ScreeningDisplayPeriod.create(startsIn, endsIn)

          // Assert
          expect(result).toBeValidResultMatching<ScreeningDisplayPeriod>((period) => {
            expect(period.startsIn).toEqual(startsIn)
            expect(period.endsIn).toEqual(endsIn)
          })
        })
      })
    })

    describe('deve falhar ao criar um período de exibição inválido', () => {
      const failureCases = [
        {
          startsIn: null as unknown as Date,
          endsIn: new Date('2024-01-01T15:00:00.000Z'),
          scenario: 'quando a data de início é nula',
          code: FailureCode.MISSING_REQUIRED_DATA,
        },
        {
          startsIn: new Date('2024-01-01T13:00:00.000Z'),
          endsIn: null as unknown as Date,
          scenario: 'quando a data de fim é nula',
          code: FailureCode.MISSING_REQUIRED_DATA,
        },
        {
          startsIn: undefined as unknown as Date,
          endsIn: new Date('2024-01-01T15:00:00.000Z'),
          scenario: 'quando a data de início é indefinida',
          code: FailureCode.MISSING_REQUIRED_DATA,
        },
        {
          startsIn: new Date('2024-01-01T13:00:00.000Z'),
          endsIn: undefined as unknown as Date,
          scenario: 'quando a data de fim é indefinida',
          code: FailureCode.MISSING_REQUIRED_DATA,
        },
        {
          startsIn: new Date('2024-01-01T15:00:00.000Z'),
          endsIn: new Date('2024-01-01T13:00:00.000Z'),
          scenario: 'quando a data de início é posterior à data de fim',
          code: FailureCode.DATE_WITH_INVALID_SEQUENCE,
        },
        {
          startsIn: new Date('2024-01-01T13:00:00.000Z'),
          endsIn: new Date('2024-01-01T13:00:00.000Z'),
          scenario: 'quando as datas de início e fim são iguais',
          code: FailureCode.DATE_WITH_INVALID_SEQUENCE,
        },
        {
          startsIn: new Date('2024-01-01T11:54:00.000Z'), // 6 minutos atrás (fora da margem)
          endsIn: new Date('2024-01-01T13:54:00.000Z'),
          scenario: 'quando a data de início está no passado além da margem de 5 minutos',
          code: FailureCode.SCREENING_START_DATE_IN_PAST,
        },
        {
          startsIn: new Date('2024-01-01T10:00:00.000Z'), // 2 horas atrás
          endsIn: new Date('2024-01-01T12:00:00.000Z'),
          scenario: 'quando a data de início está muito no passado',
          code: FailureCode.SCREENING_START_DATE_IN_PAST,
        },
      ]

      failureCases.forEach(({ startsIn, endsIn, scenario, code }) => {
        it(`objeto ScreeningDisplayPeriod ${scenario}`, () => {
          // Act
          const result = ScreeningDisplayPeriod.create(startsIn, endsIn)

          // Assert
          expect(result).toBeInvalidResultWithSingleFailure(code)
        })
      })
    })
  })

  describe('hydrate', () => {
    it('deve criar um objeto ScreeningDisplayPeriod sem validação', () => {
      // Arrange
      const startsIn = new Date('2024-01-01T10:00:00.000Z') // no passado
      const endsIn = new Date('2024-01-01T12:00:00.000Z')

      // Act
      const result = ScreeningDisplayPeriod.hydrate(startsIn, endsIn)

      // Assert
      expect(result).toBeInstanceOf(ScreeningDisplayPeriod)
      expect(result.startsIn).toEqual(startsIn)
      expect(result.endsIn).toEqual(endsIn)
    })

    it('deve lançar um erro quando as datas são nulas ou indefinidas', () => {
      // Arrange
      const validDate = new Date('2024-01-01T12:00:00.000Z')
      const invalidValues: Array<Date> = [null as any, undefined as any]

      // Act & Assert
      invalidValues.forEach((invalidValue) => {
        expect(() => ScreeningDisplayPeriod.hydrate(invalidValue, validDate)).toThrow(TechnicalError)
        expect(() => ScreeningDisplayPeriod.hydrate(validDate, invalidValue)).toThrow(TechnicalError)
      })
    })
  })

  describe('screeningStatus', () => {
    it('deve retornar PRESALE quando a sessão ainda não iniciou', () => {
      // Arrange
      const startsIn = new Date('2024-01-01T13:00:00.000Z') // 1 hora no futuro
      const endsIn = new Date('2024-01-01T15:00:00.000Z')
      const period = ScreeningDisplayPeriod.hydrate(startsIn, endsIn)

      // Act
      const status = period.getScreeningStatus(FIXED_CURRENT_TIME)

      // Assert
      expect(status).toBe(ScreeningStatus.PRESALE)
    })

    it('deve retornar SHOWING quando a sessão está em andamento', () => {
      // Arrange
      const startsIn = new Date('2024-01-01T11:00:00.000Z') // 1 hora atrás
      const endsIn = new Date('2024-01-01T13:00:00.000Z') // 1 hora no futuro
      const period = ScreeningDisplayPeriod.hydrate(startsIn, endsIn)

      // Act
      const status = period.getScreeningStatus(FIXED_CURRENT_TIME)

      // Assert
      expect(status).toBe(ScreeningStatus.SHOWING)
    })

    it('deve retornar ENDED quando a sessão já terminou', () => {
      // Arrange
      const startsIn = new Date('2024-01-01T09:00:00.000Z') // 3 horas atrás
      const endsIn = new Date('2024-01-01T11:00:00.000Z') // 1 hora atrás
      const period = ScreeningDisplayPeriod.hydrate(startsIn, endsIn)

      // Act
      const status = period.getScreeningStatus(FIXED_CURRENT_TIME)

      // Assert
      expect(status).toBe(ScreeningStatus.ENDED)
    })

    it('deve retornar SHOWING quando o horário atual é exatamente o de início', () => {
      // Arrange
      const startsIn = new Date('2024-01-01T12:00:00.000Z') // exatamente agora
      const endsIn = new Date('2024-01-01T14:00:00.000Z')
      const period = ScreeningDisplayPeriod.hydrate(startsIn, endsIn)

      // Act
      const status = period.getScreeningStatus(FIXED_CURRENT_TIME)

      // Assert
      expect(status).toBe(ScreeningStatus.SHOWING)
    })

    it('deve retornar SHOWING quando o horário atual é exatamente o de fim', () => {
      // Arrange
      const startsIn = new Date('2024-01-01T10:00:00.000Z')
      const endsIn = new Date('2024-01-01T12:00:00.000Z') // exatamente agora
      const period = ScreeningDisplayPeriod.hydrate(startsIn, endsIn)

      // Act
      const status = period.getScreeningStatus(FIXED_CURRENT_TIME)

      // Assert
      expect(status).toBe(ScreeningStatus.SHOWING)
    })
  })

  describe('durationInMinutes', () => {
    describe('deve calcular corretamente a duração em minutos', () => {
      // Arrange
      const testCases = [
        {
          startsIn: new Date('2024-01-01T13:00:00.000Z'),
          endsIn: new Date('2024-01-01T15:00:00.000Z'),
          expectedDuration: 120, // 2 horas
          scenario: 'para uma sessão de 2 horas',
        },
        {
          startsIn: new Date('2024-01-01T14:00:00.000Z'),
          endsIn: new Date('2024-01-01T16:30:00.000Z'),
          expectedDuration: 150, // 2h30
          scenario: 'para uma sessão de 2 horas e 30 minutos',
        },
        {
          startsIn: new Date('2024-01-01T19:00:00.000Z'),
          endsIn: new Date('2024-01-01T20:45:00.000Z'),
          expectedDuration: 105, // 1h45
          scenario: 'para uma sessão de 1 hora e 45 minutos',
        },
        {
          startsIn: new Date('2024-01-01T22:00:00.000Z'),
          endsIn: new Date('2024-01-01T22:30:00.000Z'),
          expectedDuration: 30, // 30 minutos
          scenario: 'para uma sessão curta de 30 minutos',
        },
      ]

      testCases.forEach(({ startsIn, endsIn, expectedDuration, scenario }) => {
        it(`deve calcular ${expectedDuration} minutos ${scenario}`, () => {
          // Arrange
          const period = ScreeningDisplayPeriod.hydrate(startsIn, endsIn)

          // Act
          const duration = period.durationInMinutes

          // Assert
          expect(duration).toBe(expectedDuration)
        })
      })
    })

    it('deve arredondar para baixo durações com segundos', () => {
      // Arrange
      const startsIn = new Date('2024-01-01T13:00:00.000Z')
      const endsIn = new Date('2024-01-01T14:30:45.000Z') // 1h30m45s
      const period = ScreeningDisplayPeriod.hydrate(startsIn, endsIn)

      // Act
      const duration = period.durationInMinutes

      // Assert
      expect(duration).toBe(90) // deve arredondar para baixo, ignorando os 45 segundos
    })
  })

  describe('isAvailableForBooking', () => {
    it('deve retornar true quando a sessão está em pré-venda', () => {
      // Arrange
      const startsIn = new Date('2024-01-01T13:00:00.000Z') // 1 hora no futuro
      const endsIn = new Date('2024-01-01T15:00:00.000Z')
      const period = ScreeningDisplayPeriod.hydrate(startsIn, endsIn)

      // Act
      const isAvailable = period.isAvailableForBooking(FIXED_CURRENT_TIME)

      // Assert
      expect(isAvailable).toBe(true)
    })

    it('deve retornar false quando a sessão está em andamento', () => {
      // Arrange
      const startsIn = new Date('2024-01-01T11:00:00.000Z') // 1 hora atrás
      const endsIn = new Date('2024-01-01T13:00:00.000Z') // 1 hora no futuro
      const period = ScreeningDisplayPeriod.hydrate(startsIn, endsIn)

      // Act
      const isAvailable = period.isAvailableForBooking(FIXED_CURRENT_TIME)

      // Assert
      expect(isAvailable).toBe(false)
    })

    it('deve retornar false quando a sessão já terminou', () => {
      // Arrange
      const startsIn = new Date('2024-01-01T09:00:00.000Z') // 3 horas atrás
      const endsIn = new Date('2024-01-01T11:00:00.000Z') // 1 hora atrás
      const period = ScreeningDisplayPeriod.hydrate(startsIn, endsIn)

      // Act
      const isAvailable = period.isAvailableForBooking(FIXED_CURRENT_TIME)

      // Assert
      expect(isAvailable).toBe(false)
    })
  })
})
