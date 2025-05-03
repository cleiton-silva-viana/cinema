import { Result } from "../../../shared/result/result";
import { ICreateMovieInput, IMovieUpdateInput, Movie } from "../entity/movie";

export interface IMovieFilterProps {
  genres?: string[];
  ageRating?: string;
  dateRange?: {
    startDate: Date;
    endDate: Date;
  };
}

/**
 * Interface para o serviço que gerencia operações relacionadas aos filmes.
 *
 * Define métodos para buscar, criar e solicitar a remoção (ou arquivamento) de filmes,
 * encapsulando as regras de negócio e validações necessárias.
 */
export interface IMovieService {
  /**
   * Busca um filme pelo seu UID. Retorna null no Result se não encontrado
   *
   * @param uid - Identificador único do filme.
   */
  findById(uid: string): Promise<Result<Movie>>;

  /**
   * Busca múltiplos filmes com base em filtros opcionais.
   * Se nenhum filtro for fornecido, retorna filmes que estejam em cartaz.
   *
   * @param filter - (Opcional) Filtros para refinar a busca.
   */
  findMany(filter: IMovieFilterProps): Promise<Result<Movie[]>>;

  /**
   * Cria um novo filme com base nos dados fornecidos.
   *
   * @param input - Objeto contendo as informações necessárias para criar um filme.
   */
  create(input: ICreateMovieInput): Promise<Result<Movie>>;

  /**
   * Atualiza os dados de um filme existente
   * @param movieUID - Identificador único do filme
   * @param input - Objeto contendo as informações necessárias para atualizar o filme.
   * */
  update(movieUID: string, input: IMovieUpdateInput): Promise<Result<Movie>>;

  /**
   * Altera o status do filme para "Pendente de Revisão".
   *
   * @param uid - Identificador único do filme
   * @returns Result<Movie> - Um Result contendo o filme atualizado ou falhas
   */
  submitForReview(uid: string): Promise<Result<Movie>>;

  /**
   * Altera o status do filme para "Aprovado".
   *
   * @param uid - Identificador único do filme
   * @returns Result<Movie> - Um Result contendo o filme atualizado ou falhas
   */
  approve(uid: string): Promise<Result<Movie>>;

  /**
   * Solicita o arquivamento de um filme.
   *
   * @param uid - Identificador único do filme.
   */
  archive(uid: string): Promise<Result<Movie>>;

  /**
   * Solicita a remoção permanente do filme nos arquivos do sistema.
   *
   * Se o filme nunca foi exibido, é realizado um hard delete.
   *
   * @param uid - Identificador único do filme.
   * */
  delete(uid: string): Promise<Result<null>>;
}
