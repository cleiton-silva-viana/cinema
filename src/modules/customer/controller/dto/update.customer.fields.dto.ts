/**
 * DTO para atualização de campos do cliente
 * Todos os campos são opcionais, permitindo atualizações parciais
 */
export interface IUpdateCustomerFieldsDTO {
  /** Nome completo do cliente */
  readonly name?: string
  /** Data de nascimento do cliente */
  readonly birthDate?: Date
  /** Endereço de email único do cliente */
  readonly email?: string
  /** CPF do cliente */
  readonly cpf?: string
  /** Cartão estudantil do cliente */
  readonly studentCard?: {
    /** Identificador do cartão estudantil */
    readonly id: string
    /** Data de validade do cartão estudantil */
    readonly validity: Date
  }
}
