import { faker } from '@faker-js/faker/.'
import { MovieDescription } from './movie.description'
import { FailureCode } from '@shared/failure/failure.codes.enum'
import { validateAndCollect } from '@shared/validator/common.validators'
import { SimpleFailure } from '@shared/failure/simple.failure.type'

describe('MovieDescription', () => {
  const VALID_PT_DESCRIPTION = faker.lorem.paragraph()
  const VALID_EN_DESCRIPTION = faker.lorem.paragraph()
  const TOO_SHORT_DESCRIPTION = faker.string.alphanumeric(47)
  const TOO_LONG_DESCRIPTION = faker.string.alphanumeric(1025)
  const DESCRIPTION_WITH_VALID_SPECIAL_CHARS = faker.lorem.paragraph() + '.,!?-_+-'
  const DESCRIPTION_WITH_INVALID_SPECIAL_CHARS = faker.lorem.paragraph() + '¥'

  describe('create', () => {
    let failures: SimpleFailure[]

    beforeEach(() => (failures = []))

    describe('deve retornar uma instância de MovieDescription com sucesso', () => {
      const successCases = [
        {
          contents: [
            { language: 'pt', text: faker.string.alphanumeric(48) },
            { language: 'en', text: VALID_EN_DESCRIPTION },
          ],
          scenario: 'com o tamanho mínimo exato',
        },
        {
          contents: [
            { language: 'pt', text: VALID_PT_DESCRIPTION },
            { language: 'en', text: faker.string.alphanumeric(1024) },
          ],
          scenario: 'com o tamanho máximo exato',
        },
        {
          contents: [
            { language: 'pt', text: DESCRIPTION_WITH_VALID_SPECIAL_CHARS },
            { language: 'en', text: DESCRIPTION_WITH_VALID_SPECIAL_CHARS },
          ],
          scenario: 'com caracteres especiais permitidos',
        },
      ]

      successCases.forEach(({ contents, scenario }) => {
        it(`deve aceitar uma descrição ${scenario}`, () => {
          // Act
          const result = validateAndCollect(MovieDescription.create(contents), failures)

          // Assert
          expect(result).toBeDefined()
        })
      })
    })

    describe('deve retornar um erro quando a descrição é inválida', () => {
      const failureCases = [
        {
          contents: [
            { language: 'pt', text: TOO_SHORT_DESCRIPTION },
            { language: 'en', text: VALID_EN_DESCRIPTION },
          ],
          scenario: 'com menos que o tamanho mínimo',
          errorCode: FailureCode.STRING_LENGTH_OUT_OF_RANGE,
        },
        {
          contents: [
            { language: 'pt', text: VALID_PT_DESCRIPTION },
            { language: 'en', text: TOO_LONG_DESCRIPTION },
          ],
          scenario: 'com mais que o tamanho máximo',
          errorCode: FailureCode.STRING_LENGTH_OUT_OF_RANGE,
        },
        {
          contents: [
            { language: 'pt', text: DESCRIPTION_WITH_INVALID_SPECIAL_CHARS },
            { language: 'en', text: DESCRIPTION_WITH_VALID_SPECIAL_CHARS },
          ],
          scenario: 'com caracteres inválidos na descrição',
          errorCode: FailureCode.STRING_INVALID_FORMAT,
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
        it(`deve rejeitar uma descrição ${scenario}`, () => {
          // Act
          const result = validateAndCollect(MovieDescription.create(contents), failures)

          // Assert
          expect(result).toBeNull()
          expect(failures[0].code).toBe(errorCode)
        })
      })
    })
  })
})
