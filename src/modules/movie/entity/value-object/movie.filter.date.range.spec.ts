import { MovieFilterDateRange } from './movie.filter.date.range'
import { FailureCode } from '@shared/failure/failure.codes.enum'
import { SimpleFailure } from '@shared/failure/simple.failure.type'
import { validateAndCollect } from '@shared/validator/common.validators'

describe('MovieFilterDateRange', () => {
  let failures: SimpleFailure[]
  const now = new Date()
  now.setHours(0, 0, 0, 0)

  beforeEach(() => (failures = []))

  it('deve criar um MovieFilterDateRange válido', () => {
    // Arrange
    const startIn = new Date(now)
    const endIn = new Date(now)
    endIn.setDate(now.getDate() + 7)

    // Act
    const result = validateAndCollect(MovieFilterDateRange.create(startIn, endIn), failures)

    // Assert
    expect(result).toBeDefined()
    expect(result).toBeInstanceOf(MovieFilterDateRange)
    expect(result.startDate).toEqual(startIn)
    expect(result.endDate).toEqual(endIn)
  })

  it('deve retornar um MovieFilterDateRange padrão', () => {
    // Act
    const intervaloDataPadrao = MovieFilterDateRange.createDefault()

    // Assert
    expect(intervaloDataPadrao).toBeInstanceOf(MovieFilterDateRange)
    expect(intervaloDataPadrao.startDate).toEqual(now)
    expect(intervaloDataPadrao.endDate).toEqual(new Date(now.setDate(now.getDate() + 7)))
  })

  it('deve falhar quando data de início estiver no passado', () => {
    // Arrange
    const pastDate = new Date()
    pastDate.setDate(now.getDate() - 1)
    const endIn = new Date()
    endIn.setDate(now.getDate() + 7)

    // Act
    const result = validateAndCollect(MovieFilterDateRange.create(pastDate, endIn), failures)

    // Assert
    expect(result).toBeNull()
    expect(failures[0].code).toBe(FailureCode.DATE_CANNOT_BE_PAST)
  })

  it('deve falhar quando data de início estiver muito longe no futuro', () => {
    // Arrange
    const dataFutura = new Date(now)
    dataFutura.setDate(now.getDate() + MovieFilterDateRange.MAX_FUTURE_DAYS + 1)
    const endIn = new Date(now)

    // Act
    const result = validateAndCollect(MovieFilterDateRange.create(dataFutura, endIn), failures)

    // Assert
    expect(result).toBeNull()
  })

  it('deve falhar quando dada de fim estiver antes de data de início', () => {
    // Arrange
    const startIn = new Date(now)
    const endIn = new Date(now)
    endIn.setDate(now.getDate() - 1)

    // Act
    const result = validateAndCollect(MovieFilterDateRange.create(startIn, endIn), failures)

    // Assert
    expect(result).toBeNull()
    expect(failures).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: FailureCode.DATE_WITH_INVALID_SEQUENCE,
        }),
      ])
    )
  })

  it('deve falhar quando o intervalo de datas for muito grande', () => {
    // Arrange
    const startIn = new Date(now)
    const endIn = new Date(now)
    endIn.setDate(now.getDate() + MovieFilterDateRange.MAX_DATE_RANGE_DAYS + 1)

    // Act
    const result = validateAndCollect(MovieFilterDateRange.create(startIn, endIn), failures)

    // Assert
    expect(result).toBeNull()
    // adicionar assert
  })

  it('deve retornar result de falha com múltiplas falhas', () => {
    // Arrange
    const dataPassada = new Date(now)
    dataPassada.setDate(now.getDate() - 1)

    const dataFutura = new Date(now)
    dataFutura.setDate(now.getDate() + MovieFilterDateRange.MAX_FUTURE_DAYS + 1)

    // Act
    const result = validateAndCollect(MovieFilterDateRange.create(dataPassada, dataFutura), failures)

    // Assert
    expect(result).toBeNull()
    expect(failures).toHaveLength(1)
  })
})
