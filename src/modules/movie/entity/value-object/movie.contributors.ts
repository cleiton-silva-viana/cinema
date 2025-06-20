import { IMovieContributorInput, MovieContributor, PersonRole } from './movie.contributor'
import { combine, failure, Result, success } from '@shared/result/result'
import { TechnicalError } from '@shared/error/technical.error'
import { FailureFactory } from '@shared/failure/failure.factory'
import { isNullOrUndefined } from '@shared/validator/utils/validation'

/**
 * Value object que representa todos os contribuidores de um filme,
 * organizados por papel.
 *
 * Esta classe é responsável por:
 * - Agrupar contribuidores por seus papéis (diretor, ator, etc.)
 * - Garantir que um filme tenha pelo menos um diretor
 * - Fornecer métodos para acessar contribuidores por papel específico
 */
export class MovieContributors {
  /**
   * Mapa que organiza os contribuidores por papel
   * @private
   */
  private readonly contributorsByRole: Map<PersonRole, MovieContributor[]>

  /**
   * Construtor privado. Use os métodos estáticos `create` ou `hydrate` para instanciar.
   * @param contributors Array de contribuidores já validados
   */
  private constructor(contributors: MovieContributor[]) {
    this.contributorsByRole = new Map()

    contributors.forEach((contributor) => {
      const role = contributor.role
      if (!this.contributorsByRole.has(role)) this.contributorsByRole.set(role, [])
      this.contributorsByRole.get(role)?.push(contributor)
    })
  }

  /**
   * Retorna a quantidade total de contribuidores
   * @returns Número total de contribuidores de todos os papéis
   */
  public get count(): number {
    return this.getAll().length
  }

  /**
   * Retorna todos os papéis presentes na coleção
   * @returns Array de PersonRole contendo todos os papéis existentes
   */
  public get roles(): PersonRole[] {
    return Array.from(this.contributorsByRole.keys())
  }

  /**
   * Cria uma instância de MovieContributors com validação completa.
   *
   * Validações realizadas:
   * - Verifica se o array de contribuidores não é nulo ou vazio
   * - Valida cada contribuidor individualmente
   * - Verifica se existe pelo menos um diretor
   *
   * @param contributors Array de MovieContributor ou MovieContributorInput
   * @returns Result<MovieContributors> contendo a instância criada ou falhas de validação
   */
  public static create(contributors: MovieContributor[] | IMovieContributorInput[]): Result<MovieContributors> {
    if (isNullOrUndefined(contributors) || contributors.length === 0)
      return failure(FailureFactory.MOVIE_MISSING_CONTRIBUTORS('N/D'))

    const processedContributors: MovieContributor[] = []

    const isInstanceOfMovieContributor = contributors[0] instanceof MovieContributor

    if (isInstanceOfMovieContributor) {
      processedContributors.push(...(contributors as Array<MovieContributor>))
    }

    if (!isInstanceOfMovieContributor) {
      const results: Result<MovieContributor>[] = []

      for (const contributor of contributors as IMovieContributorInput[])
        results.push(MovieContributor.create(contributor))

      const result = combine(results)
      if (result.isInvalid()) return result

      processedContributors.push(...result.value)
    }

    const hasDirector = processedContributors.some((contributor) => contributor.role === PersonRole.DIRECTOR)

    return !hasDirector
      ? failure(FailureFactory.MOVIE_DIRECTOR_REQUIRED())
      : success(new MovieContributors(processedContributors))
  }

  /**
   * Cria uma instância de MovieContributors a partir de dados já existentes.
   * Este método é usado principalmente para reconstruir objetos a partir do banco de dados.
   *
   * Validações básicas:
   * - Verifica se o array de contribuidores não é nulo ou vazio
   * - Processa cada contribuidor, ignorando os inválidos
   *
   * @param contributors Array de IMovieContributorInput
   * @returns MovieContributors
   * @throws TechnicalError se contributors for nulo ou vazio
   */
  public static hydrate(contributors: IMovieContributorInput[]): MovieContributors {
    TechnicalError.validateRequiredFields({ contributors })

    const processedContributors: MovieContributor[] = []

    for (const contributor of contributors) {
      const result = MovieContributor.create(contributor)
      if (result.isInvalid()) console.log(result.failures)
      else processedContributors.push(result.value)
    }

    return new MovieContributors(processedContributors)
  }

  /**
   * Retorna todos os contribuidores de todos os papéis em um único array
   * @returns Array de MovieContributor contendo todos os contribuidores
   */
  public getAll(): MovieContributor[] {
    return Array.from(this.contributorsByRole.values()).flat()
  }

  /**
   * Retorna todos os diretores do filme
   * @returns Array de MovieContributor contendo apenas os diretores
   */
  public getDirectors(): MovieContributor[] {
    return this.contributorsByRole.get(PersonRole.DIRECTOR) || []
  }

  /**
   * Retorna todos os atores e atrizes do filme em um único array
   * @returns Array de MovieContributor contendo atores e atrizes
   */
  public getActors(): MovieContributor[] {
    const actors = this.contributorsByRole.get(PersonRole.ACTOR) || []
    const actresses = this.contributorsByRole.get(PersonRole.ACTRESS) || []
    return [...actors, ...actresses]
  }

  /**
   * Retorna todos os contribuidores com um papel específico
   * @param role Papel desejado (ex: PersonRole.WRITER)
   * @returns Array de MovieContributor com o papel especificado ou array vazio se não houver
   */
  public getByRole(role: PersonRole): MovieContributor[] {
    return this.contributorsByRole.get(role) || []
  }
}
