import { failure, Result, success } from "../../../shared/result/result";
import { MovieGenre } from "./value-object/movie.genre";
import { MovieUID } from "./value-object/movie.uid";
import { MovieTitle } from "./value-object/movie.title";
import { MovieDescription } from "./value-object/movie.description";
import { SimpleFailure } from "../../../shared/failure/simple.failure.type";
import {
  LanguageContent,
  MultilingualInput,
  SupportedLanguage,
} from "../../../shared/value-object/multilingual-content";
import { Image } from "../../image/entity/image";
import { MovieContributorInput } from "./value-object/movie.contributor";
import { DisplayPeriod } from "./value-object/display.period";
import { MovieDuration } from "./value-object/movie.duration";
import { Assert } from "../../../shared/assert/assert";
import { not } from "../../../shared/assert/not";
import { MovieAdministrativeStatus } from "../type/movie.administrative.status";
import { MovieContributors } from "./value-object/movie.contributors";
import { AgeRating } from "./value-object/age.rating";
import { TechnicalError } from "../../../shared/error/technical.error";
import { isNull } from "../../../shared/validator/validator";

export const MovieCodes = {
  NULL_ARGUMENT: "NULL_ARGUMENT",
  DATE_PERIOD_IS_INVERTED: "DATE_PERIOD_IS_INVERTED",
  MOVIE_IMAGES_REQUIRED: "MOVIE_IMAGES_REQUIRED",
  MOVIE_POSTER_REQUIRED: "MOVIE_POSTER_REQUIRED",
  MOVIE_CANNOT_BE_ARCHIVED: "MOVIE_CANNOT_BE_ARCHIVED",
  MOVIE_ARCHIVED: "MOVIE_ARCHIVED",
  MOVIE_MISSING_DISPLAY_PERIOD: "MOVIE_MISSING_DISPLAY_PERIOD",
  MOVIE_NOT_AVAILABLE_IN_PERIOD: "MOVIE_NOT_AVAILABLE_IN_PERIOD",
  MOVIE_MISSING_POSTER: "MOVIE_MISSING_POSTER",
  MOVIE_MISSING_AGE_RATING: "MOVIE_MISSING_AGE_RATING",
  MOVIE_MISSING_DIRECTOR: "MOVIE_MISSING_DIRECTOR",
  MOVIE_MISSING_GENDER: "MOVIE_MISSING_GENDER",
  MOVIE_MISSING_DURATION: "MOVIE_MISSING_DURATION",
  MOVIE_MISSING_TITLE: "MOVIE_MISSING_TITLE",
  MOVIE_MISSING_DESCRIPTION: "MOVIE_MISSING_DESCRIPTION",
};

/**
 * Interface que define os dados fundamentais necessários para criar uma entidade Movie.
 * Contém apenas os campos obrigatórios para a criação inicial de um filme.
 */
export interface CreateMovieInput {
  title: MultilingualInput[];
  description: MultilingualInput[];
  ageRating: string;
  images: { poster: Image };
  contributors: MovieContributorInput[];
}

/**
 * Interface que define os dados completos de um filme para hidratação.
 * Contém todos os campos possíveis de um filme, incluindo os opcionais.
 */
export interface MovieHydrateInput {
  uid: string;
  title: LanguageContent;
  description: LanguageContent;
  duration?: number;
  ageRating: string;
  status: MovieAdministrativeStatus;
  genres?: string[];
  images: {
    banner?: Image;
    poster: Image;
  };
  displayPeriod?: {
    startDate: Date;
    endDate: Date;
  } | null;
  contributors: MovieContributorInput[];
}

/**
 * Interface que define os dados necessários para atualizar as propriedades de um filme.
 * Todos os campos são opcionais, permitindo atualização parcial.
 */
export interface MovieUpdateInput {
  title?: MultilingualInput[];
  description?: MultilingualInput[];
  duration?: number;
  ageRating?: string;
  genres?: string[];
  images?: { banner?: Image; poster: Image };
  displayPeriod?: { startDate: Date; endDate: Date }; // DisplayPeriodInput
  contributors?: MovieContributorInput[];
}

