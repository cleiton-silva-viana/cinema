import { Flow } from "./assert";
import { Assert } from "./assert";
import { is } from "./is";
import { not } from "./not";

describe("Assert", () => {
  describe("all", () => {
    let errors: any[];
    const baseContext = { userId: 123, scope: "test" };

    beforeEach(() => {
      errors = [];
    });

    it("should not add errors if all validations pass", () => {
      // Arrange
      const validations = [
        not.null("some value", "PASS_NULL"),
        not.empty([1, 2], "PASS_EMPTY"),
        is.greaterOrEqualTo(10, 5, "PASS_GE"),
      ];

      // Act
      Assert.all(errors, baseContext, ...validations);

      // Assert
      expect(errors).toHaveLength(0);
    });

    it("should add an error if one validation fails (continue)", () => {
      // Arrange
      const userAge = 10;
      const minAge = 18;
      const errorCode = "ERR_INVALID_AGE";
      const extraDetails = { field: "age" };

      // Validação que falha: is.greaterOrEqualTo(10, 18, ...) -> valid: false
      const failingValidation = is.greaterOrEqualTo(
        userAge,
        minAge,
        errorCode,
        extraDetails,
      );

      const expectedError = {
        ...baseContext,
        code: errorCode,
        ...extraDetails,
        value: JSON.stringify(userAge), // Auto-adicionado por is.greaterOrEqualTo
        min: minAge, // Auto-adicionado por is.greaterOrEqualTo
      };

      const validations = [
        not.null("ok", "PASS_1"),
        failingValidation,
        not.empty("ok", "PASS_2"),
      ];

      // Act
      Assert.all(errors, baseContext, ...validations);

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual(expectedError);
    });

    it("should add multiple errors if multiple validations fail (continue)", () => {
      // Arrange
      // Falha 1: not.null(null, ...) -> valid: false
      const failCode1 = "ERR_NULL";
      const failDetails1 = { message: "null details" };
      const expectedError1 = {
        ...baseContext,
        code: failCode1,
        ...failDetails1, // not.null retorna os detalhes passados
      };

      // Falha 2: is.greaterOrEqualTo(3, 5, ...) -> valid: false
      const failCode2 = "ERR_MIN";
      const value2 = 3;
      const min2 = 5;
      const expectedError2 = {
        ...baseContext,
        code: failCode2,
        value: JSON.stringify(value2), // Auto-adicionado
        min: min2, // Auto-adicionado
      };

      // Falha 3: not.empty("", ...) -> valid: false
      const failCode3 = "ERR_EMPTY";
      const failDetails3 = { info: "empty string" };
      const expectedError3 = {
        ...baseContext,
        code: failCode3,
        ...failDetails3,
      };

      const validations = [
        not.null(null, failCode1, failDetails1),
        is.greaterOrEqualTo(value2, min2, failCode2),
        not.empty("", failCode3, failDetails3),
        is.greaterOrEqualTo(10, 1, "PASS"),
      ];

      // Act
      Assert.all(errors, baseContext, ...validations);

      // Assert
      expect(errors).toHaveLength(3);
      expect(errors[0]).toEqual(expectedError1);
      expect(errors[1]).toEqual(expectedError2);
      expect(errors[2]).toEqual(expectedError3);
    });

    it("should stop execution and add only the first error if a failing validation has flow stop", () => {
      // Arrange
      const value = 3;
      const min = 5;
      const errorCode = "ERR_MIN_STOP";
      const extraDetails = { info: "stop here" };

      const failingValidationWithStop = is.greaterOrEqualTo(
        value,
        min,
        errorCode,
        extraDetails,
        Flow.stop,
      );

      const expectedError = {
        ...baseContext,
        code: errorCode,
        ...extraDetails,
        value: JSON.stringify(value), // Auto-adicionado
        min: min, // Auto-adicionado
      };

      const validations = [
        not.null("ok", "PASS_1"),
        failingValidationWithStop,
        not.empty("ok", "NEVER_RUN"),
      ];

      // Act
      Assert.all(errors, baseContext, ...validations);

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual(expectedError);
    });

    it("should stop execution immediately if the first validation fails with flow stop", () => {
      // Arrange
      const value: any = null;
      const errorCode = "ERR_NULL_STOP";
      const extraDetails = { field: "importantField" };

      const firstFailingValidationWithStop = not.null(
        value,
        errorCode,
        extraDetails,
        Flow.stop,
      );

      const expectedError = {
        ...baseContext,
        code: errorCode,
        ...extraDetails,
      };

      const validations = [
        firstFailingValidationWithStop,
        is.greaterOrEqualTo(10, 5, "NEVER_RUN"),
        not.empty("ok", "NEVER_RUN_2"),
      ];

      // Act
      Assert.all(errors, baseContext, ...validations);

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual(expectedError);
    });

    it("must stop the execution of the next validations and add the error resulting from the current validation to the array", () => {
      // Arrange
      const value = 4.9;
      const min = 5;
      const code = "PASS_GE_STOP";
      const extraDetails = { info: "stop anyway" };

      const passingValidationWithStop = is.greaterOrEqualTo(
        value,
        min,
        code,
        extraDetails,
        Flow.stop,
      );

      const validations = [
        not.empty("ok", "PASS_1"),
        passingValidationWithStop,
        not.null(null, "NEVER_RUN"), // Não será executada
      ];

      // Act
      Assert.all(errors, baseContext, ...validations);

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0].code).toBe(code);
      expect(errors[0].value).toEqual(JSON.stringify(value));
    });

    it("should handle no validations provided", () => {
      // Act
      Assert.all(errors, baseContext);

      // Assert
      expect(errors).toHaveLength(0);
    });

    it("should correctly add a different context to all errors", () => {
      // Arrange
      const specificContext = { requestId: "xyz-789", tenant: "acme" };

      const failCode1 = "E1";
      const expectedError1 = {
        ...specificContext,
        code: failCode1,
      };

      const failCode2 = "E2";
      const failDetails2 = { fieldName: "items" };
      const expectedError2 = {
        ...specificContext,
        code: failCode2,
        ...failDetails2,
      };

      const validations = [
        not.null(null, failCode1),
        not.empty([], failCode2, failDetails2),
      ];

      // Act
      Assert.all(errors, specificContext, ...validations);

      // Assert
      expect(errors).toHaveLength(2);
      expect(errors[0]).toEqual(expectedError1);
      expect(errors[1]).toEqual(expectedError2);
    });
  });

  describe("untilFirstFailure", () => {
    const code = "ERROR_CODE";
    const details = { message: "Error 1" };
    const codeNeverReached = "ERROR_NEVER_REACHED";
    const detailsNotBeReached = { message: "Should not be reached" };

    it("deve parar na primeira validação que falha com contexto explícito", () => {
      // Arrange
      const failures: any[] = [];
      const context = { contextInfo: "test context" };

      // Act
      Assert.untilFirstFailure(
        failures,
        context,
        () => ({ valid: false, code, details }),
        () => ({
          valid: false,
          code: codeNeverReached,
          details: detailsNotBeReached,
        }),
      );

      // Assert
      expect(failures).toHaveLength(1);
      expect(failures[0].code).toBe(code);
      expect(failures[0].message).toBe(details.message);
      expect(failures[0].contextInfo).toBe(context.contextInfo);
    });

    it("deve parar na primeira validação que falha sem contexto explícito", () => {
      // Arrange
      const failures: any[] = [];

      // Act
      Assert.untilFirstFailure(
        failures,
        () => ({ valid: false, code, details }),
        () => ({
          valid: false,
          code: codeNeverReached,
          details: detailsNotBeReached,
        }),
      );

      // Assert
      expect(failures).toHaveLength(1);
      expect(failures[0].code).toBe(code);
      expect(failures[0].message).toBe(details.message);
    });

    it("deve continuar executando enquanto as validações passarem", () => {
      // Arrange
      const failures: any[] = [];

      // Act
      Assert.untilFirstFailure(
        failures,
        () => ({ valid: true }),
        () => ({ valid: true }),
        () => ({
          valid: false,
          code: "ERROR_3",
          details: { message: "Error 3" },
        }),
      );

      // Assert
      expect(failures).toHaveLength(1);
      expect(failures[0].code).toBe("ERROR_3");
      expect(failures[0].message).toBe("Error 3");
    });

    it("não deve adicionar nada ao array de falhas se todas as validações passarem", () => {
      // Arrange
      const failures: any[] = [];

      // Act
      Assert.untilFirstFailure(
        failures,
        () => ({ valid: true }),
        () => ({ valid: true }),
        () => ({ valid: true }),
      );

      // Assert
      expect(failures).toHaveLength(0);
    });

    it("deve ignorar o Flow.stop e sempre parar na primeira falha", () => {
      // Arrange
      const failures: any[] = [];

      // Act
      Assert.untilFirstFailure(
        failures,
        () => ({ valid: false, code, details, flow: Flow.continue }),
        () => ({ valid: false, code: codeNeverReached, details: detailsNotBeReached }),
      );

      // Assert
      expect(failures).toHaveLength(1);
      expect(failures[0].code).toBe(code);
      expect(failures[0].message).toBe(details.message);
    });

    it("deve funcionar com validadores reais como is e not", () => {
      // Arrange
      const failures: any[] = [];
      const value: any = null;
      const minValue = 10;

      // Act
      Assert.untilFirstFailure(
        failures,
        not.null(value, "NULL_VALUE", { field: "testField" }),
        is.greaterOrEqualTo(value, minValue, "MIN_VALUE", {
          field: "testField",
          minValue,
        }),
      );

      // Assert
      expect(failures).toHaveLength(1);
      expect(failures[0].code).toBe("NULL_VALUE");
      expect(failures[0].field).toBe("testField");
    });
  });
});
