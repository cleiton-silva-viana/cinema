import { FailureCode } from "../failure/failure.codes.enum";
import { SimpleFailure } from "../failure/simple.failure.type";
import { ObjectValidator } from "./object.valdiator";
import { expand, observable } from "rxjs";

describe("ObjectValidator", () => {
  const OBJECT = { name: "test", age: 25 };
  const NON_EXISTENT_ATTRIBUTE = "birthDate";
  const PERSONAL_CODE = FailureCode.CONTENT_INVALID_TYPE;
  const PERSONAL_DETAILS = { message: "atributo que deve ser anexado ao erro" };
  const FIELD = "object";

  describe("hasProperty", () => {
    it("não deve adicionar falha quando o objeto tem a propriedade", () => {
      // Arrange
      const failures: SimpleFailure[] = [];

      // Act
      new ObjectValidator(OBJECT).failures(failures).hasProperty("age");

      // Assert
      expect(failures.length).toBe(0);
    });

    it("deve adicionar falha quando o objeto não tem a propriedade", () => {
      // Arrange
      const failures: SimpleFailure[] = [];

      // Act
      new ObjectValidator(OBJECT)
        .failures(failures)
        .field(FIELD)
        .hasProperty(NON_EXISTENT_ATTRIBUTE as keyof typeof OBJECT);

      // Assert
      expect(failures.length).toBe(1);
      expect(failures[0].code).toBe(FailureCode.OBJECT_MISSING_PROPERTY);
      expect(failures[0].details.property).toBe(NON_EXISTENT_ATTRIBUTE);
      expect(failures[0].details.field).toBe(FIELD);
    });

    it("deve usar o código de erro personalizado", () => {
      // Arrange
      const failures: SimpleFailure[] = [];

      // Act
      new ObjectValidator(OBJECT)
        .failures(failures)
        .field(FIELD)
        .hasProperty(
          NON_EXISTENT_ATTRIBUTE as keyof typeof OBJECT,
          PERSONAL_CODE,
        );

      // Assert
      expect(failures.length).toBe(1);
      expect(failures[0].code).toBe(PERSONAL_CODE);
      expect(failures[0].details.field).toBe(FIELD);
    });

    it("deve incluir detalhes adicionais na falha", () => {
      // Arrange
      const failures: SimpleFailure[] = [];

      // Act
      new ObjectValidator(OBJECT)
        .failures(failures)
        .field(FIELD)
        .hasProperty(
          NON_EXISTENT_ATTRIBUTE as keyof typeof OBJECT,
          FailureCode.OBJECT_MISSING_PROPERTY,
          PERSONAL_DETAILS,
        );

      // Assert
      expect(failures.length).toBe(1);
      expect(failures[0].details.message).toBe(PERSONAL_DETAILS.message);
      expect(failures[0].details.property).toBe(NON_EXISTENT_ATTRIBUTE);
      expect(failures[0].details.field).toBe(FIELD);
    });
  });

  describe("isNotEmpty", () => {
    it("não deve adicionar falha quando o objeto não está vazio", () => {
      // Arrange
      const failures: SimpleFailure[] = [];

      // Act
      new ObjectValidator(OBJECT).failures(failures).isNotEmpty();

      // Assert
      expect(failures.length).toBe(0);
    });

    it("deve adicionar falha quando o objeto está vazio", () => {
      // Arrange
      const failures: SimpleFailure[] = [];
      const obj = {};

      // Act
      new ObjectValidator(obj).failures(failures).field(FIELD).isNotEmpty();

      // Assert
      expect(failures.length).toBe(1);
      expect(failures[0].code).toBe(FailureCode.OBJECT_IS_EMPTY);
      expect(failures[0].details.field).toBe(FIELD);
    });

    it("deve usar o código de erro personalizado", () => {
      // Arrange
      const failures: SimpleFailure[] = [];
      const obj = {};

      // Act
      new ObjectValidator(obj)
        .failures(failures)
        .field(FIELD)
        .isNotEmpty(PERSONAL_CODE);

      // Assert
      expect(failures.length).toBe(1);
      expect(failures[0].code).toBe(PERSONAL_CODE);
      expect(failures[0].details.field).toBe(FIELD);
    });

    it("deve incluir detalhes adicionais na falha", () => {
      // Arrange
      const failures: SimpleFailure[] = [];
      const value = {};

      // Act
      new ObjectValidator(value)
        .failures(failures)
        .field(FIELD)
        .isNotEmpty(FailureCode.OBJECT_IS_EMPTY, PERSONAL_DETAILS);

      // Assert
      expect(failures.length).toBe(1);
      expect(failures[0].details.message).toBe(PERSONAL_DETAILS.message);
      expect(failures[0].details.field).toBe(FIELD);
    });
  });

  describe("optionalProperty", () => {
    it("não deve executar o validador quando a propriedade não existir", () => {
      // Arrange
      const failures: SimpleFailure[] = [];
      let wasExecuted = false;

      // Act
      new ObjectValidator(OBJECT)
        .failures(failures)
        .optionalProperty(NON_EXISTENT_ATTRIBUTE, () => {
          wasExecuted = true;
        });

      // Assert
      expect(wasExecuted).toBe(false);
      expect(failures.length).toBe(0);
    });

    it("deve executar o validador quando a propriedade existir", () => {
      // Arrange
      let wasExecuted = false;

      // Act
      new ObjectValidator(OBJECT).optionalProperty("age", () => {
        wasExecuted = true;
      });

      // Assert
      expect(wasExecuted).toBe(true);
    });

    it("deve permitir encadeamento de validações", () => {
      // Arrange
      let executionsCounter = 0;

      // Act
      new ObjectValidator(OBJECT)
        .optionalProperty("name", () => {
          executionsCounter++;
        })
        .optionalProperty("age", () => {
          executionsCounter++;
        });

      // Assert
      expect(executionsCounter).toBe(2);
    });
  });

  describe("property", () => {
    it("não deve executar o validador e deve adicionar falha quando a propriedade não existir", () => {
      // Arrange
      const failures: SimpleFailure[] = [];
      let wasExecuted = false;

      // Act
      new ObjectValidator(OBJECT)
        .failures(failures)
        .property(NON_EXISTENT_ATTRIBUTE, () => {
          wasExecuted = true;
        });

      // Assert
      expect(wasExecuted).toBe(false);
      expect(failures.length).toBe(1);
      expect(failures[0].code).toBe(FailureCode.MISSING_REQUIRED_DATA);
      expect(failures[0].details.field).toBe(NON_EXISTENT_ATTRIBUTE);
    });

    it("deve executar o validador quando a propriedade existir", () => {
      // Arrange
      const failures: SimpleFailure[] = [];
      let wasExecuted = false;

      // Act
      new ObjectValidator(OBJECT).failures(failures).property("age", () => {
        wasExecuted = true;
      });

      // Assert
      expect(wasExecuted).toBe(true);
      expect(failures.length).toBe(0);
    });

    it("deve permitir encadeamento de validações", () => {
      // Arrange
      const failures: SimpleFailure[] = [];
      let wasExecuted = 0;

      // Act
      new ObjectValidator(OBJECT)
        .failures(failures)
        .property("name", () => {
          wasExecuted++;
        })
        .property("age", () => {
          wasExecuted++;
        });

      // Assert
      expect(wasExecuted).toBe(2);
      expect(failures.length).toBe(0);
    });

    it("deve adicionar falha quando o objeto for nulo", () => {
      // Arrange
      const failures: SimpleFailure[] = [];
      const obj: any = null;
      let wasExecuted = false;

      // Act
      new ObjectValidator(obj).failures(failures).property("age", () => {
        wasExecuted = true;
      });

      // Assert
      expect(wasExecuted).toBe(false);
      expect(failures.length).toBe(1);
      expect(failures[0].code).toBe(FailureCode.MISSING_REQUIRED_DATA);
      expect(failures[0].details.field).toBe("age");
    });
  });
});