/**
 * Representa a entidade Filme com suas propriedades e regras de negócio.
 */
export class Movie {
  protected constructor(
    public readonly uid: MovieUID,
    public readonly title: MovieTitle,
    public readonly description: MovieDescription,
    public readonly duration: MovieDuration,
    public readonly ageRating: AgeRating,
    public readonly status: MovieAdministrativeStatus,
    public readonly genre: MovieGenre,
    public readonly images: {
      banner?: Image;
      poster: Image;
    },
    public readonly displayPeriod: DisplayPeriod | null,
    public readonly contributors: MovieContributors,
  ) {}

  /**
   * Cria uma nova instância de Filme com valores padrão para campos opcionais.
   *
   * @param input Objeto contendo parte dos dados necessários para criar um filme
   * @returns Result<Movie> Um objeto Result contendo a nova instância de Movie ou
   * um array de falhas (SimpleFailure) caso a validação falhe.
   */
  public static create(input: CreateMovieInput): Result<Movie> {
    const failures: SimpleFailure[] = [];

    const titleResult = MovieTitle.create(input.title);
    if (titleResult.invalid) failures.push(...titleResult.failures);

    const descriptionResult = MovieDescription.create(input.description);
    if (descriptionResult.invalid) failures.push(...descriptionResult.failures);

    const ageRatingsResult = AgeRating.create(input.ageRating);
    if (ageRatingsResult.invalid) failures.push(...ageRatingsResult.failures);

    const contributorsResult = MovieContributors.create(input.contributors);
    if (contributorsResult.invalid)
      failures.push(...contributorsResult.failures);

    Assert.untilFirstFailure(
      failures,
      { field: "images" },
      not.null(input.images, MovieCodes.MOVIE_IMAGES_REQUIRED),
      not.null(input.images?.poster, MovieCodes.MOVIE_POSTER_REQUIRED),
    );

    if (failures.length > 0) return failure(failures);

    return success(
      new Movie(
        MovieUID.create(),
        titleResult.value,
        descriptionResult.value,
        null,
        ageRatingsResult.value,
        MovieAdministrativeStatus.DRAFT,
        null,
        input.images,
        null,
        contributorsResult.value,
      ),
    );
  }

  /**
   * Cria uma instância de Movie a partir de dados brutos.
   * @param input Dados brutos para criar a instância de Movie
   * @returns Movie Uma nova instância de Movie
   * @throws TechnicalError se os dados forem inválidos
   */
  public static hydrate(input: MovieHydrateInput): Movie {
    TechnicalError.if(isNull(input.uid), MovieCodes.NULL_ARGUMENT, {
      message: "The movie UID cannot be null",
    });

    const uid = MovieUID.hydrate(input.uid);

    // TODO: idioma deve ser recuperado de uma env
    const title = MovieTitle.hydrate(input.title.language, input.title.text);

    // TODO: idioma deve ser recuperado de uma env
    const description = MovieDescription.hydrate(
      input.description.language,
      input.description.text,
    );

    const contributors = MovieContributors.hydrate(input.contributors);

    const ageRating = input.ageRating
      ? AgeRating.hydrate(input.ageRating)
      : null;

    const status = input.status as MovieAdministrativeStatus;

    const genres = input.genres ? MovieGenre.hydrate(input.genres) : null;

    const duration = input.duration
      ? MovieDuration.hydrate(input.duration)
      : null;

    const displayPeriod = input.displayPeriod
      ? DisplayPeriod.hydrate(
          input.displayPeriod.startDate,
          input.displayPeriod.endDate,
        )
      : null;

    return new Movie(
      uid,
      title,
      description,
      duration,
      ageRating,
      status,
      genres,
      input.images,
      displayPeriod,
      contributors,
    );
  }

