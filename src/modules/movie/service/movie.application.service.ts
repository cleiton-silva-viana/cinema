import { Inject, Injectable } from '@nestjs/common'
import { IMovieRepository, IMovieWithRelations } from '../repository/movie.repository.interface'
import { ICreateMovieInput, Movie } from '../entity/movie'
import { MovieUID } from '../entity/value-object/movie.uid'
import { IMovieFilterInput, MovieFilter } from '../entity/value-object/movie.filter'
import { failure, Result, success } from '@shared/result/result'
import { ResourceTypes } from '@shared/constant/resource.types'
import { MOVIE_REPOSITORY } from '@modules/movie/constant/movie.constant'
import { FailureFactory } from '@shared/failure/failure.factory'
import { ensureNotNull } from '@shared/validator/common.validators'
import { IMultilingualInput } from '@shared/value-object/multilingual-content'
import { IMovieContributorInput } from '@modules/movie/entity/value-object/movie.contributor'
import { IMovieApplicationService } from '@modules/movie/service/movie.application.service.interface'

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
export class MovieApplicationService implements IMovieApplicationService {
  constructor(@Inject(MOVIE_REPOSITORY) private readonly repository: IMovieRepository) {}

  /**
   * Busca um filme pelo seu identificador único (UID).
   *
   * @param uid - Identificador único do filme a ser buscado
   * @returns Result<Movie> - Um Result contendo o filme encontrado ou falha caso não exista
   */
  public async findById(uid: string): Promise<Result<Movie>> {
    const uidResult = MovieUID.parse(uid)
    if (uidResult.isInvalid()) return uidResult

    const movieUID = uidResult.value
    const movie = await this.repository.findById(movieUID)

    return movie ? success(movie) : failure(FailureFactory.RESOURCE_NOT_FOUND(ResourceTypes.MOVIE, movieUID.value))
  }

  /**
   * Busca um filme com todos os relacionamentos resolvidos.
   * Inclui dados completos de pessoas (contributors), imagens, etc.
   *
   * @param uid - Identificador único do filme a ser buscado
   * @returns Result<MovieWithRelations> - Um Result contendo o filme com relacionamentos
   */
  public async findByIdWithRelations(uid: string): Promise<Result<IMovieWithRelations>> {
    const uidResult = MovieUID.parse(uid)
    if (uidResult.isInvalid()) return uidResult

    const movieUID = uidResult.value
    const movie = await this.repository.findByIdWithRelations(movieUID)

    return movie ? success(movie) : failure(FailureFactory.RESOURCE_NOT_FOUND(ResourceTypes.MOVIE, movieUID.value))
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
    const filterResult = MovieFilter.create(filters)
    if (filterResult.isInvalid()) return filterResult

    const movies = await this.repository.findMany(filterResult.value)
    return success(movies)
  }

  /**
   * Busca múltiplos filmes com relacionamentos resolvidos.
   * Para casos onde é necessário exibir dados completos em listagens.
   *
   * @param filters - Objeto contendo critérios de filtro para a busca
   * @returns Result<MovieWithRelations[]> - Um Result contendo filmes com relacionamentos
   */
  public async findManyWithRelations(filters: IMovieFilterInput): Promise<Result<IMovieWithRelations[]>> {
    const filterResult = MovieFilter.create(filters)
    if (filterResult.isInvalid()) return filterResult

    const movies = await this.repository.findManyWithRelations(filterResult.value)
    return success(movies)
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
    const failures = ensureNotNull({ input })
    if (failures.length > 0) return failure(failures)

    const creatMovieResult = Movie.create(input)
    if (creatMovieResult.isInvalid()) return creatMovieResult

    const savedMovie = await this.repository.save(creatMovieResult.value)
    return success(savedMovie)
  }

  /**
   * Altera o status do filme para "Pendente de Revisão".
   * Verifica se o filme atende aos requisitos mínimos para ser revisado.
   *
   * @param uid - Identificador único do filme
   * @returns Result<Movie> - Um Result contendo o filme atualizado ou falhas
   */
  public async submitForReview(uid: string): Promise<Result<Movie>> {
    const findResult = await this.findById(uid)
    if (findResult.isInvalid()) return findResult
    const movie = findResult.value

    const pendingReviewResult = movie.toPendingReview()
    if (pendingReviewResult.isInvalid()) return pendingReviewResult

    const updatedMovie = await this.repository.update(pendingReviewResult.value)
    return success(updatedMovie)
  }

