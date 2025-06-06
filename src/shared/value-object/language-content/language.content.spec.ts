import { LanguageContent } from '@shared/value-object/language-content/language.content'
import { SupportedLanguageEnum } from '@shared/value-object/language-content/supported.language.enum'
import { FailureCode } from '@shared/failure/failure.codes.enum'

class TestMultilingualContent extends LanguageContent {}

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
    en: SupportedLanguageEnum.EN,
    pt: SupportedLanguageEnum.PT,
  }

  describe('static methods', () => {
    describe('create', () => {
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
            const result = TestMultilingualContent.create(contents)

            // Assert
            expect(result).toBeValidResultMatching<LanguageContent>((l) => {
              expect(l.languages()).toHaveLength(2)
              expect(l.hasLanguage(SupportedLanguageEnum.PT)).toBe(true)
              expect(l.hasLanguage(SupportedLanguageEnum.EN)).toBe(true)
              expect(l.content(SupportedLanguageEnum.PT)).toBe(pt.text)
              expect(l.content(SupportedLanguageEnum.EN)).toBe(en.text)
            })
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
            const result = TestMultilingualContent.create(contents)

            // Assert
            expect(result).toBeInvalidResultWithSingleFailure(errorCode)
          })
        })
      })

      describe('constraints validations', () => {
        it('deve falhar quando o texto contém caracteres não permitidos', () => {
          // Arrange
          const invalidContent = [{ language: 'pt', text: 'Texto com caractere inválido ¥' }, en]

          // Act
          const result = TestMultilingualContent.create(invalidContent)

          // Assert
          expect(result).toBeInvalidResultWithSingleFailure(FailureCode.STRING_WITH_INVALID_FORMAT)
        })

        it('deve falhar quando o texto não segue o formato esperado', () => {
          // Arrange
          const invalidContent = [
            { language: 'pt', text: 'Texto123$' }, // Assumindo que FORMAT_REGEX não permite números ou símbolos
            { language: 'en', text: 'Hello' },
          ]

          // Act
          const result = TestMultilingualContent.create(invalidContent)

          // Assert
          expect(result).toBeInvalidResultWithSingleFailure(FailureCode.STRING_WITH_INVALID_FORMAT)
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
        expect(result.languages()).toHaveLength(1)
      })

      it('deve falhar quando lang ou value são nulos ou indefinidos', () => {
        // Arrange
        const cases = [
          { lang: null as unknown as SupportedLanguageEnum, value: 'Oi' },
          { lang: undefined, value: 'Oi' },
          { lang: SupportedLanguageEnum.PT, value: null },
          { lang: SupportedLanguageEnum.PT, value: undefined },
        ]

        // Act & Assert
        cases.forEach(({ lang, value }) => {
          expect(() => TestMultilingualContent.hydrate(lang as any, value as any)).toThrow()
        })
      })
    })
  })
})
