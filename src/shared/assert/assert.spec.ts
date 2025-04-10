import { Flow, is } from "./assert";
import { Assert } from "./assert";

describe("Assert", () => {
  describe("all", () => {
    let errors: any[];
    const context = { userId: 123, scope: "test" };
    const valid = {
      isEmpty: is.empty("", "ERR_NOT_EMPTY"),
      isNull: is.null(null, 'ERR_NOT_NULL'),
      isGreater: is.greaterOrEqualTo(10, 5, "ERR_MIN")
    }
    const invalid = {
      notEmpty: is.empty("filled", "ERR_NOT_EMPTY"),
      notNull: is.empty(123, "ERR_NOT_NULL"),
      notGreater: is.greaterOrEqualTo(5, 10, "ERR_MIN"),
    }

    beforeEach(() => {
      errors = [];
    });

    it("should not add errors if all validations pass", () => {
      // Act
      Assert.all(
        errors,
        context,
        valid.isNull,
        valid.isEmpty,
        valid.isGreater
      );

      // Assert
      expect(errors).toHaveLength(0);
    });

    it("should add an error if one validation fails (continue)", () => {
      // Arrange
      const expectedError = {
        ...context,
        code: "ERR_INVALID_AGE",
        field: "age",
        min: 18,
      };
      const userAge = 10;

      // Act
      Assert.all(
        errors,
        context,
        valid.isNull,
        is.greaterOrEqualTo(userAge, expectedError.min, expectedError.code, { field: expectedError.field }),
        valid.isEmpty,
      );

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual(expectedError);
    });

    it("should add multiple errors if multiple validations fail (continue)", () => {
      // Arrange
      const expectedFistError = {
        ...context,
        code: "ERR_NULL",
        details: { message: "null details" },
      }

      const expectedSecondError = {
        ...context,
        code: "ERR_MIN",
        min: 5,
      }

      const expectedThirdError = {
        ...context,
        code: "ERR_EMPTY",
        message: "null details",
      }

      // Act
      Assert.all(
        errors,
        context,
        is.null("not null", expectedFistError.code, { details: expectedFistError.details }),
        is.greaterOrEqualTo(3, expectedSecondError.min, expectedSecondError.code),
        is.empty("not empty", expectedThirdError.code, { message: expectedThirdError.message }),
      );

      // Assert
      expect(errors).toHaveLength(3);
      expect(errors[0]).toEqual(expectedFistError);
      expect(errors[1]).toEqual(expectedSecondError);
      expect(errors[2]).toEqual(expectedThirdError);
    });

    it("should stop execution and add only the first error if flow is stop", () => {
      // Arrange
      const expectedError = {
        ...context,
        code: "ERR_MIN?_STOP",
        min: 5,
        info: "stop here",
      };

      // Act
      Assert.all(
        errors,
        context,
        valid.isNull,
        is.greaterOrEqualTo(
          3,
          expectedError.min,
          expectedError.code,
          { info: expectedError.info },
          Flow.stop,
        ),
        invalid.notEmpty,
      );

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual(expectedError);
    });

    it("should stop execution immediately if the first validation fails with flow stop", () => {
      // Arrange
      const expectedError = {
        ...context,
        code: 'NOT_NULL',
        details: 'filled',
      };


      // Act
      Assert.all(
        errors,
        context,
        is.null('55', expectedError.code, { details: expectedError.details }),
        valid.isEmpty,
        valid.isGreater,
      );

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual(expectedError);
    });

    it("should handle no validations provided", () => {
      // Act
      Assert.all(errors, context);

      // Assert
      expect(errors).toHaveLength(0);
    });

    it("should correctly add context to all errors", () => {
      // Assert
      const specificContext = { requestId: "xyz-789" };

      // Act
      Assert.all(
        errors,
        specificContext,
        is.null("fail1", "E1"),
        is.empty("fail2", "E2"),
      );

      // Arrange
      expect(errors).toHaveLength(2);
      expect(errors[0]).toEqual({ ...specificContext, code: "E1" });
      expect(errors[1]).toEqual({ ...specificContext, code: "E2" });
    });
  });
});
