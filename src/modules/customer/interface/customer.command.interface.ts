/**
 * Interface para criação de cliente.
 * Define os dados necessários para criar um novo cliente.
 */
export interface ICreateCustomerCommand {
  name: string
  email: string
  birthDate: Date
  cpf?: string
  studentCard?: IStudentCardCommand
}

/**
 * Interface para hidratação de cliente.
 * Define os dados completos para reconstruir um cliente.
 */
export interface IHydrateCustomerCommand {
  uid: string
  name: string
  email: string
  birthDate: Date
  cpf?: string
  studentCard?: IStudentCardCommand
  createdAt: Date
  updatedAt: Date
}

/**
 * Interface para dados de carteira estudantil.
 * Define os dados necessários para validar status de estudante.
 */
export interface IStudentCardCommand {
  institution: string
  registrationNumber: string
  expirationDate: Date
}
