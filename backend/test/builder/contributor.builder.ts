import {
  IMovieContributorInput,
  MovieContributor,
  PersonRole,
} from '@modules/movie/entity/value-object/movie.contributor'
import { PersonUID } from '@modules/person/entity/value-object/person.uid'
import { faker } from '@faker-js/faker'

export function CreateTestContributor(role?: PersonRole, uid?: string): MovieContributor {
  return MovieContributor.hydrate({
    personUID: uid || PersonUID.create().value,
    role: role || faker.helpers.enumValue(PersonRole),
  })
}

export function CreateTestContributorInput(role?: PersonRole, uid?: string): IMovieContributorInput {
  return {
    personUID: uid || PersonUID.create().value,
    role: role || faker.helpers.enumValue(PersonRole),
  } as IMovieContributorInput
}
