import { failure, Result, success } from "./result";
import { SimpleFailure } from "../failure/simple.failure.type";
import { TechnicalError } from "../error/technical.error";

describe("Result", () => {
  describe("success", () => {
    it("should create a Result instance representing success with the correct value", () => {
      // Arrange
      const data: string = "a simple data";

      // Act
      const result = success<string, SimpleFailure>(data);

      // Assert
      expect(result).toBeInstanceOf(Result);
      expect(result.invalid).toBe(false);
      expect(result.value).toBe(data);
    });

    it("should throw TechnicalError when accessing 'failures' on a success result", () => {
      // Arrange
      const data: string = "successful data";
      const result = success(data);

      // Act & Assert
      expect(() => result.failures).toThrow(TechnicalError);
    });

    it("should handle null or undefined as a success value", () => {
      // Arrange
      const datas = [null, undefined];

      // Act
      datas.forEach((data) => {
        const result = success(data);

        // Assert
        expect(result.invalid).toBe(false);
        expect(result.value).toBe(data);
        expect(() => result.failures).toThrow(TechnicalError);
      });
    });
  });

  describe("failure", () => {
    it("should create a Result instance representing failure with a single error", () => {
      // Arrange
      const fail: SimpleFailure = {
        code: "ERR_SINGLE",
        details: { field: "field" },
      };

      // Act
      const result = failure<any, SimpleFailure>(fail); // Usando 'any' para V, pois não temos valor

      // Assert
      expect(result).toBeInstanceOf(Result);
      expect(result.invalid).toBe(true);
      // Verificar se o array de falhas contém exatamente o erro esperado
      expect(result.failures).toEqual([fail]);
    });

    it("should throw TechnicalError when accessing 'value' on a failure result", () => {
      // Arrange
      const fail: SimpleFailure = { code: "ERR_ACCESS", details: {} };
      const result = failure<any, SimpleFailure>(fail);

      // Act & Assert
      expect(() => result.value).toThrow(TechnicalError);
    });

    it("should create a Result instance representing failure with multiple errors", () => {
      // Arrange
      const fails: SimpleFailure[] = [
        { code: "ERR_MULTI_1", details: { field: "field1" } },
        { code: "ERR_MULTI_2", details: { reason: "reason2" } },
      ];

      // Act
      const result = failure<any, SimpleFailure>(fails);

      // Assert
      expect(result).toBeInstanceOf(Result);
      expect(result.invalid).toBe(true);
      expect(result.failures).toEqual(fails);
      expect(() => result.value).toThrow(TechnicalError);
    });
  });
});
