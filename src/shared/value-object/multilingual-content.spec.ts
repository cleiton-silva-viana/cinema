import { MultilingualContent, SupportedLanguage } from './multilingual-content'
import { FailureCode } from '../failure/failure.codes.enum'
import { validateAndCollect } from '../validator/common.validators'
import { SimpleFailure } from '../failure/simple.failure.type'

class TestMultilingualContent extends MultilingualContent {}

describe('MultilingualContent', () => {
  const pt = {
    language: 'pt',
    text: 'olá',
  }
  const en = {
    language: 'en',
    text: 'Hello',
  }
  const fr = {
    language: 'fr',
    text: 'Bonjour',
  }

  const lang = {
    en: SupportedLanguage.EN,
    pt: SupportedLanguage.PT,
  }

  describe('static methods', () => {
    describe('create', () => {
      let failures: SimpleFailure[]

      beforeEach(() => {
        failures = []
      })

      describe('casos de sucesso', () => {
        const successCases = [
          {
            contents: [pt, en],
            scenario: 'com idiomas PT e EN',
          },
          {
            contents: [en, pt],
            scenario: 'com EN e PT em ordem inversa',
          },
          {
            contents: [
              { language: 'EN', text: en.text },
              { language: 'PT', text: pt.text },
            ],
            scenario: 'com strings maiúsculas',
          },
        ]
        successCases.forEach(({ contents, scenario }) => {
          it(`deve criar objeto MultilingualContent ${scenario}`, () => {
            // Act
            const result = validateAndCollect(TestMultilingualContent.create(contents), failures)

            // Assert
            expect(result).toBeDefined()
            expect(result.languages().length).toBe(2)
            expect(result.hasLanguage(SupportedLanguage.PT)).toBe(true)
            expect(result.hasLanguage(SupportedLanguage.EN)).toBe(true)
            expect(result.content(SupportedLanguage.PT)).toBe(pt.text)
            expect(result.content(SupportedLanguage.EN)).toBe(en.text)
          })
        })
      })

      describe('casos de falha', () => {
        const failureCases = [
          {
            contents: [pt],
            scenario: 'quando EN está faltando',
            errorCode: FailureCode.TEXT_LANGUAGE_REQUIRED,
          },
          {
            contents: [{ language: 'pt', text: 'Bonjour' }, pt, en],
            scenario: 'quando PT está duplicado',
            errorCode: FailureCode.TEXT_DUPLICATED_FOR_LANGUAGE,
          },
          {
            contents: [],
            scenario: 'quando o array está vazio',
            errorCode: FailureCode.MISSING_REQUIRED_DATA,
          },
          {
            contents: [fr],
            scenario: 'quando o idioma é inválido',
            errorCode: FailureCode.INVALID_ENUM_VALUE,
          },
        ]

        failureCases.forEach(({ contents, scenario, errorCode }) => {
          it(`deve falhar ao criar ${scenario}`, () => {
            // Act
            const result = validateAndCollect(TestMultilingualContent.create(contents), failures)

            // Assert
            expect(result).toBeNull()
            expect(failures[0].code).toBe(errorCode)
          })
        })
      })

      describe('constraints validations', () => {
        it('deve falhar quando o texto contém caracteres não permitidos', () => {
          // Arrange
          const invalidContent = [{ language: 'pt', text: 'Texto com caractere inválido ¥' }, en]

          // Act
          const result = validateAndCollect(TestMultilingualContent.create(invalidContent), failures)

          // Assert
          expect(result).toBeNull()
          expect(failures[0].code).toBe(FailureCode.STRING_INVALID_FORMAT)
        })

        it('deve falhar quando o texto não segue o formato esperado', () => {
          // Arrange
          const invalidContent = [
            { language: 'pt', text: 'Texto123$' }, // Assumindo que FORMAT_REGEX não permite números ou símbolos
            { language: 'en', text: 'Hello' },
          ]

          // Act
          const result = validateAndCollect(TestMultilingualContent.create(invalidContent), failures)

          // Assert
          expect(result).toBeNull()
          expect(failures[0].code).toBe(FailureCode.STRING_INVALID_FORMAT)
        })
      })
    })

    describe('hydrate', () => {
      it('deve criar um objeto MultilingualContent para um idioma', () => {
        // Act
        const result = TestMultilingualContent.hydrate('pT', en.text)

        // Assert
        expect(result.hasLanguage(lang.pt)).toBe(true)
        expect(result.content(lang.pt)).toBe(en.text)
        expect(result.languages().length).toBe(1)
      })

      it('deve falhar quando lang ou value são nulos ou indefinidos', () => {
        // Arrange
        const cases = [
          { lang: null as unknown as SupportedLanguage, value: 'Oi' },
          { lang: undefined, value: 'Oi' },
          { lang: SupportedLanguage.PT, value: null },
          { lang: SupportedLanguage.PT, value: undefined },
        ]

        // Act & Assert
        cases.forEach(({ lang, value }) => {
          expect(() => TestMultilingualContent.hydrate(lang as any, value as any)).toThrow()
        })
      })
    })
  })
})
