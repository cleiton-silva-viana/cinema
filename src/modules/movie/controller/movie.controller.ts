import { Body, Controller, Delete, Get, HttpStatus, Inject, Param, Patch, Post, Query } from '@nestjs/common'
import { JsonApiResponse } from '@shared/response/json.api.response'
import { IMovieApplicationService } from '../service/movie.application.service.interface'
import { ensureNotNull } from '@shared/validator/common.validators'
import { ResourceTypes } from '@shared/constant/resource.types'
import { MOVIE_APPLICATION_SERVICE } from '../constant/movie.constant'
import { MovieResponseDTO } from '@modules/movie/controller/dto/movie.response.dto'
import { IMovieFilterInput } from '@modules/movie/entity/value-object/movie.filter'
import { ICreateMovieInput } from '@modules/movie/entity/movie'
import {
  SetDisplayPeriodDTO,
  SetGenresDTO,
  UpdateAgeRatingDTO,
  UpdateContributorsDTO,
  UpdateDescriptionDTO,
  UpdateDurationDTO,
  UpdatePosterImageDTO,
  UpdateTitleDTO,
} from '@modules/movie/controller/dto/movie.dto'

/**
 * Controlador para operações relacionadas a filmes no sistema.
 * Implementa endpoints RESTful para gerenciamento completo de filmes.
 */
@Controller(ResourceTypes.MOVIE)
export class MovieController {
  constructor(@Inject(MOVIE_APPLICATION_SERVICE) private readonly service: IMovieApplicationService) {}

  /**
   * Busca um filme pelo UID.
   * GET /movies/:uid
   */
  @Get(':uid')
  public async findById(@Param('uid') uid: string): Promise<JsonApiResponse> {
    const response = new JsonApiResponse()

    const result = await this.service.findById(uid)

    return result.isInvalid()
      ? response.errors(result.failures)
      : response.data(MovieResponseDTO.fromEntity(result.value))
  }

  /**
   * Busca um filme pelo UID incluindo suas relações.
   * GET /movies/:uid/relations
   */
  @Get(':uid/relations')
  public async findByIdWithRelations(@Param('uid') uid: string): Promise<JsonApiResponse> {
    const response = new JsonApiResponse()

    const result = await this.service.findByIdWithRelations(uid)

    return result.isInvalid()
      ? response.errors(result.failures)
      : response.data(MovieResponseDTO.fromEntityWithRelations(result.value))
  }

  /**
   * Busca múltiplos filmes com base nos filtros fornecidos.
   * GET /movies
   */
  @Get()
  public async findMany(@Query() filters: Partial<IMovieFilterInput>): Promise<JsonApiResponse> {
    const response = new JsonApiResponse()

    const result = await this.service.findMany(filters)

    return result.isInvalid()
      ? response.errors(result.failures)
      : response.datas(result.value.map((movie) => MovieResponseDTO.fromEntity(movie)))
  }

  /**
   * Busca múltiplos filmes com suas relações com base nos filtros fornecidos.
   * GET /movies/relations
   */
  @Get('relations')
  public async findManyWithRelations(@Query() filters: Partial<IMovieFilterInput>): Promise<JsonApiResponse> {
    const response = new JsonApiResponse()

    const result = await this.service.findManyWithRelations(filters)

    return result.isInvalid()
      ? response.errors(result.failures)
      : response.datas(result.value.map((movie) => MovieResponseDTO.fromEntityWithRelations(movie)))
  }

  /**
   * Cria um novo filme no sistema.
   * POST /movies
   */
  @Post()
  public async create(@Body() dto: ICreateMovieInput): Promise<JsonApiResponse> {
    const response = new JsonApiResponse()

    const failures = ensureNotNull({ dto })
    if (failures.length > 0) return response.errors(failures)

    const result = await this.service.create(dto)
    return result.isInvalid()
      ? response.errors(result.failures)
      : response
          .HttpStatus(HttpStatus.CREATED)
          .data(MovieResponseDTO.fromEntity(result.value))
          .meta({ createdAt: new Date().toISOString() })
  }

  /**
   * Submete um filme para revisão.
   * PATCH /movies/:uid/submit-for-review
   */
  @Patch(':uid/submit-for-review')
  public async submitForReview(@Param('uid') uid: string): Promise<JsonApiResponse> {
    const response = new JsonApiResponse()

    const result = await this.service.submitForReview(uid)

    return result.isInvalid()
      ? response.errors(result.failures)
      : response.data(MovieResponseDTO.fromEntity(result.value)).meta({ updatedAt: new Date().toISOString() })
  }

