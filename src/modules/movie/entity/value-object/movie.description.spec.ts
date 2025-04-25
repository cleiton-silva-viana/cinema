import { MovieDescription } from './movie.description';
import { faker } from "@faker-js/faker/.";
import { codes } from "../../../../shared/value-object/multilingual-content";

describe("MovieDescription", () => {
  const validPtDescription = faker.lorem.paragraph();
  const validEnDescription = faker.lorem.paragraph();
  const tooShortDescription = faker.string.alphanumeric(47);
  const tooLongDescription = faker.string.alphanumeric(1025);
  const descriptionWithValidCharacters = faker.lorem.paragraph() + ".,!?-_+-";
  const descriptionWithInvalidCharacters = faker.lorem.paragraph() + "¥";

  describe("create", () => {
    describe("deve retornar uma instância de MovieDescription com sucesso", () => {
      const successCases = [
        {
          contents: [
            { language: "pt", text: faker.string.alphanumeric(48) },
            { language: "en", text: validEnDescription },
          ],
          scenario: "com o tamanho mínimo exato",
        },
        {
          contents: [
            { language: "pt", text: validPtDescription },
            { language: "en", text: faker.string.alphanumeric(1024) },
          ],
          scenario: "com o tamanho máximo exato",
        },
        {
          contents: [
            { language: "pt", text: descriptionWithValidCharacters },
            { language: "en", text: descriptionWithValidCharacters },
          ],
          scenario: "com caracteres especiais permitidos",
        },
      ];

      successCases.forEach(({ contents, scenario }) => {
        it(`deve aceitar uma descrição ${scenario}`, () => {
          // Act
          const result = MovieDescription.create(contents);

          // Assert
          expect(result.invalid).toBe(false);
          expect(result.value).toBeInstanceOf(MovieDescription);
        });
      });
    });

    describe("deve retornar um erro quando a descrição é inválida", () => {
      const failureCases = [
        {
          contents: [
            { language: "pt", text: tooShortDescription },
            { language: "en", text: validEnDescription },
          ],
          scenario: "com menos que o tamanho mínimo",
          errorCode: codes.contentLengthOutOfRange,
        },
        {
          contents: [
            { language: "pt", text: validPtDescription },
            { language: "en", text: tooLongDescription },
          ],
          scenario: "com mais que o tamanho máximo",
          errorCode: codes.contentLengthOutOfRange,
        },
        {
          contents: [
            { language: "pt", text: descriptionWithInvalidCharacters },
            { language: "en", text: descriptionWithValidCharacters },
          ],
          scenario: "com caracteres inválidos na descrição",
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
        it(`deve rejeitar uma descrição ${scenario}`, () => {
          // Act
          const result = MovieDescription.create(contents);

          // Assert
          expect(result.invalid).toBe(true);
          expect(result.failures[0].code).toBe(errorCode);
        });
      });
    });
  });
});
