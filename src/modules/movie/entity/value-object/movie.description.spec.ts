import { MovieDescription } from "./movie.description";
import { faker } from "@faker-js/faker/.";
import { FailureCode } from "../../../../shared/failure/failure.codes.enum";

describe("MovieDescription", () => {
  const VALID_PT_DESCRIPTION = faker.lorem.paragraph();
  const VALID_EN_DESCRIPTION = faker.lorem.paragraph();
  const TOO_SHORT_DESCRIPTION = faker.string.alphanumeric(47);
  const TOO_LONG_DESCRIPTION = faker.string.alphanumeric(1025);
  const DESCRIPTION_WITH_VALID_SPECIAL_CHARS =
    faker.lorem.paragraph() + ".,!?-_+-";
  const DESCRIPTION_WITH_INVALID_SPECIAL_CHARS = faker.lorem.paragraph() + "¥";

  describe("create", () => {
    describe("deve retornar uma instância de MovieDescription com sucesso", () => {
      const successCases = [
        {
          contents: [
            { language: "pt", text: faker.string.alphanumeric(48) },
            { language: "en", text: VALID_EN_DESCRIPTION },
          ],
          scenario: "com o tamanho mínimo exato",
        },
        {
          contents: [
            { language: "pt", text: VALID_PT_DESCRIPTION },
            { language: "en", text: faker.string.alphanumeric(1024) },
          ],
          scenario: "com o tamanho máximo exato",
        },
        {
          contents: [
            { language: "pt", text: DESCRIPTION_WITH_VALID_SPECIAL_CHARS },
            { language: "en", text: DESCRIPTION_WITH_VALID_SPECIAL_CHARS },
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
            { language: "pt", text: TOO_SHORT_DESCRIPTION },
            { language: "en", text: VALID_EN_DESCRIPTION },
          ],
          scenario: "com menos que o tamanho mínimo",
          errorCode: FailureCode.INVALID_FIELD_SIZE,
        },
        {
          contents: [
            { language: "pt", text: VALID_PT_DESCRIPTION },
            { language: "en", text: TOO_LONG_DESCRIPTION },
          ],
          scenario: "com mais que o tamanho máximo",
          errorCode: FailureCode.INVALID_FIELD_SIZE,
        },
        {
          contents: [
            { language: "pt", text: DESCRIPTION_WITH_INVALID_SPECIAL_CHARS },
            { language: "en", text: DESCRIPTION_WITH_VALID_SPECIAL_CHARS },
          ],
          scenario: "com caracteres inválidos na descrição",
          errorCode: FailureCode.CONTENT_INVALID_FORMAT,
        },
        {
          contents: null as any,
          scenario: "quando o conteúdo é nulo",
          errorCode: FailureCode.NULL_ARGUMENT,
        },
        {
          contents: undefined as any,
          scenario: "quando o conteúdo é indefinido",
          errorCode: FailureCode.NULL_ARGUMENT,
        },
        {
          contents: [],
          scenario: "quando o conteúdo está vazio",
          errorCode: FailureCode.EMPTY_FIELD,
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
