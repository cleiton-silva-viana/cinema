import { faker } from '@faker-js/faker/.'
import { ImageTitle } from './image.title'
import { FailureCode } from '@shared/failure/failure.codes.enum'
import { SupportedLanguageEnum } from '@shared/value-object/language-content/supported.language.enum'

describe('ImageTitle', () => {
  const validPtTitle = 'Título da Imagem com tamanho válido'
  const validEnTitle = 'Valid image title with proper length'
  const tooShortTitle = 'Short'
  const tooLongTitle = 'T'.repeat(125)
  const titleWithValidCharacters = '.,!?-_-+/'
  const titleWithInvalidCharacters = 'Título com caracter inválido ¥'

  describe('ImageTitle', () => {
    describe('create', () => {
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
            const result = ImageTitle.create(contents)

            // Assert
            expect(result).toBeValidResultMatching<ImageTitle>((i) => {
              expect(i).toBeInstanceOf(ImageTitle)
              expect(i.content(SupportedLanguageEnum.PT)).toBe(contents[0].text)
              expect(i.content(SupportedLanguageEnum.EN)).toBe(contents[1].text)
            })
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
            code: FailureCode.STRING_LENGTH_OUT_OF_RANGE,
          },
          {
            contents: [
              { language: 'pt', text: validPtTitle },
              { language: 'en', text: tooLongTitle },
            ],
            scenario: 'com mais que o tamanho máximo',
            code: FailureCode.STRING_LENGTH_OUT_OF_RANGE,
          },
          {
            contents: [
              { language: 'pt', text: titleWithInvalidCharacters },
              { language: 'en', text: titleWithValidCharacters },
            ],
            scenario: 'com caracteres inválidos no título',
            code: FailureCode.STRING_WITH_INVALID_FORMAT,
          },
        ]

        failureCases.forEach(({ contents, scenario, code }) => {
          it(`deve rejeitar um título ${scenario}`, () => {
            // Act
            const result = ImageTitle.create(contents)

            // Assert
            expect(result).toBeInvalidResultWithSingleFailure(code)
          })
        })
      })
    })
  })
})
