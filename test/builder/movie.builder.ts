import { faker } from '@faker-js/faker'
import { IMovieHydrateInput, Movie } from '@modules/movie/entity/movie'
import { ICreateMovieDTO } from '@modules/movie/controller/dto/movie.dto'
import { ImageUID } from '@modules/image/entity/value-object/image.uid'
import { PersonRole } from '@/modules/movie/entity/value-object/movie.contributor'
import { ILanguageContent, SupportedLanguageEnum } from '@shared/value-object/multilingual-content'
import { Genre } from '@modules/movie/entity/value-object/movie.genre'
import { MovieUID } from '@modules/movie/entity/value-object/movie.uid'
import { MovieAdministrativeStatusEnum } from '@modules/movie/type/movie.administrative.status'

export function CreateTestMovie(override?: Partial<IMovieHydrateInput>) {
  const { title, description, ageRating, imageUID, durationInMinutes, contributors } = CreateTestMovieDTO()

  return Movie.hydrate({
    uid: override?.uid ?? MovieUID.create().value,
    title: title[0] as ILanguageContent,
    description: description[0] as ILanguageContent,
    ageRating: ageRating,
    imageUID: imageUID,
    duration: durationInMinutes,
    contributors: contributors.map((c) => ({
      personUID: c.personUID,
      role: c.role,
    })),
    status: MovieAdministrativeStatusEnum.DRAFT,
    displayPeriod: { startDate: faker.date.soon({ days: 10 }), endDate: faker.date.soon({ days: 30 }) },
    genres: [faker.helpers.enumValue(Genre)],
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
    durationInMinutes: override?.durationInMinutes ?? faker.number.int({ min: 90, max: 180 }),
  }
}
