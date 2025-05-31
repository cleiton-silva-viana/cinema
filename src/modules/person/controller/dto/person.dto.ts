/**
 * DTO para criação de pessoa
 */
export type CreatePersonDTO = {
  readonly name: string
  readonly birthDate: Date
}

export type UpdatePersonDTO = Partial<CreatePersonDTO>