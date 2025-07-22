import { ResourceTypesEnum } from '@shared/constant/resource.types'
import { Customer } from '../../entity/customer'

/**
 * DTO para formatação da resposta de cliente no padrão JSON:API
 * Implementa a estrutura padrão de resposta com id, type, attributes e links
 */
export class CustomerResponseDTO {
  /**
   * Construtor privado para garantir imutabilidade
   * @param id Identificador único do cliente
   * @param type Tipo do recurso
   * @param attributes Atributos do cliente
   * @param links Links relacionados ao cliente
   */
  private constructor(
    public readonly id: string,
    public readonly type: string,
    public readonly attributes: {
      readonly name: string
      readonly birthDate: string
      readonly email: string
    },
    public readonly links: {
      readonly self: string
    }
  ) {}

  /**
   * Cria um DTO de resposta a partir de uma entidade Customer
   * @param customer Entidade Customer
   * @returns DTO formatado no padrão JSON:API
   */
  public static fromEntity(customer: Customer): CustomerResponseDTO {
    return new CustomerResponseDTO(
      customer.uid.value,
      ResourceTypesEnum.CUSTOMER,
      {
        name: customer.name.value,
        birthDate: customer.birthDate.value.toISOString().split('T')[0],
        email: customer.email.value,
      },
      {
        self: `/${ResourceTypesEnum.CUSTOMER}/${customer.uid.value}`,
      }
    )
  }
}
