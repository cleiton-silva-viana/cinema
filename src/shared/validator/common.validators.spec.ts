import {
  ensureNotNull,
  collectNullFields,
  validateAndCollect,
  parseToEnum,
  Mode,
} from "./common.validators";
import { FailureCode } from "../failure/failure.codes.enum";
import { faker } from "@faker-js/faker";
import { failure, Result, success } from "../result/result";
import { SimpleFailure } from "../failure/simple.failure.type";

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

  describe("validateAndCollect", () => {
    const failure1 = {
      code: FailureCode.MISSING_REQUIRED_DATA,
      details: {
        field: "Erro 1",
      },
    };
    const failure2 = {
      code: FailureCode.MISSING_REQUIRED_DATA,
      details: {
        field: "Erro 2",
      },
    };

    it("deve retornar o valor e não adicionar falhas quando o resultado é um sucesso", () => {
      // Arrange
      const successValue = { id: 1, name: "Test Item" };
      const result: Result<typeof successValue> = success(successValue);
      const failures: SimpleFailure[] = [];

      // Act
      const collectedValue = validateAndCollect(result, failures);

      // Assert
      expect(collectedValue).toBe(successValue);
      expect(failures.length).toBe(0);
    });

    it("deve retornar null e adicionar a falha ao array quando o resultado é uma falha com um único erro", () => {
      // Arrange
      const result: Result<never> = failure(failure1);
      const failures: SimpleFailure[] = [];

      // Act
      const collectedValue = validateAndCollect(result, failures);

      // Assert
      expect(collectedValue).toBeNull();
      expect(failures.length).toBe(1);
      expect(failures).toContainEqual(failure1);
    });

    it("deve retornar null e adicionar as falhas ao array quando o resultado é uma falha com múltiplos erros", () => {
      // Arrange
      const errors: SimpleFailure[] = [failure2, failure1];
      const result: Result<never> = failure(errors);
      const failures: SimpleFailure[] = [];

      // Act
      const collectedValue = validateAndCollect(result, failures);

      // Assert
      expect(collectedValue).toBeNull();
      expect(failures.length).toBe(2);
      expect(failures).toEqual(expect.arrayContaining(errors));
    });

    it("deve anexar falhas a um array de falhas pré-existente quando o resultado é uma falha", () => {
      // Arrange
      const preExistingError = failure1;
      const newError = failure2;
      const result: Result<never> = failure(newError);
      const failures: SimpleFailure[] = [preExistingError];

      // Act
      const collectedValue = validateAndCollect(result, failures);

      // Assert
      expect(collectedValue).toBeNull();
      expect(failures.length).toBe(2);
      expect(failures).toContainEqual(preExistingError);
      expect(failures).toContainEqual(newError);
    });

    it("deve retornar o valor e não modificar um array de falhas pré-existente quando o resultado é um sucesso", () => {
      // Arrange
      const successValue = "dados de sucesso";
      const result: Result<string> = success(successValue);
      const preExistingError = failure2;
      const failures: SimpleFailure[] = [preExistingError];

      // Act
      const collectedValue = validateAndCollect(result, failures);

      // Assert
      expect(collectedValue).toBe(successValue);
      expect(failures.length).toBe(1);
      expect(failures).toContainEqual(preExistingError);
    });
  });

  describe("Common Validators", () => {
    let failures: SimpleFailure[];

    beforeEach(() => {
      failures = [];
    });

    describe("parseToEnum", () => {
      enum StringEnum {
        ValueA = "VALUE_A",
        ValueB = "VALUE_B",
      }

      it("deve converter string para enum (IgnoreCase, sucesso)", () => {
        // Arrange
        const result = parseToEnum("value_a", StringEnum, Mode.IGNORE_CASE);

        // Act
        const parsedValue = validateAndCollect(result, failures);

        // Assert
        expect(result).toBeDefined();
        expect(parsedValue).toBe(StringEnum.ValueA);
        expect(failures).toHaveLength(0);
      });

      it("deve converter string para enum (CaseSensitive, sucesso)", () => {
        // Arrange
        const result = parseToEnum("VALUE_B", StringEnum, Mode.SENSITIVE_CASE);

        // Act
        const parsedValue = validateAndCollect(result, failures);

        // Assert
        expect(parsedValue).toBeDefined();
        expect(parsedValue).toBe(StringEnum.ValueB);
        expect(failures).toHaveLength(0);
      });

      it("deve falhar ao converter string inexistente (IgnoreCase)", () => {
        // Arrange
        const result = parseToEnum(
          "non_existent",
          StringEnum,
          Mode.IGNORE_CASE,
        );

        // Act
        const parsedValue = validateAndCollect(result, failures);

        // Assert
        expect(parsedValue).toBeNull();
        expect(failures).toHaveLength(1);
        expect(failures[0].code).toBe(FailureCode.INVALID_ENUM_VALUE);
        expect(failures[0].details).toEqual({
          value: "NON_EXISTENT",
          allowed_values: ["VALUE_A", "VALUE_B"],
        });
      });

      it("deve falhar ao converter string inexistente (CaseSensitive)", () => {
        // Arrange
        const result = parseToEnum("value_c", StringEnum, Mode.SENSITIVE_CASE);

        // Act
        const parsedValue = validateAndCollect(result, failures);

        // Assert
        expect(parsedValue).toBeNull();
        expect(failures).toHaveLength(1);
        expect(failures[0].code).toBe(FailureCode.INVALID_ENUM_VALUE);
        expect(failures[0].details).toEqual({
          value: "value_c",
          allowed_values: ["VALUE_A", "VALUE_B"],
        });
      });

      it("deve falhar ao converter string vazia", () => {
        // Arrange
        const result = parseToEnum("", StringEnum, Mode.IGNORE_CASE);

        // Act
        const parsedValue = validateAndCollect(result, failures);

        // Assert
        expect(parsedValue).toBeNull();
        expect(failures).toHaveLength(1);
        expect(failures[0].code).toBe(FailureCode.INVALID_ENUM_VALUE);
        expect(failures[0].details).toEqual({
          value: "",
          allowed_values: ["VALUE_A", "VALUE_B"],
        });
      });

      it("deve falhar quando o valor for nulo", () => {
        // Arrange
        const values: any[] = [null, undefined];

        // Act
        values.forEach((value) => {
          failures = [];
          const parsedValue = validateAndCollect(
            parseToEnum(value, StringEnum, Mode.IGNORE_CASE),
            failures,
          );

          // Assert
          expect(parsedValue).toBeFalsy();
          expect(failures).toHaveLength(1);
          expect(failures[0].code).toBe(FailureCode.INVALID_ENUM_VALUE);
          expect(failures[0].details.allowed_values).toEqual([
            "VALUE_A",
            "VALUE_B",
          ]);
        });
      });
    });
  });
});
