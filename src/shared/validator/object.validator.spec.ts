import { FailureCode } from "../failure/failure.codes.enum";
import { SimpleFailure } from "../failure/simple.failure.type";
import { ObjectValidator } from "./object.valdiator";

describe("ObjectValidator", () => {
  describe("hasProperty", () => {
    it("não deve adicionar falha quando o objeto tem a propriedade", () => {
      // Arrange
      const failures: SimpleFailure[] = [];
      const value = { nome: "teste", idade: 25 };

      // Act
      new ObjectValidator(value)
        .failures(failures)
        .hasProperty("nome");

      // Assert
      expect(failures.length).toBe(0);
    });

    it("deve adicionar falha quando o objeto não tem a propriedade", () => {
      // Arrange
      const failures: SimpleFailure[] = [];
      const value = { nome: "teste" };

      // Act
      new ObjectValidator(value)
        .failures(failures)
        .hasProperty("idade" as keyof typeof value);

      // Assert
      expect(failures.length).toBe(1);
      expect(failures[0].code).toBe(FailureCode.OBJECT_MISSING_PROPERTY);
      expect(failures[0].details.property).toBe("idade");
    });

    it("deve usar o código de erro personalizado", () => {
      // Arrange
      const failures: SimpleFailure[] = [];
      const value = { nome: "teste" };
      const code = FailureCode.CONTENT_INVALID_TYPE;

      // Act
      new ObjectValidator(value)
        .failures(failures)
        .hasProperty("idade" as keyof typeof value, code);

      // Assert
      expect(failures.length).toBe(1);
      expect(failures[0].code).toBe(code);
    });

    it("deve incluir detalhes adicionais na falha", () => {
      // Arrange
      const failures: SimpleFailure[] = [];
      const value = { nome: "teste" };
      const details = { message: "Propriedade obrigatória não encontrada" };

      // Act
      new ObjectValidator(value)
        .failures(failures)
        .hasProperty(
          "idade" as keyof typeof value,
          FailureCode.OBJECT_MISSING_PROPERTY,
          details
        );

      // Assert
      expect(failures.length).toBe(1);
      expect(failures[0].details.message).toBe(details.message);
      expect(failures[0].details.property).toBe("idade");
    });
  });

  describe("isNotEmpty", () => {
    it("não deve adicionar falha quando o objeto não está vazio", () => {
      // Arrange
      const failures: SimpleFailure[] = [];
      const value = { nome: "teste" };

      // Act
      new ObjectValidator(value)
        .failures(failures)
        .field("objeto")
        .isNotEmpty();

      // Assert
      expect(failures.length).toBe(0);
    });

    it("deve adicionar falha quando o objeto está vazio", () => {
      // Arrange
      const failures: SimpleFailure[] = [];
      const value = {};

      // Act
      new ObjectValidator(value)
        .failures(failures)
        .field("objeto")
        .isNotEmpty();

      // Assert
      expect(failures.length).toBe(1);
      expect(failures[0].code).toBe(FailureCode.OBJECT_IS_EMPTY);
    });

    it("deve usar o código de erro personalizado", () => {
      // Arrange
      const failures: SimpleFailure[] = [];
      const value = {};
      const code = FailureCode.CONTENT_INVALID_TYPE;

      // Act
      new ObjectValidator(value)
        .failures(failures)
        .field("objeto")
        .isNotEmpty(code);

      // Assert
      expect(failures.length).toBe(1);
      expect(failures[0].code).toBe(code);
    });

    it("deve incluir detalhes adicionais na falha", () => {
      // Arrange
      const failures: SimpleFailure[] = [];
      const value = {};
      const details = { message: "Objeto não pode estar vazio" };

      // Act
      new ObjectValidator(value)
        .failures(failures)
        .field("objeto")
        .isNotEmpty(FailureCode.OBJECT_IS_EMPTY, details);

      // Assert
      expect(failures.length).toBe(1);
      expect(failures[0].details).toMatchObject(details);
    });
  });
});