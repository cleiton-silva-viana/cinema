import { ScreeningDisplayPeriod, ScreeningStatus } from './screening.display.period'
import { TechnicalError } from '@shared/error/technical.error'
import { FailureCode } from '@shared/failure/failure.codes.enum'
import { validateAndCollect } from '@shared/validator/common.validators'
import { SimpleFailure } from '@shared/failure/simple.failure.type'

describe('ScreeningDisplayPeriod', () => {
  const mockCurrentTime = new Date(2024, 0, 1, 12, 0, 0) // 1º de janeiro de 2024, 12:00

  beforeAll(() => {
    jest.useFakeTimers()
    jest.setSystemTime(mockCurrentTime)
  })

  afterAll(() => {
    jest.useRealTimers()
  })

  describe('create', () => {
    let failures: SimpleFailure[]

    beforeEach(() => {
      failures = []
    })

    describe('deve criar um período de exibição válido', () => {
      const successCases = [
        {
          startsIn: new Date(2024, 0, 1, 13, 0, 0), // 1 hora no futuro
          endsIn: new Date(2024, 0, 1, 15, 0, 0), // 3 horas no futuro
          scenario: 'com horários futuros válidos',
        },
        {
          startsIn: new Date(2024, 0, 1, 12, 0, 0), // exatamente agora
          endsIn: new Date(2024, 0, 1, 14, 30, 0), // 2h30 no futuro
          scenario: 'com início no momento atual',
        },
        {
          startsIn: new Date(2024, 0, 1, 11, 56, 0), // 4 minutos atrás (dentro da margem)
          endsIn: new Date(2024, 0, 1, 13, 56, 0), // 2 horas de duração
          scenario: 'com início dentro da margem de 5 minutos',
        },
        {
          startsIn: new Date(2024, 0, 2, 9, 0, 0), // amanhã
          endsIn: new Date(2024, 0, 2, 11, 30, 0), // amanhã + 2h30
          scenario: 'com sessão para o dia seguinte',
        },
      ]

      successCases.forEach(({ startsIn, endsIn, scenario }) => {
        it(`objeto ScreeningDisplayPeriod ${scenario}`, () => {
          // Act
          const result = validateAndCollect(ScreeningDisplayPeriod.create(startsIn, endsIn), failures)

          // Assert
          expect(result).toBeDefined()
          expect(result.startsIn).toEqual(startsIn)
          expect(result.endsIn).toEqual(endsIn)
          expect(failures.length).toBe(0)
        })
      })
    })

    describe('deve falhar ao criar um período de exibição inválido', () => {
      const failureCases = [
        {
          startsIn: null as unknown as Date,
          endsIn: new Date(2024, 0, 1, 15, 0, 0),
          scenario: 'quando a data de início é nula',
          errorCodeExpected: FailureCode.MISSING_REQUIRED_DATA,
        },
        {
          startsIn: new Date(2024, 0, 1, 13, 0, 0),
          endsIn: null as unknown as Date,
          scenario: 'quando a data de fim é nula',
          errorCodeExpected: FailureCode.MISSING_REQUIRED_DATA,
        },
        {
          startsIn: undefined as unknown as Date,
          endsIn: new Date(2024, 0, 1, 15, 0, 0),
          scenario: 'quando a data de início é indefinida',
          errorCodeExpected: FailureCode.MISSING_REQUIRED_DATA,
        },
        {
          startsIn: new Date(2024, 0, 1, 13, 0, 0),
          endsIn: undefined as unknown as Date,
          scenario: 'quando a data de fim é indefinida',
          errorCodeExpected: FailureCode.MISSING_REQUIRED_DATA,
        },
        {
          startsIn: new Date(2024, 0, 1, 15, 0, 0),
          endsIn: new Date(2024, 0, 1, 13, 0, 0),
          scenario: 'quando a data de início é posterior à data de fim',
          errorCodeExpected: FailureCode.DATE_WITH_INVALID_SEQUENCE,
        },
        {
          startsIn: new Date(2024, 0, 1, 13, 0, 0),
          endsIn: new Date(2024, 0, 1, 13, 0, 0),
          scenario: 'quando as datas de início e fim são iguais',
          errorCodeExpected: FailureCode.DATE_WITH_INVALID_SEQUENCE,
        },
        {
          startsIn: new Date(2024, 0, 1, 11, 54, 0), // 6 minutos atrás (fora da margem)
          endsIn: new Date(2024, 0, 1, 13, 54, 0),
          scenario: 'quando a data de início está no passado além da margem de 5 minutos',
          errorCodeExpected: FailureCode.SCREENING_START_DATE_IN_PAST,
        },
        {
          startsIn: new Date(2024, 0, 1, 10, 0, 0), // 2 horas atrás
          endsIn: new Date(2024, 0, 1, 12, 0, 0),
          scenario: 'quando a data de início está muito no passado',
          errorCodeExpected: FailureCode.SCREENING_START_DATE_IN_PAST,
        },
      ]

      failureCases.forEach(({ startsIn, endsIn, scenario, errorCodeExpected }) => {
        it(`objeto ScreeningDisplayPeriod ${scenario}`, () => {
          // Act
          const result = validateAndCollect(ScreeningDisplayPeriod.create(startsIn, endsIn), failures)

          // Assert
          expect(result).toBeNull()
          expect(failures.length).toBe(1)
          expect(failures[0].code).toBe(errorCodeExpected)
        })
      })
    })
  })

  describe('hydrate', () => {
    it('deve criar um objeto ScreeningDisplayPeriod sem validação', () => {
      // Arrange
      const startsIn = new Date(2024, 0, 1, 10, 0, 0) // no passado
      const endsIn = new Date(2024, 0, 1, 12, 0, 0)

      // Act
      const result = ScreeningDisplayPeriod.hydrate(startsIn, endsIn)

      // Assert
      expect(result).toBeInstanceOf(ScreeningDisplayPeriod)
      expect(result.startsIn).toEqual(startsIn)
      expect(result.endsIn).toEqual(endsIn)
    })

    it('deve lançar um erro quando as datas são nulas ou indefinidas', () => {
      // Arrange
      const validDate = new Date(2024, 0, 1, 12, 0, 0)
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
      const startsIn = new Date(2024, 0, 1, 13, 0, 0) // 1 hora no futuro
      const endsIn = new Date(2024, 0, 1, 15, 0, 0)
      const period = ScreeningDisplayPeriod.hydrate(startsIn, endsIn)

      // Act
      const status = period.screeningStatus

      // Assert
      expect(status).toBe(ScreeningStatus.PRESALE)
    })

    it('deve retornar SHOWING quando a sessão está em andamento', () => {
      // Arrange
      const startsIn = new Date(2024, 0, 1, 11, 0, 0) // 1 hora atrás
      const endsIn = new Date(2024, 0, 1, 13, 0, 0) // 1 hora no futuro
      const period = ScreeningDisplayPeriod.hydrate(startsIn, endsIn)

      // Act
      const status = period.screeningStatus

      // Assert
      expect(status).toBe(ScreeningStatus.SHOWING)
    })

    it('deve retornar ENDED quando a sessão já terminou', () => {
      // Arrange
      const startsIn = new Date(2024, 0, 1, 9, 0, 0) // 3 horas atrás
      const endsIn = new Date(2024, 0, 1, 11, 0, 0) // 1 hora atrás
      const period = ScreeningDisplayPeriod.hydrate(startsIn, endsIn)

      // Act
      const status = period.screeningStatus

      // Assert
      expect(status).toBe(ScreeningStatus.ENDED)
    })

    it('deve retornar SHOWING quando o horário atual é exatamente o de início', () => {
      // Arrange
      const startsIn = new Date(2024, 0, 1, 12, 0, 0) // exatamente agora
      const endsIn = new Date(2024, 0, 1, 14, 0, 0)
      const period = ScreeningDisplayPeriod.hydrate(startsIn, endsIn)

      // Act
      const status = period.screeningStatus

      // Assert
      expect(status).toBe(ScreeningStatus.SHOWING)
    })

    it('deve retornar SHOWING quando o horário atual é exatamente o de fim', () => {
      // Arrange
      const startsIn = new Date(2024, 0, 1, 10, 0, 0)
      const endsIn = new Date(2024, 0, 1, 12, 0, 0) // exatamente agora
      const period = ScreeningDisplayPeriod.hydrate(startsIn, endsIn)

      // Act
      const status = period.screeningStatus

      // Assert
      expect(status).toBe(ScreeningStatus.SHOWING)
    })
  })

  describe('durationInMinutes', () => {
    describe('deve calcular corretamente a duração em minutos', () => {
      // Arrange
      const testCases = [
        {
          startsIn: new Date(2024, 0, 1, 13, 0, 0),
          endsIn: new Date(2024, 0, 1, 15, 0, 0),
          expectedDuration: 120, // 2 horas
          scenario: 'para uma sessão de 2 horas',
        },
        {
          startsIn: new Date(2024, 0, 1, 14, 0, 0),
          endsIn: new Date(2024, 0, 1, 16, 30, 0),
          expectedDuration: 150, // 2h30
          scenario: 'para uma sessão de 2 horas e 30 minutos',
        },
        {
          startsIn: new Date(2024, 0, 1, 19, 0, 0),
          endsIn: new Date(2024, 0, 1, 20, 45, 0),
          expectedDuration: 105, // 1h45
          scenario: 'para uma sessão de 1 hora e 45 minutos',
        },
        {
          startsIn: new Date(2024, 0, 1, 22, 0, 0),
          endsIn: new Date(2024, 0, 1, 22, 30, 0),
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
      const startsIn = new Date(2024, 0, 1, 13, 0, 0)
      const endsIn = new Date(2024, 0, 1, 14, 30, 45) // 1h30m45s
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
      const startsIn = new Date(2024, 0, 1, 13, 0, 0) // 1 hora no futuro
      const endsIn = new Date(2024, 0, 1, 15, 0, 0)
      const period = ScreeningDisplayPeriod.hydrate(startsIn, endsIn)

      // Act
      const isAvailable = period.isAvailableForBooking

      // Assert
      expect(isAvailable).toBe(true)
    })

    it('deve retornar false quando a sessão está em andamento', () => {
      // Arrange
      const startsIn = new Date(2024, 0, 1, 11, 0, 0) // 1 hora atrás
      const endsIn = new Date(2024, 0, 1, 13, 0, 0) // 1 hora no futuro
      const period = ScreeningDisplayPeriod.hydrate(startsIn, endsIn)

      // Act
      const isAvailable = period.isAvailableForBooking

      // Assert
      expect(isAvailable).toBe(false)
    })

    it('deve retornar false quando a sessão já terminou', () => {
      // Arrange
      const startsIn = new Date(2024, 0, 1, 9, 0, 0) // 3 horas atrás
      const endsIn = new Date(2024, 0, 1, 11, 0, 0) // 1 hora atrás
      const period = ScreeningDisplayPeriod.hydrate(startsIn, endsIn)

      // Act
      const isAvailable = period.isAvailableForBooking

      // Assert
      expect(isAvailable).toBe(false)
    })
  })
})
