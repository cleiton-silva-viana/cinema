import { FailureCode } from "../failure/failure.codes.enum";
import { SimpleFailure } from "../failure/simple.failure.type";
import { DateValidator } from "./date.validator";

describe("DateValidator", () => {
  describe("Método isAfter", () => {
    it("não deve adicionar falha quando a data for posterior à data limite", () => {
      // Arrange
      const failures: SimpleFailure[] = [];
      const value = new Date("2023-02-01");
      const limitDate = new Date("2023-01-01");

      // Act
      new DateValidator(value)
        .failures(failures)
        .field("dataEvento")
        .isAfter(limitDate);

      // Assert
      expect(failures.length).toBe(0);
    });

    it("deve adicionar falha quando a data não for posterior à data limite", () => {
      // Arrange
      const failures: SimpleFailure[] = [];
      const value = new Date("2023-01-01");
      const limitDate = new Date("2023-02-01");

      // Act
      new DateValidator(value)
        .failures(failures)
        .field("dataEvento")
        .isAfter(limitDate);

      // Assert
      expect(failures.length).toBe(1);
      expect(failures[0].code).toBe(FailureCode.DATE_NOT_AFTER_LIMIT);
      expect(failures[0].details.value).toBe(value.toISOString());
      expect(failures[0].details.limitDate).toBe(limitDate.toISOString());
    });

    it("deve usar o código de erro personalizado", () => {
      // Arrange
      const failures: SimpleFailure[] = [];
      const value = new Date("2023-01-01");
      const limitDate = new Date("2023-02-01");
      const code = FailureCode.CONTENT_INVALID_TYPE;

      // Act
      new DateValidator(value)
        .failures(failures)
        .field("dataEvento")
        .isAfter(limitDate, code);

      // Assert
      expect(failures.length).toBe(1);
      expect(failures[0].code).toBe(code);
    });

    it("deve incluir detalhes adicionais na falha", () => {
      // Arrange
      const failures: SimpleFailure[] = [];
      const value = new Date("2023-01-01");
      const limitDate = new Date("2023-02-01");
      const details = { message: "Data deve ser posterior à data limite" };

      // Act
      new DateValidator(value)
        .failures(failures)
        .field("dataEvento")
        .isAfter(limitDate, FailureCode.DATE_NOT_AFTER_LIMIT, details);

      // Assert
      expect(failures.length).toBe(1);
      expect(failures[0].details.message).toBe(details.message);
      expect(failures[0].details.value).toBe(value.toISOString());
      expect(failures[0].details.limitDate).toBe(limitDate.toISOString());
    });
  });

  describe("Método isBefore", () => {
    it("não deve adicionar falha quando a data for anterior à data limite", () => {
      // Arrange
      const failures: SimpleFailure[] = [];
      const value = new Date("2023-01-01");
      const limitDate = new Date("2023-02-01");

      // Act
      new DateValidator(value)
        .failures(failures)
        .field("dataEvento")
        .isBefore(limitDate);

      // Assert
      expect(failures.length).toBe(0);
    });

    it("deve adicionar falha quando a data não for anterior à data limite", () => {
      // Arrange
      const failures: SimpleFailure[] = [];
      const value = new Date("2023-02-01");
      const limitDate = new Date("2023-01-01");

      // Act
      new DateValidator(value)
        .failures(failures)
        .field("dataEvento")
        .isBefore(limitDate);

      // Assert
      expect(failures.length).toBe(1);
      expect(failures[0].code).toBe(FailureCode.DATE_NOT_BEFORE_LIMIT);
      expect(failures[0].details.value).toBe(value.toISOString());
      expect(failures[0].details.limitDate).toBe(limitDate.toISOString());
    });

    it("deve usar o código de erro personalizado", () => {
      // Arrange
      const failures: SimpleFailure[] = [];
      const value = new Date("2023-02-01");
      const limitDate = new Date("2023-01-01");
      const code = FailureCode.CONTENT_INVALID_TYPE;

      // Act
      new DateValidator(value)
        .failures(failures)
        .field("dataEvento")
        .isBefore(limitDate, code);

      // Assert
      expect(failures.length).toBe(1);
      expect(failures[0].code).toBe(code);
    });

    it("deve incluir detalhes adicionais na falha", () => {
      // Arrange
      const failures: SimpleFailure[] = [];
      const value = new Date("2023-02-01");
      const limitDate = new Date("2023-01-01");
      const details = { message: "Data deve ser anterior à data limite" };

      // Act
      new DateValidator(value)
        .failures(failures)
        .field("dataEvento")
        .isBefore(limitDate, FailureCode.DATE_NOT_BEFORE_LIMIT, details);

      // Assert
      expect(failures.length).toBe(1);
      expect(failures[0].details.message).toBe(details.message);
      expect(failures[0].details.value).toBe(value.toISOString());
      expect(failures[0].details.limitDate).toBe(limitDate.toISOString());
    });
  });

  describe("Método isBetween", () => {
    it("não deve adicionar falha quando a data estiver dentro do intervalo", () => {
      // Arrange
      const failures: SimpleFailure[] = [];
      const value = new Date("2023-02-01");
      const startDate = new Date("2023-01-01");
      const endDate = new Date("2023-03-01");

      // Act
      new DateValidator(value)
        .failures(failures)
        .field("dataEvento")
        .isBetween(startDate, endDate);

      // Assert
      expect(failures.length).toBe(0);
    });

    it("não deve adicionar falha quando a data for igual à data de início", () => {
      // Arrange
      const failures: SimpleFailure[] = [];
      const value = new Date("2023-01-01");
      const startDate = new Date("2023-01-01");
      const endDate = new Date("2023-03-01");

      // Act
      new DateValidator(value)
        .failures(failures)
        .field("dataEvento")
        .isBetween(startDate, endDate);

      // Assert
      expect(failures.length).toBe(0);
    });

    it("não deve adicionar falha quando a data for igual à data de fim", () => {
      // Arrange
      const failures: SimpleFailure[] = [];
      const value = new Date("2023-03-01");
      const startDate = new Date("2023-01-01");
      const endDate = new Date("2023-03-01");

      // Act
      new DateValidator(value)
        .failures(failures)
        .field("dataEvento")
        .isBetween(startDate, endDate);

      // Assert
      expect(failures.length).toBe(0);
    });

    it("deve adicionar falha quando a data for anterior à data de início", () => {
      // Arrange
      const failures: SimpleFailure[] = [];
      const value = new Date("2022-12-31");
      const startDate = new Date("2023-01-01");
      const endDate = new Date("2023-03-01");

      // Act
      new DateValidator(value)
        .failures(failures)
        .field("dataEvento")
        .isBetween(startDate, endDate);

      // Assert
      expect(failures.length).toBe(1);
      expect(failures[0].code).toBe(FailureCode.DATE_OUT_OF_RANGE);
      expect(failures[0].details.value).toBe(value.toISOString());
      expect(failures[0].details.startDate).toBe(startDate.toISOString());
      expect(failures[0].details.endDate).toBe(endDate.toISOString());
    });

    it("deve adicionar falha quando a data for posterior à data de fim", () => {
      // Arrange
      const failures: SimpleFailure[] = [];
      const value = new Date("2023-03-02");
      const startDate = new Date("2023-01-01");
      const endDate = new Date("2023-03-01");

      // Act
      new DateValidator(value)
        .failures(failures)
        .field("dataEvento")
        .isBetween(startDate, endDate);

      // Assert
      expect(failures.length).toBe(1);
      expect(failures[0].code).toBe(FailureCode.DATE_OUT_OF_RANGE);
      expect(failures[0].details.value).toBe(value.toISOString());
      expect(failures[0].details.startDate).toBe(startDate.toISOString());
      expect(failures[0].details.endDate).toBe(endDate.toISOString());
    });

    it("deve usar o código de erro personalizado", () => {
      // Arrange
      const failures: SimpleFailure[] = [];
      const value = new Date("2023-03-02");
      const startDate = new Date("2023-01-01");
      const endDate = new Date("2023-03-01");
      const code = FailureCode.CONTENT_INVALID_TYPE;

      // Act
      new DateValidator(value)
        .failures(failures)
        .field("dataEvento")
        .isBetween(startDate, endDate, code);

      // Assert
      expect(failures.length).toBe(1);
      expect(failures[0].code).toBe(code);
    });

    it("deve incluir detalhes adicionais na falha", () => {
      // Arrange
      const failures: SimpleFailure[] = [];
      const value = new Date("2023-03-02");
      const startDate = new Date("2023-01-01");
      const endDate = new Date("2023-03-01");
      const details = { message: "Data fora do período permitido" };

      // Act
      new DateValidator(value)
        .failures(failures)
        .field("dataEvento")
        .isBetween(startDate, endDate, FailureCode.DATE_OUT_OF_RANGE, details);

      // Assert
      expect(failures.length).toBe(1);
      expect(failures[0].details.message).toBe(details.message);
      expect(failures[0].details.value).toBe(value.toISOString());
      expect(failures[0].details.startDate).toBe(startDate.toISOString());
      expect(failures[0].details.endDate).toBe(endDate.toISOString());
    });
  });
});