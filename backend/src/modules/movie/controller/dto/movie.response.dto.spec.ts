import { IHydrateImageParams, Image } from '@/modules/image/entity/image'
import { MovieResponseDTO } from './movie.response.dto'
import { IMovieHydrateInput, Movie } from '../../entity/movie'
import { PersonRole } from '../../entity/value-object/movie.contributor'
import { Person } from '@modules/person/entity/person'
import { SupportedLanguage } from '@shared/value-object/multilingual-content'
import { MovieUID } from '@modules/movie/entity/value-object/movie.uid'
import { MovieAdministrativeStatus } from '../../type/movie.administrative.status'
import { ImageUID } from '@modules/image/entity/value-object/image.uid'
import { PersonUID } from '@modules/person/entity/value-object/person.uid'
import { faker } from '@faker-js/faker/.'
import { ResourceTypes } from '@shared/constant/resource.types'

describe('MovieResponseDTO', () => {
  function createPersonForTest(): Person {
    return Person.hydrate(PersonUID.create().value, faker.helpers.enumValue(PersonRole), faker.date.past())
  }

  function createTestResources(
    movieOverrides?: Partial<IMovieHydrateInput>,
    imageOverrides?: Partial<IHydrateImageParams>,
    personsOverride?: Person[]
  ): { image: Image; movie: Movie; persons: Person[] } {
    const persons: Person[] = personsOverride ?? [
      Person.hydrate(PersonUID.create().value, faker.person.firstName(), faker.date.birthdate()),
    ]

    const imageUID = movieOverrides?.imageUID ?? ImageUID.create().value
    const image: Image = Image.hydrate({
      uid: imageUID,
      title: { text: faker.lorem.sentence({ min: 3, max: 7 }), language: SupportedLanguage.PT },
      description: { text: faker.lorem.paragraphs(), language: SupportedLanguage.PT },
      sizes: {
        small: 'small_default_url',
        normal: 'normal_default_url',
        large: 'large_default_url',
      },
      ...imageOverrides,
    })

    const movie = Movie.hydrate({
      uid: MovieUID.create().value,
      title: { text: 'Título Padrão PT', language: SupportedLanguage.PT },
      description: { text: 'Descrição Padrão PT', language: SupportedLanguage.PT },
      ageRating: 'L',
      status: MovieAdministrativeStatus.DRAFT,
      duration: 120,
      imageUID: imageUID,
      genres: ['ACTION'],
      contributors: [{ personUID: persons[0].uid.value, role: PersonRole.ACTOR }],
      ...movieOverrides,
    })

    return { movie, image, persons }
  }

  describe('fromEntity', () => {
    it('deve mapear corretamente uma entidade Movie', () => {
      // Arrange
      const { movie } = createTestResources()

      // Act
      const dto = MovieResponseDTO.fromEntity(movie)

      // Assert
      expect(dto.id).toBe(movie.uid.value)
      expect(dto.type).toBe(ResourceTypes.MOVIE)
      expect(dto.attributes.title).toBe(movie.title.content(SupportedLanguage.PT))
      expect(dto.attributes.description).toBe(movie.description.content(SupportedLanguage.PT))
      expect(dto.attributes.durationInMinutes).toBe(movie.duration?.minutes)
      expect(dto.attributes.ageRating).toBe(movie.ageRating.value)
      expect(dto.attributes.status).toBe(movie.status)
      expect(dto.attributes.genres).toEqual(movie.genre?.getGenres())
      expect(dto.attributes.displayPeriod).toBeNull()
      expect(dto.relationships?.image).toBeDefined()
      expect(dto.relationships?.image?.data).toEqual({ id: movie.imageUID.value, type: ResourceTypes.IMAGE })
      expect(dto.included).toEqual([])
    })
  })

  describe('fromEntityWithRelations', () => {
    it('deve mapear corretamente uma entidade Movie com imagem e contribuidores', () => {
      const { movie, image, persons: contributors } = createTestResources()

      const dto = MovieResponseDTO.fromEntityWithRelations({ movie, image, contributors })

      expect(dto.id).toBe(movie.uid.value)
      expect(dto.type).toBe(ResourceTypes.MOVIE)

      // Attributes check
      expect(dto.attributes.title).toBe(movie.title.content(SupportedLanguage.PT))
      expect(dto.attributes.durationInMinutes).toBe(movie.duration?.minutes)
      expect(dto.attributes.genres).toEqual(movie.genre?.getGenres())

      // Relationships check
      expect(dto.relationships?.image?.data).toEqual({ type: ResourceTypes.IMAGE, id: image.uid.value })
      expect(dto.relationships?.contributors?.data).toEqual([
        { type: ResourceTypes.PERSON, id: contributors[0].uid.value },
      ])

      // Included check
      expect(dto.included).toHaveLength(2)
      expect(dto.included).toContainEqual({
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
      expect(dto.included).toContainEqual({
        type: ResourceTypes.PERSON,
        id: contributors[0].uid.value,
        attributes: {
          name: contributors[0].name.value,
          birthDate: contributors[0].birthDate.value.toISOString(), // converter para string ISO
          role: movie.contributors.getAll()[0].role,
        },
      })
    })

    it('deve mapear corretamente quando a imagem não está presente', () => {
      // Arrange
      const { movie, persons: contributors } = createTestResources()
      const image = null as any

      // Act
      const dto = MovieResponseDTO.fromEntityWithRelations({ movie, image, contributors })

      // Assert
      expect(dto.relationships?.image).toBeUndefined()
      expect(dto.included?.find((inc) => inc.type === ResourceTypes.IMAGE)).toBeUndefined()
      expect(dto.included?.find((inc) => inc.type === ResourceTypes.PERSON)?.id).toBe(contributors[0].uid.value)
    })

    it('deve mapear corretamente quando os contribuidores não estão presentes', () => {
      // Arrange
      const { movie, image } = createTestResources()
      const contributors = null as any

      // Act
      const dto = MovieResponseDTO.fromEntityWithRelations({ movie, image, contributors })

      // Assert
      expect(dto.relationships?.contributors).toBeUndefined()
      expect(dto.included?.find((inc) => inc.type === ResourceTypes.PERSON)).toBeUndefined()
      expect(dto.included?.find((inc) => inc.type === ResourceTypes.IMAGE)?.id).toBe(image.uid.value)
    })

    it('deve mapear corretamente quando nem imagem nem contribuidores estão presentes', () => {
      // Arrange
      const { movie } = createTestResources()

      // Act
      const dto = MovieResponseDTO.fromEntityWithRelations({ movie, image: null as any, contributors: [] })

      // Assert
      expect(dto.relationships?.image).toBeUndefined()
      expect(dto.relationships?.contributors).toBeUndefined()
      expect(dto.included).toEqual([])
    })

    it('deve lidar com casos em que um contribuidor em movie.contributors não é encontrado na lista de contribuidores fornecida', () => {
      // Arrange
      const p1 = createPersonForTest()
      const c1 = { personUID: p1.uid.value, role: PersonRole.ACTOR }
      const p2 = createPersonForTest()
      const c2 = { personUID: p2.uid.value, role: faker.helpers.enumValue(PersonRole) }
      const p3 = createPersonForTest()
      const c3 = { personUID: p3.uid.value, role: faker.helpers.enumValue(PersonRole) }
      const { movie } = createTestResources({
        contributors: [c1, c2, c3],
      })

      // Act
      const dto = MovieResponseDTO.fromEntityWithRelations({
        movie,
        image: null as any,
        contributors: [p1, p2], // p3 não incluso
      })

      // Assert
      expect(dto.relationships?.contributors?.data).toHaveLength(2)
      const data = dto.relationships?.contributors?.data
      expect(data).toContainEqual({ type: ResourceTypes.PERSON, id: c1.personUID })
      expect(data).toContainEqual({ type: ResourceTypes.PERSON, id: c2.personUID })
      expect(dto.included).toHaveLength(2)
      expect(dto.included?.some((p) => p.id === p1.uid.value)).toBe(true)
      expect(dto.included?.some((p) => p.id === p2.uid.value)).toBe(true)
      expect(dto.included?.some((p) => p.id === p3.uid.value)).toBe(false)
    })
  })
})
