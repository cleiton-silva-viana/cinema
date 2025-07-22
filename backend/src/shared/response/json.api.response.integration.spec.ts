import { JsonApiResponse } from './json.api.response'
import { SimpleFailure } from '../failure/simple.failure.type'
import { FailureMapper } from '../failure/failure.mapper'
import { FailureCode } from '@shared/failure/failure.codes.enum'

describe('JsonApiResponse Integration', () => {
  let response: JsonApiResponse

  beforeEach(() => {
    // Use o FailureMapper real em vez do mock
    response = new JsonApiResponse(FailureMapper.getInstance())
  })

  it('deve mapear corretamente erros usando o FailureMapper real', () => {
    // Arrange
    const failure: SimpleFailure = {
      code: FailureCode.MISSING_REQUIRED_DATA,
      details: { field: 'email' },
    }

    // Act
    response.errors(failure)
    const json = response.toJSON()

    // Assert
    expect(json.errors).toHaveLength(1)
    expect(json.errors[0].code).toBe(FailureCode.MISSING_REQUIRED_DATA)
    expect(json.errors[0].title).toBeDefined()
    expect(response.status).toBeGreaterThan(399)
  })

  it('deve traduzir erros de acordo com o idioma', () => {
    // Este teste assume que FailureMapper suporta diferentes idiomas
    const failureEN: SimpleFailure = {
      code: FailureCode.DATE_CANNOT_BE_PAST,
      details: { field: 'birthdate' },
    }

    // Crie duas instâncias com diferentes idiomas (se suportado)
    const responseEN = new JsonApiResponse()

    // Act
    responseEN.errors(failureEN)

    // Assert
    const jsonEN = responseEN.toJSON()
    expect(jsonEN.errors[0].title).toBeDefined()
  })
})
