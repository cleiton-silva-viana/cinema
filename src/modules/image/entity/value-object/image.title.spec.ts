import { faker } from '@faker-js/faker/.'
import { ImageTitle } from './image.title'
import { FailureCode } from '@shared/failure/failure.codes.enum'
import { SimpleFailure } from '@shared/failure/simple.failure.type'
import { validateAndCollect } from '@shared/validator/common.validators'

describe('ImageTitle', () => {
  const validPtTitle = 'Título da Imagem com tamanho válido'
  const validEnTitle = 'Valid image title with proper length'
  const tooShortTitle = 'Short'
  const tooLongTitle = 'T'.repeat(125)
  const titleWithValidCharacters = '.,!?-_-+/'
  const titleWithInvalidCharacters = 'Título com caracter inválido ¥'

  describe('ImageTitle', () => {
    describe('create', () => {
      let failures: SimpleFailure[]

      beforeEach(() => {
        failures = []
      })

      describe('deve retornar uma instância de ImageTitle com sucesso', () => {
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
            const result = validateAndCollect(ImageTitle.create(contents), failures)

            // Assert
            expect(result).toBeDefined()
            expect(result).toBeInstanceOf(ImageTitle)
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
            errorCode: FailureCode.STRING_INVALID_FORMAT,
          },
        ]

        failureCases.forEach(({ contents, scenario, errorCode }) => {
          it(`deve rejeitar um título ${scenario}`, () => {
            // Act
            const result = validateAndCollect(ImageTitle.create(contents), failures)

            // Assert
            expect(result).toBeNull()
            expect(failures[0].code).toBe(errorCode)
          })
        })
      })
    })
  })
})
