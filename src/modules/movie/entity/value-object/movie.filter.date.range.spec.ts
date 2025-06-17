import { MovieFilterDateRange } from './movie.filter.date.range'
import { FailureCode } from '@shared/failure/failure.codes.enum'
import { DateHelper } from '@shared/helper/date.helper'

describe('MovieFilterDateRange', () => {
  describe('create', () => {
    it('deve criar um MovieFilterDateRange válido', () => {
      // Arrange
      const startIn = DateHelper.soon(0)
      const endIn = DateHelper.soon(7)

      // Act
      const result = MovieFilterDateRange.create(startIn, endIn)

      // Assert
      expect(result).toBeValidResultMatching<MovieFilterDateRange>((m) => {
        expect(m.startDate).toEqual(startIn)
        expect(m.endDate).toEqual(endIn)
      })
    })

    it('deve falhar quando data de início estiver no passado', () => {
      // Arrange
      const pastDate = DateHelper.recent(1)
      const endIn = DateHelper.soon(7)

      // Act
      const result = MovieFilterDateRange.create(pastDate, endIn)

      // Assert
      expect(result).toBeInvalidResultWithSingleFailure(FailureCode.DATE_CANNOT_BE_PAST)
    })

    it('deve falhar quando data de inicio posterior à data de término', () => {
      // Arrange
      const futureDate = DateHelper.soon(MovieFilterDateRange.MAX_DATE_RANGE_DAYS + 1)
      const endIn = DateHelper.soon(11)

      // Act
      const result = MovieFilterDateRange.create(futureDate, endIn)

      // Assert
      expect(result).toBeInvalidResultWithSingleFailure(FailureCode.DATE_WITH_INVALID_SEQUENCE)
    })

    it('deve falhar quando dada de fim estiver antes de data de início', () => {
      // Arrange
      const startIn = DateHelper.soon(0)
      const endIn = DateHelper.recent(1)

      // Act
      const result = MovieFilterDateRange.create(startIn, endIn)

      // Assert
      expect(result).toBeInvalidResultWithSingleFailure(FailureCode.DATE_WITH_INVALID_SEQUENCE)
    })

    it('deve falhar quando o intervalo de datas for muito grande', () => {
      // Arrange
      const startIn = DateHelper.soon(0)
      const endIn = DateHelper.soon(MovieFilterDateRange.MAX_DATE_RANGE_DAYS + 1)

      // Act
      const result = MovieFilterDateRange.create(startIn, endIn)

      // Assert
      expect(result).toBeInvalidResultWithSingleFailure(FailureCode.DATE_RANGE_TOO_LARGE)
    })

    it('deve retornar result de falha com múltiplas falhas', () => {
      // Arrange
      const pastDate = DateHelper.recent(1)
      const futureDate = DateHelper.soon(1)

      // Act
      const result = MovieFilterDateRange.create(pastDate, futureDate)

      // Assert
      expect(result).toBeInvalidResultWithSingleFailure(FailureCode.DATE_CANNOT_BE_PAST)
    })
  })

  describe('createDefault', () => {
    it('deve retornar um MovieFilterDateRange padrão', () => {
      // Arrange
      const expectedStartDate = DateHelper.startOfDay(new Date())
      const expectedEndDate = DateHelper.endOfDay(DateHelper.soon(MovieFilterDateRange.DEFAULT_DATE_RANGE_DAYS))

      // Act
      const result = MovieFilterDateRange.createDefault()

      // Assert
      expect(result).toBeDefined()
      expect(result.startDate).toEqual(expectedStartDate)
      expect(result.endDate).toEqual(expectedEndDate)
    })
  })
})
