/**
 * DTO para criação de pessoa
 * Contém os dados necessários para criar uma nova pessoa no sistema
 */
export interface ICreatePersonDTO {
  /** Nome completo da pessoa */
  readonly name: string
  /** Data de nascimento da pessoa */
  readonly birthDate: Date
}
