import { Movie } from '../entity/movie'
import { MovieUID } from '../entity/value-object/movie.uid'
import { MovieFilter } from '../entity/value-object/movie.filter'
import { Image } from '@modules/image/entity/image'
import { Person } from '@modules/person/entity/person'

/**
 * Interface que representa um filme com todas suas relações carregadas.
 * Utilizada para retornar dados completos do agregado Movie.
 */
export interface IMovieWithRelations {
  /** A entidade Movie principal */
  movie: Movie
  /** A imagem/poster do filme */
  image: Image
  /** Lista de pessoas (contribuidores) relacionadas ao filme */
  contributors: Person[]
}

/**
 * Interface para o repositório de filmes.
 *
 * Define os métodos para acesso e manipulação dos dados relacionados aos filmes.
 */
export interface IMovieRepository {
  /**
   * Busca um filme pelo seu UID.
   *
   * @param uid - Identificador único do filme.
   * @returns {Promise<Movie | null>} Uma Promise que resolve com o filme, ou null se não for encontrado.
   */
  findById(uid: MovieUID): Promise<Movie | null>

  /**
   * Busca um filme pelo seu UID incluindo todas as entidades relacionadas.
   *
   * Este método carrega o filme junto com:
   * - A imagem/poster associada
   * - Todos os contribuidores (diretores, atores, etc.)
   *
   * @param uid - Identificador único do filme
   * @returns {Promise<IMovieWithRelations | null>} Uma Promise que resolve com o filme e suas relações, ou null se não encontrado
   */
  findByIdWithRelations(uid: MovieUID): Promise<IMovieWithRelations | null>

  /**
   * Busca filmes com base em um filtro opcional.
   *
   * Se nenhum filtro for fornecido, um conjunto padrão (por exemplo, filmes em cartaz) poderá ser retornado.
   *
   * @param filter - (Opcional) Objeto com critérios para filtrar a busca.
   * @returns {Promise<Movie[]>} Uma Promise que resolve com um array de filmes que atendem aos critérios.
   */
  findMany(filter: MovieFilter): Promise<Movie[]>

  /**
   * Busca múltiplos filmes incluindo suas relações com base em um filtro.
   *
   * @param filter - Objeto com critérios para filtrar a busca
   * @returns {Promise<IMovieWithRelations[]>} Uma Promise que resolve com um array de filmes com suas relações
   */
  findManyWithRelations(filter: MovieFilter): Promise<IMovieWithRelations[]>

  /**
   * Persiste um filme, criando ou atualizando conforme necessário.
   *
   * @param movie - Objeto Movie a ser salvo.
   * @returns {Promise<Movie>} Uma Promise que resolve com o filme persistido.
   */
  save(movie: Movie): Promise<Movie>

  /**
   * Atualiza um filme existente.
   *
   * Essa é uma alternativa ao método save(), caso seja utilizada uma abordagem
   * de atualização explícita.
   *
   * @param movie - Objeto Movie com os dados atualizados.
   * @returns {Promise<Movie>} Uma Promise que resolve com o filme atualizado.
   */
  update(movie: Partial<Movie>): Promise<Movie>

  /**
   * Realiza a exclusão definitiva (hard delete) de um filme.
   *
   * @param uid - Identificador único do filme a ser excluído.
   * @returns {Promise<boolean>} Uma Promise que resolve com true se a exclusão for bem-sucedida, false caso contrário.
   */
  delete(uid: MovieUID): Promise<boolean>
}
