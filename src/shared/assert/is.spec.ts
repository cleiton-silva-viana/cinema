import { is } from "./is";
import { Flow } from "./assert";
import { v4, v7 } from "uuid";

describe("is", () => { // Nome do describe mais específico

  describe('true', () => {
    const code = "ERR_TRUE";
    const valueValid = true;
    const valueInvalid = false;

    it("should return valid=true when value is true", () => {
      // Arrange
      const validation = is.true(valueValid, code);

      // Act
      const result = validation();

      // Assert
      expect(result.valid).toBe(true);
      expect(result.code).toBe(code);
      expect(result.flow).toBe(Flow.continue);
      expect(result.details).toEqual({});
    });

    it("should return valid=false with details when value is false", () => {
      // Arrange
      const extraDetails = { info: "additional data" };
      const validation = is.true(valueInvalid, code, extraDetails);

      // Act
      const result = validation();

      // Assert
      expect(result.valid).toBe(false);
      expect(result.code).toBe(code);
      expect(result.details).toEqual(extraDetails);
      expect(result.flow).toBe(Flow.continue);
    });

    it("should set flow to stop when specified", () => {
      // Arrange
      const validation = is.true(valueValid, code, {}, Flow.stop);

      // Act
      const result = validation();

      // Assert
      expect(result.flow).toBe(Flow.stop);
      expect(result.valid).toBe(true);
      expect(result.code).toBe(code);
    });
  });

  describe("equal", () => {
    const code = "ERR_EQUAL";
    const value = 5;
    const matchingTarget = 5;
    const differentTarget = 6;

    it("should return valid=true when values are equal", () => {
      // Arrange
      const expectedDetails = {
        value: JSON.stringify(value),
        target: JSON.stringify(matchingTarget)
      };
      const validation = is.equal(value, matchingTarget, code);

      // Act
      const result = validation();

      // Assert
      expect(result.valid).toBe(true);
      expect(result.code).toBe(code);
      expect(result.flow).toBe(Flow.continue);
      expect(result.details).toEqual(expectedDetails);
    });

    it("should return valid=false with details when values are different", () => {
      // Arrange
      const extraDetails = { info: "additional data" };
      const expectedDetails = {
        value: JSON.stringify(value),
        target: JSON.stringify(differentTarget),
        ...extraDetails,
      };
      const validation = is.equal(value, differentTarget, code, extraDetails);

      // Act
      const result = validation();

      // Assert
      expect(result.valid).toBe(false);
      expect(result.code).toBe(code);
      expect(result.details).toEqual(expectedDetails); // Verifica detalhes mesclados
      expect(result.flow).toBe(Flow.continue);
    });

    it("should set flow to stop when specified", () => {
      // Arrange
      const validation = is.equal(value, matchingTarget, code, {}, Flow.stop);

      // Act
      const result = validation();

      // Assert
      expect(result.flow).toBe(Flow.stop);
      expect(result.valid).toBe(true);
      expect(result.code).toBe(code);
    });
  });

  describe("between", () => {
    const min = 1;
    const max = 10;
    const code = "ERR_BETWEEN";
    const valueInRange = 5;
    const valueOutOfRange: any[] = [];

    it("should return valid=true when value is within range", () => {
      // Arrange
      const validation = is.between(valueInRange, min, max, code);

      // Act
      const result = validation();

      // Assert
      expect(result.valid).toBe(true);
      expect(result.code).toBe(code);
      expect(result.flow).toBe(Flow.continue);
    });

    it("should return valid=false with details when value is outside range", () => {
      // Arrange
      const expectedDetailsFail = { value: JSON.stringify(valueOutOfRange), min: min, max: max }; // Detalhes auto-adicionados
      const validation = is.between(valueOutOfRange, min, max, code);
      // Act
      const result = validation();
      // Assert
      expect(result.valid).toBe(false);
      expect(result.code).toBe(code);
      expect(result.details).toEqual(expectedDetailsFail);
      expect(result.flow).toBe(Flow.continue);
    });

    it("should set flow to stop when specified", () => {
      // Arrange
      const validation = is.between(valueInRange, min, max, code, {}, Flow.stop);
      // Act
      const result = validation();
      // Assert
      expect(result.flow).toBe(Flow.stop);
    });
  });

  describe("lessOrEqualTo", () => {
    const max = 10;
    const code = "ERR_LE";
    const valueValid = 5;
    const valueInvalid = 15;

    it("should return valid=true when value <= max", () => {
      // Arrange
      const validation = is.lessOrEqualTo(valueValid, max, code);

      // Act
      const result = validation();

      // Assert
      expect(result.valid).toBe(true);
      expect(result.code).toBe(code);
      expect(result.flow).toBe(Flow.continue);
    });

    it("should return valid=false with details when value > max", () => {
      // Arrange
      const expectedDetailsFail = { value: JSON.stringify(valueInvalid), max: max };
      const validation = is.lessOrEqualTo(valueInvalid, max, code);

      // Act
      const result = validation();

      // Assert
      expect(result.valid).toBe(false);
      expect(result.code).toBe(code);
      expect(result.details).toEqual(expectedDetailsFail);
      expect(result.flow).toBe(Flow.continue);
    });

    it("should set flow to stop when specified", () => {
      // Arrange
      const validation = is.lessOrEqualTo(valueValid, max, code, {}, Flow.stop);
      // Act
      const result = validation();
      // Assert
      expect(result.flow).toBe(Flow.stop);
    });
  });

  describe("greaterOrEqualTo", () => {
    const min = 5;
    const code = "ERR_GE";
    const valueValid = 10;
    const valueInvalid = 3;

    it("should return valid=true when value >= min", () => {
      // Arrange
      const validation = is.greaterOrEqualTo(valueValid, min, code);

      // Act
      const result = validation();

      // Assert
      expect(result.valid).toBe(true);
      expect(result.code).toBe(code);
      expect(result.flow).toBe(Flow.continue);
    });

    it("should return valid=false with details when value < min", () => {
      // Arrange
      const expectedDetailsFail = { value: JSON.stringify(valueInvalid), min: min };
      const validation = is.greaterOrEqualTo(valueInvalid, min, code);

      // Act
      const result = validation();

      // Assert
      expect(result.valid).toBe(false);
      expect(result.code).toBe(code);
      expect(result.details).toEqual(expectedDetailsFail);
      expect(result.flow).toBe(Flow.continue);
    });

    it("should set flow to stop when specified", () => {
      // Arrange
      const validation = is.greaterOrEqualTo(valueValid, min, code, {}, Flow.stop);
      // Act
      const result = validation();
      // Assert
      expect(result.flow).toBe(Flow.stop);
    });
  });

  describe("match", () => {
    const regex = /^[a-z]+$/;
    const code = "ERR_REGEX";
    const valueValid = "abc";
    const valueInvalid = "ABC123";
    const expectedDetailsFail = {};

    it("should return valid=true when string matches the regex", () => {
      // Arrange
      const validation = is.match(valueValid, regex, code);

      // Act
      const result = validation();

      // Assert
      expect(result.valid).toBe(true);
      expect(result.code).toBe(code);
      expect(result.flow).toBe(Flow.continue);
    });

    it("should return valid=false with details when string does not match", () => {
      // Arrange
      const validation = is.match(valueInvalid, regex, code);
      // Act
      const result = validation();
      // Assert
      expect(result.valid).toBe(false);
      expect(result.code).toBe(code);
      expect(result.details).toEqual(expectedDetailsFail);
      expect(result.flow).toBe(Flow.continue);
    });

    it("should set flow to stop when specified", () => {
      // Arrange
      const validation = is.match(valueValid, regex, code, {}, Flow.stop);
      // Act
      const result = validation();
      // Assert
      expect(result.flow).toBe(Flow.stop);
    });
  });

  describe("email", () => {
    const code = "ERR_EMAIL";
    const valueValid = "test@example.com";
    const valueInvalid = "invalid-email";
    const expectedDetailsFail = {};

    it("should return valid=true for a valid email", () => {
      // Arrange
      const validation = is.email(valueValid, code);
      // Act
      const result = validation();
      // Assert
      expect(result.valid).toBe(true);
      expect(result.code).toBe(code);
      expect(result.flow).toBe(Flow.continue);
    });

    it("should return valid=false with details for an invalid email", () => {
      // Arrange
      const validation = is.email(valueInvalid, code);
      // Act
      const result = validation();
      // Assert
      expect(result.valid).toBe(false);
      expect(result.code).toBe(code);
      expect(result.details).toEqual(expectedDetailsFail);
      expect(result.flow).toBe(Flow.continue);
    });

    it("should set flow to stop when specified", () => {
      // Arrange
      const validation = is.email(valueValid, code, {}, Flow.stop);
      // Act
      const result = validation();
      // Assert
      expect(result.flow).toBe(Flow.stop);
    });
  });

  describe("uidV4", () => {
    const code = "ERR_UUID";
    const valueValid = v4();
    const valueInvalid = "not-a-uuid";
    const expectedDetailsFail = {};

    it("should return valid=true for a valid UUIDv4", () => {
      // Arrange
      const validation = is.uidV4(valueValid, code);
      // Act
      const result = validation();
      // Assert
      expect(result.valid).toBe(true);
      expect(result.code).toBe(code);
      expect(result.flow).toBe(Flow.continue);
    });

    it("should return valid=false with details for an invalid UUIDv4", () => {
      // Arrange
      const validation = is.uidV4(valueInvalid, code);
      // Act
      const result = validation();
      // Assert
      expect(result.valid).toBe(false);
      expect(result.code).toBe(code);
      expect(result.details).toEqual(expectedDetailsFail);
      expect(result.flow).toBe(Flow.continue);
    });

    it("should set flow to stop when specified", () => {
      // Arrange
      const validation = is.uidV4(valueValid, code, {}, Flow.stop);
      // Act
      const result = validation();
      // Assert
      expect(result.flow).toBe(Flow.stop);
    });
  });

  describe("uidV7", () => {
    const code = "ERR_UUID";
    const valueValid = v7();
    const valueInvalid = "not-a-uuid";
    const expectedDetailsFail = {};

    it("should return valid=true for a valid UUIDv7", () => {
      // Arrange
      const validation = is.uidV7(valueValid, code);
      // Act
      const result = validation();
      // Assert
      expect(result.valid).toBe(true);
      expect(result.code).toBe(code);
      expect(result.flow).toBe(Flow.continue);
    });

    it("should return valid=false with details for an invalid UUIDv7", () => {
      // Arrange
      const validation = is.uidV7(valueInvalid, code);

      // Act
      const result = validation();

      // Assert
      expect(result.valid).toBe(false);
      expect(result.code).toBe(code);
      expect(result.details).toEqual(expectedDetailsFail);
      expect(result.flow).toBe(Flow.continue);
    });

    it("should set flow to stop when specified", () => {
      // Arrange
      const validation = is.uidV4(valueValid, code, {}, Flow.stop);

      // Act
      const result = validation();

      // Assert
      expect(result.flow).toBe(Flow.stop);
    });
  });

  describe("dateAfter", () => {
    const limitDate = new Date("2023-12-31T23:59:59.999Z");
    const valueValid = new Date("2024-01-01T00:00:00.000Z"); // After limit
    const valueInvalid = new Date("2023-01-01T00:00:00.000Z"); // Before limit
    const code = "ERR_DATE_AFTER";

    it("should return valid=true when date is after the limit date", () => {
      // Arrange
      const validation = is.dateAfter(valueValid, limitDate, code);
      // Act
      const result = validation();
      // Assert
      expect(result.valid).toBe(true);
      expect(result.code).toBe(code);
      expect(result.flow).toBe(Flow.continue);
    });

    it("should return valid=false with details when date is not after", () => {
      // Arrange
      // Usando um valor inválido (anterior) como caso representativo de falha
      const validation = is.dateAfter(valueInvalid, limitDate, code);
      const expectedDetailsFail = { value: valueInvalid.toISOString(), limitDate: limitDate.toISOString() };

      // Act
      const result = validation();

      // Assert
      expect(result.valid).toBe(false);
      expect(result.code).toBe(code);
      expect(result.details).toEqual(expectedDetailsFail);
      expect(result.flow).toBe(Flow.continue);
    });

    it("should set flow to stop when specified", () => {
      // Arrange
      const validation = is.dateAfter(valueValid, limitDate, code, {}, Flow.stop);
      // Act
      const result = validation();
      // Assert
      expect(result.flow).toBe(Flow.stop);
    });
  });

  describe('dateBefore', () => {
    const limitDate = new Date("2023-12-31T23:59:59.999Z");
    const valueValid = new Date("2023-01-01T00:00:00.000Z"); // Before limit
    const valueInvalid = new Date("2024-01-01T00:00:00.000Z"); // After limit
    const code = "ERR_DATE_BEFORE";

    it("should return valid=true when date is before the limit date", () => {
      // Arrange
      const validation = is.dateBefore(valueValid, limitDate, code);

      // Act
      const result = validation();

      // Assert
      expect(result.valid).toBe(true);
      expect(result.code).toBe(code);
      expect(result.flow).toBe(Flow.continue);
    });

    it("should return valid=false with details when date is not before", () => {
      // Arrange
      const validation = is.dateBefore(valueInvalid, limitDate, code);
      const expectedDetails = {
        value: valueInvalid.toISOString(),
        limitDate: limitDate.toISOString()
      };

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
      const validation = is.dateBefore(valueValid, limitDate, code, {}, Flow.stop);

      // Act
      const result = validation();

      // Assert
      expect(result.flow).toBe(Flow.stop);
    });
  });

  describe("array", () => {
    const code = "ERR_ARRAY";
    const valueValid = [1, 2, 3];
    const valueInvalid = "not-an-array";

    it("should return valid=true when value is an array", () => {
      // Arrange
      const validation = is.array(valueValid, code);

      // Act
      const result = validation();

      // Assert
      expect(result.valid).toBe(true);
      expect(result.code).toBe(code);
      expect(result.flow).toBe(Flow.continue);
      expect(result.details.value).toBe(JSON.stringify(valueValid));
    });

    it("should return valid=false when value is not an array", () => {
      // Arrange
      const validation = is.array(valueInvalid, code);

      // Act
      const result = validation();

      // Assert
      expect(result.valid).toBe(false);
      expect(result.code).toBe(code);
      expect(result.flow).toBe(Flow.continue);
      expect(result.details.value).toBe(JSON.stringify(valueInvalid));
    });

    it("should merge custom details", () => {
      // Arrange
      const extraDetails = { custom: "info" };
      const validation = is.array(valueValid, code, extraDetails);

      // Act
      const result = validation();

      // Assert
      expect(result.details.custom).toBe("info");
      expect(result.details.value).toBe(JSON.stringify(valueValid));
    });

    it("should set flow to stop when specified", () => {
      // Arrange
      const validation = is.array(valueValid, code, {}, Flow.stop);

      // Act
      const result = validation();

      // Assert
      expect(result.flow).toBe(Flow.stop);
    });
  });
});