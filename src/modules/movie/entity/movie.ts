import { failure, Result, success } from "../../../shared/result/result";
import { MovieGenre } from "./value-object/movie.genre";
import { MovieUID } from "./value-object/movie.uid";
import { MovieTitle } from "./value-object/movie.title";
import { MovieDescription } from "./value-object/movie.description";
import { SimpleFailure } from "../../../shared/failure/simple.failure.type";
import {
  ILanguageContent,
  IMultilingualInput,
} from "../../../shared/value-object/multilingual-content";
import {
  DisplayPeriod,
  ICreateDisplayPeriodInput,
} from "./value-object/display.period";
import { MovieDuration } from "./value-object/movie.duration";
import { MovieAdministrativeStatus } from "../type/movie.administrative.status";
import { MovieContributors } from "./value-object/movie.contributors";
import { AgeRating } from "./value-object/age.rating";
import { TechnicalError } from "../../../shared/error/technical.error";
import { isNull } from "../../../shared/validator/validator";
import { IMovieContributorInput } from "./value-object/movie.contributor";
import { ImageUID } from "../../image/entity/value-object/image-uid.vo";
import { FailureCode } from "../../../shared/failure/failure.codes.enum";

/**
 * Interface que define os dados fundamentais necessários para criar uma entidade Movie.
 * Contém apenas os campos obrigatórios para a criação inicial de um filme.
 *
 * Exemplo:
 * ```typescript
 * const movieInput: ICreateMovieInput = {
 *   title: [{ language: "pt-BR", text: "O Filme" }, { language: "en-US", text: "The Movie" }],
 *   description: [{ language: "pt-BR", text: "Descrição do filme" }],
 *   ageRating: "12",
 *   imageUID: "IMG_12345",
 *   contributors: [{ name: "Diretor", role: "DIRECTOR" }]
 * };
 * ```
 */
export interface ICreateMovieInput {
  title: IMultilingualInput[];
  description: IMultilingualInput[];
  ageRating: string;
  imageUID: string;
  contributors: IMovieContributorInput[];
}

/**
 * Interface que define os dados completos de um filme para hidratação.
 * Contém todos os campos possíveis de um filme, incluindo os opcionais.
 */
export interface IMovieHydrateInput {
  uid: string;
  title: ILanguageContent;
  description: ILanguageContent;
  duration?: number;
  ageRating: string;
  status: MovieAdministrativeStatus;
  genres?: string[];
  imageUID: string;
  displayPeriod?: ICreateDisplayPeriodInput;
  contributors: IMovieContributorInput[];
}

/**
 * Interface que define os dados necessários para atualizar as propriedades de um filme.
 * Todos os campos são opcionais, permitindo atualização parcial.
 */
export interface IMovieUpdateInput {
  title?: IMultilingualInput[];
  description?: IMultilingualInput[];
  duration?: number;
  ageRating?: string;
  genres?: string[];
  imageUID?: string;
  displayPeriod?: ICreateDisplayPeriodInput;
  contributors?: IMovieContributorInput[];
}

/**
 * Representa a entidade Filme com suas propriedades e regras de negócio.
 *
 * Esta classe implementa o padrão de Value Object para garantir a imutabilidade
 * e encapsular as regras de validação específicas para filmes no sistema de cinema.
 *
 * Um filme possui um ciclo de vida representado por diferentes status administrativos:
 * - DRAFT: Rascunho inicial, com informações básicas
 * - PENDING_REVIEW: Aguardando revisão, com informações essenciais preenchidas
 * - APPROVED: Aprovado para exibição, com todas as informações necessárias
 * - ARCHIVED: Arquivado, não disponível para novas exibições
 *
 * A classe oferece métodos para transições de estado que validam se o filme
 * atende aos requisitos necessários para cada status.
 */
export class Movie {
  /**
   * Construtor protegido para criar instâncias de Movie.
   *
   * Este construtor é protegido para garantir que novas instâncias sejam criadas
   * apenas através dos métodos estáticos factory (create) ou de hidratação (hydrate),
   * assegurando que todas as regras de negócio sejam aplicadas.
   *
   * @param uid Identificador único do filme
   * @param status Status administrativo atual do filme
   * @param title Título do filme em múltiplos idiomas
   * @param description Descrição do filme em múltiplos idiomas
   * @param duration Duração do filme em minutos
   * @param ageRating Classificação etária do filme
   * @param genre Gêneros do filme
   * @param imageUID Identificador da imagem do poster do filme
   * @param displayPeriod Período em que o filme estará disponível para exibição
   * @param contributors Contribuidores do filme (diretores, atores, etc.)
   */
  protected constructor(
    public readonly uid: MovieUID,
    public readonly title: MovieTitle,
    public readonly description: MovieDescription,
    public readonly duration: MovieDuration,
    public readonly ageRating: AgeRating,
    public readonly status: MovieAdministrativeStatus,
    public readonly genre: MovieGenre,
    public readonly imageUID: ImageUID,
    public readonly displayPeriod: DisplayPeriod | null,
    public readonly contributors: MovieContributors,
  ) {}

