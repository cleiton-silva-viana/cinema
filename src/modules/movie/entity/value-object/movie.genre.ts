import { failure, Result, success } from '@shared/result/result'
import { SimpleFailure } from '@shared/failure/simple.failure.type'
import { SupportedLanguage } from '@shared/value-object/multilingual-content'
import { TechnicalError } from '@shared/error/technical.error'
import { FailureCode } from '@shared/failure/failure.codes.enum'
import { Validate } from '@shared/validator/validate'
import { FailureFactory } from '@shared/failure/failure.factory'
import { ensureNotNull, hydrateEnum, parseToEnum } from '@shared/validator/common.validators'

// Enum para os gêneros
export enum Genre {
  ACTION = 'ACTION',
  FANTASY = 'FANTASY',
  COMEDY = 'COMEDY',
  DRAMA = 'DRAMA',
  HORROR = 'HORROR',
  ROMANCE = 'ROMANCE',
  THRILLER = 'THRILLER',
  SCIFI = 'SCIFI',
  DOCUMENTARY = 'DOCUMENTARY',
}

// Tipo para as traduções de cada gênero
export type GenreTranslation = {
  [key in SupportedLanguage]: string
}

/**
 * Objeto que mapeia cada gênero de filme para suas respectivas traduções em diferentes idiomas.
 * Cada gênero possui uma tradução em português (PT) e inglês (EN).
 *
 * @example
 * GenreTranslations[Genre.ACTION] retorna:
 * {
 *   PT: 'Ação',
 *   EN: 'Action'
 * }
 */
export const GenreTranslations: Record<Genre, GenreTranslation> = {
  [Genre.ACTION]: {
    [SupportedLanguage.PT]: 'Ação',
    [SupportedLanguage.EN]: 'Action',
  },
  [Genre.FANTASY]: {
    [SupportedLanguage.PT]: 'Fantasia',
    [SupportedLanguage.EN]: 'Fantasy',
  },
  [Genre.COMEDY]: {
    [SupportedLanguage.PT]: 'Comédia',
    [SupportedLanguage.EN]: 'Comedy',
  },
  [Genre.DRAMA]: {
    [SupportedLanguage.PT]: 'Drama',
    [SupportedLanguage.EN]: 'Drama',
  },
  [Genre.HORROR]: {
    [SupportedLanguage.PT]: 'Terror',
    [SupportedLanguage.EN]: 'Horror',
  },
  [Genre.ROMANCE]: {
    [SupportedLanguage.PT]: 'Romance',
    [SupportedLanguage.EN]: 'Romance',
  },
  [Genre.THRILLER]: {
    [SupportedLanguage.PT]: 'Suspense',
    [SupportedLanguage.EN]: 'Thriller',
  },
  [Genre.SCIFI]: {
    [SupportedLanguage.PT]: 'Ficção Científica',
    [SupportedLanguage.EN]: 'Sci-Fi',
  },
  [Genre.DOCUMENTARY]: {
    [SupportedLanguage.PT]: 'Documentário',
    [SupportedLanguage.EN]: 'Documentary',
  },
}

/**
 * Value Object que representa os gêneros associados a um filme
 */
export class MovieGenre {
  private static readonly MIN_GENRES = 1
  private static readonly MAX_GENRES = 5

  private constructor(private readonly genres: Set<Genre>) {}

  /**
   * Obtém a quantidade de gêneros
   */
  public get count(): number {
    return this.genres.size
  }

  /**
   * Cria uma instância de MovieGenre diretamente a partir de dados do banco de dados
   * Este método pula as validações para melhor performance
   * @param genres Array de gêneros do banco de dados
   * @returns MovieGenre
   */
  public static hydrate(genres: string[]): MovieGenre {
    TechnicalError.validateRequiredFields({ genres })

    const movieGenres: Set<Genre> = new Set()

    genres.forEach((genre) => movieGenres.add(hydrateEnum('genre', genre, Genre)))

    return new MovieGenre(movieGenres)
  }

  /**
   * Cria um MovieGenre a partir de um array de GenreId
   * @param genres Array de GenreId
   * @returns Result<MovieGenre>
   */
  public static create(genres: Genre[] | string[]): Result<MovieGenre> {
    if (!genres || genres.length === 0) return failure(FailureFactory.MISSING_REQUIRED_DATA('genres'))

    if (typeof genres[0] === 'string') return this.createFromStrings(genres as string[])
    else return this.createFromEnums(genres as Genre[])
  }

  /**
   * Cria um MovieGenre a partir de um array de strings
   * @param genres Array de strings representando gêneros
   * @returns Result<MovieGenre> Sucesso com o MovieGenre criado ou falha com os erros encontrados
   */
  public static createFromStrings(genres: string[]): Result<MovieGenre> {
    const failures: SimpleFailure[] = []

    Validate.array({ genres }, failures).isRequired().hasLengthBetween(MovieGenre.MIN_GENRES, MovieGenre.MAX_GENRES)

    const genresParsed: Genre[] = []
    genres.forEach((genre) => {
      const result = parseToEnum('genre', genre, Genre)
      if (result.isInvalid()) failures.push(...result.failures)
      else genresParsed.push(result.value)
    })

    const uniqueGenres = MovieGenre.extractUniqueGenres(genresParsed, failures)

    return failures.length > 0 ? failure(failures) : success(new MovieGenre(uniqueGenres))
  }

  /**
   * Cria um MovieGenre a partir de um array de enums Genre
   * @param genres Array de enums Genre para criar o MovieGenre
   * @returns Result<MovieGenre> Sucesso com o MovieGenre criado ou falha com os erros encontrados
   */
  private static createFromEnums(genres: Genre[]): Result<MovieGenre> {
    const failures = ensureNotNull({ genres })

    const uniqueGenres = MovieGenre.extractUniqueGenres(genres, failures)

    return failures.length > 0 ? failure(failures) : success(new MovieGenre(uniqueGenres))
  }

  private static extractUniqueGenres(genres: Genre[], failures: SimpleFailure[]): Set<Genre> {
    let uniqueGenres: Set<Genre> = new Set()

    genres.forEach((g) => {
      const result = parseToEnum('genre', g, Genre)
      if (result.isInvalid()) {
        failures.push(...result.failures)
      }

      if (result.isValid()) {
        const genre = result.value
        if (uniqueGenres.has(genre)) failures.push(FailureFactory.GENRE_IS_DUPLICATED(genre))
        else uniqueGenres.add(genre)
      }
    })

    return uniqueGenres
  }

  /**
   * Obtém todos os gêneros
   * @returns Array de GenreId
   */
  public getGenres(): Genre[] {
    return [...this.genres]
  }

  /**
   * Obtém as traduções de todos os gêneros no idioma especificado
   * @param language Idioma desejado
   * @returns Array de strings com as traduções
   */
  public getTranslations(language: SupportedLanguage): string[] {
    const arr = Array.from(this.genres)
    let languages: string[] = []

    arr.forEach((genre) => {
      languages.push(GenreTranslations[genre][language])
    })

    return languages
  }

  /**
   * Verifica se o filme possui um determinado gênero
   * @param genreId Gênero a verificar
   * @returns boolean
   */
  public hasGenre(genreId: Genre): boolean {
    return this.genres.has(genreId)
  }
}
