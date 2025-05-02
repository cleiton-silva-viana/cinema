import { Result, failure, success } from "../../../../shared/result/result";
import { SimpleFailure } from "../../../../shared/failure/simple.failure.type";
import { SupportedLanguage } from "../../../../shared/value-object/multilingual-content";
import { Assert } from "../../../../shared/assert/assert";
import { not } from "../../../../shared/assert/not";
import { is } from "../../../../shared/assert/is";
import { TechnicalError } from "../../../../shared/error/technical.error";
import { isNull } from "../../../../shared/validator/validator";
import { FailureCode } from "../../../../shared/failure/failure.codes.enum";

// Enum para os gêneros
export enum Genre {
  ACTION = "ACTION",
  FANTASY = "FANTASY",
  COMEDY = "COMEDY",
  DRAMA = "DRAMA",
  HORROR = "HORROR",
  ROMANCE = "ROMANCE",
  THRILLER = "THRILLER",
  SCIFI = "SCIFI",
  DOCUMENTARY = "DOCUMENTARY",
}

// Tipo para as traduções de cada gênero
export type GenreTranslation = {
  [key in SupportedLanguage]: string;
};

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
    [SupportedLanguage.PT]: "Ação",
    [SupportedLanguage.EN]: "Action",
  },
  [Genre.FANTASY]: {
    [SupportedLanguage.PT]: "Fantasia",
    [SupportedLanguage.EN]: "Fantasy",
  },
  [Genre.COMEDY]: {
    [SupportedLanguage.PT]: "Comédia",
    [SupportedLanguage.EN]: "Comedy",
  },
  [Genre.DRAMA]: {
    [SupportedLanguage.PT]: "Drama",
    [SupportedLanguage.EN]: "Drama",
  },
  [Genre.HORROR]: {
    [SupportedLanguage.PT]: "Terror",
    [SupportedLanguage.EN]: "Horror",
  },
  [Genre.ROMANCE]: {
    [SupportedLanguage.PT]: "Romance",
    [SupportedLanguage.EN]: "Romance",
  },
  [Genre.THRILLER]: {
    [SupportedLanguage.PT]: "Suspense",
    [SupportedLanguage.EN]: "Thriller",
  },
  [Genre.SCIFI]: {
    [SupportedLanguage.PT]: "Ficção Científica",
    [SupportedLanguage.EN]: "Sci-Fi",
  },
  [Genre.DOCUMENTARY]: {
    [SupportedLanguage.PT]: "Documentário",
    [SupportedLanguage.EN]: "Documentary",
  },
};

/**
 * Value Object que representa os gêneros associados a um filme
 */
export class MovieGenre {
  private static readonly MIN_GENRES = 1;
  private static readonly MAX_GENRES = 5;

  private constructor(private readonly genres: Genre[]) {}

  /**
   * Cria uma instância de MovieGenre diretamente a partir de dados do banco de dados
   * Este método pula as validações para melhor performance
   * @param genres Array de gêneros do banco de dados
   * @returns MovieGenre
   */
  public static hydrate(genres: string[]): MovieGenre {
    TechnicalError.if(isNull(genres), FailureCode.NULL_ARGUMENT);
    TechnicalError.if(genres.length === 0, FailureCode.EMPTY_FIELD);

    const movieGenres = genres
      .map((genre) => genre.toUpperCase())
      .filter((genre) => Object.values(Genre).includes(genre as Genre))
      .map((genre) => genre as Genre);

    return new MovieGenre(movieGenres);
  }

  /**
   * Cria um MovieGenre a partir de um array de GenreId
   * @param genres Array de GenreId
   * @returns Result<MovieGenre>
   */
  public static create(genres: Genre[] | string[]): Result<MovieGenre> {
    if (!genres || genres.length === 0) {
      return failure([
        {
          code: FailureCode.INVALID_GENRE_COUNT,
          details: {
            minGenres: MovieGenre.MIN_GENRES,
          },
        },
      ]);
    }
    if (typeof genres[0] === "string") {
      return this.createFromStrings(genres as string[]);
    } else {
      return this.createFromEnums(genres as Genre[]);
    }
  }

