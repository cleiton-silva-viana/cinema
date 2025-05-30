import { MovieGenre } from './value-object/movie.genre'
import { MovieUID } from './value-object/movie.uid'
import { MovieTitle } from './value-object/movie.title'
import { MovieDescription } from './value-object/movie.description'
import { ICreateMovieDisplayPeriodInput, MovieDisplayPeriod } from './value-object/movie.display.period'
import { MovieDuration } from './value-object/movie.duration'
import { MovieAdministrativeStatus } from '../type/movie.administrative.status'
import { MovieContributors } from './value-object/movie.contributors'
import { AgeRating } from './value-object/age.rating'
import { IMovieContributorInput } from './value-object/movie.contributor'
import { ImageUID } from '@modules/image/entity/value-object/image.uid'
import { failure, Result, success } from '@shared/result/result'
import { SimpleFailure } from '@shared/failure/simple.failure.type'
import { ILanguageContent, IMultilingualInput } from '@shared/value-object/multilingual-content'
import { TechnicalError } from '@shared/error/technical.error'
import { isNull } from '@shared/validator/validator'
import { FailureCode } from '@shared/failure/failure.codes.enum'
import { ensureNotNull, validateAndCollect } from '@shared/validator/common.validators'
import { FailureFactory } from '@shared/failure/failure.factory'

/**
 * Interface que define os dados fundamentais necessários para criar uma entidade Movie.
 */
export interface ICreateMovieInput {
  title: IMultilingualInput[]
  description: IMultilingualInput[]
  ageRating: string
  imageUID: string
  contributors: IMovieContributorInput[]
  durationInMinutes: number
}

/**
 * Interface que define os dados completos de um filme para hidratação.
 */
export interface IMovieHydrateInput {
  uid: string
  title: ILanguageContent
  description: ILanguageContent
  duration: number
  ageRating: string
  status: MovieAdministrativeStatus
  genres?: string[]
  imageUID: string
  displayPeriod?: ICreateMovieDisplayPeriodInput
  contributors: IMovieContributorInput[]
}

/**
 * Representa a entidade Filme com suas propriedades e regras de negócio.
 *
 * Esta classe implementa o padrão Rich Domain Model, oferecendo métodos específicos
 * para cada operação de negócio, seguindo os princípios do Domain-Driven Design.
 *
 * A classe é imutável - todas as operações retornam uma nova instância.
 */
export class Movie {
  protected constructor(
    public readonly uid: MovieUID,
    public readonly imageUID: ImageUID,
    public readonly status: MovieAdministrativeStatus,
    public readonly title: MovieTitle,
    public readonly description: MovieDescription,
    public readonly duration: MovieDuration | null,
    public readonly ageRating: AgeRating,
    public readonly genre: MovieGenre | null,
    public readonly displayPeriod: MovieDisplayPeriod | null,
    public readonly contributors: MovieContributors
  ) {}

  /**
   * Cria uma nova instância de Filme com valores padrão para campos opcionais.
   */
  public static create(input: ICreateMovieInput): Result<Movie> {
    const failures = ensureNotNull({ input })
    if (failures.length > 0) return failure(failures)

    const title = validateAndCollect(MovieTitle.create(input.title), failures)
    const description = validateAndCollect(MovieDescription.create(input.description), failures)
    const ageRating = validateAndCollect(AgeRating.create(input.ageRating), failures)
    const contributors = validateAndCollect(MovieContributors.create(input.contributors), failures)
    const imageUID = validateAndCollect(ImageUID.parse(input.imageUID), failures)
    const duration = validateAndCollect(MovieDuration.create(input.durationInMinutes), failures)

    return failures.length > 0
      ? failure(failures)
      : success(
          new Movie(
            MovieUID.create(),
            imageUID,
            MovieAdministrativeStatus.DRAFT,
            title,
            description,
            duration,
            ageRating,
            null,
            null,
            contributors
          )
        )
  }

  /**
   * Cria uma instância de Movie a partir de dados brutos.
   */
  public static hydrate(input: IMovieHydrateInput): Movie {
    TechnicalError.if(isNull(input.uid), FailureCode.MISSING_REQUIRED_DATA)

    const uid = MovieUID.hydrate(input.uid)
    const title = MovieTitle.hydrate(input.title.language, input.title.text)
    const description = MovieDescription.hydrate(input.description.language, input.description.text)
    const contributors = MovieContributors.hydrate(input.contributors)
    const ageRating = AgeRating.hydrate(input.ageRating)
    const status = input.status as MovieAdministrativeStatus
    const genres = input.genres ? MovieGenre.hydrate(input.genres) : null
    const duration = input.duration ? MovieDuration.hydrate(input.duration) : null
    const displayPeriod = input.displayPeriod
      ? MovieDisplayPeriod.hydrate(input.displayPeriod.startDate, input.displayPeriod.endDate)
      : null
    const imageUID = ImageUID.hydrate(input.imageUID)

    return new Movie(
      uid,
      imageUID,
      status,
      title,
      description,
      duration,
      ageRating,
      genres,
      displayPeriod,
      contributors
    )
  }

