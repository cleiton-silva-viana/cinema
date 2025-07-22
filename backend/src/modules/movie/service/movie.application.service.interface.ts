import { Result } from '@shared/result/result'
import { Movie, ICreateMovieInput } from '../entity/movie'
import { IMovieFilterInput } from '../entity/value-object/movie.filter'
import { IMovieWithRelations } from '../repository/movie.repository.interface'
import { IMovieContributorInput } from '@modules/movie/entity/value-object/movie.contributor'
import { ILanguageContentInput } from '@/shared/value-object/language-content/language.content.input.interface'

/**
 * Interface para o serviço de aplicação de filmes.
 *
 * Define o contrato para todas as operações relacionadas ao gerenciamento de filmes,
 * incluindo operações CRUD, transições de estado e atualizações específicas de atributos.
 */
export interface IMovieApplicationService {
  /**
   * Busca um filme pelo seu identificador único.
   *
   * @param uid - Identificador único do filme
   * @returns Result<Movie> - Um Result contendo o filme encontrado ou falhas
   */
  findById(uid: string): Promise<Result<Movie>>

  /**
   * Busca um filme pelo seu identificador único incluindo suas relações.
   *
   * @param uid - Identificador único do filme
   * @returns Result<IMovieWithRelations> - Um Result contendo o filme com relações ou falhas
   */
  findByIdWithRelations(uid: string): Promise<Result<IMovieWithRelations>>

  /**
   * Busca múltiplos filmes com base nos filtros fornecidos.
   *
   * @param filters - Filtros para busca de filmes
   * @returns Result<Movie[]> - Um Result contendo a lista de filmes ou falhas
   */
  findMany(filters: IMovieFilterInput): Promise<Result<Movie[]>>

  /**
   * Busca múltiplos filmes com suas relações com base nos filtros fornecidos.
   *
   * @param filters - Filtros para busca de filmes
   * @returns Result<IMovieWithRelations[]> - Um Result contendo a lista de filmes com relações ou falhas
   */
  findManyWithRelations(filters: IMovieFilterInput): Promise<Result<IMovieWithRelations[]>>

  /**
   * Cria um novo filme.
   *
   * @param input - Dados para criação do filme
   * @returns Result<Movie> - Um Result contendo o filme criado ou falhas
   */
  create(input: ICreateMovieInput): Promise<Result<Movie>>

  /**
   * Submete um filme para revisão.
   *
   * @param uid - Identificador único do filme
   * @returns Result<Movie> - Um Result contendo o filme atualizado ou falhas
   */
  submitForReview(uid: string): Promise<Result<Movie>>

  /**
   * Aprova um filme.
   *
   * @param uid - Identificador único do filme
   * @returns Result<Movie> - Um Result contendo o filme aprovado ou falhas
   */
  approve(uid: string): Promise<Result<Movie>>

  /**
   * Arquiva um filme.
   *
   * @param uid - Identificador único do filme
   * @returns Result<Movie> - Um Result contendo o filme arquivado ou falhas
   */
  archive(uid: string): Promise<Result<Movie>>

  /**
   * Atualiza o título do filme.
   *
   * @param uid - Identificador único do filme
   * @param title - Novo título multilíngue
   * @returns Result<Movie> - Um Result contendo o filme atualizado ou falhas
   */
  updateTitle(uid: string, title: ILanguageContentInput[]): Promise<Result<Movie>>

  /**
   * Atualiza a descrição do filme.
   *
   * @param uid - Identificador único do filme
   * @param description - Nova descrição multilíngue
   * @returns Result<Movie> - Um Result contendo o filme atualizado ou falhas
   */
  updateDescription(uid: string, description: ILanguageContentInput[]): Promise<Result<Movie>>

  /**
   * Define ou atualiza a duração do filme.
   *
   * @param uid - Identificador único do filme
   * @param durationInMinutes - Duração em minutos
   * @returns Result<Movie> - Um Result contendo o filme atualizado ou falhas
   */
  setDuration(uid: string, durationInMinutes: number): Promise<Result<Movie>>

  /**
   * Remove a duração do filme.
   *
   * @param uid - Identificador único do filme
   * @returns Result<Movie> - Um Result contendo o filme atualizado ou falhas
   */
  removeDuration(uid: string): Promise<Result<Movie>>

  /**
   * Atualiza a classificação etária do filme.
   *
   * @param uid - Identificador único do filme
   * @param ageRating - Nova classificação etária
   * @returns Result<Movie> - Um Result contendo o filme atualizado ou falhas
   */
  updateAgeRating(uid: string, ageRating: string): Promise<Result<Movie>>

  /**
   * Define ou atualiza os gêneros do filme.
   *
   * @param uid - Identificador único do filme
   * @param genres - Lista de gêneros
   * @returns Result<Movie> - Um Result contendo o filme atualizado ou falhas
   */
  setGenres(uid: string, genres: string[]): Promise<Result<Movie>>

  /**
   * Remove todos os gêneros do filme.
   *
   * @param uid - Identificador único do filme
   * @returns Result<Movie> - Um Result contendo o filme atualizado ou falhas
   */
  removeGenres(uid: string): Promise<Result<Movie>>

  /**
   * Atualiza a imagem do poster do filme.
   *
   * @param uid - Identificador único do filme
   * @param imageUID - Identificador único da nova imagem
   * @returns Result<Movie> - Um Result contendo o filme atualizado ou falhas
   */
  updatePosterImage(uid: string, imageUID: string): Promise<Result<Movie>>

  /**
   * Define ou atualiza o período de exibição do filme.
   *
   * @param uid - Identificador único do filme
   * @param startDate - Data de início da exibição
   * @param endDate - Data de término da exibição
   * @returns Result<Movie> - Um Result contendo o filme atualizado ou falhas
   */
  setDisplayPeriod(uid: string, startDate: Date, endDate: Date): Promise<Result<Movie>>

  /**
   * Remove o período de exibição do filme.
   *
   * @param uid - Identificador único do filme
   * @returns Result<Movie> - Um Result contendo o filme atualizado ou falhas
   */
  removeDisplayPeriod(uid: string): Promise<Result<Movie>>

  /**
   * Atualiza os contribuidores do filme.
   *
   * @param uid - Identificador único do filme
   * @param contributors - Lista de contribuidores
   * @returns Result<Movie> - Um Result contendo o filme atualizado ou falhas
   */
  updateContributors(uid: string, contributors: IMovieContributorInput[]): Promise<Result<Movie>>
}