  /**
   * Cria um MovieGenre a partir de um array de enums Genre
   * @param genres Array de enums Genre para criar o MovieGenre
   * @returns Result<MovieGenre> Sucesso com o MovieGenre criado ou falha com os erros encontrados
   */
  private static createFromEnums(genres: Genre[]): Result<MovieGenre> {
    const failures: SimpleFailure[] = [];

    Assert.untilFirstFailure(
      failures,
      not.null(genres, FailureCode.INVALID_GENRE_COUNT, {
        minGenres: MovieGenre.MIN_GENRES,
      }),
      is.true(
        [...new Set(genres)].length === genres.length,
        FailureCode.DUPLICATE_GENRES,
      ),
      is.between(
        genres,
        MovieGenre.MIN_GENRES,
        MovieGenre.MAX_GENRES,
        FailureCode.INVALID_GENRE_COUNT,
        {
          minGenres: MovieGenre.MIN_GENRES,
          maxGenres: MovieGenre.MAX_GENRES,
        },
      ),
    );

    return failures.length > 0
      ? failure(failures)
      : success(new MovieGenre(genres));
  }

  /**
   * Cria um MovieGenre a partir de um array de strings
   * @param genreStrings Array de strings representando gêneros
   * @returns Result<MovieGenre> Sucesso com o MovieGenre criado ou falha com os erros encontrados
   */
  public static createFromStrings(genreStrings: string[]): Result<MovieGenre> {
    const failures: SimpleFailure[] = [];

    Assert.untilFirstFailure(
      failures,
      {
        minGenres: MovieGenre.MIN_GENRES,
        maxGenres: MovieGenre.MAX_GENRES,
      },
      not.null(genreStrings, FailureCode.INVALID_GENRE_COUNT),
      is.greaterOrEqualTo(
        genreStrings?.length,
        MovieGenre.MIN_GENRES,
        FailureCode.INVALID_GENRE_COUNT,
      ),
      is.lessOrEqualTo(
        genreStrings?.length,
        MovieGenre.MAX_GENRES,
        FailureCode.INVALID_GENRE_COUNT,
      ),
    );
    if (failures.length > 0) return failure(failures);

    let uniqueGenres: Set<Genre> = new Set();

    genreStrings.forEach((genreString) => {
      const upperCaseGenre = genreString.toUpperCase();
      if (!Object.values(Genre).includes(upperCaseGenre as Genre)) {
        failures.push({
          code: FailureCode.INVALID_GENRE,
          details: {
            valueInvalid: upperCaseGenre,
          },
        });
      }
      if (uniqueGenres.has(upperCaseGenre as Genre)) {
        failures.push({
          code: FailureCode.DUPLICATE_GENRES,
          details: {
            duplicatedValue: upperCaseGenre,
          },
        });
      }
      uniqueGenres.add(upperCaseGenre as Genre);
    });

    return failures.length > 0
      ? failure(failures)
      : success(new MovieGenre(Array.from(uniqueGenres)));
  }

  /**
   * Obtém todos os gêneros
   * @returns Array de GenreId
   */
  public getGenres(): Genre[] {
    return [...this.genres];
  }

  /**
   * Obtém as traduções de todos os gêneros no idioma especificado
   * @param language Idioma desejado
   * @returns Array de strings com as traduções
   */
  public getTranslations(language: SupportedLanguage): string[] {
    return this.genres.map((genreId) => GenreTranslations[genreId][language]);
  }

  /**
   * Verifica se o filme possui um determinado gênero
   * @param genreId Gênero a verificar
   * @returns boolean
   */
  public hasGenre(genreId: Genre): boolean {
    return this.genres.includes(genreId);
  }

  /**
   * Obtém a quantidade de gêneros
   */
  public get count(): number {
    return this.genres.length;
  }
}
