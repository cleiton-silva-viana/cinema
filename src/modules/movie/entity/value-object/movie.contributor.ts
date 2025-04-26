import { PersonUID } from "../../../person/value-object/person.uid";
import { failure, Result, success } from "../../../../shared/result/result";
import { isNull } from "../../../../shared/validator/validator";
import { TechnicalError } from "../../../../shared/error/technical.error";
import { MovieUID } from "./movie.uid";

export const contributorCodes = {
  INVALID_PERSON_MOVIE_ROLE: 'INVALID_PERSON_MOVIE_ROLE'
}

export enum PersonRole {
  ACTOR = 'actor',
  DIRECTOR = 'director',
  WRITER = 'writer',
  PRODUCER = 'producer',
  ACTRESS = 'actress',
  CINEMATOGRAPHER = 'cinematographer',
}

/**
 * Representa o vínculo de uma pessoa a um filme, com um papel específico.
 * Uma pessoa pode ter múltiplos PersonMovieRole para o mesmo filme (ex: ator e diretor).
 */
export class MovieContributor {
  // TODO: Validar duplicidade (não permitir dois vínculos idênticos para a mesma pessoa, filme e papel).
  private constructor(
    public readonly personUid: PersonUID,
    public readonly movieUid: MovieUID,
    public readonly role: PersonRole
  ) {}

  public static create(personUid: PersonUID, movieUid: MovieUID, role: PersonRole): Result<MovieContributor> {
    return (isNull(personUid) || isNull(movieUid) || isNull(role))
      ? failure({ code: contributorCodes.INVALID_PERSON_MOVIE_ROLE, details: { personUid, movieUid, role } })
      : success(new MovieContributor(personUid, movieUid, role));
  }

  public static hydrate(personUID: string, movieUID: string, role: string) {
    TechnicalError.if(!personUID || !movieUID || !role, 'INVALID_PARAMS', { personUID, movieUID, role })
    
    return new MovieContributor(PersonUID.hydrate(personUID), MovieUID.hydrate(movieUID), role as PersonRole);
  }
}
