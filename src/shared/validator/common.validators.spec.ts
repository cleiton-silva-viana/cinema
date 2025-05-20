import {
  ensureNotNull,
  ensureStringNotEmpty,
  collectNullFields,
} from "./common.validators";
import { FailureCode } from "../failure/failure.codes.enum";
import { SimpleFailure } from "../failure/simple.failure.type";
import { faker } from "@faker-js/faker";

describe("Common Validators", () => {
  describe("ensureNotNull", () => {
    it("deve retornar true quando o valor não é nulo", () => {
      // Arrange
      const failures: SimpleFailure[] = [];

      // Act
      const result = ensureNotNull(
        faker.string.alphanumeric(),
        "campo",
        failures,
      );

      // Assert
      expect(result).toBe(true);
      expect(failures.length).toBe(0);
    });

    it("deve retornar false e adicionar falha quando o valor é null", () => {
      // Arrange
      const failures: SimpleFailure[] = [];
      const fieldName = "nullField";

      // Act
      const result = ensureNotNull(null, fieldName, failures);

      // Assert
      expect(result).toBe(false);
      expect(failures.length).toBe(1);
      expect(failures[0].code).toBe(FailureCode.MISSING_REQUIRED_DATA);
      expect(failures[0].details.field).toBe(fieldName);
    });

    it("deve retornar false e adicionar falha quando o valor é undefined", () => {
      // Arrange
      const failures: SimpleFailure[] = [];
      let undefinedValue;
      const fieldName = "undefinedField";

      // Act
      const result = ensureNotNull(undefinedValue, fieldName, failures);

      // Assert
      expect(result).toBe(false);
      expect(failures.length).toBe(1);
      expect(failures[0].code).toBe(FailureCode.MISSING_REQUIRED_DATA);
      expect(failures[0].details.field).toBe(fieldName);
    });

    it("deve usar o código de erro personalizado quando fornecido", () => {
      // Arrange
      const failures: SimpleFailure[] = [];
      const code = FailureCode.INVALID_VALUE_FORMAT;

      // Act
      const result = ensureNotNull(null, "campo", failures, code);

      // Assert
      expect(result).toBe(false);
      expect(failures.length).toBe(1);
      expect(failures[0].code).toBe(code);
    });
  });

  describe("ensureStringNotEmpty", () => {
    it("deve retornar true quando a string não está vazia", () => {
      // Arrange
      const failures: SimpleFailure[] = [];

      // Act
      const result = ensureStringNotEmpty("texto válido", "campo", failures);

      // Assert
      expect(result).toBe(true);
      expect(failures.length).toBe(0);
    });

    it("deve retornar false e adicionar falha quando a string é vazia", () => {
      // Arrange
      const failures: SimpleFailure[] = [];
      const fieldName = "emptyField";

      // Act
      const result = ensureStringNotEmpty("", fieldName, failures);

      // Assert
      expect(result).toBe(false);
      expect(failures.length).toBe(1);
      expect(failures[0].code).toBe(FailureCode.STRING_CANNOT_BE_EMPTY);
      expect(failures[0].details.field).toBe(fieldName);
    });

    it("deve retornar false e adicionar falha quando a string contém apenas espaços", () => {
      // Arrange
      const failures: SimpleFailure[] = [];
      const fieldName = "fieldWithWitheSpace";

      // Act
      const result = ensureStringNotEmpty("   ", fieldName, failures);

      // Assert
      expect(result).toBe(false);
      expect(failures.length).toBe(1);
      expect(failures[0].code).toBe(FailureCode.STRING_CANNOT_BE_EMPTY);
      expect(failures[0].details.field).toBe(fieldName);
    });

    it("deve retornar false e adicionar falha quando o valor é null", () => {
      // Arrange
      const failures: SimpleFailure[] = [];
      const fieldName = "nullField";

      // Act
      const result = ensureStringNotEmpty(null as any, fieldName, failures);

      // Assert
      expect(result).toBe(false);
      expect(failures.length).toBe(1);
      expect(failures[0].code).toBe(FailureCode.STRING_CANNOT_BE_EMPTY);
      expect(failures[0].details.field).toBe(fieldName);
    });

    it("deve usar o código de erro personalizado quando fornecido", () => {
      // Arrange
      const failures: SimpleFailure[] = [];
      const code = FailureCode.STRING_INVALID_FORMAT;

      // Act
      const result = ensureStringNotEmpty("", "campo", failures, code);

      // Assert
      expect(result).toBe(false);
      expect(failures.length).toBe(1);
      expect(failures[0].code).toBe(code);
    });
  });

  describe("collectNullFields", () => {
    it("deve retornar um array vazio quando não há campos nulos", () => {
      // Arrange
      const obj = {
        name: faker.person.firstName(),
        age: faker.date.birthdate(),
        email: faker.internet.email(),
      };

      // Act
      const resultado = collectNullFields(obj);

      // Assert
      expect(resultado).toEqual([]);
      expect(resultado.length).toBe(0);
    });

    it("deve retornar os nomes dos campos nulos", () => {
      // Arrange
      const obj = {
        name: faker.person.firstName(),
        age: null as any,
        email: undefined as any,
        address: faker.location.streetAddress(),
      };

      // Act
      const resultado = collectNullFields(obj);

      // Assert
      expect(resultado).toContain("age");
      expect(resultado).toContain("email");
      expect(resultado.length).toBe(2);
    });

    it("deve lidar com objetos vazios", () => {
      // Arrange
      const campos = {};

      // Act
      const resultado = collectNullFields(campos);

      // Assert
      expect(resultado).toEqual([]);
      expect(resultado.length).toBe(0);
    });

    it("deve lidar com valores falsy que não são null ou undefined", () => {
      // Arrange
      const campos = {
        zero: 0,
        falsy: false,
        emptyString: "",
        nil: null as any,
        indefinido: undefined as any,
      };

      // Act
      const resultado = collectNullFields(campos);

      // Assert
      expect(resultado).toContain("nil");
      expect(resultado).toContain("indefinido");
      expect(resultado).not.toContain("zero");
      expect(resultado).not.toContain("falsy");
      expect(resultado).not.toContain("emptyString");
      expect(resultado.length).toBe(2);
    });
  });
});