  /**
   * Aprova um filme.
   * PATCH /movies/:uid/approve
   */
  @Patch(':uid/approve')
  public async approve(@Param('uid') uid: string): Promise<JsonApiResponse> {
    const response = new JsonApiResponse()

    const result = await this.service.approve(uid)

    return result.isInvalid()
      ? response.errors(result.failures)
      : response.data(MovieResponseDTO.fromEntity(result.value)).meta({ updatedAt: new Date().toISOString() })
  }

  /**
   * Arquiva um filme.
   * PATCH /movies/:uid/archive
   */
  @Patch(':uid/archive')
  public async archive(@Param('uid') uid: string): Promise<JsonApiResponse> {
    const response = new JsonApiResponse()

    const result = await this.service.archive(uid)

    return result.isInvalid()
      ? response.errors(result.failures)
      : response.data(MovieResponseDTO.fromEntity(result.value)).meta({ updatedAt: new Date().toISOString() })
  }

  /**
   * Atualiza o título do filme.
   * PATCH /movies/:uid/title
   */
  @Patch(':uid/title')
  public async updateTitle(@Param('uid') uid: string, @Body() dto: UpdateTitleDTO): Promise<JsonApiResponse> {
    const response = new JsonApiResponse()

    const failures = ensureNotNull({ uid, dto })
    if (failures.length > 0) return response.errors(failures)

    const result = await this.service.updateTitle(uid, dto.title)

    return result.isInvalid()
      ? response.errors(result.failures)
      : response.data(MovieResponseDTO.fromEntity(result.value)).meta({ updatedAt: new Date().toISOString() })
  }

  /**
   * Atualiza a descrição do filme.
   * PATCH /movies/:uid/description
   */
  @Patch(':uid/description')
  public async updateDescription(
    @Param('uid') uid: string,
    @Body() dto: UpdateDescriptionDTO
  ): Promise<JsonApiResponse> {
    const response = new JsonApiResponse()

    const failures = ensureNotNull({ uid, dto })
    if (failures.length > 0) return response.errors(failures)

    const result = await this.service.updateDescription(uid, dto.description)

    return result.isInvalid()
      ? response.errors(result.failures)
      : response.data(MovieResponseDTO.fromEntity(result.value)).meta({ updatedAt: new Date().toISOString() })
  }

  /**
   * Define ou atualiza a duração do filme.
   * PATCH /movies/:uid/duration
   */
  @Patch(':uid/duration')
  public async setDuration(@Param('uid') uid: string, @Body() dto: UpdateDurationDTO): Promise<JsonApiResponse> {
    const response = new JsonApiResponse()

    const failures = ensureNotNull({ uid, dto })
    if (failures.length > 0) return response.errors(failures)

    const result = await this.service.setDuration(uid, dto.durationInMinutes)

    return result.isInvalid()
      ? response.errors(result.failures)
      : response.data(MovieResponseDTO.fromEntity(result.value)).meta({ updatedAt: new Date().toISOString() })
  }

  /**
   * Remove a duração do filme.
   * DELETE /movies/:uid/duration
   */
  @Delete(':uid/duration')
  public async removeDuration(@Param('uid') uid: string): Promise<JsonApiResponse> {
    const response = new JsonApiResponse()

    const result = await this.service.removeDuration(uid)

    return result.isInvalid()
      ? response.errors(result.failures)
      : response.data(MovieResponseDTO.fromEntity(result.value)).meta({ updatedAt: new Date().toISOString() })
  }

  /**
   * Atualiza a classificação etária do filme.
   * PATCH /movies/:uid/age-rating
   */
  @Patch(':uid/age-rating')
  public async updateAgeRating(@Param('uid') uid: string, @Body() dto: UpdateAgeRatingDTO): Promise<JsonApiResponse> {
    const response = new JsonApiResponse()

    const failures = ensureNotNull({ uid, dto })
    if (failures.length > 0) return response.errors(failures)

    const result = await this.service.updateAgeRating(uid, dto.ageRating)

    return result.isInvalid()
      ? response.errors(result.failures)
      : response.data(MovieResponseDTO.fromEntity(result.value)).meta({ updatedAt: new Date().toISOString() })
  }

  /**
   * Define ou atualiza os gêneros do filme.
   * PATCH /movies/:uid/genres
   */
  @Patch(':uid/genres')
  public async setGenres(@Param('uid') uid: string, @Body() dto: SetGenresDTO): Promise<JsonApiResponse> {
    const response = new JsonApiResponse()

    const failures = ensureNotNull({ uid, dto })
    if (failures.length > 0) return response.errors(failures)

    const result = await this.service.setGenres(uid, dto.genres)

    return result.isInvalid()
      ? response.errors(result.failures)
      : response.data(MovieResponseDTO.fromEntity(result.value)).meta({ updatedAt: new Date().toISOString() })
  }

