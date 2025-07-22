export interface ICreateMovieDTO {
  title: { text: string; language: string }[]
  description: { text: string; language: string }[]
  ageRating: string
  imageUID: string
  contributors: { personUID: string; role: string }[]
  durationInMinutes: number
}

export type UpdateTitleDTO = Pick<ICreateMovieDTO, 'title'>
export type UpdateDescriptionDTO = Pick<ICreateMovieDTO, 'description'>
export type UpdateAgeRatingDTO = Pick<ICreateMovieDTO, 'ageRating'>
export type UpdatePosterImageDTO = Pick<ICreateMovieDTO, 'imageUID'>
export type UpdateContributorsDTO = Pick<ICreateMovieDTO, 'contributors'>
export type UpdateDurationDTO = Pick<ICreateMovieDTO, 'durationInMinutes'>
export type SetDisplayPeriodDTO = { startsIn: Date; endsIn: Date }
export type SetGenresDTO = { genres: string[] }
