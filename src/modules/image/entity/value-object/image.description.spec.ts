import { ImageDescription } from './image.description'
import { faker } from '@faker-js/faker/.'
import { FailureCode } from '@shared/failure/failure.codes.enum'
import { SimpleFailure } from '@shared/failure/simple.failure.type'
import { validateAndCollect } from '@shared/validator/common.validators'

describe('ImageDescription', () => {
  const validPtDescription = 'Descrição da Imagem com tamanho válido'
  const validEnDescription = 'Valid image description with proper length'
  const tooShortDescription = 'Short'
  const tooLongDescription = faker.string.alphanumeric(241)
  const descriptionWithValidCharacters = '.,!?-_-+/<>#@$%&*'
  const descriptionWithInvalidCharacters = 'Descrição com caracter inválido ¥'

  describe('ImageDescription', () => {
    describe('create', () => {
      let failures: SimpleFailure[]

      beforeEach(() => {
        failures = []
      })

      describe('deve retornar uma instância de ImageDescription com sucesso', () => {
        const successCases = [
          {
            contents: [
              { language: 'pt', text: faker.string.alphanumeric(8) },
              { language: 'en', text: validEnDescription },
            ],
            scenario: 'com o tamanho mínimo exato',
          },
          {
            contents: [
              { language: 'pt', text: validPtDescription },
              { language: 'en', text: faker.string.alphanumeric(240) },
            ],
            scenario: 'com o tamanho máximo exato',
          },
          {
            contents: [
              { language: 'pt', text: descriptionWithValidCharacters },
              { language: 'en', text: descriptionWithValidCharacters },
            ],
            scenario: 'com caracteres especiais permitidos',
          },
        ]

        successCases.forEach(({ contents, scenario }) => {
          it(`deve aceitar uma descrição ${scenario}`, () => {
            // Act
            const result = validateAndCollect(ImageDescription.create(contents), failures)

            // Assert
            expect(result).toBeDefined()
            expect(result).toBeInstanceOf(ImageDescription)
          })
        })
      })

      describe('deve retornar um erro quando a descrição é inválida', () => {
        const failureCases = [
          {
            contents: [
              { language: 'pt', text: tooShortDescription },
              { language: 'en', text: validEnDescription },
            ],
            scenario: 'com menos que o tamanho mínimo',
            errorCode: FailureCode.STRING_LENGTH_OUT_OF_RANGE,
          },
          {
            contents: [
              { language: 'pt', text: validPtDescription },
              { language: 'en', text: tooLongDescription },
            ],
            scenario: 'com mais que o tamanho máximo',
            errorCode: FailureCode.STRING_LENGTH_OUT_OF_RANGE,
          },
          {
            contents: [
              { language: 'pt', text: descriptionWithInvalidCharacters },
              { language: 'en', text: descriptionWithValidCharacters },
            ],
            scenario: 'com caracteres inválidos na descrição',
            errorCode: FailureCode.STRING_INVALID_FORMAT,
          },
        ]

        failureCases.forEach(({ contents, scenario, errorCode }) => {
          it(`deve rejeitar uma descrição ${scenario}`, () => {
            // Act
            const result = validateAndCollect(ImageDescription.create(contents), failures)

            // Assert
            expect(result).toBeNull()
            expect(failures[0].code).toBe(errorCode)
          })
        })
      })
    })
  })
})
