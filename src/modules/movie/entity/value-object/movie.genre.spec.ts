import { Genre, MovieGenre } from './movie.genre'
import { SupportedLanguageEnum} from '@shared/value-object/multilingual-content'
import { FailureCode } from '@shared/failure/failure.codes.enum'
import { validateAndCollect } from '@shared/validator/common.validators'
import { SimpleFailure } from '@shared/failure/simple.failure.type'
import { TechnicalError } from '@shared/error/technical.error'

describe('MovieGenre', () => {
  const validGenres: Genre[] = [Genre.ACTION, Genre.COMEDY]
  const validGenreStrings: string[] = ['ACTION', 'COMEDY']
  const tooManyGenres = [Genre.ACTION, Genre.COMEDY, Genre.DRAMA, Genre.FANTASY, Genre.HORROR, Genre.ROMANCE]
  const invalidGenreString = 'INVALID_GENRE'
  const duplicatedGenres = [Genre.ACTION, Genre.ACTION]
  const duplicatedGenreStrings = ['ACTION', 'action']

  describe('Static Methods', () => {
    describe('create', () => {
      let failures: SimpleFailure[]

      beforeEach(() => (failures = []))

      describe('deve retornar uma instância de MovieGenre com sucesso', () => {
        const successCases = [
          {
            genres: validGenres,
            scenario: 'com gêneros válidos usando enum',
          },
          {
            genres: validGenreStrings,
            scenario: 'com gêneros válidos usando strings',
          },
          {
            genres: [Genre.ACTION],
            scenario: 'com o número mínimo de gêneros',
          },
          {
            genres: [Genre.ACTION, Genre.COMEDY, Genre.DRAMA, Genre.FANTASY, Genre.HORROR],
            scenario: 'com o número máximo de gêneros',
          },
        ]

        successCases.forEach(({ genres, scenario }) => {
          it(`deve aceitar gêneros ${scenario}`, () => {
            // Act
            const result = validateAndCollect(MovieGenre.create(genres), failures)

            // Assert
            expect(result).toBeDefined()
            expect(result).toBeInstanceOf(MovieGenre)
          })
        })
      })

      describe('deve retornar um erro quando os gêneros são inválidos', () => {
        const failureCases = [
          {
            genres: null as any,
            scenario: 'quando os gêneros são nulos',
            errorCode: FailureCode.MISSING_REQUIRED_DATA,
          },
          {
            genres: undefined as any,
            scenario: 'quando os gêneros são indefinidos',
            errorCode: FailureCode.MISSING_REQUIRED_DATA,
          },
          {
            genres: [],
            scenario: 'quando o array de gêneros está vazio',
            errorCode: FailureCode.MISSING_REQUIRED_DATA,
          },
          {
            genres: tooManyGenres,
            scenario: 'quando há mais que o número máximo de gêneros',
            errorCode: FailureCode.STRING_LENGTH_OUT_OF_RANGE,
          },
          {
            genres: duplicatedGenres,
            scenario: 'quando há gêneros duplicados usando enum',
            errorCode: FailureCode.GENRE_IS_DUPLICATED,
          },
          {
            genres: duplicatedGenreStrings,
            scenario: 'quando há gêneros duplicados usando strings',
            errorCode: FailureCode.GENRE_IS_DUPLICATED,
          },
          {
            genres: [invalidGenreString],
            scenario: 'quando contém um gênero inválido',
            errorCode: FailureCode.INVALID_ENUM_VALUE,
          },
        ]

        failureCases.forEach(({ genres, scenario, errorCode }) => {
          it(`deve rejeitar gêneros ${scenario}`, () => {
            // Act
            const result = validateAndCollect(MovieGenre.create(genres), failures)

            // Assert
            expect(result).toBeNull()
            expect(failures[0].code).toBe(errorCode)
          })
        })
      })
    })

    describe('hydrate', () => {
      it('deve criar uma instância de MovieGenre a partir de strings', () => {
        // Arrange
        const genreStrings = ['ACTION', 'COMEDY']

        // Act
        const movieGenre = MovieGenre.hydrate(genreStrings)

        // Assert
        expect(movieGenre.getGenres()).toEqual([Genre.ACTION, Genre.COMEDY])
      })

      it('deve aceitar strings de gêneros que normalmente seriam inválidos em quantidade', () => {
        // Arrange - Mais gêneros do que o permitido
        const tooManyGenreStrings = ['ACTION', 'COMEDY', 'DRAMA', 'FANTASY', 'HORROR', 'ROMANCE']

        // Act
        const movieGenre = MovieGenre.hydrate(tooManyGenreStrings)

        // Assert
        expect(movieGenre.count).toBe(6) // Mais do que o MAX_GENRES
      })

      it('deve retornar um array com valores únicos', () => {
        // Arrange
        const duplicatedGenreStrings = ['ACTION', 'ACTION', 'COMEDY']

        // Act
        const movieGenre = MovieGenre.hydrate(duplicatedGenreStrings)

        // Assert
        expect(movieGenre.count).toBe(2)
        expect(movieGenre.getGenres().some((g) => g === 'ACTION')).toBe(true)
        expect(movieGenre.getGenres().some((g) => g === 'COMEDY')).toBe(true)
      })

      it('deve aceitar strings de gêneros em minúsculas', () => {
        // Arrange
        const lowerCaseGenreStrings = ['action', 'comedy']

        // Act
        const movieGenre = MovieGenre.hydrate(lowerCaseGenreStrings)

        // Assert
        expect(movieGenre.count).toEqual(lowerCaseGenreStrings.length)
        expect(movieGenre.getGenres()).toContain(lowerCaseGenreStrings[0].toUpperCase())
        expect(movieGenre.getGenres()).toContain(lowerCaseGenreStrings[1].toUpperCase())
      })

      it('deve lançar uma exceção se algum gênero for inválido', () => {
        // Arrange
        const invalidGenre = 'INVALID_GENRE'
        const unknownGenre = 'UNKNOWN_GENRE'
        const unmappedGenres = [...tooManyGenres, invalidGenre, unknownGenre]

        // Act
        expect(() => MovieGenre.hydrate(unmappedGenres)).toThrow(TechnicalError)
      })

      it('deve lançar TechnicalError quando recebe array nulo', () => {
        // Arrange
        const nullArray = null as unknown as string[]

        // Act & Assert
        expect(() => {
          MovieGenre.hydrate(nullArray)
        }).toThrow()
      })
    })
  })

  describe('Instance Methods', () => {
    it('getGenres deve retornar todos os generos', () => {
      // Arrange
      const result = MovieGenre.hydrate(validGenres)

      // Act
      const genres = result.getGenres()

      // Assert
      expect(genres).toEqual(validGenres)
      expect(genres).not.toBe(validGenres)
    })

    it('getTranslations deve retornar as traduções no idioma especificado', () => {
      // Arrange
      const result = MovieGenre.hydrate([Genre.ACTION, Genre.COMEDY])

      // Act
      const ptTranslations = result.getTranslations(SupportedLanguageEnum.PT)
      const enTranslations = result.getTranslations(SupportedLanguageEnum.EN)

      // Assert
      expect(ptTranslations).toEqual(['Ação', 'Comédia'])
      expect(enTranslations).toEqual(['Action', 'Comedy'])
    })

    it('hasGenre deve verificar corretamente se um gênero está presente', () => {
      // Arrange
      const result = MovieGenre.hydrate([Genre.ACTION, Genre.COMEDY])

      // Act & Assert
      expect(result.hasGenre(Genre.ACTION)).toBe(true)
      expect(result.hasGenre(Genre.HORROR)).toBe(false)
    })

    it('count deve retornar a quantidade correta de gêneros', () => {
      // Arrange
      const result = MovieGenre.hydrate([Genre.ACTION, Genre.COMEDY])

      // Act & Assert
      expect(result.count).toBe(2)
    })
  })
})
