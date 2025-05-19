import { PersonUID } from "../../../person/entity/value-object/person.uid";
import { failure, Result, success } from "../../../../shared/result/result";
import { isNull } from "../../../../shared/validator/validator";
import { TechnicalError } from "../../../../shared/error/technical.error";
import { SimpleFailure } from "../../../../shared/failure/simple.failure.type";
import { FailureCode } from "../../../../shared/failure/failure.codes.enum";

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
 *
 * Este é um Value Object imutável que encapsula:
 * - O identificador único da pessoa (PersonUID)
 * - O papel desempenhado pela pessoa no filme (PersonRole)
 *
 * Características:
 * - Imutável: todas as propriedades são readonly
 * - Sem identidade própria: dois MovieContributor com os mesmos valores são considerados iguais
 * - Validação na criação: use o método estático create() para instanciar com validação
 * - Hidratação: use o método hydrate() para instanciar a partir de dados já validados
 */
export class MovieContributor {
  /**
   * Construtor privado. Use os métodos estáticos `create` ou `hydrate` para instanciar.
   * @param personUid - Identificador único da pessoa associada ao filme
   * @param role - Papel desempenhado pela pessoa no filme
   * @private
   */
  private constructor(
    public readonly personUid: PersonUID,
    public readonly role: PersonRole,
  ) {}

  /**
   * Cria uma nova instância de MovieContributor com validação completa.
   *
   * Validações realizadas:
   * - Verifica se o personUid é um UUID válido
   * - Verifica se o role é um valor válido do enum PersonRole
   *
   * Possíveis falhas:
   * - Falhas relacionadas à validação do PersonUID
   * - FailureCode.INVALID_ENUM_VALUE quando o role não é um valor válido do enum PersonRole
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

    const hasRole = Object.values(PersonRole).includes(
      input.role as PersonRole,
    );
    if (!hasRole)
      failures.push({
        code: FailureCode.INVALID_ENUM_VALUE,
        details: {
          validValues: Object.values(PersonRole),
        },
      });

    return failures.length > 0
      ? failure(failures)
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
   * @throws TechnicalError com código NULL_ARGUMENT se input for nulo
   * @throws TechnicalError com código NULL_ARGUMENT se personUid for nulo
   * @throws TechnicalError com código NULL_ARGUMENT se role for nulo
   */
  public static hydrate(input: IMovieContributorInput) {
    TechnicalError.if(isNull(input), FailureCode.MISSING_REQUIRED_DATA, {
      object: "input",
    });

    TechnicalError.if(
      isNull(input.personUid),
      FailureCode.MISSING_REQUIRED_DATA,
      {
        field: "personUid",
      },
    );

    TechnicalError.if(isNull(input.role), FailureCode.MISSING_REQUIRED_DATA, {
      field: "role",
    });

    return new MovieContributor(
      PersonUID.hydrate(input.personUid),
      input.role as PersonRole,
    );
  }
  /**
   * Verifica se este MovieContributor é igual a outro.
   * Dois MovieContributor são considerados iguais se tiverem o mesmo personUid e role.
   *
   * @param other - Outro MovieContributor para comparação
   * @returns boolean - true se forem iguais, false caso contrário
   */
  public equal(other: MovieContributor): boolean {
    if (!other) return false;
    return this.personUid.equal(other.personUid) && this.role === other.role;
  }
}
