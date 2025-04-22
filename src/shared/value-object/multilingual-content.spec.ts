import {
  codes,
  LanguageContent,
  MultilingualContent, MultilingualInput,
  SupportedLanguage
} from "./multilingual-content";
import { SimpleFailure } from "../failure/simple.failure.type";

class TestMultilingualContent extends MultilingualContent {
  protected validate(
    contents: LanguageContent[],
    failures: SimpleFailure[],
  ): void {
    return;
  }
}

describe("MultilingualContent", () => {
  const pt = {
    language: "pt",
    text: "olá",
  };
  const en = {
    language: "en",
    text: "Hello",
  };
  const fr = {
    language: "fr",
    text: "Bonjour",
  };

  const lang = {
    en: SupportedLanguage.EN,
    pt: SupportedLanguage.PT
  }

  describe("static methods", () => {
    describe("create", () => {
      describe("casos de sucesso", () => {
        const successCases = [
          {
            contents: [pt, en],
            scenario: "com idiomas PT e EN",
          },
          {
            contents: [en, pt],
            scenario: "com EN e PT em ordem inversa",
          },
          {
            contents: [
              { language: "EN", text: en.text },
              { language: "PT", text: pt.text },
            ],
            scenario: "com strings maiúsculas",
          },
        ];
        successCases.forEach(({ contents, scenario }) => {
          it(`deve criar objeto MultilingualContent ${scenario}`, () => {
            // Act
            const result = TestMultilingualContent.create(contents);

            // Assert
            expect(result.invalid).toBe(false);
            expect(result.value.languages().length).toBe(2)
            expect(result.value.hasLanguage(SupportedLanguage.PT)).toBe(true);
            expect(result.value.hasLanguage(SupportedLanguage.EN)).toBe(true);
            expect(result.value.content(SupportedLanguage.PT)).toBe(pt.text);
            expect(result.value.content(SupportedLanguage.EN)).toBe(en.text);
          });
        });
      });

      describe("casos de falha", () => {
        const failureCases = [
          {
            contents: [pt],
            scenario: "quando EN está faltando",
            errorCode: codes.contentMissingRequiredLanguage,
          },
          {
            contents: [{ language: "pt", text: "Bonjour" }, pt, en],
            scenario: "quando PT está duplicado",
            errorCode: codes.contentDuplicateLanguage,
          },
          {
            contents: [],
            scenario: "quando o array está vazio",
            errorCode: codes.contentNullOrEmpty,
          },
          {
            contents: [fr],
            scenario: "quando o idioma é inválido",
            errorCode: codes.contentInvalidLanguage,
          },
        ];

        failureCases.forEach(({ contents, scenario, errorCode }) => {
          it(`deve falhar ao criar ${scenario}`, () => {
            // Act
            const result = TestMultilingualContent.create(contents);

            // Assert
            expect(result.invalid).toBe(true);
            expect(result.failures[0].code).toBe(errorCode);
          });
        });
      });
    });

    describe("hydrate", () => {
      it("deve criar um objeto MultilingualContent para um idioma", () => {
        // Act
        const result = TestMultilingualContent.hydrate(
          lang.en,
          en.text,
        );

        // Assert
        expect(result.hasLanguage(lang.en)).toBe(true);
        expect(result.content(lang.en)).toBe(en.text);
        expect(result.languages().length).toBe(1)
      });

      it("deve falhar quando lang ou value são nulos ou indefinidos", () => {
        // Arrange
        const cases = [
          { lang: null as SupportedLanguage, value: "Oi" },
          { lang: undefined, value: "Oi" },
          { lang: SupportedLanguage.PT, value: null },
          { lang: SupportedLanguage.PT, value: undefined },
        ];

        // Act & Assert
        cases.forEach(({ lang, value }) => {
          expect(() =>
            TestMultilingualContent.hydrate(lang as any, value as any),
          ).toThrow();
        });
      });
    });
  });
});
