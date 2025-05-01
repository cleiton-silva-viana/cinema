import { Name } from "./name";
import { TechnicalError } from "../error/technical.error";
import { faker } from "@faker-js/faker";
import { FailureCode } from "../failure/failure.codes.enum";

describe("Name", () => {
  describe("create", () => {
    describe("should create a valid", () => {
      const successCases = [
        { name: "john", scenario: "with minimum length" },
        { name: "mark", scenario: "with another valid name" },
        { name: "Sérgio", scenario: "with brazillian name" },
        {
          name: "Mary Jane Watson Parker",
          scenario: "with multiple compound name",
        },
        {
          name: faker.string.alpha(50),
          scenario: "with maximum length",
        },
      ];

      successCases.forEach(({ name, scenario }) => {
        it(`Name object ${scenario}`, () => {
          // Act
          const result = Name.create(name);

          // Assert
          expect(result.value.value).toBe(name);
        });
      });
    });

    describe("should fail to create an invalid", () => {
      const failureCases = [
        {
          name: null as unknown as string,
          scenario: "when name is null",
          errorCodeExpected: FailureCode.NULL_ARGUMENT,
        },
        {
          name: undefined as unknown as string,
          scenario: "when name is undefined",
          errorCodeExpected: FailureCode.NULL_ARGUMENT,
        },
        {
          name: "",
          scenario: "when name is empty",
          errorCodeExpected: FailureCode.EMPTY_FIELD,
        },
        {
          name: "ab",
          scenario: "when name is too short",
          errorCodeExpected: FailureCode.INVALID_FIELD_SIZE,
        },
        {
          name: faker.string.alphanumeric(51),
          scenario: "when name is too long",
          errorCodeExpected: FailureCode.INVALID_FIELD_SIZE,
        },
        {
          name: "john123",
          scenario: "when name contains invalid characters",
          errorCodeExpected: FailureCode.INVALID_NAME_FORMAT,
        },
        {
          name: "John #$$",
          scenario: "when name contains special characters",
          errorCodeExpected: FailureCode.INVALID_NAME_FORMAT,
        },
      ];

      failureCases.forEach(({ name, scenario, errorCodeExpected }) => {
        it(`Name object ${scenario}`, () => {
          // Act
          const result = Name.create(name);
          const failures = result.failures;

          // Assert
          expect(failures.length).toBe(1);
          expect(failures[0].code).toBe(errorCodeExpected);
        });
      });
    });
  });

  describe("hydrate", () => {
    it("should create a Name object without validation", () => {
      // Arrange
      const nameString = faker.person.firstName();

      // Act
      const result = Name.hydrate(nameString);

      // Assert
      expect(result).toBeInstanceOf(Name);
      expect(result.value).toBe(nameString);
    });

    it("should throw an error when name is null or undefined", () => {
      // Arrange
      const values: any[] = [null, undefined];

      // Act
      values.forEach((value) => {
        expect(() => Name.hydrate(value as any)).toThrow(TechnicalError);
      });
    });
  });

  describe("equal", () => {
    it("should return true when names are equal", () => {
      // Arrange
      const nameString = faker.person.firstName();
      const result1 = Name.create(nameString);
      const result2 = Name.create(nameString);

      // Assert
      expect(result1.value.equal(result2.value)).toBe(true);
    });

    it("should return false when names are different", () => {
      // Arrange
      const result1 = Name.create(faker.person.firstName());
      const result2 = Name.create(faker.person.firstName());

      // Assert
      expect(result1.value.equal(result2.value)).toBe(false);
    });

    it("should return false when comparing with non-Name object", () => {
      // Arrange
      const result = Name.create("john");
      const notNameObject = { name: "john" };

      // Assert
      expect(result.value.equal(notNameObject as any)).toBe(false);
    });
  });
});
