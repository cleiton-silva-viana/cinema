import { PersonUID } from "../../../person/value-object/person.uid";
import { failure, Result, success } from "../../../../shared/result/result";
import { isNull } from "../../../../shared/validator/validator";
import { TechnicalError } from "../../../../shared/error/technical.error";
import { SimpleFailure } from "../../../../shared/failure/simple.failure.type";

/**
 * Códigos de erro relacionados aos contribuidores de filmes.
 */
export const contributorCodes = {
  INVALID_PERSON_MOVIE_ROLE: "INVALID_PERSON_MOVIE_ROLE",
  INVALID_PARAMS: "INVALID_PARAMS",
};

/**
 * Enum que define os possíveis papéis que uma pessoa pode ter em um filme.
 */
export enum PersonRole {
  ACTOR = "actor", // Ator
  DIRECTOR = "director", // Diretor
  WRITER = "writer", // Roteirista
  PRODUCER = "producer", // Produtor
  ACTRESS = "actress", // Atriz
  CINEMATOGRAPHER = "cinematographer", // Diretor de fotografia
}

/**
 * Interface que define os dados necessários para criar um MovieContributor.
 * Esta interface contém todas as propriedades obrigatórias para instanciar
 * um value object do tipo MovieContributor através do método create().
 *
 * @property personUid - Identificador único da pessoa (deve ser um UUID válido)
 * @property role - Papel da pessoa no filme (deve ser um dos valores definidos em PersonRole)
 */
export interface IMovieContributorInput {
  personUid: string;
  role: string;
}

/**
 * Representa o vínculo de uma pessoa a um filme, com um papel específico.
 * Uma pessoa pode ter múltiplos vínculos para o mesmo filme (ex: ator e diretor).
 */
export class MovieContributor {
  private constructor(
    public readonly personUid: PersonUID,
    public readonly role: PersonRole,
  ) {}

  /**
   * Cria uma nova instância de MovieContributor com validação completa.
   *
   * @param input - Objeto contendo os dados necessários para criar um contribuidor
   * @returns Result<MovieContributor> - Objeto Result contendo a instância ou falhas
   */
  public static create(
    input: IMovieContributorInput,
  ): Result<MovieContributor> {
    const failures: SimpleFailure[] = [];

    const personUidResult = PersonUID.parse(input.personUid);
    if (personUidResult.invalid) failures.push(...personUidResult.failures);

    if (!Object.values(PersonRole).includes(input.role as PersonRole))
      failures.push({
        code: contributorCodes.INVALID_PERSON_MOVIE_ROLE,
      });

    return failures.length > 0
      ? failure({
          code: contributorCodes.INVALID_PERSON_MOVIE_ROLE,
          details: {
            personUID: input.personUid,
            role: input.role,
          },
        })
      : success(
          new MovieContributor(personUidResult.value, input.role as PersonRole),
        );
  }

  /**
   * Cria uma instância de MovieContributor a partir de dados brutos.
   * Este método realiza uma validação básica dos dados de entrada e lança erro se estiverem inválidos.
   *
   * @param input - Objeto contendo os dados do contribuidor (personUid e role)
   * @returns MovieContributor - Uma nova instância de MovieContributor
   * @throws TechnicalError se algum dos campos obrigatórios estiver ausente ou inválido
   */
  public static hydrate(input: IMovieContributorInput) {
    TechnicalError.if(isNull(input), contributorCodes.INVALID_PARAMS, {
      message: "Movie contributor input object is required",
    });

    TechnicalError.if(
      isNull(input.personUid),
      contributorCodes.INVALID_PARAMS,
      {
        message: "Person UID is required",
      },
    );

    TechnicalError.if(isNull(input.role), contributorCodes.INVALID_PARAMS, {
      message: "Role is required",
    });

    return new MovieContributor(
      PersonUID.hydrate(input.personUid),
      input.role as PersonRole,
    );
  }
}
