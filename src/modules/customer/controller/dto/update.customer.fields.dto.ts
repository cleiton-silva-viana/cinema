export interface IUpdateCustomerFieldsDTO {
  readonly name?: string
  readonly birthDate?: Date
  readonly email?: string
  readonly cpf?: string
  readonly studentCard?: { id: string; validity: Date }
}
