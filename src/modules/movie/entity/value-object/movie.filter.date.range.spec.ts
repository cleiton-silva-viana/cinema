import { MovieFilterDateRange } from './movie.filter.date.range'
import { FailureCode } from '@shared/failure/failure.codes.enum'

describe('MovieFilterDateRange', () => {
  let now: Date

  beforeEach(() => (now = new Date(new Date().setHours(0, 0, 0, 0))))

  it('deve criar um MovieFilterDateRange válido', () => {
    // Arrange
    const startIn = new Date(now)
    const endIn = new Date(now)
    endIn.setDate(endIn.getDate() + 7) // Usar endIn ao invés de now

    // Act
    const result = MovieFilterDateRange.create(startIn, endIn)

    // Assert
    expect(result).toBeValidResultMatching<MovieFilterDateRange>((m) => {
      expect(m.startDate).toEqual(startIn)
      expect(m.endDate).toEqual(endIn)
    })
  })

  it('deve retornar um MovieFilterDateRange padrão', () => {
    // Act
    const result = MovieFilterDateRange.createDefault()

    // Assert
    expect(result).toBeDefined()
    const expectedEndDate = new Date(now)
    expectedEndDate.setDate(expectedEndDate.getDate() + 7)
    expect(result.startDate).toEqual(now)
    expect(result.endDate).toEqual(expectedEndDate)
  })

  it('deve falhar quando data de início estiver no passado', () => {
    // Arrange
    const pastDate = new Date(now.getTime() - 1 * 60000)
    const endIn = new Date(now.getTime() + 7 * 60000) // 7 dias no futuro

    // Act
    const result = MovieFilterDateRange.create(pastDate, endIn)

    // Assert
    expect(result).toBeInvalidResultWithSingleFailure(FailureCode.DATE_CANNOT_BE_PAST)
  })

  it('deve falhar quando data de for posterior à data de término', () => {
    // Arrange
    const futureDate = new Date(now.getTime() + (MovieFilterDateRange.MAX_DATE_RANGE_DAYS + 1) * 60000)
    const endIn = new Date(now.getTime() + 1 * 60000) // 1 dia no futuro

    // Act
    const result = MovieFilterDateRange.create(futureDate, endIn)

    // Assert
    expect(result).toBeInvalidResultWithSingleFailure(FailureCode.DATE_WITH_INVALID_SEQUENCE)
  })

  it('deve falhar quando dada de fim estiver antes de data de início', () => {
    // Arrange
    const startIn = new Date(now)
    const endIn = new Date(now.getTime() - 1 * 60000) // 1 dia no passado

    // Act
    const result = MovieFilterDateRange.create(startIn, endIn)

    // Assert
    expect(result).toBeInvalidResultWithSingleFailure(FailureCode.DATE_WITH_INVALID_SEQUENCE)
  })

  it('deve falhar quando o intervalo de datas for muito grande', () => {
    // Arrange
    const startIn = new Date(now)
    const endIn = new Date(now.getTime() + (MovieFilterDateRange.MAX_DATE_RANGE_DAYS + 1) * 24 * 60 * 60 * 1000)

    // Act
    const result = MovieFilterDateRange.create(startIn, endIn)

    // Assert
    expect(result).toBeInvalidResultWithSingleFailure(FailureCode.DATE_NOT_BEFORE_LIMIT)
  })

  it('deve retornar result de falha com múltiplas falhas', () => {
    // Arrange
    const pastDate = new Date(now.getTime() - 1 * 60000) // 1 dia no passado
    const futureDate = new Date(now.getTime() + (MovieFilterDateRange.MAX_FUTURE_DAYS + 1) * 60000)

    // Act
    const result = MovieFilterDateRange.create(pastDate, futureDate)

    // Assert
    expect(result).toBeInvalidResultWithSingleFailure(FailureCode.DATE_CANNOT_BE_PAST)
  })
})
