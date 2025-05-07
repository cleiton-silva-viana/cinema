import { ArrayValidator } from "./array.validator";
import { FailureCode } from "../failure/failure.codes.enum";
import { SimpleFailure } from "../failure/simple.failure.type";

describe("ArrayValidator", () => {
  describe("isNotEmpty", () => {
    it("não deve adicionar falha quando o array não estiver vazio", () => {
      // Arrange
      const failures: SimpleFailure[] = [];
      const value = [1, 2, 3];

      // Act
      new ArrayValidator(value).failures(failures).field("itens").isNotEmpty();

      // Assert
      expect(failures.length).toBe(0);
    });

    it("deve adicionar falha quando o array estiver vazio", () => {
      // Arrange
      const failures: SimpleFailure[] = [];
      const value: number[] = [];

      // Act
      new ArrayValidator(value).failures(failures).field("itens").isNotEmpty();

      // Assert
      expect(failures.length).toBe(1);
      expect(failures[0].code).toBe(FailureCode.OBJECT_IS_EMPTY);
    });

    it("deve usar o código de erro personalizado", () => {
      // Arrange
      const failures: SimpleFailure[] = [];
      const value: number[] = [];
      const code = FailureCode.CONTENT_INVALID_TYPE;

      // Act
      new ArrayValidator(value)
        .failures(failures)
        .field("itens")
        .isNotEmpty(code);

      // Assert
      expect(failures.length).toBe(1);
      expect(failures[0].code).toBe(code);
    });

    it("deve incluir detalhes adicionais na falha", () => {
      // Arrange
      const failures: SimpleFailure[] = [];
      const value: number[] = [];
      const details = { message: "Lista não pode estar vazia" };

      // Act
      new ArrayValidator(value)
        .failures(failures)
        .field("itens")
        .isNotEmpty(FailureCode.OBJECT_IS_EMPTY, details);

      // Assert
      expect(failures.length).toBe(1);
      expect(failures[0].details).toMatchObject(details);
    });
  });

  describe("hasLengthBetween", () => {
    it("não deve adicionar falha quando o tamanho estiver dentro do intervalo", () => {
      // Arrange
      const failures: SimpleFailure[] = [];
      const value = [1, 2, 3, 4];
      const min = 2;
      const max = 5;

      // Act
      new ArrayValidator(value)
        .failures(failures)
        .field("itens")
        .hasLengthBetween(min, max);

      // Assert
      expect(failures.length).toBe(0);
    });

    it("deve adicionar falha quando o tamanho for menor que o mínimo", () => {
      // Arrange
      const failures: SimpleFailure[] = [];
      const value = [1];
      const min = 2;
      const max = 5;

      // Act
      new ArrayValidator(value)
        .failures(failures)
        .field("itens")
        .hasLengthBetween(min, max);

      // Assert
      expect(failures.length).toBe(1);
      expect(failures[0].code).toBe(FailureCode.LENGTH_OUT_OF_RANGE);
      expect(failures[0].details.minLength).toBe(min);
      expect(failures[0].details.maxLength).toBe(max);
      expect(failures[0].details.actualLength).toBe(value.length);
    });

    it("deve adicionar falha quando o tamanho for maior que o máximo", () => {
      // Arrange
      const failures: SimpleFailure[] = [];
      const value = [1, 2, 3, 4, 5, 6];
      const min = 2;
      const max = 5;

      // Act
      new ArrayValidator(value)
        .failures(failures)
        .field("itens")
        .hasLengthBetween(min, max);

      // Assert
      expect(failures.length).toBe(1);
      expect(failures[0].code).toBe(FailureCode.LENGTH_OUT_OF_RANGE);
      expect(failures[0].details.minLength).toBe(min);
      expect(failures[0].details.maxLength).toBe(max);
      expect(failures[0].details.actualLength).toBe(value.length);
    });

    it("deve usar o código de erro personalizado", () => {
      // Arrange
      const failures: SimpleFailure[] = [];
      const value = [1];
      const min = 2;
      const max = 5;
      const code = FailureCode.CONTENT_INVALID_TYPE;

      // Act
      new ArrayValidator(value)
        .failures(failures)
        .field("itens")
        .hasLengthBetween(min, max, code);

      // Assert
      expect(failures.length).toBe(1);
      expect(failures[0].code).toBe(code);
    });

    it("deve incluir detalhes adicionais na falha", () => {
      // Arrange
      const failures: SimpleFailure[] = [];
      const value = [1];
      const min = 2;
      const max = 5;
      const details = { message: "Quantidade de itens inválida" };

      // Act
      new ArrayValidator(value)
        .failures(failures)
        .field("itens")
        .hasLengthBetween(min, max, FailureCode.LENGTH_OUT_OF_RANGE, details);

      // Assert
      expect(failures.length).toBe(1);
      expect(failures[0].details.message).toBe(details.message);
      expect(failures[0].details.minLength).toBe(min);
      expect(failures[0].details.maxLength).toBe(max);
      expect(failures[0].details.actualLength).toBe(value.length);
    });
  });

  describe("contains", () => {
    it("não deve adicionar falha quando o array contém o item", () => {
      // Arrange
      const failures: SimpleFailure[] = [];
      const item = 2;
      const value = [1, 2, 3];

      // Act
      new ArrayValidator(value)
        .failures(failures)
        .field("itens")
        .contains(item);

      // Assert
      expect(failures.length).toBe(0);
    });

    it("deve adicionar falha quando o array não contém o item", () => {
      // Arrange
      const failures: SimpleFailure[] = [];
      const item = 5;
      const value = [1, 2, 3];

      // Act
      new ArrayValidator(value)
        .failures(failures)
        .field("itens")
        .contains(item);

      // Assert
      expect(failures.length).toBe(1);
      expect(failures[0].code).toBe(FailureCode.MISSING_REQUIRED_DATA);
      expect(failures[0].details.item).toBe(item);
    });

    it("deve usar o código de erro personalizado", () => {
      // Arrange
      const failures: SimpleFailure[] = [];
      const item = 5;
      const value = [1, 2, 3];
      const code = FailureCode.CONTENT_INVALID_TYPE;

      // Act
      new ArrayValidator(value)
        .failures(failures)
        .field("itens")
        .contains(item, code);

      // Assert
      expect(failures.length).toBe(1);
      expect(failures[0].code).toBe(code);
    });

    it("deve incluir detalhes adicionais na falha", () => {
      // Arrange
      const failures: SimpleFailure[] = [];
      const item = 5;
      const value = [1, 2, 3];
      const details = { message: "Item obrigatório não encontrado" };

      // Act
      new ArrayValidator(value)
        .failures(failures)
        .field("itens")
        .contains(item, FailureCode.MISSING_REQUIRED_DATA, details);

      // Assert
      expect(failures.length).toBe(1);
      expect(failures[0].details.message).toBe(details.message);
      expect(failures[0].details.item).toBe(item);
    });
  });

  describe("every", () => {
    it("não deve adicionar falha quando todos os itens satisfazem a condição", () => {
      // Arrange
      const failures: SimpleFailure[] = [];
      const value = [2, 4, 6, 8];
      const predicate = (item: number) => item % 2 === 0;

      // Act
      new ArrayValidator(value)
        .failures(failures)
        .field("itens")
        .every(predicate);

      // Assert
      expect(failures.length).toBe(0);
    });

    it("deve adicionar falha quando algum item não satisfaz a condição", () => {
      // Arrange
      const failures: SimpleFailure[] = [];
      const value = [2, 4, 5, 8];
      const predicate = (item: number) => item % 2 === 0;

      // Act
      new ArrayValidator(value)
        .failures(failures)
        .field("itens")
        .every(predicate);

      // Assert
      expect(failures.length).toBe(1);
      expect(failures[0].code).toBe(FailureCode.CONTENT_INVALID_ITEMS);
    });

    it("deve usar o código de erro personalizado", () => {
      // Arrange
      const failures: SimpleFailure[] = [];
      const value = [2, 4, 5, 8];
      const predicate = (item: number) => item % 2 === 0;
      const code = FailureCode.INVALID_VALUE_FORMAT;

      // Act
      new ArrayValidator(value)
        .failures(failures)
        .field("itens")
        .every(predicate, code);

      // Assert
      expect(failures.length).toBe(1);
      expect(failures[0].code).toBe(code);
    });

    it("deve incluir detalhes adicionais na falha", () => {
      // Arrange
      const failures: SimpleFailure[] = [];
      const value = [2, 4, 5, 8];
      const predicate = (item: number) => item % 2 === 0;
      const details = { message: "Todos os itens devem ser pares" };

      // Act
      new ArrayValidator(value)
        .failures(failures)
        .field("itens")
        .every(predicate, FailureCode.CONTENT_INVALID_ITEMS, details);

      // Assert
      expect(failures.length).toBe(1);
      expect(failures[0].details).toMatchObject(details);
    });
  });

  describe("some", () => {
    it("não deve adicionar falha quando pelo menos um item satisfaz a condição", () => {
      // Arrange
      const failures: SimpleFailure[] = [];
      const value = [1, 3, 5, 8];
      const predicate = (item: number) => item % 2 === 0;

      // Act
      new ArrayValidator(value)
        .failures(failures)
        .field("itens")
        .some(predicate);

      // Assert
      expect(failures.length).toBe(0);
    });

    it("deve adicionar falha quando nenhum item satisfaz a condição", () => {
      // Arrange
      const failures: SimpleFailure[] = [];
      const value = [1, 3, 5, 7];
      const predicate = (item: number) => item % 2 === 0;

      // Act
      new ArrayValidator(value)
        .failures(failures)
        .field("itens")
        .some(predicate);

      // Assert
      expect(failures.length).toBe(1);
      expect(failures[0].code).toBe(FailureCode.MISSING_VALID_ITEM);
    });

    it("deve usar o código de erro personalizado", () => {
      // Arrange
      const failures: SimpleFailure[] = [];
      const value = [1, 3, 5, 7];
      const predicate = (item: number) => item % 2 === 0;
      const code = FailureCode.INVALID_VALUE_FORMAT;

      // Act
      new ArrayValidator(value)
        .failures(failures)
        .field("itens")
        .some(predicate, code);

      // Assert
      expect(failures.length).toBe(1);
      expect(failures[0].code).toBe(code);
    });

    it("deve incluir detalhes adicionais na falha", () => {
      // Arrange
      const failures: SimpleFailure[] = [];
      const value = [1, 3, 5, 7];
      const predicate = (item: number) => item % 2 === 0;
      const details = { message: "Pelo menos um item deve ser par" };

      // Act
      new ArrayValidator(value)
        .failures(failures)
        .field("itens")
        .some(predicate, FailureCode.MISSING_VALID_ITEM, details);

      // Assert
      expect(failures.length).toBe(1);
      expect(failures[0].details).toMatchObject(details);
    });
  });
});
