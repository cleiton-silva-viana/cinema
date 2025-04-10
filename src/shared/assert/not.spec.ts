import { Flow } from "./assert";
import { not } from "./not";

describe("not", () => { // Nome do describe mais específico

  describe("null", () => {
    const code = "ERR_NOT_NULL";
    const valueNotNull = "hello";
    const valueNull = null;
    const extraDetails = { info: "additional data" };

    it("should return valid=true when value is NOT null", () => {
      // Arrange
      const validation = not.null(valueNotNull, code);
      const expectedDetails = {};

      // Act
      const result = validation();

      // Assert
      expect(result.valid).toBe(true); // Porque !isNull(valueNotNull) é true
      expect(result.code).toBe(code);
      expect(result.flow).toBe(Flow.continue);
      expect(result.details).toEqual(expectedDetails);
    });

    it("should return valid=false with details when value IS null", () => {
      // Arrange
      const expectedDetails = { ...extraDetails };
      const validation = not.null(valueNull, code, extraDetails);

      // Act
      const result = validation();

      // Assert
      expect(result.valid).toBe(false); // Porque !isNull(valueNull) é false
      expect(result.code).toBe(code);
      expect(result.details).toEqual(expectedDetails); // Verifica detalhes mesclados
      expect(result.flow).toBe(Flow.continue);
    });

    it("should set flow to stop when specified", () => {
      // Arrange
      const validation = not.null(valueNotNull, code, {}, Flow.stop);

      // Act
      const result = validation();

      // Assert
      expect(result.flow).toBe(Flow.stop);
      expect(result.valid).toBe(true);
      expect(result.code).toBe(code);
    });
  });

  describe("empty", () => {
    const code = "ERR_NOT_EMPTY";
    const valueNotEmpty = "hello";
    const valueEmpty = "";
    const valueEmptyArray: any[] = [];
    const extraDetails = { info: "additional data" };

    it("should return valid=true when value is NOT empty", () => {
      // Arrange
      const validation = not.empty(valueNotEmpty, code);
      const expectedDetails = {};

      // Act
      const result = validation();

      // Assert
      expect(result.valid).toBe(true);
      expect(result.code).toBe(code);
      expect(result.flow).toBe(Flow.continue);
      expect(result.details).toEqual(expectedDetails);
    });

    it("should return valid=false with details when value IS empty (string)", () => {
      // Arrange
      const expectedDetails = { ...extraDetails };
      const validation = not.empty(valueEmpty, code, extraDetails);

      // Act
      const result = validation();

      // Assert
      expect(result.valid).toBe(false);
      expect(result.code).toBe(code);
      expect(result.details).toEqual(expectedDetails);
      expect(result.flow).toBe(Flow.continue);
    });

    it("should return valid=false with details when value IS empty (array)", () => {
      // Arrange
      const expectedDetails = { ...extraDetails };
      const validation = not.empty(valueEmptyArray, code, extraDetails);

      // Act
      const result = validation();

      // Assert
      expect(result.valid).toBe(false);
      expect(result.code).toBe(code);
      expect(result.details).toEqual(expectedDetails);
      expect(result.flow).toBe(Flow.continue);
    });

    it("should set flow to stop when specified", () => {
      // Arrange
      const validation = not.empty(valueNotEmpty, code, {}, Flow.stop);

      // Act
      const result = validation();

      // Assert
      expect(result.flow).toBe(Flow.stop);
      expect(result.valid).toBe(true);
      expect(result.code).toBe(code);
    });
  });

  describe("blank", () => {
    const code = "ERR_NOT_BLANK"; // Código passado, mas ignorado pela implementação
    const valueNotBlank = "hello"; // Condição isBlank é falsa
    const valueBlank = "   ";     // Condição isBlank é verdadeira
    const valueNull = null;        // Condição isBlank é verdadeira

    it("should return valid=true when value is NOT blank", () => {
      // Arrange
      const validation = not.blank(valueNotBlank, code);

      // Act
      const result = validation();

      // Assert
      expect(result.valid).toBe(true);
      expect(result.code).toBe(code);
      expect(result.flow).toBe(Flow.continue);
      expect(result.details).toEqual({});
    });

    it("should return valid=false when value IS blank (spaces)", () => {
      // Arrange
      const validation = not.blank(valueBlank, code);

      // Act
      const result = validation();

      // Assert
      expect(result.valid).toBe(false);
      expect(result.code).toBe(code);
      expect(result.details).toEqual({});
      expect(result.flow).toBe(Flow.continue);
    });

    it("should return valid=false when value IS blank (null)", () => {
      // Arrange
      const validation = not.blank(valueNull, code);

      // Act
      const result = validation();

      // Assert
      expect(result.valid).toBe(false);
      expect(result.code).toBe(code);
      expect(result.details).toEqual({});
      expect(result.flow).toBe(Flow.continue);
    });
  });

  describe("lessOrEqualTo", () => {
    const max = 10;
    const code = "ERR_NOT_LE";
    const valueFailCondition = 15; // Valor > max (condição LE é falsa)
    const valuePassCondition = 5;  // Valor <= max (condição LE é verdadeira)
    const valuePassConditionEdge = 10; // Valor <= max (condição LE é verdadeira)
    const extraDetails = { info: "additional data" };

    it("should return valid=true when value is NOT less or equal to max (value > max)", () => {
      // Arrange
      const validation = not.lessOrEqualTo(valueFailCondition, max, code);
      const expectedDetails = { value: valueFailCondition, max: max };

      // Act
      const result = validation();

      // Assert
      expect(result.valid).toBe(true);
      expect(result.code).toBe(code);
      expect(result.flow).toBe(Flow.continue);
      expect(result.details).toEqual(expectedDetails);
    });

    it("should return valid=false with details when value IS less or equal to max", () => {
      // Arrange
      const expectedDetails = { value: valuePassCondition, max: max, ...extraDetails };
      const validation = not.lessOrEqualTo(valuePassCondition, max, code, extraDetails);

      // Act
      const result = validation();

      // Assert
      expect(result.valid).toBe(false);
      expect(result.code).toBe(code);
      expect(result.details).toEqual(expectedDetails);
      expect(result.flow).toBe(Flow.continue);
    });

    it("should return valid=false with details when value IS equal to max", () => {
      // Arrange
      const expectedDetails = { value: valuePassConditionEdge, max: max, ...extraDetails };
      const validation = not.lessOrEqualTo(valuePassConditionEdge, max, code, extraDetails);

      // Act
      const result = validation();

      // Assert
      expect(result.valid).toBe(false); // !lessThanOrEqualTo(10, 10) é false
      expect(result.code).toBe(code);
      expect(result.details).toEqual(expectedDetails);
      expect(result.flow).toBe(Flow.continue);
    });

    it("should set flow to stop when specified", () => {
      // Arrange
      const validation = not.lessOrEqualTo(valueFailCondition, max, code, {}, Flow.stop);

      // Act
      const result = validation();

      // Assert
      expect(result.flow).toBe(Flow.stop);
      expect(result.valid).toBe(true); // Resultado da validação ainda é true
      expect(result.code).toBe(code);
    });
  });

  describe("greaterOrEqualTo", () => {
    const min = 5;
    const code = "ERR_NOT_GE";
    const valueFailCondition = 3;  // Valor < min (condição GE é falsa)
    const valuePassCondition = 10; // Valor >= min (condição GE é verdadeira)
    const valuePassConditionEdge = 5; // Valor >= min (condição GE é verdadeira)
    const extraDetails = { info: "additional data" };

    it("should return valid=true when value is NOT greater or equal to min (value < min)", () => {
      // Arrange
      const validation = not.greaterOrEqualTo(valueFailCondition, min, code);
      const expectedDetails = { value: valueFailCondition, min: min };

      // Act
      const result = validation();

      // Assert
      expect(result.valid).toBe(true); // !greaterThanOrEqualTo(3, 5) é true
      expect(result.code).toBe(code);
      expect(result.flow).toBe(Flow.continue);
      expect(result.details).toEqual(expectedDetails);
    });

    it("should return valid=false with details when value IS greater or equal to min", () => {
      // Arrange
      const expectedDetails = { value: valuePassCondition, min: min, ...extraDetails };
      const validation = not.greaterOrEqualTo(valuePassCondition, min, code, extraDetails);

      // Act
      const result = validation();

      // Assert
      expect(result.valid).toBe(false); // !greaterThanOrEqualTo(10, 5) é false
      expect(result.code).toBe(code);
      expect(result.details).toEqual(expectedDetails);
      expect(result.flow).toBe(Flow.continue);
    });

    it("should return valid=false with details when value IS equal to min", () => {
      // Arrange
      const expectedDetails = { value: valuePassConditionEdge, min: min, ...extraDetails };
      const validation = not.greaterOrEqualTo(valuePassConditionEdge, min, code, extraDetails);

      // Act
      const result = validation();

      // Assert
      expect(result.valid).toBe(false); // !greaterThanOrEqualTo(5, 5) é false
      expect(result.code).toBe(code);
      expect(result.details).toEqual(expectedDetails);
      expect(result.flow).toBe(Flow.continue);
    });

    it("should set flow to stop when specified", () => {
      // Arrange
      const validation = not.greaterOrEqualTo(valueFailCondition, min, code, {}, Flow.stop);

      // Act
      const result = validation();

      // Assert
      expect(result.flow).toBe(Flow.stop);
      expect(result.valid).toBe(true); // Resultado da validação ainda é true
      expect(result.code).toBe(code);
    });
  });

  describe("dateAfter", () => {
    const limitDate = new Date("2023-12-31T23:59:59.999Z");
    const code = "ERR_NOT_DATE_AFTER";
    const valueFailCondition = new Date("2023-01-01T00:00:00.000Z"); // Data ANTES do limite (condição dateAfter é falsa)
    const valueFailConditionEdge = new Date("2023-12-31T23:59:59.999Z"); // Data IGUAL ao limite (condição dateAfter é falsa)
    const valuePassCondition = new Date("2024-01-01T00:00:00.000Z"); // Data DEPOIS do limite (condição dateAfter é verdadeira)
    const extraDetails = { info: "additional data" };

    it("should return valid=true when date is NOT after the limit date (is before)", () => {
      // Arrange
      const validation = not.dateAfter(valueFailCondition, limitDate, code);
      const expectedDetails = { value: valueFailCondition, limitDate: limitDate.toISOString() };

      // Act
      const result = validation();

      // Assert
      expect(result.valid).toBe(true);
      expect(result.code).toBe(code);
      expect(result.flow).toBe(Flow.continue);
      expect(result.details).toEqual(expectedDetails);
    });

    it("should return valid=true when date is NOT after the limit date (is equal)", () => {
      // Arrange
      const validation = not.dateAfter(valueFailConditionEdge, limitDate, code);
      const expectedDetails = { value: valueFailConditionEdge, limitDate: limitDate.toISOString() };

      // Act
      const result = validation();

      // Assert
      expect(result.valid).toBe(true);
      expect(result.code).toBe(code);
      expect(result.flow).toBe(Flow.continue);
      expect(result.details).toEqual(expectedDetails);
    });

    it("should return valid=false with details when date IS after the limit date", () => {
      // Arrange
      const expectedDetails = { value: valuePassCondition, limitDate: limitDate.toISOString(), ...extraDetails };
      const validation = not.dateAfter(valuePassCondition, limitDate, code, extraDetails);

      // Act
      const result = validation();

      // Assert
      expect(result.valid).toBe(false);
      expect(result.code).toBe(code);
      expect(result.details).toEqual(expectedDetails);
      expect(result.flow).toBe(Flow.continue);
    });

    it("should set flow to stop when specified", () => {
      // Arrange
      // Usando valueFailCondition para ter valid=true
      const validation = not.dateAfter(valueFailCondition, limitDate, code, {}, Flow.stop);

      // Act
      const result = validation();

      // Assert
      expect(result.flow).toBe(Flow.stop);
      expect(result.valid).toBe(true);
      expect(result.code).toBe(code);
    });
  });

  describe('dateBefore', () => {
    const limitDate = new Date("2023-12-31T23:59:59.999Z");
    const code = "ERR_NOT_DATE_BEFORE";
    const valueFailCondition = new Date("2024-01-01T00:00:00.000Z"); // Data DEPOIS do limite (condição dateBefore é falsa)
    const valueFailConditionEdge = new Date("2023-12-31T23:59:59.999Z"); // Data IGUAL ao limite (condição dateBefore é falsa)
    const valuePassCondition = new Date("2023-01-01T00:00:00.000Z"); // Data ANTES do limite (condição dateBefore é verdadeira)
    const extraDetails = { info: "additional data" };

    it("should return valid=true when date is NOT before the limit date (is after)", () => {
      // Arrange
      const validation = not.dateBefore(valueFailCondition, limitDate, code);
      const expectedDetails = { value: valueFailCondition, limitDate: limitDate.toISOString() };

      // Act
      const result = validation();

      // Assert
      expect(result.valid).toBe(true);
      expect(result.code).toBe(code);
      expect(result.flow).toBe(Flow.continue);
      expect(result.details).toEqual(expectedDetails);
    });

    it("should return valid=true when date is NOT before the limit date (is equal)", () => {
      // Arrange
      const validation = not.dateBefore(valueFailConditionEdge, limitDate, code);
      const expectedDetails = { value: valueFailConditionEdge, limitDate: limitDate.toISOString() };

      // Act
      const result = validation();

      // Assert
      expect(result.valid).toBe(true);
      expect(result.code).toBe(code);
      expect(result.flow).toBe(Flow.continue);
      expect(result.details).toEqual(expectedDetails);
    });


    it("should return valid=false with details when date IS before the limit date", () => {
      // Arrange
      const expectedDetails = { value: valuePassCondition, limitDate: limitDate.toISOString(), ...extraDetails };
      const validation = not.dateBefore(valuePassCondition, limitDate, code, extraDetails);

      // Act
      const result = validation();

      // Assert
      expect(result.valid).toBe(false);
      expect(result.code).toBe(code);
      expect(result.details).toEqual(expectedDetails);
      expect(result.flow).toBe(Flow.continue);
    });

    it("should set flow to stop when specified", () => {
      // Arrange
      const validation = not.dateBefore(valueFailCondition, limitDate, code, {}, Flow.stop);

      // Act
      const result = validation();

      // Assert
      expect(result.flow).toBe(Flow.stop);
      expect(result.valid).toBe(true);
      expect(result.code).toBe(code);
    });
  });
});