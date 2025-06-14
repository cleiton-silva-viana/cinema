/**
 * DTO para atualização de pessoa
 * Todos os campos são opcionais, permitindo atualizações parciais
 */
export interface IUpdatePersonDTO {
  /** Nome completo da pessoa */
  readonly name?: string
  /** Data de nascimento da pessoa */
  readonly birthDate?: Date
}