  /**
   * Atualiza os campos do filme e retorna uma nova instância com os valores atualizados.
   * Apenas os campos fornecidos em 'updates' serão alterados; os demais permanecem inalterados.
   *
   * @param updates Objeto contendo os campos a serem atualizados
   * @returns Result<Movie> Um Result contendo a nova instância atualizada ou falhas
   */
  public update(updates: MovieUpdateInput): Result<Movie> {
    const failures: SimpleFailure[] = [];

    let title: MovieTitle = this.title;
    let description: MovieDescription = this.description;
    let duration: MovieDuration = this.duration;
    let genres: MovieGenre = this.genre;
    let displayPeriod: DisplayPeriod = this.displayPeriod;
    let contributors: MovieContributors = this.contributors;

    if (updates.title) {
      const result = MovieTitle.create(updates.title);
      result.invalid
        ? failures.push(...result.failures)
        : (title = result.value);
    }

    if (updates.description) {
      const result = MovieDescription.create(updates.description);
      result.invalid
        ? failures.push(...result.failures)
        : (description = result.value);
    }

    if (updates.duration) {
      const result = MovieDuration.create(updates.duration);
      result.invalid
        ? failures.push(...result.failures)
        : (duration = result.value);
    }

    if (updates.genres) {
      const result = MovieGenre.create(updates.genres);
      result.invalid
        ? failures.push(...result.failures)
        : (genres = result.value);
    }

    if (updates.displayPeriod) {
      const result = DisplayPeriod.create(
        updates.displayPeriod.startDate,
        updates.displayPeriod.endDate,
      );
      result.invalid
        ? failures.push(...result.failures)
        : (displayPeriod = result.value);
    }

    return failures.length > 0
      ? failure(failures)
      : success(
          new Movie(
            this.uid,
            title,
            description,
            duration,
            this.ageRating,
            this.status,
            genres,
            this.images,
            displayPeriod,
            contributors,
          ),
        );
  }

  /**
   * Altera o status do filme para "Pendente de Revisão".
   * Este método verifica se o filme atende aos requisitos mínimos para ser revisado:
   * - Deve ter título
   * - Deve ter descrição
   * - Deve ter classificação etária
   * - Deve ter pelo menos um diretor
   * - Deve ter imagem do poster
   *
   * @returns Result<Movie> Um Result contendo a nova instância com status PENDING_REVIEW
   * ou um array de falhas caso os requisitos não sejam atendidos
   */
  public toPendingReview(): Result<Movie> {
    const result = this.canPendingReview();
    if (result.invalid) return failure(result.failures);
    return success(this.withStatus(MovieAdministrativeStatus.PENDING_REVIEW));
  }

  /**
   * Altera o status do filme para "Aprovado".
   * Este método verifica se o filme atende a todos os requisitos para ser aprovado:
   * - Deve atender a todos os requisitos de revisão (título, descrição, classificação, diretor e poster)
   * - Deve ter duração definida
   * - Deve ter pelo menos um gênero definido
   *
   * @returns Result<Movie> Um Result contendo a nova instância com status APPROVED
   * ou um array de falhas caso os requisitos não sejam atendidos
   */
  public toApprove(): Result<Movie> {
    const result = this.canApprove();
    if (result.invalid) return failure(result.failures);
    return success(this.withStatus(MovieAdministrativeStatus.APPROVED));
  }

  /**
   * Transforma o filme para o estado arquivado.
   *
   * @returns Result<Movie> Um Result contendo a nova instância com status ARCHIVED ou falha
   */
  public toArchive(): Result<Movie> {
    return success(this.withStatus(MovieAdministrativeStatus.ARCHIVED));
  }

