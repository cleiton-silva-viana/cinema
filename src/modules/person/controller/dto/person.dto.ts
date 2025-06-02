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
