import { AgeRating } from './age.rating'
import { MovieGenre } from './movie.genre'
import { combine, Result, success } from '@shared/result/result'
import { MovieFilterDateRange } from '@modules/movie/entity/value-object/movie.filter.date.range'
import { isNullOrUndefined } from '@shared/validator/utils/validation'

/**
 * Interface que define os parâmetros de entrada para filtrar filmes.
 * Todos os campos são opcionais.
 */
export interface IMovieFilterInput {
  /**
   * Lista de códigos de gêneros para filtrar filmes
   */
  genres?: string[]

  /**
   * Código de classificação etária para filtrar filmes
   */
  ageRating?: string

  /**
   * Intervalo de datas para filtrar filmes em exibição
   */
  dateRange?: {
    /**
     * Data inicial do período de exibição
     */
    startDate: Date

    /**
     * Data final do período de exibição
     */
    endDate: Date
  }
}

/**
 * Value Object que representa um filtro para busca de filmes.
 *
 * Este filtro pode incluir:
 * - Intervalo de datas para exibição
 * - Classificação etária
 * - Gêneros de filme
 *
 * Regras de negócio:
 * - A data inicial não pode ser no passado
 * - A data inicial não pode ser mais de 30 dias no futuro
 * - O intervalo entre data inicial e final não pode ser maior que 14 dias
 * - Se nenhum filtro for fornecido, um filtro padrão de 7 dias a partir de hoje é criado
 */
export class MovieFilter {
  /**
   * Construtor privado. Use o método estático `create` para instanciar.
   *
   * @param dateRange Intervalo de datas para filtrar filmes em exibição
   * @param ageRating Classificação etária para filtrar filmes
   * @param genres Gêneros para filtrar filmes
   * @private
   */
  private constructor(
    public readonly dateRange: MovieFilterDateRange,
    public readonly ageRating: AgeRating,
    public readonly genres: MovieGenre
  ) {}

  /**
   * Cria uma instância de MovieFilter com validação completa.
   *
   * Comportamentos:
   * - Se input for nulo, cria um filtro padrão com período de 7 dias a partir de hoje
   * - Se nenhum filtro válido for fornecido, também cria o filtro padrão
   * - Valida cada componente do filtro individualmente
   *
   * Validações realizadas:
   * - Data inicial não pode ser no passado
   * - Data inicial não pode ser mais de MAX_FUTURE_DAYS no futuro
   * - Data final não pode ser anterior à data inicial
   * - Intervalo entre datas não pode ser maior que MAX_DATE_RANGE_DAYS
   * - Classificação etária deve ser válida
   * - Gêneros devem ser válidos
   *
   * @param input Objeto contendo os parâmetros do filtro
   * @returns Result<MovieFilter> contendo a instância criada ou falhas de validação
   */
  public static create(input: IMovieFilterInput): Result<MovieFilter> {
    const defaultDateRange = MovieFilterDateRange.createDefault()
    const defaultAgeRating = AgeRating.createDefault()
    const defaultGenres = MovieGenre.createAllGenres()

    if (isNullOrUndefined(input) || isNullOrUndefined({ ...input }))
      return success(new MovieFilter(defaultDateRange, defaultAgeRating, defaultGenres))

    return combine({
      dateRange: input.dateRange
        ? MovieFilterDateRange.create(input.dateRange.startDate, input.dateRange.endDate)
        : success(defaultDateRange),
      genres: input.genres ? MovieGenre.create(input.genres) : success(defaultGenres),
      ageRating: input.ageRating ? AgeRating.create(input.ageRating) : success(defaultAgeRating),
    }).flatMap(({ dateRange, genres, ageRating }) => {
      return success(new MovieFilter(dateRange, ageRating, genres))
    })
  }
}
