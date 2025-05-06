import { BaseValidator } from "./base.validator.ts";
import { SimpleFailure } from "../failure/simple.failure.type";
import { FailureCode } from "../failure/failure.codes.enum";
import { Flow } from "../assert/assert";

class TestValidator extends BaseValidator<TestValidator> {
  constructor(value: any) {
    super(value);
    this._value = value;
  }

  getField(): string {
    return this._field;
  }

  getFailures(): SimpleFailure[] {
    return this._failures;
  }

  getFlow(): Flow {
    return this._flow;
  }
}

describe("BaseValidator", () => {
  describe("Métodos de configuração", () => {
    it("should set the field name correctly", () => {
      // Act
      const result = new TestValidator("test").field("testField");

      // Assert
      expect(result.getField()).toBe("testField");
    });

    it("should set the failures array correctly", () => {
      // Arrange
      const validator = new TestValidator("test");
      const failures: SimpleFailure[] = [];

      // Act
      const result = validator.failures(failures);

      // Assert
      expect(result.getFailures()).toBe(failures);
    });

    it("should set flow to stop when expression is false", () => {
      // Arrange
      const validator = new TestValidator("test");

      // Act
      const result = validator.if(false);

      // Assert
      expect(result.getFlow()).toBe(Flow.stop);
    });

    it("should set flow to continue when expression is true", () => {
      // Arrange
      const validator = new TestValidator("test");

      // Act
      const result = validator.if(true);

      // Assert
      expect(result.getFlow()).toBe(Flow.continue);
    });

    it("should set flow to continue even after failures", () => {
      // Arrange
      const validator = new TestValidator("test");
      validator.if(false); // Sets flow to stop

      // Act
      const result = validator.continueOnFailure();

      // Assert
      expect(result.getFlow()).toBe(Flow.continue);
    });
  });

  describe("Método isRequired", () => {
    it("should not add failure when value is not null or undefined", () => {
      // Arrange
      const failures: SimpleFailure[] = [];
      const validator = new TestValidator("test").failures(failures);

      // Act
      validator.isRequired({});

      // Assert
      expect(failures.length).toBe(0);
    });

    describe("failure cases", () => {
      const failureCases = [
        {
          scenario: "when value is null",
          value: null as unknown,
        },
        {
          scenario: "when value is undefined",
          value: undefined,
        },
      ];

      failureCases.forEach(({ scenario, value }) => {
        it(`should add failure ${scenario}`, () => {
          // Arrange
          const failures: SimpleFailure[] = [];

          // Act
          new TestValidator(value)
            .field("test")
            .failures(failures)
            .isRequired();

          // Assert
          expect(failures.length).toBe(1);
          expect(failures[0].code).toBe(FailureCode.MISSING_REQUIRED_DATA);
        });
      });

      it("when using custom error code", () => {
        // Arrange
        const failures: SimpleFailure[] = [];
        const value: any = null;

        // Act
        new TestValidator(value)
          .field("test")
          .failures(failures)
          .isRequired({}, FailureCode.VALUES_NOT_EQUAL);

        // Assert
        expect(failures.length).toBe(1);
        expect(failures[0].code).toBe(FailureCode.VALUES_NOT_EQUAL);
      });
    });
  });

  describe("Método isEqualTo", () => {
    it("deve validar corretamente igualdade de valores quando os valores forem iguais", () => {
      // Arrange
      const failures: SimpleFailure[] = [];
      const value = "aaa";
      const target = "aaa";

      // Act
      new TestValidator(value)
        .failures(failures)
        .field("test")
        .isEqualTo(target);

      // Assert
      expect(failures.length).toBe(0);
    });

    it("deve falhar quando valores não forem iguais", () => {
      // Arrange
      const failures: SimpleFailure[] = [];
      const value = "aaa";
      const target = "aab";

      // Act
      new TestValidator(value)
        .failures(failures)
        .field("test")
        .isEqualTo(target);

      // Assert
      expect(failures.length).toBe(1);
      expect(failures[0].code).toBe(FailureCode.VALUES_NOT_EQUAL);
    });

    it("deve falhar e retornar o código de erro alternativo", () => {
      // Arrange
      const failures: SimpleFailure[] = [];
      const value = "aaa";
      const target = "aab";
      const code = FailureCode.CONTENT_INVALID_TYPE;

      // Act
      new TestValidator(value)
        .failures(failures)
        .field("test")
        .isEqualTo(target, {}, code);

      // Assert
      expect(failures.length).toBe(1);
      expect(failures[0].code).toBe(code);
    });

    it("deve incluir detalhes na falha", () => {
      // Arrange
      const failures: SimpleFailure[] = [];
      const value = "aaa";
      const target = "aab";
      const details = { message: "message" };

      // Act
      new TestValidator(value).failures(failures).isEqualTo(target, details);

      // Assert
      expect(failures.length).toBe(1);
      expect(failures[0].details).toMatchObject(details);
    });
  });

  describe("Fluxo de validação", () => {
    it("deve ignorar as validações quando if for false", () => {
      // Arrange
      const failures: SimpleFailure[] = [];

      // Act
      new TestValidator(null).failures(failures).if(false).isRequired();

      //Assert
      expect(failures.length).toBe(0);
    });

    it("deve parar a validação após a primeira falha quando o fluxo for stop", () => {
      // Arrange
      const failures: SimpleFailure[] = [];

      // Act
      new TestValidator(null)
        .failures(failures)
        .isRequired()
        .isRequired()
        .isRequired();

      // Assert
      expect(failures.length).toBe(1);
    });

    it("deve continuar a validação quando o fluxo for continue", () => {
      // Arrange
      const failures: SimpleFailure[] = [];

      // Act
      new TestValidator(null)
        .failures(failures)
        .isRequired()
        .continueOnFailure()
        .isRequired() // stop here
        .isRequired();

      // Assert
      expect(failures.length).toBe(2);
    });
  });
});
