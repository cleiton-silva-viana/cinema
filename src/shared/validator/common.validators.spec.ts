import { ensureNotNull, collectNullFields } from "./common.validators";
import { FailureCode } from "../failure/failure.codes.enum";
import { faker } from "@faker-js/faker";

describe("Common Validators", () => {
  describe("ensureNotNull", () => {
    it("deve retornar um array vazio quando não há campos nulos", () => {
      // Arrange
      const validField = faker.string.alphanumeric();

      // Act
      const failures = ensureNotNull({
        campo: validField,
      });

      // Assert
      expect(failures).toBeInstanceOf(Array);
      expect(failures.length).toBe(0);
    });

    it("deve adicionar falha quando o valor é null", () => {
      // Arrange
      const fieldName = "nullField";

      // Act
      const failures = ensureNotNull({
        [fieldName]: null,
      });

      // Assert
      expect(failures.length).toBe(1);
      expect(failures[0].code).toBe(FailureCode.MISSING_REQUIRED_DATA);
      expect(failures[0].details.field).toBe(fieldName);
    });

    it("deve adicionar falha quando o valor é undefined", () => {
      // Arrange
      let undefinedValue;
      const fieldName = "undefinedField";

      // Act
      const failures = ensureNotNull({
        [fieldName]: undefinedValue,
      });

      // Assert
      expect(failures.length).toBe(1);
      expect(failures[0].code).toBe(FailureCode.MISSING_REQUIRED_DATA);
      expect(failures[0].details.field).toBe(fieldName);
    });

    it("deve validar múltiplos campos corretamente", () => {
      // Arrange
      const validField = faker.string.alphanumeric();

      // Act
      const failures = ensureNotNull({
        validField: validField,
        nullField: null,
        undefinedField: undefined,
      });

      // Assert
      expect(failures.length).toBe(2);

      const fieldNames = failures.map((failure) => failure.details.field);
      expect(fieldNames).toContain("nullField");
      expect(fieldNames).toContain("undefinedField");
      expect(fieldNames).not.toContain("validField");

      failures.forEach((failure) => {
        expect(failure.code).toBe(FailureCode.MISSING_REQUIRED_DATA);
      });
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
