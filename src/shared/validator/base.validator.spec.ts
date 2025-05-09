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
    it("deve definir o nome do campo corretamente", () => {
      // Act
      const result = new TestValidator("test").field("testField");

      // Assert
      expect(result.getField()).toBe("testField");
    });

    it("deve definir o array de falhas corretamente", () => {
      // Arrange
      const validator = new TestValidator("test");
      const failures: SimpleFailure[] = [];

      // Act
      const result = validator.failures(failures);

      // Assert
      expect(result.getFailures()).toBe(failures);
    });

    it("deve definir o fluxo para parar quando a expressão for falsa", () => {
      // Arrange
      const validator = new TestValidator("test");

      // Act
      const result = validator.if(false);

      // Assert
      expect(result.getFlow()).toBe(Flow.stop);
    });

    it("deve definir o fluxo para continuar quando a expressão for verdadeira", () => {
      // Arrange
      const validator = new TestValidator("test");

      // Act
      const result = validator.if(true);

      // Assert
      expect(result.getFlow()).toBe(Flow.stop);
    });

    it("deve definir o fluxo para continuar mesmo após falhas", () => {
      // Arrange
      const validator = new TestValidator("test");
      validator.if(false); // Define o fluxo para parar

      // Act
      const result = validator.continue();

      // Assert
      expect(result.getFlow()).toBe(Flow.continue);
    });
  });

  describe("then", () => {
    it("deve executar o validador quando não há falhas", () => {
      // Arrange
      const failures: SimpleFailure[] = [];
      let wasExecuted = false;

      // Act
      new TestValidator("test").failures(failures).then(() => {
        wasExecuted = true;
      });

      // Assert
      expect(wasExecuted).toBe(true);
    });

    it("não deve executar o validador quando há falhas", () => {
      // Arrange
      const failures: SimpleFailure[] = [];
      let wasExecuted = false;

      // Act
      new TestValidator(null)
        .failures(failures)
        .isRequired()
        .then(() => {
          wasExecuted = true;
        });

      // Assert
      expect(wasExecuted).toBe(false);
      expect(failures.length).toBe(1);
    });

    it("deve permitir encadeamento de validações", () => {
      // Arrange
      const failures: SimpleFailure[] = [];
      let executionsCounter = 0;

      // Act
      new TestValidator("test")
        .failures(failures)
        .then(() => {
          executionsCounter++;
        })
        .then(() => {
          executionsCounter++;
        });

      // Assert
      expect(executionsCounter).toBe(2);
    });
  });

  describe("when", () => {
    it("deve executar o validador quando a condição for verdadeira", () => {
      // Arrange
      let wasExecuted = false;

      // Act
      new TestValidator("test").when(true, () => {
        wasExecuted = true;
      });

      // Assert
      expect(wasExecuted).toBe(true);
    });

    it("não deve executar o validador quando a condição for falsa", () => {
      // Arrange
      let wasExecuted = false;

      // Act
      new TestValidator("test").when(false, () => {
        wasExecuted = true;
      });

      // Assert
      expect(wasExecuted).toBe(false);
    });

    it("deve permitir encadeamento de validações", () => {
      // Arrange
      let executionsCounter = 0;

      // Act
      new TestValidator("test")
        .when(true, () => {
          executionsCounter++;
        })
        .when(true, () => {
          executionsCounter++;
        });

      // Assert
      expect(executionsCounter).toBe(2);
    });
  });

  describe("guard", () => {
    it("deve permitir validações subsequentes quando a expressão retornar true", () => {
      // Arrange
      const failures: SimpleFailure[] = [];
      let wasExecuted = false;

      // Act
      new TestValidator(null)
        .failures(failures)
        .guard(() => true)
        .then(() => {
          wasExecuted = true;
        });

      // Assert
      expect(wasExecuted).toBe(true);
      expect(failures.length).toBe(0);
    });

    it("deve impedir validações subsequentes quando a expressão retornar false", () => {
      // Arrange
      const failures: SimpleFailure[] = [];
      let wasExecuted = false;

      // Act
      new TestValidator("test")
        .failures(failures)
        .guard(() => false)
        .then(() => {
          wasExecuted = true;
        });

      // Assert
      expect(wasExecuted).toBe(false);
      expect(failures.length).toBe(0);
    });

    it("deve definir o fluxo para parar quando a expressão retornar false", () => {
      // Arrange
      const validator = new TestValidator("test");

      // Act
      const result = validator.guard(() => false);

      // Assert
      expect(result.getFlow()).toBe(Flow.stop);
    });

    it("deve marcar que há uma falha quando a expressão retornar false", () => {
      // Arrange
      const failures: SimpleFailure[] = [];

      // Act
      new TestValidator("test")
        .failures(failures)
        .guard(() => false)
        .isRequired(); // Esta validação não deve ser executada

      // Assert
      expect(failures.length).toBe(0); // Não deve adicionar falhas, apenas impedir validações subsequentes
    });

    it("deve permitir encadeamento de validações quando a expressão retornar true", () => {
      // Arrange
      const failures: SimpleFailure[] = [];
      let executionsCounter = 0;

      // Act
      new TestValidator(null)
        .failures(failures)
        .guard(() => true)
        .then(() => executionsCounter++)
        .guard(() => true)
        .then(() => executionsCounter++);

      // Assert
      expect(executionsCounter).toBe(2);
    });
  });

  describe("isRequired", () => {
    it("não deve adicionar falha quando o valor não for nulo ou indefinido", () => {
      // Arrange
      const failures: SimpleFailure[] = [];
      const validator = new TestValidator("test").failures(failures);

      // Act
      validator.isRequired({});

      // Assert
      expect(failures.length).toBe(0);
    });

    describe("casos de falha", () => {
      const failureCases = [
        {
          scenario: "quando o valor for nulo",
          value: null as unknown,
        },
        {
          scenario: "quando o valor for indefinido",
          value: undefined,
        },
      ];

      failureCases.forEach(({ scenario, value }) => {
        it(`deve adicionar falha ${scenario}`, () => {
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

      it("quando usar código de erro personalizado", () => {
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

  describe("isEqualTo", () => {
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
        .continue()
        .isRequired()
        .isRequired();

      // Assert
      expect(failures.length).toBe(2);
    });
  });
});
