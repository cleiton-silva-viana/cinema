import { IMovieFilterInput, MovieFilter } from './movie.filter'
import { FailureCode } from '@shared/failure/failure.codes.enum'
import { validateAndCollect } from '@shared/validator/common.validators'
import { SimpleFailure } from '@shared/failure/simple.failure.type'

describe('MovieFilter', () => {
  describe('create', () => {
    let failures: SimpleFailure[]

    beforeEach(() => (failures = []))

    const date = (days: number = 10) => {
      const date = new Date()
      date.setHours(0, 0, 0, 0)
      date.setDate(date.getDate() + days)
      return date
    }

    describe('filtros padrão', () => {
      const defaultFilterCases = [
        { scenario: 'input nulo', input: null },
        { scenario: 'input undefined', input: undefined },
        { scenario: 'objeto vazio', input: {} },
      ]

      defaultFilterCases.forEach(({ scenario, input }) => {
        it(`deve criar um filtro padrão quando ${scenario}`, () => {
          // Act
          const result = validateAndCollect(MovieFilter.create(input as IMovieFilterInput), failures)

          // Assert
          expect(result).toBeDefined()
          expect(result.dateRange).toBeDefined()
          expect(result.ageRating).toBeUndefined()
          expect(result.genres).toBeUndefined()
        })
      })
    })

    describe('validação de dateRange', () => {
      it('deve criar um filtro com dateRange válido', () => {
        // Arrange
        const input: IMovieFilterInput = {
          dateRange: { startDate: date(10), endDate: date(11) },
        }

        // Act
        const result = validateAndCollect(MovieFilter.create(input), failures)

        // Assert
        expect(result).toBeDefined()
        expect(result.dateRange).toEqual(input.dateRange)
      })

      describe('deve falhar quando valores fornecidos forem inválidos', () => {
        const invalidCases = [
          {
            scenario: 'startDate é nulo',
            input: {
              dateRange: {
                startDate: null,
                endDate: date(),
              },
            },
            code: FailureCode.MISSING_REQUIRED_DATA,
          },
          {
            scenario: 'endDate é nulo',
            input: {
              dateRange: {
                startDate: date(),
                endDate: null as unknown as Date,
              },
            },
            code: FailureCode.MISSING_REQUIRED_DATA,
          },
          {
            scenario: 'startDate é anterior à data atual',
            input: {
              dateRange: {
                startDate: date(-10),
                endDate: date(5),
              },
            },
            code: FailureCode.DATE_CANNOT_BE_PAST,
          },
          {
            scenario: 'startDate é posterior ao limite máximo de 30 dias',
            input: {
              dateRange: {
                startDate: date(31),
                endDate: date(20),
              },
            },
            code: FailureCode.DATE_NOT_BEFORE_LIMIT,
          },
          {
            scenario: 'startDate é posterior a endDate',
            input: {
              dateRange: {
                startDate: date(10),
                endDate: date(5),
              },
            },
            code: FailureCode.DATE_WITH_INVALID_SEQUENCE,
          },
          {
            scenario: 'endDate é posterior ao limite máximo de 14 dias após startDate',
            input: {
              dateRange: {
                startDate: date(10),
                endDate: date(25),
              },
            },
            code: FailureCode.DATE_NOT_BEFORE_LIMIT,
          },
        ]

        invalidCases.forEach(({ scenario, input, code }) => {
          it(`deve falhar quando ${scenario}`, () => {
            // Act
            const result = validateAndCollect(MovieFilter.create(input as IMovieFilterInput), failures)

            // Assert
            expect(result).toBeNull()
            expect(failures.length).toBe(1)
            expect(failures[0].code).toBe(code)
          })
        })
      })
    })

    describe('validação de ageRating', () => {
      it('deve criar um filtro com ageRating válido', () => {
        // Arrange
        const input: IMovieFilterInput = { ageRating: '10' }

        // Act
        const result = validateAndCollect(MovieFilter.create(input), failures)

        // Assert
        expect(result).toBeDefined()
        expect(result.ageRating?.value).toBe(input.ageRating)
      })

      it('deve falhar quando ageRating é inválido', () => {
        // Arrange
        const input: IMovieFilterInput = {
          ageRating: 'INVALID',
        }

        // Act
        const result = validateAndCollect(MovieFilter.create(input), failures)

        // Assert
        expect(result).toBeNull()
      })
    })

    describe('validação de genres', () => {
      it('deve criar um filtro com genres válido', () => {
        // Arrange
        const input: IMovieFilterInput = {
          genres: ['ACTION', 'COMEDY'],
        }

        // Act
        const result = validateAndCollect(MovieFilter.create(input), failures)

        // Assert
        expect(result).toBeDefined()
        expect(result.genres?.count).toBe(input.genres?.length)
        expect(result.genres?.getGenres().every((g) => input.genres?.includes(g))).toBeTruthy()
      })

      it('deve falhar quando genres é inválido', () => {
        // Arrange
        const input: IMovieFilterInput = {
          genres: ['INVALID_GENRE'],
        }

        // Act
        const result = validateAndCollect(MovieFilter.create(input), failures)

        // Assert
        expect(result).toBeNull()
      })
    })

    describe('múltiplos critérios', () => {
      it('deve criar um filtro com múltiplos critérios válidos', () => {
        // Arrange
        const input: IMovieFilterInput = {
          dateRange: { startDate: date(2), endDate: date(7) },
          ageRating: '16',
          genres: ['ACTION'],
        }

        // Act
        const result = validateAndCollect(MovieFilter.create(input), failures)

        // Assert
        expect(result).toBeDefined()
        expect(result.genres?.getGenres()).toEqual(input.genres)
        expect(result.ageRating?.value).toBe(input.ageRating)
      })

      it('deve acumular múltiplas falhas de validação', () => {
        // Arrange
        const now = new Date()
        const startDate = new Date(now.getDate() - 10) // data no passado
        const input: IMovieFilterInput = {
          dateRange: {
            startDate: startDate,
            endDate: null as unknown as Date,
          },
          ageRating: 'INVALID',
          genres: ['INVALID_GENRE'],
        }

        // Act
        const result = validateAndCollect(MovieFilter.create(input), failures)

        // Assert
        expect(result).toBeNull()
        expect(failures.length).toBe(3)
      })
    })
  })
})