  /**
   * Remove todos os gêneros do filme.
   * DELETE /movies/:uid/genres
   */
  @Delete(':uid/genres')
  public async removeGenres(@Param('uid') uid: string): Promise<JsonApiResponse> {
    const response = new JsonApiResponse()

    const result = await this.service.removeGenres(uid)

    return result.isInvalid()
      ? response.errors(result.failures)
      : response.data(MovieResponseDTO.fromEntity(result.value)).meta({ updatedAt: new Date().toISOString() })
  }

  /**
   * Atualiza a imagem do poster do filme.
   * PATCH /movies/:uid/poster-image
   */
  @Patch(':uid/poster-image')
  public async updatePosterImage(
    @Param('uid') uid: string,
    @Body() dto: UpdatePosterImageDTO
  ): Promise<JsonApiResponse> {
    const response = new JsonApiResponse()

    const failures = ensureNotNull({ uid, dto })
    if (failures.length > 0) return response.errors(failures)

    const result = await this.service.updatePosterImage(uid, dto.imageUID)

    return result.isInvalid()
      ? response.errors(result.failures)
      : response.data(MovieResponseDTO.fromEntity(result.value)).meta({ updatedAt: new Date().toISOString() })
  }

  /**
   * Define ou atualiza o período de exibição do filme.
   * PATCH /movies/:uid/display-period
   */
  @Patch(':uid/display-period')
  public async setDisplayPeriod(@Param('uid') uid: string, @Body() dto: SetDisplayPeriodDTO): Promise<JsonApiResponse> {
    const response = new JsonApiResponse()

    const failures = ensureNotNull({ uid, dto })
    if (failures.length > 0) return response.errors(failures)

    const result = await this.service.setDisplayPeriod(uid, new Date(dto.startsIn), new Date(dto.endsIn))

    return result.isInvalid()
      ? response.errors(result.failures)
      : response.data(MovieResponseDTO.fromEntity(result.value)).meta({ updatedAt: new Date().toISOString() })
  }

  /**
   * Remove o período de exibição do filme.
   * DELETE /movies/:uid/display-period
   */
  @Delete(':uid/display-period')
  public async removeDisplayPeriod(@Param('uid') uid: string): Promise<JsonApiResponse> {
    const response = new JsonApiResponse()

    const result = await this.service.removeDisplayPeriod(uid)

    return result.isInvalid()
      ? response.errors(result.failures)
      : response.data(MovieResponseDTO.fromEntity(result.value)).meta({ updatedAt: new Date().toISOString() })
  }

  /**
   * Atualiza os contribuidores do filme.
   * PATCH /movies/:uid/contributors
   */
  @Patch(':uid/contributors')
  public async updateContributors(
    @Param('uid') uid: string,
    @Body() dto: UpdateContributorsDTO
  ): Promise<JsonApiResponse> {
    const response = new JsonApiResponse()

    const failures = ensureNotNull({ uid, dto })
    if (failures.length > 0) return response.errors(failures)

    const result = await this.service.updateContributors(uid, dto.contributors)

    return result.isInvalid()
      ? response.errors(result.failures)
      : response.data(MovieResponseDTO.fromEntity(result.value)).meta({ updatedAt: new Date().toISOString() })
  }
}

/*
export interface MovieWithRelationsDto {
  movie: {
    uid: string
    title: ILanguageContent
    description: ILanguageContent
    duration: number | null
    ageRating: string
    status: MovieAdministrativeStatus
    genres: string[] | null
    imageUID: string
    displayPeriod: {
      startDate: Date
      endDate: Date
    } | null
    contributorUIDs: string[] // Apenas os UIDs dos contribuidores
  }
  image: {
    uid: string
    url: string
    altText: string
    // outras propriedades da imagem
  }
  contributors: Array<{
    uid: string
    name: string
    role: string
    // outras propriedades da pessoa
  }>
}

{
  "data": {
    "type": "movie",
    "id": "movie-uid",
    "attributes": {  dados do filme  },
    "relationships": {
        "image": { "data": { "type": "image", "id": "image-uid" } },
        "contributors": { "data": [{ "type": "person", "id": "person-uid" }] }
      }
    },
    "included": [
      { "type": "image", "id": "image-uid", "attributes": {  dados da imagem  } },
      { "type": "person", "id": "person-uid", "attributes": {  dados da pessoa  } }
    ]
  }
  
  export class MovieWithRelationsMapper {
    static toJsonApi(data: MovieWithRelationsDto): JsonApiResponse {
      return {
        data: this.mapMovieToJsonApi(data.movie),
        included: [
          this.mapImageToJsonApi(data.image),
          ...data.contributors.map(c => this.mapPersonToJsonApi(c))
        ]
      }
    }
  }

*/