  /**
   * Cria uma nova instância de Filme com valores padrão para campos opcionais.
   *
   * Este método valida todos os dados de entrada e retorna um Result que pode
   * conter a nova instância de Movie ou um conjunto de falhas de validação.
   *
   * Possíveis falhas incluem:
   * - Validação de título (formato, comprimento)
   * - Validação de descrição (formato, comprimento)
   * - Classificação etária inválida
   * - Problemas com contribuidores (formato, quantidade)
   * - UID de imagem inválido
   *
   * @param input Objeto contendo parte dos dados necessários para criar um filme
   * @returns Result<Movie> Um objeto Result contendo a nova instância de Movie ou
   * um array de falhas (SimpleFailure) caso a validação falhe.
   */
  public static create(input: ICreateMovieInput): Result<Movie> {
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

    const imageUIDResult = ImageUID.parse(input.imageUID);
    if (imageUIDResult.invalid) failures.push(...imageUIDResult.failures);

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
        imageUIDResult.value,
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
  public static hydrate(input: IMovieHydrateInput): Movie {
    TechnicalError.if(isNull(input.uid), FailureCode.MISSING_REQUIRED_DATA);

    const uid = MovieUID.hydrate(input.uid);

    const title = MovieTitle.hydrate(input.title.language, input.title.text);

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

    const imageUID = ImageUID.hydrate(input.imageUID);

    return new Movie(
      uid,
      title,
      description,
      duration,
      ageRating,
      status,
      genres,
      imageUID,
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
  public update(updates: IMovieUpdateInput): Result<Movie> {
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
            this.imageUID,
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
   * Verifica se o filme está disponível para exibição na data especificada.
   * Considera apenas o dia/mês/ano, ignorando o horário específico.
   * @param date Data da exibição proposta
   * @returns boolean Indica se o filme está disponível nesta data
   */
  public isAvailableForPeriod(date: Date): boolean {
    if (this.status !== MovieAdministrativeStatus.APPROVED) return false;

    const requestedDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
    );

    const startDate = new Date(
      this.displayPeriod.startDate.getFullYear(),
      this.displayPeriod.startDate.getMonth(),
      this.displayPeriod.startDate.getDate(),
    );

    const endDate = new Date(
      this.displayPeriod.endDate.getFullYear(),
      this.displayPeriod.endDate.getMonth(),
      this.displayPeriod.endDate.getDate(),
    );

    endDate.setHours(23, 59, 59, 999);

    return requestedDate >= startDate && requestedDate <= endDate;
  }

  /**
   * Cria uma nova instância do filme com o status administrativo atualizado.
   *
   * Este método implementa o padrão de imutabilidade, retornando uma nova
   * instância com o status alterado em vez de modificar a instância atual.
   * Se o novo status for igual ao atual, retorna a própria instância.
   *
   * @param status Novo status administrativo a ser aplicado
   * @returns Movie Nova instância do filme com o status atualizado
   * @private
   */
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
      this.imageUID,
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
      failures.push({
        code: FailureCode.MISSING_REQUIRED_DATA,
        details: {
          field: "title",
        },
      });
    }

    if (!this.description) {
      failures.push({
        code: FailureCode.MISSING_REQUIRED_DATA,
        details: {
          field: "description",
        },
      });
    }

    if (!this.ageRating) {
      failures.push({
        code: FailureCode.MISSING_REQUIRED_DATA,
        details: {
          field: "ageRating",
        },
      });
    }

    if (this.contributors.getDirectors().length === 0) {
      failures.push({
        code: FailureCode.MISSING_REQUIRED_DATA,
        details: {
          field: "contributors",
        },
      });
    }

    if (!this.imageUID) {
      failures.push({
        code: FailureCode.MISSING_REQUIRED_DATA,
        details: {
          field: "imageUID",
        },
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
        code: FailureCode.MISSING_REQUIRED_DATA,
        details: {
          field: "duration",
        },
      });
    }

    if (!this.genre || this.genre?.count === 0) {
      failures.push({
        code: FailureCode.MISSING_REQUIRED_DATA,
        details: {
          field: "genres",
        },
      });
    }
    return failures.length > 0 ? failure(failures) : success(true);
  }
}
