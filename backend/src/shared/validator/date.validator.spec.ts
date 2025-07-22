import { FailureCode } from '../failure/failure.codes.enum'
import { FailureFactory } from '../failure/failure.factory'
import { SimpleFailure } from '../failure/simple.failure.type'
import { DateValidator } from './date.validator'

describe('DateValidator', () => {
  const startDate = new Date('2023-01-01')
  const endDate = new Date('2023-03-01')
  const ONE_DAY = 24 * 60 * 60 * 1000

  const dataBefore = new Date(startDate.getTime() - ONE_DAY)
  const dataMiddle = new Date(startDate.getTime() + ONE_DAY)
  const FAILURE = FailureFactory.MISSING_VALID_ITEM('item')

  let failures: SimpleFailure[]

  beforeEach(() => (failures = []))

  describe('Construtor e inicialização', () => {
    it('deve criar uma instância válida com uma data', () => {
      // Arrange & Act
      const validator = new DateValidator({ data: new Date() }, [])

      // Assert
      expect(validator).toBeInstanceOf(DateValidator)
    })

    it('deve lidar com valores null', () => {
      // Arrange & Act & Assert
      expect(() => new DateValidator({ data: null as any }, [])).not.toThrow()
    })

    it('deve lidar com valores undefined', () => {
      // Arrange & Act & Assert
      expect(() => new DateValidator({ data: undefined as any }, [])).not.toThrow()
    })

    it('deve lidar com valores que não são datas', () => {
      // Arrange & Act & Assert
      expect(() => new DateValidator({ data: '2023-01-01' as any }, [])).not.toThrow()
      expect(() => new DateValidator({ data: 123 as any }, [])).not.toThrow()
      expect(() => new DateValidator({ data: {} as any }, [])).not.toThrow()
    })
  })

  describe('isAfter', () => {
    it('não deve adicionar falha quando a data for posterior à data limite', () => {
      // Act
      new DateValidator({ data: dataMiddle }, failures).isAfter(startDate)

      // Assert
      expect(failures).toHaveLength(0)
    })

    it('deve adicionar falha quando a data não for posterior à data limite', () => {
      // Act
      new DateValidator({ data: startDate }, failures).isAfter(endDate)

      // Assert
      expect(failures).toHaveLength(1)
      expect(failures[0].code).toBe(FailureCode.DATE_NOT_AFTER_LIMIT)
    })

    it('deve usar a falha personalizada', () => {
      // Act
      new DateValidator({ data: startDate }, failures).isAfter(endDate, () => FAILURE)

      // Assert
      expect(failures).toHaveLength(1)
      expect(failures[0].code).toBe(FAILURE.code)
    })

    it('deve lidar com limit date inválido', () => {
      // Arrange
      const invalidDate: any[] = [null, undefined]

      // Act & Assert
      for (const date of invalidDate) {
        expect(() => {
          new DateValidator({ data: startDate }, []).isAfter(date)
        }).toThrowTechnicalError()
      }
    })

    it('deve adicionar falha quando a data for um valor falsy', () => {
      // Act
      new DateValidator({ data: null as unknown as Date }, failures).isAfter(endDate)

      // Assert
      expect(failures.length).toBeGreaterThan(0)
      expect(failures[0].code).toBe(FailureCode.DATE_NOT_AFTER_LIMIT)
    })
  })

  describe('isBefore', () => {
    it('não deve adicionar falha quando a data for anterior à data limite', () => {
      // Act
      new DateValidator({ data: startDate }, failures).isBefore(endDate)

      // Assert
      expect(failures).toHaveLength(0)
    })

    it('deve adicionar falha quando a data não for anterior à data limite', () => {
      // Act
      new DateValidator({ data: endDate }, failures).isBefore(startDate)

      // Assert
      expect(failures).toHaveLength(1)
      expect(failures[0].code).toBe(FailureCode.DATE_NOT_BEFORE_LIMIT)
    })

    it('deve adicionar falha quando a data for um valor valor falsy', () => {
      // Act
      new DateValidator({ data: null as unknown as Date }, failures).isBefore(endDate)

      // Assert
      expect(failures).toHaveLength(1)
      expect(failures[0].code).toBe(FailureCode.DATE_NOT_BEFORE_LIMIT)
    })

    it('deve usar uma falha personalizado', () => {
      // Act
      new DateValidator({ data: endDate }, failures).isBefore(startDate, () => FAILURE)

      // Assert
      expect(failures).toHaveLength(1)
      expect(failures[0]).toEqual(FAILURE)
    })

    it('deve lidar com limitDate inválido', () => {
      // Arrange
      const invalidLimits: any[] = [null, undefined]

      for (const limit of invalidLimits) {
        expect(() => {
          new DateValidator({ data: startDate }, []).isBefore(limit)
        }).toThrowTechnicalError()
      }
    })
  })

  describe('isBetween', () => {
    it('não deve adicionar falha quando a data estiver entre as datas de início e fim', () => {
      // Act
      new DateValidator({ data: dataMiddle }, failures).isBetween(startDate, endDate)

      // Assert
      expect(failures).toHaveLength(0)
    })

    it('deve adicionar falha quando a data não estiver entre as datas de início e fim', () => {
      // Act
      new DateValidator({ data: dataBefore }, failures).isBetween(startDate, endDate)

      // Assert
      expect(failures).toHaveLength(1)
      expect(failures[0].code).toBe(FailureCode.DATE_IS_OUT_OF_RANGE)
    })

    it('deve adicionar falha quando a data de início for posterior à data de fim', () => {
      // Act
      new DateValidator({ data: dataMiddle }, failures).isBetween(endDate, startDate)

      // Assert
      expect(failures).toHaveLength(1)
      expect(failures[0].code).toBe(FailureCode.DATE_WITH_INVALID_SEQUENCE)
    })

    it('deve usar uma falha personalizado', () => {
      // Act
      new DateValidator({ data: dataBefore }, failures).isBetween(startDate, endDate, () => FAILURE)

      // Assert
      expect(failures).toHaveLength(1)
      expect(failures[0]).toEqual(FAILURE)
    })

    it('deve lidar com startDate ou endDate inválidos', () => {
      // Arrange
      const invalidDates: any[] = [null, undefined]

      // Assert
      for (const invalidDate of invalidDates) {
        expect(() =>
          new DateValidator({ data: dataMiddle }, []).isBetween(invalidDate, endDate)
        ).toThrowTechnicalError()
        expect(() =>
          new DateValidator({ data: dataMiddle }, []).isBetween(startDate, invalidDate)
        ).toThrowTechnicalError()
      }
    })

    it('deve adicionar falha quando a data for um valor falsy', () => {
      // Act
      new DateValidator({ data: null as unknown as Date }, failures).isBetween(startDate, endDate)

      // Assert
      expect(failures).toHaveLength(1)
      expect(failures[0].code).toBe(FailureCode.CONTENT_WITH_INVALID_TYPE)
    })
  })

  describe('encadeamento de validações', () => {
    it('deve acumular falhas quando múltiplas validações falham', () => {
      // Arrange
      const value = new Date('2023-01-01')

      // Act
      new DateValidator({ data: value }, failures)
        .isAfter(new Date('2023-02-01'))
        .continue()
        .isBefore(new Date('2022-12-01'))
        .continue()
        .isBetween(new Date('2023-02-01'), new Date('2023-02-28'))

      // Assert
      expect(failures).toHaveLength(3)
      expect(failures[0].code).toBe(FailureCode.DATE_NOT_AFTER_LIMIT)
      expect(failures[1].code).toBe(FailureCode.DATE_NOT_BEFORE_LIMIT)
      expect(failures[2].code).toBe(FailureCode.DATE_IS_OUT_OF_RANGE)
    })

    it('deve parar de validar após o primeiro erro quando stopOnFirstFailure é usado', () => {
      // Arrange
      const value = new Date('2023-01-01')

      // Act
      new DateValidator({ data: value }, failures).isAfter(new Date('2023-02-01')).isBefore(new Date('2022-12-01'))

      // Assert
      expect(failures).toHaveLength(1)
      expect(failures[0].code).toBe(FailureCode.DATE_NOT_AFTER_LIMIT)
    })

    it('não deve lançar um erro quando um valor nulo é passado para um fluxo de validação', () => {
      // Act
      new DateValidator({ data: null as unknown as Date }, failures)
        .isAfter(new Date())
        .isBefore(new Date())
        .isBetween(new Date(), new Date())

      // Assert
      expect(failures).toHaveLength(1)
      expect(failures[0].code).toBe(FailureCode.DATE_NOT_AFTER_LIMIT)
    })
  })
})