  /**
   * Verifica se o filme estará disponível para exibição em um determinado período
   *
   * @param startDate Data de início do período
   * @param endDate Data de fim do período
   * @returns Result<boolean> Resultado indicando se o filme estará disponível
   */
  public isAvailableForPeriod(startDate: Date, endDate: Date): Result<boolean> {
    if (this.status === MovieAdministrativeStatus.ARCHIVED)
      return failure({
        // Filmes arquivados não podem ser agendados para exibição
        code: MovieCodes.MOVIE_ARCHIVED,
      });

    if (!this.displayPeriod)
      return failure({
        // O filme não possui período de exibição definido
        code: MovieCodes.MOVIE_MISSING_DISPLAY_PERIOD,
      });

    // Verifica se há sobreposição entre o período proposto e o período de exibição do filme
    const movieStart = this.displayPeriod.startDate.getTime();
    const movieEnd = this.displayPeriod.endDate.getTime();
    const periodStart = startDate.getTime();
    const periodEnd = endDate.getTime();

    // Verifica se há alguma sobreposição
    const hasOverlap = !(periodEnd < movieStart || periodStart > movieEnd);

    if (periodStart > periodEnd)
      return failure({
        // A data e início e término das exibições estão invertidas
        code: MovieCodes.DATE_PERIOD_IS_INVERTED,
      });

    if (!hasOverlap)
      return failure({
        // O período proposto não coincide com o período de exibição do filme
        code: MovieCodes.MOVIE_NOT_AVAILABLE_IN_PERIOD,
        details: {
          proposedPeriodStart: startDate,
          proposedPeriodEnd: endDate,
          movieDisplayPeriodStart: this.displayPeriod.startDate,
          movieDisplayPeriodEnd: this.displayPeriod.endDate,
        },
      });

    return success(true);
  }

  private withStatus(status: MovieAdministrativeStatus): Movie {
    if (this.status === status) return this;

    return new Movie(
      this.uid,
      this.title,
      this.description,
      this.duration,
      this.ageRating,
      status,
      this.genre,
      this.images,
      this.displayPeriod,
      this.contributors,
    );
  }

  /**
   * Verifica se o filme atende aos requisitos mínimos para ser enviado para revisão.
   *
   * @returns Result<boolean> Um Result indicando se o filme pode ser enviado para revisão.
   * Em caso de falha, retorna um array com todos os requisitos não atendidos.
   * @private
   */
  private canPendingReview(): Result<boolean> {
    const failures: SimpleFailure[] = [];

    if (!this.title) {
      // Título da imagem é obrigatório
      failures.push({ code: MovieCodes.MOVIE_MISSING_TITLE });
    }

    if (!this.description) {
      // Descrição da imagem é obrigatória
      failures.push({ code: MovieCodes.MOVIE_MISSING_DESCRIPTION });
    }

    if (!this.ageRating) {
      failures.push({
        // Classificação etária é obrigatória
        code: MovieCodes.MOVIE_MISSING_AGE_RATING,
      });
    }

    // ??? Será mesmo necessário?
    if (this.contributors.getDirectors().length === 0) {
      failures.push({
        // Diretor é obrigatório
        code: MovieCodes.MOVIE_MISSING_DIRECTOR,
      });
    }

    if (!this.images.poster) {
      failures.push({
        // Imagem do poster é obrigatória
        code: MovieCodes.MOVIE_MISSING_POSTER,
      });
    }

    return failures.length > 0 ? failure(failures) : success(true);
  }

  /**
   * Verifica se o filme atende a todos os requisitos para ser aprovado.
   *
   * O método primeiro verifica se o filme pode ser enviado para revisão usando
   * o método canPendingReview(). Se passar nessa verificação, então são
   * verificados os requisitos adicionais para aprovação.
   *
   * @returns Result<boolean> Um Result indicando se o filme pode ser aprovado.
   * Em caso de falha, retorna um array com todos os requisitos não atendidos.
   * @private
   */
  private canApprove(): Result<boolean> {
    const result = this.toPendingReview();
    if (result.invalid) {
      return failure(result.failures);
    }

    const failures: SimpleFailure[] = [];

    if (!this.duration) {
      failures.push({
        // Duração é obrigatória
        code: MovieCodes.MOVIE_MISSING_DURATION,
      });
    }

    // Será mesmo necessário???
    if (!this.genre || this.genre?.count === 0) {
      failures.push({
        // Ao menos um gênero é obrigatório
        code: MovieCodes.MOVIE_MISSING_GENDER,
      });
    }
    return failures.length > 0 ? failure(failures) : success(true);
  }
}