  /**
   * Atualiza o título do filme.
   * Retorna uma nova instância de Movie com o título atualizado.
   */
  public updateTitle(title: IMultilingualInput[]): Result<Movie> {
    const titleResult = MovieTitle.create(title)
    return titleResult.isInvalid() ? titleResult : success(this.updateWith({ title: titleResult.value }))
  }

  /**
   * Atualiza a descrição do filme.
   * Retorna uma nova instância de Movie com a descrição atualizada.
   */
  public updateDescription(description: IMultilingualInput[]): Result<Movie> {
    const descriptionResult = MovieDescription.create(description)
    return descriptionResult.isInvalid()
      ? descriptionResult
      : success(this.updateWith({ description: descriptionResult.value }))
  }

  /**
   * Define ou atualiza a duração do filme.
   * Retorna uma nova instância de Movie com a duração atualizada.
   */
  public setDuration(durationInMinutes: number): Result<Movie> {
    const durationResult = MovieDuration.create(durationInMinutes)
    return durationResult.isInvalid() ? durationResult : success(this.updateWith({ duration: durationResult.value }))
  }

  /**
   * Remove a duração do filme.
   * Retorna uma nova instância de Movie sem duração definida.
   */
  public removeDuration(): Result<Movie> {
    return success(this.updateWith({ duration: null }))
  }

  /**
   * Atualiza a classificação etária do filme.
   * Retorna uma nova instância de Movie com a classificação atualizada.
   */
  public updateAgeRating(ageRating: string): Result<Movie> {
    const ageRatingResult = AgeRating.create(ageRating)
    return ageRatingResult.isInvalid()
      ? ageRatingResult
      : success(this.updateWith({ ageRating: ageRatingResult.value }))
  }

  /**
   * Define ou atualiza os gêneros do filme.
   * Retorna uma nova instância de Movie com os gêneros atualizados.
   */
  public setGenres(genres: string[]): Result<Movie> {
    const genreResult = MovieGenre.create(genres)
    return genreResult.isInvalid() ? genreResult : success(this.updateWith({ genre: genreResult.value }))
  }

  /**
   * Remove todos os gêneros do filme.
   * Retorna uma nova instância de Movie sem gêneros definidos.
   */
  public removeGenres(): Result<Movie> {
    return success(this.updateWith({ genre: null }))
  }

  /**
   * Atualiza a imagem do poster do filme.
   * Retorna uma nova instância de Movie com a imagem atualizada.
   */
  public updatePosterImage(imageUID: string): Result<Movie> {
    const imageResult = ImageUID.parse(imageUID)
    return imageResult.isInvalid() ? imageResult : success(this.updateWith({ imageUID: imageResult.value }))
  }

  /**
   * Define ou atualiza o período de exibição do filme.
   * Retorna uma nova instância de Movie com o período atualizado.
   */
  public setDisplayPeriod(startDate: Date, endDate: Date): Result<Movie> {
    const displayPeriodResult = MovieDisplayPeriod.create(startDate, endDate)
    return displayPeriodResult.isInvalid()
      ? displayPeriodResult
      : success(this.updateWith({ displayPeriod: displayPeriodResult.value }))
  }

  /**
   * Remove o período de exibição do filme.
   * Retorna uma nova instância de Movie sem período de exibição definido.
   */
  public removeDisplayPeriod(): Result<Movie> {
    return success(this.updateWith({ displayPeriod: null }))
  }

  /**
   * Atualiza os contribuidores do filme.
   * Retorna uma nova instância de Movie com os contribuidores atualizados.
   */
  public updateContributors(contributors: IMovieContributorInput[]): Result<Movie> {
    const contributorsResult = MovieContributors.create(contributors)
    return contributorsResult.isInvalid()
      ? contributorsResult
      : success(this.updateWith({ contributors: contributorsResult.value }))
  }

