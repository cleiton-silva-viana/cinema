/**
 * DTO para criação de cliente
 * Contém os dados necessários para criar um novo cliente no sistema
 */
export interface ICreateCustomerDTO {
  /** Nome completo do cliente */
  readonly name: string
  /** Endereço de email único do cliente */
  readonly email: string
  /** Data de nascimento do cliente */
  readonly birthDate: Date
  /** Senha para autenticação do cliente */
  readonly password: string
}
