import { MovieTitle } from './movie.title'
import { faker } from '@faker-js/faker/.'
import { SimpleFailure } from '@shared/failure/simple.failure.type'
import { FailureCode } from '@shared/failure/failure.codes.enum'

describe('MovieTitle', () => {
  const validPtTitle = 'Título do Filme com tamanho válido'
  const validEnTitle = 'Valid movie title with proper length'
  const tooShortTitle = 'Short'
  const tooLongTitle = 'T'.repeat(125)
  const titleWithValidCharacters = '.,!?-_+-'
  const titleWithInvalidCharacters = 'Título com caracter inválido ¥'

  describe('create', () => {
    let failures: SimpleFailure[]

    beforeEach(() => (failures = []))

    describe('deve retornar uma instância de MovieTitle com sucesso', () => {
      const successCases = [
        {
          contents: [
            { language: 'pt', text: faker.string.alphanumeric(8) },
            { language: 'en', text: validEnTitle },
          ],
          scenario: 'com o tamanho mínimo exato',
        },
        {
          contents: [
            { language: 'pt', text: validPtTitle },
            { language: 'en', text: faker.string.alphanumeric(124) },
          ],
          scenario: 'com o tamanho máximo exato',
        },
        {
          contents: [
            { language: 'pt', text: titleWithValidCharacters },
            { language: 'en', text: titleWithValidCharacters },
          ],
          scenario: 'com caracteres especiais permitidos',
        },
      ]

      successCases.forEach(({ contents, scenario }) => {
        it(`deve aceitar um título ${scenario}`, () => {
          // Act
          const result = MovieTitle.create(contents)

          // Assert
          expect(result).toBeValidResult()
        })
      })
    })

    describe('deve retornar um erro quando o título é inválido', () => {
      const failureCases = [
        {
          contents: [
            { language: 'pt', text: tooShortTitle },
            { language: 'en', text: validEnTitle },
          ],
          scenario: 'com menos que o tamanho mínimo',
          errorCode: FailureCode.STRING_LENGTH_OUT_OF_RANGE,
        },
        {
          contents: [
            { language: 'pt', text: validPtTitle },
            { language: 'en', text: tooLongTitle },
          ],
          scenario: 'com mais que o tamanho máximo',
          errorCode: FailureCode.STRING_LENGTH_OUT_OF_RANGE,
        },
        {
          contents: [
            { language: 'pt', text: titleWithInvalidCharacters },
            { language: 'en', text: titleWithValidCharacters },
          ],
          scenario: 'com caracteres inválidos no título',
          errorCode: FailureCode.STRING_WITH_INVALID_FORMAT,
        },
        {
          contents: null as any,
          scenario: 'quando o conteúdo é nulo',
          errorCode: FailureCode.MISSING_REQUIRED_DATA,
        },
        {
          contents: undefined as any,
          scenario: 'quando o conteúdo é indefinido',
          errorCode: FailureCode.MISSING_REQUIRED_DATA,
        },
        {
          contents: [],
          scenario: 'quando o conteúdo está vazio',
          errorCode: FailureCode.MISSING_REQUIRED_DATA,
        },
      ]

      failureCases.forEach(({ contents, scenario, errorCode }) => {
        it(`deve rejeitar um título ${scenario}`, () => {
          // Act
          const result = MovieTitle.create(contents)

          // Assert
          expect(result).toBeInvalidResultWithSingleFailure(errorCode)
        })
      })
    })
  })
})
