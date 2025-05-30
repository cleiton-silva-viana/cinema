import { ResourceTypes } from '@shared/constant/resource.types'
import { Movie } from '@modules/movie/entity/movie'
import { IMovieWithRelations } from '@modules/movie/repository/movie.repository.interface'
import { Image } from '@modules/image/entity/image'
import { Person } from '@modules/person/entity/person'
import { SupportedLanguage } from '@shared/value-object/multilingual-content'

interface MovieAttributes {
  title: any // Considerando que pode ser IMultilingualText
  description: any // Considerando que pode ser IMultilingualText
  durationInMinutes: number | null
  ageRating: string
  status: string
  genres: string[] | null
  displayPeriod: {
    startDate: string
    endDate: string
  } | null
}

interface Relationship {
  data: { type: string; id: string } | { type: string; id: string }[] | null
}

interface Relationships {
  [key: string]: Relationship
}

interface IncludedResource {
  type: string
  id: string
  attributes: any
}

/**
 * DTO para resposta de Movie seguindo o padrão JSON:API.
 *
 * Regras importantes:
 * - fromEntity(): Inclui todos os relacionamentos existentes no Movie (image e contributors)
 *   nos relationships, mesmo sem os dados detalhados no included.
 *
 * - fromEntityWithRelations(): Só inclui relacionamentos nos relationships se os objetos
 *   relacionados (image/contributors) forem explicitamente fornecidos, garantindo
 *   consistência entre relationships e included.
 */
export class MovieResponseDTO {
  public readonly id: string
  public readonly type: string = ResourceTypes.MOVIE
  public readonly attributes: MovieAttributes
  public readonly relationships?: Relationships
  public readonly included?: IncludedResource[]

  private constructor(
    movie: Movie,
    image?: Image,
    contributors?: Array<{ person: Person; role: string }>,
    isFromEntity: boolean = false
  ) {
    this.id = movie.uid.value
    this.attributes = {
      title: movie.title.content(SupportedLanguage.PT),
      description: movie.description.content(SupportedLanguage.PT),
      durationInMinutes: movie.duration?.minutes ?? null,
      ageRating: movie.ageRating.value,
      status: movie.status,
      genres: movie.genre?.getGenres() ?? null,
      displayPeriod: movie.displayPeriod
        ? {
            startDate: movie.displayPeriod.startDate.toISOString(),
            endDate: movie.displayPeriod.endDate.toISOString(),
          }
        : null,
    }

    this.relationships = {}
    this.included = []

    // Para fromEntity, sempre incluímos o relacionamento se existir no Movie
    // Para fromEntityWithRelations, só incluímos se a imagem for fornecida
    if (movie.imageUID && (isFromEntity || image)) {
      this.relationships.image = {
        data: { type: ResourceTypes.IMAGE, id: movie.imageUID.value },
      }

      // Só incluímos os atributos da imagem se ela for fornecida
      if (image) {
        this.included?.push({
          type: ResourceTypes.IMAGE,
          id: image.uid.value,
          attributes: {
            sizes: {
              small: image.sizes.small,
              normal: image.sizes.normal,
              large: image.sizes.large,
            },
            title: image.title.content(SupportedLanguage.PT),
            description: image.description.content(SupportedLanguage.PT),
          },
        })
      }
    }

    const movieContributors = movie.contributors.getAll()
    // Para fromEntity, sempre incluímos os relacionamentos se existirem no Movie
    // Para fromEntityWithRelations, só incluímos se os contributors forem fornecidos
    if (movieContributors.length > 0 && (isFromEntity || (contributors && contributors.length > 0))) {
      const availableContributors = isFromEntity
        ? movieContributors
        : movieContributors.filter((c) => contributors!.some((p) => p.person.uid.equal(c.personUID)))

      if (availableContributors.length > 0) {
        this.relationships.contributors = {
          data: availableContributors.map((c) => ({
            type: ResourceTypes.PERSON,
            id: c.personUID.value,
          })),
        }

        // Só incluímos os atributos dos contributors se eles forem fornecidos
        if (contributors) {
          contributors.forEach((c) => {
            this.included?.push({
              type: ResourceTypes.PERSON,
              id: c.person.uid.value,
              attributes: {
                name: c.person.name.value,
                birthDate: c.person.birthDate.value.toISOString(),
                role: c.role,
              },
            })
          })
        }
      }
    }
  }

  public static fromEntity(movie: Movie): MovieResponseDTO {
    return new MovieResponseDTO(movie, undefined, undefined, true)
  }

  public static fromEntityWithRelations(movieWithRelations: IMovieWithRelations): MovieResponseDTO {
    const { movie, image, contributors } = movieWithRelations

    const mappedContributors = !contributors
      ? []
      : (movie?.contributors
          .getAll()
          .map((c) => {
            const person = contributors.find((p) => p.uid.equal(c.personUID))
            return person ? { person, role: c.role } : null
          })
          .filter(Boolean) as Array<{ person: Person; role: string }>)

    return new MovieResponseDTO(movie, image, mappedContributors, false)
  }
}
