import { ResourceTypes } from '@shared/constant/resource.types'
import { Person } from '../../entity/person'

/**
 * DTO para formatação da resposta de pessoa no padrão JSON:API
 */
export class PersonResponseDTO {
  /**
   * Construtor privado para garantir imutabilidade
   * @param id Identificador único da pessoa
   * @param type Tipo do recurso
   * @param attributes Atributos da pessoa
   * @param links Links relacionados à pessoa
   */
  private constructor(
    public readonly id: string,
    public readonly type: string,
    public readonly attributes: {
      readonly name: string
      readonly birthDate: string
    },
    public readonly links: {
      readonly self: string
    }
  ) {}

  /**
   * Cria um DTO de resposta a partir de uma entidade Person
   * @param person Entidade Person
   * @returns DTO formatado no padrão JSON:API
   */
  public static fromEntity(person: Person): PersonResponseDTO {
    return new PersonResponseDTO(
      person.uid.value,
      ResourceTypes.PERSON,
      {
        name: person.name.value,
        birthDate: person.birthDate.value.toISOString().split('T')[0],
      },
      {
        self: `/${ResourceTypes.PERSON.toLowerCase()}/${person.uid.value}`,
      }
    )
  }
}
