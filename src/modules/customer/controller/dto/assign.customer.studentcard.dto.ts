/**
 * DTO para atribuição de cartão estudantil ao cliente
 * Contém os dados necessários para vincular um cartão estudantil
 */
export interface IAssignCustomerStudentCardDTO {
  /** Identificador único do cartão estudantil */
  readonly id: string
  /** Data de validade do cartão estudantil */
  readonly validity: Date
}
