import { Movie } from "../entity/movie";
import { MovieUID } from "../entity/value-object/movie.uid";
import { MovieFilter } from "../entity/value-object/movie.filter";

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
  findById(uid: MovieUID): Promise<Movie | null>;

  /**
   * Busca filmes com base em um filtro opcional.
   *
   * Se nenhum filtro for fornecido, um conjunto padrão (por exemplo, filmes em cartaz) poderá ser retornado.
   *
   * @param filter - (Opcional) Objeto com critérios para filtrar a busca.
   * @returns {Promise<Movie[]>} Uma Promise que resolve com um array de filmes que atendem aos critérios.
   */
  find(filter: MovieFilter): Promise<Movie[]>;

  /**
   * Persiste um filme, criando ou atualizando conforme necessário.
   *
   * @param movie - Objeto Movie a ser salvo.
   * @returns {Promise<Movie>} Uma Promise que resolve com o filme persistido.
   */
  save(movie: Movie): Promise<Movie>;

  /**
   * Atualiza um filme existente.
   *
   * Essa é uma alternativa ao método save(), caso seja utilizada uma abordagem
   * de atualização explícita.
   *
   * @param movie - Objeto Movie com os dados atualizados.
   * @returns {Promise<Movie>} Uma Promise que resolve com o filme atualizado.
   */
  update(movie: Movie): Promise<Movie>;

  /**
   * Realiza a exclusão definitiva (hard delete) de um filme.
   *
   * @param uid - Identificador único do filme a ser excluído.
   * @returns {Promise<boolean>} Uma Promise que resolve com true se a exclusão for bem-sucedida, false caso contrário.
   */
  delete(uid: MovieUID): Promise<boolean>;
}
