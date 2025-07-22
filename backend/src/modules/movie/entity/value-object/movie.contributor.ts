import { PersonUID } from '@modules/person/entity/value-object/person.uid'
import { combine, failure, Result, success } from '@shared/result/result'
import { TechnicalError } from '@shared/error/technical.error'
import { isNullOrUndefined } from '@shared/validator/utils/validation'
import { ensureNotNull, hydrateEnum, parseToEnum } from '@shared/validator/utils/validation.helpers'

/**
 * Enum que define os possíveis papéis que uma pessoa pode ter em um filme.
 */
export enum PersonRole {
  ACTOR = 'ACTOR',
  DIRECTOR = 'DIRECTOR',
  WRITER = 'WRITER',
  PRODUCER = 'PRODUCER',
  ACTRESS = 'ACTRESS',
  CINEMATOGRAPHER = 'CINEMATOGRAPHER',
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
  personUID: string
  role: string
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
   * @param personUID - Identificador único da pessoa associada ao filme
   * @param role - Papel desempenhado pela pessoa no filme
   * @private
   */
  private constructor(
    public readonly personUID: PersonUID,
    public readonly role: PersonRole
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
  public static create(input: IMovieContributorInput): Result<MovieContributor> {
    const failures = ensureNotNull({ input })
    if (failures.length !== 0) return failure(failures)

    const result = combine({
      personUID: PersonUID.parse(input.personUID),
      role: parseToEnum('person_role', input.role, PersonRole),
    })

    if (result.isInvalid()) return failure(result.failures)

    const { personUID, role } = result.value
    return success(new MovieContributor(personUID, role))
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
    TechnicalError.validateRequiredFields({ input })
    const { personUID, role } = input
    TechnicalError.validateRequiredFields({ personUID, role })
    return new MovieContributor(PersonUID.hydrate(personUID), hydrateEnum({ role }, PersonRole))
  }

  /**
   * Verifica se este MovieContributor é igual a outro.
   * Dois MovieContributor são considerados iguais se tiverem o mesmo personUid e role.
   *
   * @param other - Outro MovieContributor para comparação
   * @returns boolean - true se forem iguais, false caso contrário
   */
  public equal(other: MovieContributor): boolean {
    if (isNullOrUndefined(other)) return false
    if (!(other instanceof MovieContributor)) return false
    return this.role === other.role
  }
}
