import { faker } from '@faker-js/faker'
import { IMovieHydrateInput, Movie } from '@modules/movie/entity/movie'
import { ICreateMovieDTO } from '@modules/movie/controller/dto/movie.dto'
import { ImageUID } from '@modules/image/entity/value-object/image.uid'
import { PersonRole } from '@/modules/movie/entity/value-object/movie.contributor'
import { Genre } from '@modules/movie/entity/value-object/movie.genre'
import { MovieUID } from '@modules/movie/entity/value-object/movie.uid'
import { MovieAdministrativeStatusEnum } from '@modules/movie/type/movie.administrative.status'
import { AgeRatingEnum } from '@modules/movie/entity/value-object/age.rating'
import { SupportedLanguageEnum } from '@/shared/value-object/language-content/supported.language.enum'
import { CreateTestContributorInput } from '@test/builder/contributor.builder'
import { DateHelper } from '@shared/helper/date.helper'

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

export function CreateTestMovieDTO(override?: Partial<ICreateMovieDTO>): ICreateMovieDTO {
  return {
    title: override?.title ?? [
      { text: faker.lorem.sentences({ min: 3, max: 5 }), language: SupportedLanguageEnum.PT },
      { text: faker.lorem.sentences({ min: 3, max: 5 }), language: SupportedLanguageEnum.EN },
    ],
    description: override?.description ?? [
      { text: faker.lorem.paragraph(), language: SupportedLanguageEnum.PT },
      { text: faker.lorem.paragraph(), language: SupportedLanguageEnum.EN },
    ],
    ageRating: override?.ageRating ?? faker.helpers.enumValue(Genre),
    imageUID: override?.imageUID ?? ImageUID.create().value,
    contributors: override?.contributors ?? [
      { personUID: faker.string.uuid(), role: PersonRole.DIRECTOR },
      { personUID: faker.string.uuid(), role: PersonRole.ACTOR },
    ],
    duration: override?.duration ?? faker.number.int({ min: 90, max: 180 }),
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