  /**
   * Altera o status do filme para "Aprovado".
   * Verifica se o filme atende a todos os requisitos para ser aprovado.
   *
   * @param uid - Identificador único do filme
   * @returns Result<Movie> - Um Result contendo o filme atualizado ou falhas
   */
  public async approve(uid: string): Promise<Result<Movie>> {
    const findResult = await this.findById(uid)
    if (findResult.isInvalid()) return findResult
    const movie = findResult.value

    const approveResult = movie.toApprove()
    if (approveResult.isInvalid()) return approveResult

    const updatedMovie = await this.repository.update(approveResult.value)
    return success(updatedMovie)
  }

  /**
   * Altera o status do filme para "Arquivado".
   *
   * @param uid - Identificador único do filme
   * @returns Result<Movie> - Um Result contendo o filme atualizado ou falhas
   */
  public async archive(uid: string): Promise<Result<Movie>> {
    const findResult = await this.findById(uid)
    if (findResult.isInvalid()) return findResult
    const movie = findResult.value

    const archiveResult = movie.toArchive()
    if (archiveResult.isInvalid()) return archiveResult

    const updatedMovie = await this.repository.update(archiveResult.value)
    return success(updatedMovie)
  }

  /**
   * Atualiza o título do filme.
   *
   * @param uid - Identificador único do filme
   * @param title - Novo título multilíngue
   * @returns Result<Movie> - Um Result contendo o filme atualizado ou falhas
   */
  public async updateTitle(uid: string, title: IMultilingualInput[]): Promise<Result<Movie>> {
    const findResult = await this.findById(uid)
    if (findResult.isInvalid()) return findResult
    const movie = findResult.value

    const updateResult = movie.updateTitle(title)
    if (updateResult.isInvalid()) return updateResult

    const updatedMovie = await this.repository.update(updateResult.value)
    return success(updatedMovie)
  }

  /**
   * Atualiza a descrição do filme.
   *
   * @param uid - Identificador único do filme
   * @param description - Nova descrição multilíngue
   * @returns Result<Movie> - Um Result contendo o filme atualizado ou falhas
   */
  public async updateDescription(uid: string, description: IMultilingualInput[]): Promise<Result<Movie>> {
    const findResult = await this.findById(uid)
    if (findResult.isInvalid()) return findResult
    const movie = findResult.value

    const updateResult = movie.updateDescription(description)
    if (updateResult.isInvalid()) return updateResult

    const updatedMovie = await this.repository.update(updateResult.value)
    return success(updatedMovie)
  }

  /**
   * Define ou atualiza a duração do filme.
   *
   * @param uid - Identificador único do filme
   * @param durationInMinutes - Duração em minutos
   * @returns Result<Movie> - Um Result contendo o filme atualizado ou falhas
   */
  public async setDuration(uid: string, durationInMinutes: number): Promise<Result<Movie>> {
    const findResult = await this.findById(uid)
    if (findResult.isInvalid()) return findResult
    const movie = findResult.value

    const updateResult = movie.setDuration(durationInMinutes)
    if (updateResult.isInvalid()) return updateResult

    const updatedMovie = await this.repository.update(updateResult.value)
    return success(updatedMovie)
  }

  /**
   * Remove a duração do filme.
   *
   * @param uid - Identificador único do filme
   * @returns Result<Movie> - Um Result contendo o filme atualizado ou falhas
   */
  public async removeDuration(uid: string): Promise<Result<Movie>> {
    const findResult = await this.findById(uid)
    if (findResult.isInvalid()) return findResult
    const movie = findResult.value

    const updateResult = movie.removeDuration()
    if (updateResult.isInvalid()) return updateResult

    const updatedMovie = await this.repository.update(updateResult.value)
    return success(updatedMovie)
  }

