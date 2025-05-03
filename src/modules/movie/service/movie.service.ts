import { IMovieRepository } from "../repository/movie.repository.interface";
import { failure, Result, success } from "../../../shared/result/result";
import { ICreateMovieInput, Movie, IMovieUpdateInput } from "../entity/movie";
import { Inject, Injectable } from "@nestjs/common";
import {
  IShowtimeService,
  SHOWTIME_SERVICE,
} from "../../showtime/service/showtime.service.interface";
import { MovieUID } from "../entity/value-object/movie.uid";
import { isNull } from "../../../shared/validator/validator";
import {
  IMovieFilterInput,
  MovieFilter,
} from "../entity/value-object/movie.filter";
import { MOVIE_REPOSITORY } from "../constant/movie.constant";
import { FailureCode } from "../../../shared/failure/failure.codes.enum";
import { ResourceTypes } from "../../../shared/constant/resource.types";
import { IMovieService } from "./movie.service.interface";

/**
 * Serviço responsável por gerenciar operações relacionadas a filmes.
 *
 * Este serviço implementa a camada de aplicação para operações de filmes,
 * coordenando a comunicação entre a API e o domínio. Ele encapsula toda a
 * lógica de negócio relacionada a:
 * - Busca e filtragem de filmes
 * - Criação e atualização de filmes
 * - Gerenciamento do ciclo de vida dos filmes (rascunho, revisão, aprovação, arquivamento)
 * - Validação de regras de negócio antes de persistir alterações
 *
 * O serviço utiliza o padrão Repository para acesso a dados e Result para
 * tratamento de erros e sucesso.
 */
@Injectable()
export class MovieService implements IMovieService {
  constructor(
    @Inject(MOVIE_REPOSITORY) private readonly repository: IMovieRepository,
    @Inject(SHOWTIME_SERVICE)
    private readonly showtimeService: IShowtimeService,
  ) {}

  /**
   * Busca um filme pelo seu identificador único (UID).
   *
   * @param uid - Identificador único do filme a ser buscado
   * @returns Result<Movie> - Um Result contendo o filme encontrado ou falha caso não exista
   */
  public async findById(uid: string): Promise<Result<Movie>> {
    const uidResult = MovieUID.parse(uid);
    if (uidResult.invalid) return failure(uidResult.failures);

    const movie = await this.repository.findById(uidResult.value);

    return movie
      ? success(movie)
      : failure({
          code: FailureCode.RESOURCE_NOT_FOUND,
          details: { resource: ResourceTypes.MOVIE },
        });
  }

  /**
   * Busca múltiplos filmes com base em filtros opcionais.
   *
   * Se nenhum filtro for fornecido, busca filmes em exibição no dia atual e nos próximos 7 dias.
   * Os filtros são validados antes da busca para garantir consistência.
   *
   * Filtros disponíveis:
   * - status: Status administrativo dos filmes (DRAFT, PENDING_REVIEW, APPROVED, ARCHIVED)
   * - displayPeriod: Período de exibição (startDate, endDate)
   * - genres: Lista de gêneros para filtrar
   * - title: Busca por título (parcial, case-insensitive)
   *
   * @param filters - Objeto contendo critérios de filtro para a busca
   * @returns Result<Movie[]> - Um Result contendo a lista de filmes que atendem aos critérios
   */
  public async findMany(filters: IMovieFilterInput): Promise<Result<Movie[]>> {
    const filterResult = MovieFilter.create(filters);
    if (filterResult.invalid) return failure(filterResult.failures);

    const movies = await this.repository.find(filterResult.value);
    return success(movies);
  }

  /**
   * Cria um novo filme no sistema.
   *
   * Um novo filme é criado com status inicial DRAFT. Os campos obrigatórios são:
   * - title: Título do filme em pelo menos um idioma
   * - description: Descrição do filme em pelo menos um idioma
   * - ageRating: Classificação etária do filme
   * - imageUID: Identificador da imagem do poster
   * - contributors: Lista de contribuidores (pelo menos um diretor)
   *
   * @param input - Dados necessários para criar um novo filme
   * @returns Result<Movie> - Um Result contendo o filme criado ou falhas de validação
   */
  public async create(input: ICreateMovieInput): Promise<Result<Movie>> {
    if (isNull(input)) {
      return failure({
        code: FailureCode.NULL_ARGUMENT,
      });
    }

    const movieResult = Movie.create(input);
    if (movieResult.invalid) return failure(movieResult.failures);

    const savedMovie = await this.repository.save(movieResult.value);
    return success(savedMovie);
  }

