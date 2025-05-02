import { CPF } from "./cpf";
import { TechnicalError } from "../../../../shared/error/technical.error";

describe("CPF", () => {
  describe("create", () => {
    describe("should create a valid", () => {
      const successCases = [
        { cpf: "1234567890123", scenario: "with valid format" },
        { cpf: "9876543210123", scenario: "with different valid numbers" },
      ];

      successCases.forEach(({ cpf, scenario }) => {
        it(`CPF object ${scenario}`, () => {
          // Act
          const result = CPF.create(cpf);

          // Assert
          expect(result.invalid).toBe(false);
          expect(result.value).toBeInstanceOf(CPF);
          expect(result.value.value).toBe(cpf);
        });
      });
    });

    describe("should fail to create an invalid", () => {
      const failureCases = [
        {
          cpf: null,
          scenario: "when CPF is null",
          errorCodeExpected: "FIELD_CANNOT_BE_NULL",
        },
        {
          cpf: undefined,
          scenario: "when CPF is undefined",
          errorCodeExpected: "FIELD_CANNOT_BE_NULL",
        },
        {
          cpf: "",
          scenario: "when CPF is empty",
          errorCodeExpected: "FIELD_CANNOT_BE_EMPTY",
        },
        {
          cpf: "123456789012",
          scenario: "when CPF has less than 13 digits",
          errorCodeExpected: "INVALID_CPF_FORMAT",
        },
        {
          cpf: "12345678901234",
          scenario: "when CPF has more than 13 digits",
          errorCodeExpected: "INVALID_CPF_FORMAT",
        },
        {
          cpf: "1234567890abc",
          scenario: "when CPF contains non-numeric characters",
          errorCodeExpected: "INVALID_CPF_FORMAT",
        },
      ];

      failureCases.forEach(({ cpf, scenario, errorCodeExpected }) => {
        it(`CPF object ${scenario}`, () => {
          // Act
          const result = CPF.create(cpf);

          // Assert
          expect(result.invalid).toBe(true);
          expect(result.failures[0].code).toBe(errorCodeExpected);
        });
      });
    });
  });

  describe("hydrate", () => {
    it("should create a CPF object without validation", () => {
      // Arrange
      const cpfString = "1234567890123";

      // Act
      const hydratedCPF = CPF.hydrate(cpfString);

      // Assert
      expect(hydratedCPF).toBeInstanceOf(CPF);
      expect(hydratedCPF.value).toBe(cpfString);
    });

    it("should throw TechnicalError when CPF is null or undefined", () => {
      // Arrange
      const values = [null, undefined];

      // Act & Assert
      values.forEach((value) => {
        expect(() => {
          CPF.hydrate(value);
        }).toThrow(TechnicalError);
      });
    });
  });

  describe("equal", () => {
    it("should return true when CPFs are equal", () => {
      // Arrange
      const cpfString = "1234567890123";
      const result1 = CPF.create(cpfString);
      const result2 = CPF.create(cpfString);

      // Assert
      expect(result1.value.equal(result2.value)).toBe(true);
    });

    it("should return false when CPFs are different", () => {
      // Arrange
      const result1 = CPF.create("1234567890123");
      const result2 = CPF.create("9876543210123");

      // Assert
      expect(result1.value.equal(result2.value)).toBe(false);
    });

    it("should return false when comparing with null", () => {
      // Arrange
      const result = CPF.create("1234567890123");

      // Assert
      expect(result.value.equal(null)).toBe(false);
    });

    it("should return false when comparing with non-CPF object", () => {
      // Arrange
      const result = CPF.create("1234567890123");
      const notCPFObject = { value: "1234567890123" };

      // Assert
      expect(result.value.equal(notCPFObject as unknown as CPF)).toBe(false);
    });
  });
});