  /**
   * Atualiza a classificação etária do filme.
   *
   * @param uid - Identificador único do filme
   * @param ageRating - Nova classificação etária
   * @returns Result<Movie> - Um Result contendo o filme atualizado ou falhas
   */
  public async updateAgeRating(uid: string, ageRating: string): Promise<Result<Movie>> {
    const findResult = await this.findById(uid)
    if (findResult.isInvalid()) return findResult
    const movie = findResult.value

    const updateResult = movie.updateAgeRating(ageRating)
    if (updateResult.isInvalid()) return updateResult

    const updatedMovie = await this.repository.update(updateResult.value)
    return success(updatedMovie)
  }

  /**
   * Define ou atualiza os gêneros do filme.
   *
   * @param uid - Identificador único do filme
   * @param genres - Lista de gêneros
   * @returns Result<Movie> - Um Result contendo o filme atualizado ou falhas
   */
  public async setGenres(uid: string, genres: string[]): Promise<Result<Movie>> {
    const findResult = await this.findById(uid)
    if (findResult.isInvalid()) return findResult
    const movie = findResult.value

    const updateResult = movie.setGenres(genres)
    if (updateResult.isInvalid()) return updateResult

    const updatedMovie = await this.repository.update(updateResult.value)
    return success(updatedMovie)
  }

  /**
   * Remove todos os gêneros do filme.
   *
   * @param uid - Identificador único do filme
   * @returns Result<Movie> - Um Result contendo o filme atualizado ou falhas
   */
  public async removeGenres(uid: string): Promise<Result<Movie>> {
    const findResult = await this.findById(uid)
    if (findResult.isInvalid()) return findResult
    const movie = findResult.value

    const updateResult = movie.removeGenres()
    if (updateResult.isInvalid()) return updateResult

    const updatedMovie = await this.repository.update(updateResult.value)
    return success(updatedMovie)
  }

  /**
   * Atualiza a imagem do poster do filme.
   *
   * @param uid - Identificador único do filme
   * @param imageUID - Identificador único da nova imagem
   * @returns Result<Movie> - Um Result contendo o filme atualizado ou falhas
   */
  public async updatePosterImage(uid: string, imageUID: string): Promise<Result<Movie>> {
    const findResult = await this.findById(uid)
    if (findResult.isInvalid()) return findResult
    const movie = findResult.value

    const updateResult = movie.updatePosterImage(imageUID)
    if (updateResult.isInvalid()) return updateResult

    const updatedMovie = await this.repository.update(updateResult.value)
    return success(updatedMovie)
  }

  /**
   * Define ou atualiza o período de exibição do filme.
   *
   * @param uid - Identificador único do filme
   * @param startDate - Data de início da exibição
   * @param endDate - Data de término da exibição
   * @returns Result<Movie> - Um Result contendo o filme atualizado ou falhas
   */
  public async setDisplayPeriod(uid: string, startDate: Date, endDate: Date): Promise<Result<Movie>> {
    const findResult = await this.findById(uid)
    if (findResult.isInvalid()) return findResult
    const movie = findResult.value

    const updateResult = movie.setDisplayPeriod(startDate, endDate)
    if (updateResult.isInvalid()) return updateResult

    const updatedMovie = await this.repository.update(updateResult.value)
    return success(updatedMovie)
  }

  /**
   * Remove o período de exibição do filme.
   *
   * @param uid - Identificador único do filme
   * @returns Result<Movie> - Um Result contendo o filme atualizado ou falhas
   */
  public async removeDisplayPeriod(uid: string): Promise<Result<Movie>> {
    const findResult = await this.findById(uid)
    if (findResult.isInvalid()) return findResult
    const movie = findResult.value

    const updateResult = movie.removeDisplayPeriod()
    if (updateResult.isInvalid()) return updateResult

    const updatedMovie = await this.repository.update(updateResult.value)
    return success(updatedMovie)
  }

  /**
   * Atualiza os contribuidores do filme.
   *
   * @param uid - Identificador único do filme
   * @param contributors - Lista de contribuidores
   * @returns Result<Movie> - Um Result contendo o filme atualizado ou falhas
   */
  public async updateContributors(uid: string, contributors: IMovieContributorInput[]): Promise<Result<Movie>> {
    const findResult = await this.findById(uid)
    if (findResult.isInvalid()) return findResult
    const movie = findResult.value

    const updateResult = movie.updateContributors(contributors)
    if (updateResult.isInvalid()) return updateResult

    const updatedMovie = await this.repository.update(updateResult.value)
    return success(updatedMovie)
  }
}
