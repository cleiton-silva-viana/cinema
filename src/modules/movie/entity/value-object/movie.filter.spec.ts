import { IMovieFilterInput, MovieFilter } from './movie.filter'
import { FailureCode } from '@shared/failure/failure.codes.enum'
import { DateHelper } from '@shared/helper/date.helper'

describe('MovieFilter', () => {
  describe('create', () => {
    describe('filtros padrão', () => {
      const defaultFilterCases = [
        { scenario: 'input nulo', input: null },
        { scenario: 'input undefined', input: undefined },
        { scenario: 'objeto vazio', input: {} },
      ]

      defaultFilterCases.forEach(({ scenario, input }) => {
        it(`deve criar um filtro padrão quando ${scenario}`, () => {
          // Act
          const result = MovieFilter.create(input as IMovieFilterInput)

          // Assert
          expect(result).toBeValidResultMatching<MovieFilter>((movieFilter) => {
            expect(movieFilter.dateRange).toBeDefined() // configuração padrão
            expect(movieFilter.ageRating).toBeDefined() // configuração padrão
            expect(movieFilter.genres).toBeDefined() // configuração padrão
          })
        })
      })
    })

    describe('validação de dateRange', () => {
      it('deve criar um filtro com dateRange válido', () => {
        // Arrange
        const startDate = DateHelper.soon(10)
        const endDate = DateHelper.soon(11)
        const input: IMovieFilterInput = { dateRange: { startDate, endDate } }

        // Act
        const result = MovieFilter.create(input)

        // Assert
        expect(result).toBeValidResultMatching<MovieFilter>((movieFilter) => {
          expect(movieFilter.dateRange).toBeDefined()
          expect(movieFilter.dateRange?.startDate).toEqual(startDate)
          expect(movieFilter.dateRange?.endDate).toEqual(endDate)
          expect(movieFilter.genres).toBeDefined() // configuração padrão
          expect(movieFilter.ageRating).toBeDefined() // configuração padrão
        })
      })

      describe('deve falhar quando valores fornecidos forem inválidos', () => {
        const invalidCases = [
          {
            scenario: 'startDate é nulo',
            input: {
              dateRange: {
                startDate: null as unknown as Date,
                endDate: DateHelper.soon(5),
              },
            },
            code: FailureCode.MISSING_REQUIRED_DATA,
          },
          {
            scenario: 'endDate é nulo',
            input: {
              dateRange: {
                startDate: DateHelper.soon(5),
                endDate: null as unknown as Date,
              },
            },
            code: FailureCode.MISSING_REQUIRED_DATA,
          },
          {
            scenario: 'startDate e endDate são nulos',
            input: {
              dateRange: {
                startDate: null as unknown as Date,
                endDate: null as unknown as Date,
              },
            },
            code: FailureCode.MISSING_REQUIRED_DATA,
          },
          {
            scenario: 'startDate é anterior à data atual',
            input: {
              dateRange: {
                startDate: DateHelper.recent(10),
                endDate: DateHelper.soon(5),
              },
            },
            code: FailureCode.DATE_CANNOT_BE_PAST,
          },
          {
            scenario: 'startDate é posterior ao limite máximo de 30 dias',
            input: {
              dateRange: {
                startDate: DateHelper.soon(31),
                endDate: DateHelper.soon(40),
              },
            },
            code: FailureCode.DATE_NOT_BEFORE_LIMIT,
          },
          {
            scenario: 'startDate é posterior a endDate',
            input: {
              dateRange: {
                startDate: DateHelper.soon(10),
                endDate: DateHelper.soon(5),
              },
            },
            code: FailureCode.DATE_WITH_INVALID_SEQUENCE,
          },
          {
            scenario: 'endDate é posterior ao limite máximo de 14 dias após startDate',
            input: {
              dateRange: {
                startDate: DateHelper.soon(10),
                endDate: DateHelper.soon(25),
              },
            },
            code: FailureCode.DATE_RANGE_TOO_LARGE,
          },
        ]

        invalidCases.forEach(({ scenario, input, code }) => {
          it(`deve falhar quando ${scenario}`, () => {
            // Act
            const result = MovieFilter.create(input as IMovieFilterInput)

            // Assert
            expect(result).toBeInvalidResultWithSingleFailure(code)
          })
        })
      })
    })

    describe('validação de ageRating', () => {
      it('deve criar um filtro com ageRating válido', () => {
        // Arrange
        const input: IMovieFilterInput = { ageRating: '10' }

        // Act
        const result = MovieFilter.create(input)

        // Assert
        expect(result).toBeValidResultMatching<MovieFilter>((movieFilter) => {
          expect(movieFilter.ageRating?.value).toBe(input.ageRating)
        })
      })

      it('deve falhar quando ageRating é inválido', () => {
        // Arrange
        const input: IMovieFilterInput = {
          ageRating: 'INVALID',
        }

        // Act
        const result = MovieFilter.create(input)

        // Assert
        expect(result).toBeInvalidResultWithSingleFailure(FailureCode.INVALID_ENUM_VALUE)
      })
    })

    describe('validação de genres', () => {
      it('deve criar um filtro com genres válido', () => {
        // Arrange
        const input: IMovieFilterInput = {
          genres: ['ACTION', 'COMEDY'],
        }

        // Act
        const result = MovieFilter.create(input)

        // Assert
        expect(result).toBeValidResultMatching<MovieFilter>((movieFilter) => {
          expect(movieFilter.genres?.count).toBe(input.genres?.length)
          expect(movieFilter.genres?.getGenres().every((g) => input.genres?.includes(g))).toBeTruthy()
        })
      })

      it('deve falhar quando genres é inválido', () => {
        // Arrange
        const input: IMovieFilterInput = {
          genres: ['INVALID_GENRE'],
        }

        // Act
        const result = MovieFilter.create(input)

        // Assert
        expect(result).toBeInvalidResultWithSingleFailure(FailureCode.INVALID_ENUM_VALUE)
      })
    })

    describe('múltiplos critérios', () => {
      it('deve criar um filtro com múltiplos critérios válidos', () => {
        // Arrange
        const input: IMovieFilterInput = {
          dateRange: { startDate: DateHelper.soon(2), endDate: DateHelper.soon(7) },
          ageRating: '16',
          genres: ['ACTION'],
        }

        // Act
        const result = MovieFilter.create(input)

        // Assert
        expect(result).toBeValidResultMatching<MovieFilter>((movieFilter) => {
          expect(movieFilter.genres?.getGenres()).toEqual(input.genres)
          expect(movieFilter.ageRating?.value).toBe(input.ageRating)
        })
      })

      describe('deve acumular múltiplas falhas de validação', () => {
        const cases = [
          {
            scenario: 'com erros em genres e dateRange',
            input: {
              dateRange: {
                startDate: DateHelper.soon(10),
                endDate: DateHelper.soon(45),
              },
              genres: ['invalid_genre'],
            },
            errorsCount: 2,
          },
          {
            scenario: 'com erros em ageRating e genres',
            input: {
              ageRating: 'invalid_genre',
              genres: ['invalid_genre'],
            },
            errorsCount: 2,
          },
          {
            scenario: 'com erros em todos os campos',
            input: {
              dateRange: {
                startDate: DateHelper.soon(10),
                endDate: DateHelper.soon(45),
              },
              genres: ['invalid_genre'],
              ageRating: 'invalid_genre',
            },
            errorsCount: 3,
          },
        ]

        cases.forEach(({ scenario, input, errorsCount }) => {
          it(scenario, () => {
            // Act
            const result = MovieFilter.create(input)

            // Assert
            expect(result).toBeInvalidResultWithFailureCount(errorsCount)
          })
        })
      })
    })
  })
})
