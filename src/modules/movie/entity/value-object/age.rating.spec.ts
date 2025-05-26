import { AgeRating, AgeRatingEnum } from './age.rating'
import { TechnicalError } from '@shared/error/technical.error'
import { FailureCode } from '@shared/failure/failure.codes.enum'
import { SimpleFailure } from '@shared/failure/simple.failure.type'
import { validateAndCollect } from '@shared/validator/common.validators'

describe('AgeRating', () => {
  describe('Static Methods', () => {
    describe('create', () => {
      let failures: SimpleFailure[]

      beforeEach(() => {
        failures = []
      })

      it('deve criar um Result de sucesso com classificação existente', () => {
        // Arrange
        const validRatings = Object.values(AgeRatingEnum)

        validRatings.forEach((rating) => {
          // Act
          const result = validateAndCollect(AgeRating.create(rating), failures)

          // Assert
          expect(result).toBeDefined()
          expect(result.value).toBe(rating)
        })
      })

      it('deve retornar um Result de falha para classificação inválida', () => {
        // Arrange
        const invalidRating = 'INVALID_RATING'

        // Act
        const result = validateAndCollect(AgeRating.create(invalidRating), failures)

        // Assert
        expect(result).toBeNull()
        expect(failures[0].code).toBe(FailureCode.INVALID_ENUM_VALUE)
      })
    })

    describe('hydrate', () => {
      it('deve criar uma instância diretamente a partir de uma classificação válida', () => {
        // Arrange
        const validRatings = Object.values(AgeRatingEnum)

        // Act & Assert
        validRatings.forEach((rating) => {
          const ageRating = AgeRating.hydrate(rating)
          expect(ageRating).toBeInstanceOf(AgeRating)
          expect(ageRating.value).toBe(rating)
        })
      })

      it('deve lançar TechnicalError quando rating for null', () => {
        // Act & Assert
        expect(() => {
          AgeRating.hydrate(null as unknown as string)
        }).toThrow(TechnicalError)
      })
    })
  })

  describe('Instance Methods', () => {
    describe('canWatch', () => {
      it('deve permitir qualquer idade para classificação Livre', () => {
        // Arrange
        const ageRating = AgeRating.hydrate(AgeRatingEnum.L)

        // Act & Assert
        expect(ageRating.canWatch(-1)).toBe(true)
        expect(ageRating.canWatch(0)).toBe(true)
        expect(ageRating.canWatch(5)).toBe(true)
        expect(ageRating.canWatch(100)).toBe(true)
      })

      it('deve verificar corretamente se uma idade pode assistir a uma classificação', () => {
        // Arrange
        const testCases = [
          { rating: AgeRatingEnum.TEN, allowedAge: 10, disallowedAge: 9 },
          { rating: AgeRatingEnum.TWELVE, allowedAge: 12, disallowedAge: 11 },
          { rating: AgeRatingEnum.FOURTEEN, allowedAge: 14, disallowedAge: 13 },
          { rating: AgeRatingEnum.SIXTEEN, allowedAge: 16, disallowedAge: 15 },
          { rating: AgeRatingEnum.EIGHTEEN, allowedAge: 18, disallowedAge: 17 },
        ]

        testCases.forEach(({ rating, allowedAge, disallowedAge }) => {
          // Act
          const ageRating = AgeRating.hydrate(rating)

          // Assert
          expect(ageRating.canWatch(allowedAge)).toBe(true)
          expect(ageRating.canWatch(disallowedAge)).toBe(false)
        })
      })
    })

    describe('minimumAge', () => {
      it('deve retornar a idade mínima correta para cada classificação', () => {
        // Arrange
        const testCases = [
          { rating: AgeRatingEnum.L, expectedMinAge: 0 },
          { rating: AgeRatingEnum.TEN, expectedMinAge: 10 },
          { rating: AgeRatingEnum.TWELVE, expectedMinAge: 12 },
          { rating: AgeRatingEnum.FOURTEEN, expectedMinAge: 14 },
          { rating: AgeRatingEnum.SIXTEEN, expectedMinAge: 16 },
          { rating: AgeRatingEnum.EIGHTEEN, expectedMinAge: 18 },
        ]

        // Act & Assert
        testCases.forEach(({ rating, expectedMinAge }) => {
          const ageRating = AgeRating.hydrate(rating)
          expect(ageRating.minimumAge).toBe(expectedMinAge)
        })
      })
    })
  })
})
