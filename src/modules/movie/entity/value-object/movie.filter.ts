import { AgeRating } from './age.rating'
import { MovieGenre } from './movie.genre'
import { failure, Result, success } from '@shared/result/result'
import { SimpleFailure } from '@shared/failure/simple.failure.type'
import { isNull } from '@shared/validator/validator'
import { validateAndCollect } from '@shared/validator/common.validators'
import { MovieFilterDateRange } from '@modules/movie/entity/value-object/movie.filter.date.range'

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
   * Número máximo de dias no futuro permitido para a data inicial do filtro (30 dias)
   */
  public static readonly MAX_FUTURE_DAYS = 30

  /**
   * Intervalo máximo em dias entre a data inicial e final do filtro (14 dias)
   */
  public static readonly MAX_DATE_RANGE_DAYS = 14

  /**
   * Construtor privado. Use o método estático `create` para instanciar.
   *
   * @param dateRange Intervalo de datas para filtrar filmes em exibição
   * @param ageRating Classificação etária para filtrar filmes
   * @param genres Gêneros para filtrar filmes
   * @private
   */
  private constructor(
    public readonly dateRange?: {
      readonly startDate: Date
      readonly endDate: Date
    },
    public readonly ageRating?: AgeRating,
    public readonly genres?: MovieGenre
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
    if (isNull(input)) {
      const today = new Date()
      const endDate = new Date(today)
      endDate.setDate(endDate.getDate() + 7)

      return success(
        new MovieFilter({
          startDate: today,
          endDate: endDate,
        })
      )
    }

    const failures: SimpleFailure[] = []
    let dateRangeValue: { startDate: Date; endDate: Date } | undefined = undefined
    let ageRatingValue: AgeRating | undefined = undefined
    let genresValue: MovieGenre | undefined = undefined

    dateRangeValue = input.dateRange
      ? validateAndCollect(MovieFilterDateRange.create(input.dateRange.startDate, input.dateRange.endDate), failures)
      : MovieFilterDateRange.createDefault()

    if (input.ageRating) ageRatingValue = validateAndCollect(AgeRating.create(input.ageRating), failures)
    if (input.genres) genresValue = validateAndCollect(MovieGenre.create(input.genres), failures)

    if (failures.length > 0) return failure(failures)

    if (!dateRangeValue && !ageRatingValue && !genresValue) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const endDate = new Date(today)
      endDate.setDate(endDate.getDate() + 7)

      dateRangeValue = {
        startDate: today,
        endDate: endDate,
      }
    }

    return success(new MovieFilter(dateRangeValue, ageRatingValue, genresValue))
  }
}
