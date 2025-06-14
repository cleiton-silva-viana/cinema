import { MovieDuration } from './movie.duration'
import { FailureCode } from '@shared/failure/failure.codes.enum'

describe('MovieDuration', () => {
  describe('Static Methods', () => {
    describe('create', () => {
      it('deve criar uma instância válida com duração dentro dos limites', () => {
        // Arrange
        const minutes = 120 // 2 horas

        // Act
        const result = MovieDuration.create(minutes)

        // Assert
        expect(result).toBeValidResultMatching<MovieDuration>((m) => {
          expect(m.minutes).toBe(minutes)
        })
      })

      it('deve criar uma instância válida com duração mínima permitida', () => {
        // Arrange
        const minutes = MovieDuration.MIN_DURATION

        // Act
        const result = MovieDuration.create(minutes)

        // Assert
        expect(result).toBeValidResultMatching<MovieDuration>((m) => {
          expect(m.minutes).toBe(minutes)
        })
      })

      it('deve criar uma instância válida com duração máxima permitida', () => {
        // Arrange
        const minutes = MovieDuration.MAX_DURATION

        // Act
        const result = MovieDuration.create(minutes)

        // Assert
        expect(result).toBeValidResultMatching<MovieDuration>((m) => {
          expect(m.minutes).toBe(minutes)
        })
      })

      it('deve falhar ao criar com duração nula', () => {
        // Arrange
        const minutes = null as unknown as number

        // Act
        const result = MovieDuration.create(minutes)

        // Assert
        expect(result).toBeInvalidResultWithSingleFailure(FailureCode.MISSING_REQUIRED_DATA)
      })

      it('deve falhar ao criar com duração menor que o mínimo permitido', () => {
        // Arrange
        const minutes = MovieDuration.MIN_DURATION - 1

        // Act
        const result = MovieDuration.create(minutes)

        // Assert
        expect(result).toBeInvalidResultWithSingleFailure(FailureCode.MOVIE_WITH_DURATION_TOO_SHORT)
      })

      it('deve falhar ao criar com duração maior que o máximo permitido', () => {
        // Arrange
        const minutes = MovieDuration.MAX_DURATION + 1

        // Act
        const result = MovieDuration.create(minutes)

        // Assert
        expect(result).toBeInvalidResultWithSingleFailure(FailureCode.MOVIE_WITH_DURATION_TOO_LONG)
      })
    })

    describe('hydrate', () => {
      it('deve hidratar corretamente a partir de um valor válido', () => {
        // Arrange
        const minutes = 150

        // Act
        const duration = MovieDuration.hydrate(minutes)

        // Assert
        expect(duration.minutes).toBe(minutes)
      })

      it('deve lançar erro técnico ao tentar hidratar com valor nulo', () => {
        // Arrange
        const minutes = null as unknown as number

        // Act & Assert
        expect(() => {
          MovieDuration.hydrate(minutes)
        }).toThrow(FailureCode.MISSING_REQUIRED_DATA)
      })
    })
  })

  describe('Instance Methods', () => {
    describe('format', () => {
      it('deve formatar corretamente quando há apenas horas', () => {
        // Arrange
        const hours = 2
        const minutes = hours * 60
        const duration = MovieDuration.hydrate(minutes)

        // Act
        const formatted = duration.format()

        // Assert
        expect(formatted).toBe('2h')
      })

      it('deve formatar corretamente quando há apenas minutos', () => {
        // Arrange
        const minutes = 45
        const duration = MovieDuration.hydrate(minutes)

        // Act
        const formatted = duration.format()

        // Assert
        expect(formatted).toBe('45min')
      })

      it('deve formatar corretamente quando há horas e minutos', () => {
        // Arrange
        const hours = 2
        const mins = 15
        const totalMinutes = hours * 60 + mins
        const duration = MovieDuration.hydrate(totalMinutes)

        // Act
        const formatted = duration.format()

        // Assert
        expect(formatted).toBe('2h 15min')
      })
    })
  })
})
