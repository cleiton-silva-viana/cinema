import { Name } from "./name";
import { TechnicalError } from "../error/technical.error";
import { faker } from "@faker-js/faker";
import { FailureCode } from "../failure/failure.codes.enum";

describe("Name", () => {
  describe("create", () => {
    describe("deve criar um nome válido", () => {
      const successCases = [
        { name: "john", scenario: "com comprimento mínimo" },
        { name: "mark", scenario: "com outro nome válido" },
        { name: "Sérgio", scenario: "com nome brasileiro" },
        {
          name: "Mary Jane Watson Parker",
          scenario: "com múltiplos nomes compostos",
        },
        {
          name: faker.string.alpha(50),
          scenario: "com comprimento máximo",
        },
      ];

      successCases.forEach(({ name, scenario }) => {
        it(`objeto Name ${scenario}`, () => {
          // Act
          const result = Name.create(name);

          // Assert
          expect(result.value.value).toBe(name);
        });
      });
    });

    describe("deve falhar ao criar um nome inválido", () => {
      const failureCases = [
        {
          name: null as unknown as string,
          scenario: "quando o nome é nulo",
          errorCodeExpected: FailureCode.MISSING_REQUIRED_DATA,
        },
        {
          name: undefined as unknown as string,
          scenario: "quando o nome é indefinido",
          errorCodeExpected: FailureCode.MISSING_REQUIRED_DATA,
        },
        {
          name: "",
          scenario: "quando o nome está vazio",
          errorCodeExpected: FailureCode.STRING_CANNOT_BE_EMPTY,
        },
        {
          name: "ab",
          scenario: "quando o nome é muito curto",
          errorCodeExpected: FailureCode.STRING_LENGTH_OUT_OF_RANGE,
        },
        {
          name: faker.string.alphanumeric(51),
          scenario: "quando o nome é muito longo",
          errorCodeExpected: FailureCode.STRING_LENGTH_OUT_OF_RANGE,
        },
        {
          name: "john123",
          scenario: "quando o nome contém caracteres inválidos",
          errorCodeExpected: FailureCode.INVALID_NAME_FORMAT,
        },
        {
          name: "John #$$",
          scenario: "quando o nome contém caracteres especiais",
          errorCodeExpected: FailureCode.INVALID_NAME_FORMAT,
        },
      ];

      failureCases.forEach(({ name, scenario, errorCodeExpected }) => {
        it(`objeto Name ${scenario}`, () => {
          // Act
          const result = Name.create(name);
          const failures = result.failures;

          // Assert
          expect(failures.length).toBe(1);
          expect(failures[0].code).toBe(errorCodeExpected);
        });
      });
    });
  });

  describe("hydrate", () => {
    it("deve criar um objeto Name sem validação", () => {
      // Arrange
      const nameString = faker.person.firstName();

      // Act
      const result = Name.hydrate(nameString);

      // Assert
      expect(result).toBeInstanceOf(Name);
      expect(result.value).toBe(nameString);
    });

    it("deve lançar um erro quando o nome é nulo ou indefinido", () => {
      // Arrange
      const values: any[] = [null, undefined];

      // Act
      values.forEach((value) => {
        expect(() => Name.hydrate(value as any)).toThrow(TechnicalError);
      });
    });
  });

  describe("equal", () => {
    it("deve retornar verdadeiro quando os nomes são iguais", () => {
      // Arrange
      const nameString = faker.person.firstName();
      const result1 = Name.create(nameString);
      const result2 = Name.create(nameString);

      // Assert
      expect(result1.value.equal(result2.value)).toBe(true);
    });

    it("deve retornar falso quando os nomes são diferentes", () => {
      // Arrange
      const result1 = Name.create(faker.person.firstName());
      const result2 = Name.create(faker.person.firstName());

      // Assert
      expect(result1.value.equal(result2.value)).toBe(false);
    });

    it("deve retornar falso quando comparado com um objeto que não é Name", () => {
      // Arrange
      const result = Name.create("john");
      const notNameObject = { name: "john" };

      // Assert
      expect(result.value.equal(notNameObject as any)).toBe(false);
    });
  });
});