  /**
   * Altera o status do filme para "Pendente de Revisão".
   */
  public toPendingReview(): Result<Movie> {
    const result = this.canPendingReview()
    if (result.isInvalid()) return result
    return success(this.updateWith({ status: MovieAdministrativeStatus.PENDING_REVIEW }))
  }

  /**
   * Altera o status do filme para "Aprovado".
   */
  public toApprove(): Result<Movie> {
    const result = this.canApprove()
    if (result.isInvalid()) return result
    return success(this.updateWith({ status: MovieAdministrativeStatus.APPROVED }))
  }

  /**
   * Transforma o filme para o estado arquivado.
   */
  public toArchive(): Result<Movie> {
    return success(this.updateWith({ status: MovieAdministrativeStatus.ARCHIVED }))
  }

  /**
   * Verifica se o filme está disponível para exibição na data especificada.
   */
  public isAvailableForPeriod(date: Date): boolean {
    if (this.status !== MovieAdministrativeStatus.APPROVED) return false
    if (!this.displayPeriod) return false

    const requestedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    const startDate = new Date(
      this.displayPeriod.startDate.getFullYear(),
      this.displayPeriod.startDate.getMonth(),
      this.displayPeriod.startDate.getDate()
    )
    const endDate = new Date(
      this.displayPeriod.endDate.getFullYear(),
      this.displayPeriod.endDate.getMonth(),
      this.displayPeriod.endDate.getDate()
    )

    endDate.setHours(23, 59, 59, 999)
    return requestedDate >= startDate && requestedDate <= endDate
  }

  /**
   * Verifica se o filme possui todas as informações necessárias para revisão.
   */
  public hasMinimumRequirementsForReview(): boolean {
    return this.canPendingReview().isValid()
  }

  /**
   * Verifica se o filme possui todas as informações necessárias para aprovação.
   */
  public hasAllRequirementsForApproval(): boolean {
    return this.canApprove().isValid()
  }

  /**
   * Verifica se o filme atende aos requisitos mínimos para ser enviado para revisão.
   */
  private canPendingReview(): Result<boolean> {
    const failures: SimpleFailure[] = []

    if (!this.title) failures.push(FailureFactory.MISSING_REQUIRED_DATA('title'))
    if (!this.description) failures.push(FailureFactory.MISSING_REQUIRED_DATA('description'))
    if (!this.ageRating) failures.push(FailureFactory.MISSING_REQUIRED_DATA('ageRating'))
    if (this.contributors.getDirectors().length === 0) failures.push(FailureFactory.MOVIE_DIRECTOR_REQUIRED())
    if (!this.imageUID) failures.push(FailureFactory.MISSING_REQUIRED_DATA('imageUID'))
    if (this.status === MovieAdministrativeStatus.ARCHIVED) failures.push(FailureFactory.MOVIE_IS_ARCHIVED())
    if (this.status === MovieAdministrativeStatus.APPROVED) failures.push(FailureFactory.MOVIE_ALREADY_APPROVED())

    return failures.length > 0 ? failure(failures) : success(true)
  }

  /**
   * Verifica se o filme atende a todos os requisitos para ser aprovado.
   */
  private canApprove(): Result<boolean> {
    const result = this.canPendingReview()
    if (result.isInvalid()) return result

    const failures: SimpleFailure[] = []

    if (!this.duration) failures.push(FailureFactory.MISSING_REQUIRED_DATA('duration')) // pode ser melhor
    if (!this.genre || this.genre.count === 0) failures.push(FailureFactory.MISSING_REQUIRED_DATA('genres')) // pode ser melhor
    if (this.status !== MovieAdministrativeStatus.PENDING_REVIEW) failures.push(FailureFactory.MOVIE_NOT_IN_DRAFT())

    return failures.length > 0 ? failure(failures) : success(true)
  }

  private updateWith(
    props: Partial<{
      title: MovieTitle
      description: MovieDescription
      duration: MovieDuration | null
      ageRating: AgeRating
      genre: MovieGenre | null
      imageUID: ImageUID
      displayPeriod: MovieDisplayPeriod | null
      contributors: MovieContributors
      status: MovieAdministrativeStatus
    }>
  ): Movie {
    return new Movie(
      this.uid,
      props.imageUID || this.imageUID,
      props.status || this.status,
      props.title || this.title,
      props.description || this.description,
      props.duration !== undefined ? props.duration : this.duration,
      props.ageRating || this.ageRating,
      props.genre !== undefined ? props.genre : this.genre,
      props.displayPeriod !== undefined ? props.displayPeriod : this.displayPeriod,
      props.contributors || this.contributors
    )
  }
}