  /**
   * Atualiza um filme existente.
   *
   * Busca o filme pelo UID, aplica as atualizações e persiste as mudanças.
   * Campos que podem ser atualizados:
   * - title: Título do filme
   * - description: Descrição do filme
   * - duration: Duração em minutos
   * - genres: Lista de gêneros
   * - displayPeriod: Período de exibição
   * - contributors: Lista de contribuidores
   *
   * Nota: A atualização não altera o status administrativo do filme.
   * Para alterar o status, use os métodos específicos (submitForReview, approve, archive).
   *
   * @param movieUID - Identificador único do filme a ser atualizado
   * @param input - Dados a serem atualizados no filme
   * @returns Result<Movie> - Um Result contendo o filme atualizado ou falhas
   */
  public async update(
    movieUID: string,
    input: IMovieUpdateInput,
  ): Promise<Result<Movie>> {
    if (isNull(input)) return failure({ code: FailureCode.NULL_ARGUMENT });

    const findResult = await this.findById(movieUID);
    if (findResult.invalid) return failure(findResult.failures);
    const movie = findResult.value;

    const updatedResult = movie.update(input);
    if (updatedResult.invalid) return failure(updatedResult.failures);

    const updatedMovie = await this.repository.update(updatedResult.value);
    return success(updatedMovie);
  }

  /**
   * Altera o status do filme para "Pendente de Revisão".
   * Verifica se o filme atende aos requisitos mínimos para ser revisado.
   *
   * @param uid - Identificador único do filme
   * @returns Result<Movie> - Um Result contendo o filme atualizado ou falhas
   */
  public async submitForReview(uid: string): Promise<Result<Movie>> {
    const findResult = await this.findById(uid);
    if (findResult.invalid) return failure(findResult.failures);
    const movie = findResult.value;

    const pendingReviewResult = movie.toPendingReview();
    if (pendingReviewResult.invalid)
      return failure(pendingReviewResult.failures);

    const updatedMovie = await this.repository.update(
      pendingReviewResult.value,
    );
    return success(updatedMovie);
  }

  /**
   * Altera o status do filme para "Aprovado".
   * Verifica se o filme atende a todos os requisitos para ser aprovado.
   *
   * @param uid - Identificador único do filme
   * @returns Result<Movie> - Um Result contendo o filme atualizado ou falhas
   */
  public async approve(uid: string): Promise<Result<Movie>> {
    const findResult = await this.findById(uid);
    if (findResult.invalid) return failure(findResult.failures);
    const movie = findResult.value;

    const approveResult = movie.toApprove();
    if (approveResult.invalid) return failure(approveResult.failures);

    const updatedMovie = await this.repository.update(approveResult.value);
    return success(updatedMovie);
  }

  /**
   * Arquiva um filme existente.
   *
   * Este método verifica se o filme existe e então o marca como arquivado.
   * Usado quando um filme já teve exibições e não deve ser excluído permanentemente.
   * Antes de arquivar, verifica se não há exibições agendadas para o filme.
   *
   * @param uid - Identificador único do filme a ser arquivado
   * @returns Result<Movie> - Sucesso com o filme arquivado, ou falhas caso contrário
   */
  public async archive(uid: string): Promise<Result<Movie>> {
    const findResult = await this.findById(uid);
    if (findResult.invalid) return failure(findResult.failures);
    const movie = findResult.value;

    const hasExhibitionsScheduled =
      await this.showtimeService.movieHasExhibitionsScheduled(movie.uid.value);
    if (hasExhibitionsScheduled.invalid)
      return failure(hasExhibitionsScheduled.failures);

    if (hasExhibitionsScheduled.value === true) {
      return failure({
        code: FailureCode.MOVIE_ARCHIVE_BLOCKED_BY_SCREENINGS,
      });
    }

    const archiveResult = movie.toArchive();
    if (archiveResult.invalid) return failure(archiveResult.failures);
    const archivedMovie = archiveResult.value;

    await this.repository.update(archivedMovie);
    return success(archivedMovie);
  }

  /**
   * Exclui permanentemente um filme.
   *
   * Este método verifica se o filme existe e se pode ser excluído (não teve exibições).
   * Se o filme já teve exibições, retorna um erro indicando que deve ser arquivado.
   *
   * Possíveis falhas:
   * - RESOURCE_NOT_FOUND: O filme não foi encontrado
   * - MOVIE_DELETE_BLOCKED_BY_SHOWINGS: O filme possui exibições e não pode ser excluído
   *
   * @param uid - Identificador único do filme a ser excluído
   * @returns Result<null> - Sucesso se a exclusão for concluída, ou falhas caso contrário
   */
  public async delete(uid: string): Promise<Result<null>> {
    const findResult = await this.findById(uid);
    if (findResult.invalid) return failure(findResult.failures);
    const movie = findResult.value;

    const hasShowingsResult = await this.showtimeService.movieHasShowings(
      movie.uid.value,
    );
    if (hasShowingsResult.invalid) return failure(hasShowingsResult.failures);

    if (hasShowingsResult.value) {
      return failure({
        code: FailureCode.MOVIE_DELETE_BLOCKED_BY_SHOWINGS,
        details: {
          uid: movie.uid.value,
        },
      });
    }

    await this.repository.delete(movie.uid);
    return success(null);
  }
}
