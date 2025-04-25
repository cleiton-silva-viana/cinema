import { MovieTitle } from "./movie.title";
import { faker } from "@faker-js/faker/.";
import { codes } from "../../../../shared/value-object/multilingual-content";

describe("MovieTitle", () => {
  const validPtTitle = "Título do Filme com tamanho válido";
  const validEnTitle = "Valid movie title with proper length";
  const tooShortTitle = "Short";
  const tooLongTitle = "T".repeat(125);
  const titleWithValidCharacters = ".,!?-_+-";
  const titleWithInvalidCharacters = "Título com caracter inválido ¥";

  describe("create", () => {
    describe("deve retornar uma instância de MovieTitle com sucesso", () => {
      const successCases = [
        {
          contents: [
            { language: "pt", text: faker.string.alphanumeric(8) },
            { language: "en", text: validEnTitle },
          ],
          scenario: "com o tamanho mínimo exato",
        },
        {
          contents: [
            { language: "pt", text: validPtTitle },
            { language: "en", text: faker.string.alphanumeric(124) },
          ],
          scenario: "com o tamanho máximo exato",
        },
        {
          contents: [
            { language: "pt", text: titleWithValidCharacters },
            { language: "en", text: titleWithValidCharacters },
          ],
          scenario: "com caracteres especiais permitidos",
        },
      ];

      successCases.forEach(({ contents, scenario }) => {
        it(`deve aceitar um título ${scenario}`, () => {
          // Act
          const result = MovieTitle.create(contents);

          // Assert
          expect(result.invalid).toBe(false);
          expect(result.value).toBeInstanceOf(MovieTitle);
        });
      });
    });

    describe("deve retornar um erro quando o título é inválido", () => {
      const failureCases = [
        {
          contents: [
            { language: "pt", text: tooShortTitle },
            { language: "en", text: validEnTitle },
          ],
          scenario: "com menos que o tamanho mínimo",
          errorCode: codes.contentLengthOutOfRange,
        },
        {
          contents: [
            { language: "pt", text: validPtTitle },
            { language: "en", text: tooLongTitle },
          ],
          scenario: "com mais que o tamanho máximo",
          errorCode: codes.contentLengthOutOfRange,
        },
        {
          contents: [
            { language: "pt", text: titleWithInvalidCharacters },
            { language: "en", text: titleWithValidCharacters },
          ],
          scenario: "com caracteres inválidos no título",
          errorCode: codes.contentInvalidFormat,
        },
        {
          contents: null as any,
          scenario: "quando o conteúdo é nulo",
          errorCode: codes.contentNullOrEmpty,
        },
        {
          contents: undefined as any,
          scenario: "quando o conteúdo é indefinido",
          errorCode: codes.contentNullOrEmpty,
        },
        {
          contents: [],
          scenario: "quando o conteúdo está vazio",
          errorCode: codes.contentNullOrEmpty,
        },
      ];

      failureCases.forEach(({ contents, scenario, errorCode }) => {
        it(`deve rejeitar um título ${scenario}`, () => {
          // Act
          const result = MovieTitle.create(contents);

          // Assert
          expect(result.invalid).toBe(true);
          expect(result.failures[0].code).toBe(errorCode);
        });
      });
    });
  });
});
