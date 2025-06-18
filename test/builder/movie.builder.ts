import { faker } from '@faker-js/faker'
import { IMovieHydrateInput, Movie } from '@modules/movie/entity/movie'
import { ImageUID } from '@modules/image/entity/value-object/image.uid'
import { IMovieContributorInput, PersonRole } from '@/modules/movie/entity/value-object/movie.contributor'
import { Genre } from '@modules/movie/entity/value-object/movie.genre'
import { MovieUID } from '@modules/movie/entity/value-object/movie.uid'
import { MovieAdministrativeStatusEnum } from '@modules/movie/type/movie.administrative.status'
import { AgeRatingEnum } from '@modules/movie/entity/value-object/age.rating'
import { SupportedLanguageEnum } from '@/shared/value-object/language-content/supported.language.enum'
import { CreateTestContributorInput } from '@test/builder/contributor.builder'
import { DateHelper } from '@shared/helper/date.helper'
import { IMovieWithRelations } from '@modules/movie/repository/movie.repository.interface'
import { IHydrateImageParams } from '@modules/image/entity/image'
import { CreateTestImage } from '@test/builder/image.builder'
import { hydrateEnum } from '@shared/validator/utils/validation.helpers'
import { Person } from '@modules/person/entity/person'
import { CreateTestPerson } from '@test/builder/person.builder'

export function CreateTestMovie(override?: Partial<IMovieHydrateInput>) {
  let { uid, title, description, ageRating, imageUID, duration, contributors, genres, status, displayPeriod } =
    createTestMovieHydrateInputDTO(override)
  return Movie.hydrate({
    uid,
    title,
    description,
    ageRating,
    imageUID,
    duration,
    contributors,
    status,
    displayPeriod,
    genres,
  })
}

export function CloneTestMovieWithOverrides(movie: Movie, override: Partial<Omit<IMovieHydrateInput, 'uid'>>) {
  return Movie.hydrate({
    uid: movie.uid.value,
    imageUID: override?.imageUID ?? movie.imageUID.value,
    duration: override?.duration ?? movie.duration?.minutes!,
    ageRating: override?.ageRating ?? movie.ageRating.value,
    status: override?.status ?? movie.status,
    genres: override?.genres ?? (movie.genre ? movie.genre.getGenres() : []),
    displayPeriod: override?.displayPeriod ?? movie.displayPeriod!,
    title: override?.title ?? {
      text: movie.title.content(SupportedLanguageEnum.PT)!,
      language: SupportedLanguageEnum.PT,
    },
    description: override?.description ?? {
      text: movie.description.content(SupportedLanguageEnum.PT)!,
      language: SupportedLanguageEnum.PT,
    },
    contributors:
      override?.contributors ??
      movie.contributors.getAll().map((c) => ({
        personUID: c.personUID.value,
        role: c.role,
      })),
  })
}

export function CreateTestMovieWithRelations(options?: {
  movie?: Partial<IMovieHydrateInput>
  image?: Partial<IHydrateImageParams>
  contributos?: Partial<IMovieContributorInput>[]
}): IMovieWithRelations {
  const image = CreateTestImage(options?.image)

  const contributorsInput: IMovieContributorInput[] = []
  const contributors: Person[] = []

  if (options?.contributos) {
    options.contributos.forEach((ctb) => {
      const role = ctb.role ? hydrateEnum({ role: ctb.role }, PersonRole) : undefined
      contributorsInput.push(CreateTestContributorInput(role, ctb.personUID))
      contributors.push(CreateTestPerson({ uid: ctb.personUID }))
    })
  }

  const movie = CreateTestMovie({
    ...options?.movie,
    contributors: contributorsInput,
  })

  return {
    movie,
    contributors,
    image,
  }
}

export function createTestMovieHydrateInputDTO(overrides?: Partial<IMovieHydrateInput>): IMovieHydrateInput {
  return {
    uid: MovieUID.create().value,
    title: { text: faker.lorem.paragraph(), language: SupportedLanguageEnum.PT },
    description: { text: faker.lorem.paragraph(), language: SupportedLanguageEnum.PT },
    duration: faker.number.int({ min: 90, max: 180 }),
    ageRating: faker.helpers.enumValue(AgeRatingEnum),
    status: MovieAdministrativeStatusEnum.DRAFT,
    genres: [faker.helpers.enumValue(Genre)],
    imageUID: ImageUID.create().value,
    contributors: [
      CreateTestContributorInput(),
      CreateTestContributorInput(),
      CreateTestContributorInput(PersonRole.DIRECTOR),
    ],
    displayPeriod: {
      startDate: DateHelper.soon(10),
      endDate: DateHelper.soon(15),
    },
    ...overrides,
  }
}
