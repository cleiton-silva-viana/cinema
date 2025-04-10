import { v1, v4, v7 } from "uuid";
import {
  isNull,
  isEmpty,
  isBlank,
  isEqual,
  isBetween,
  isDateAfterLimit,
  isDateBeforeLimit,
  isMatch,
  isEmail,
  isUIDv4,
  isUIDv7,
  greaterThanOrEqualTo,
  lessThanOrEqualTo,
} from "./validator";

describe("Validation", () => {
  describe("isNull", () => {
    it("should return true", () => {
      const values = [null, undefined];
      values.forEach((value) => expect(isNull(value)).toBe(true));
    });

    it("should return false", () => {
      const values = ["", 1, new Date(0, 0, 0, 0, 0, 0, 0), [], {}];
      values.forEach((value) => expect(isNull(value)).toBe(false));
    });
  });

  describe("isEqual", () => {

    describe("Values considered equal (should return true)", () => {
      const date = new Date(); // Use the same Date instance for identity check

      const equalTestCases = [
        // Primitives
        { value1: "", value2: "", scenario: "empty strings" },
        { value1: "abc", value2: "abc", scenario: "identical strings" },
        { value1: " 14wd", value2: " 14wd", scenario: "identical strings with leading space" },
        { value1: 0, value2: 0, scenario: "number zero" },
        { value1: 123, value2: 123, scenario: "identical positive numbers" },
        { value1: -5, value2: -5, scenario: "identical negative numbers" },
        { value1: true, value2: true, scenario: "boolean true" },
        { value1: false, value2: false, scenario: "boolean false" },
        // Null / Undefined
        { value1: null, value2: null, scenario: "both null" },
        { value1: undefined, value2: undefined, scenario: "both undefined" },
        { value1: null, value2: undefined, scenario: "null vs undefined" },
        // Note: Per function logic, null and undefined are only equal to themselves
        // Dates
        { value1: date, value2: date, scenario: "same Date object instance" },
        { value1: new Date(2024, 0, 1), value2: new Date(2024, 0, 1), scenario: "different Date object instances with same value" },
        // Arrays (shallow and deep)
        { value1: [], value2: [], scenario: "empty arrays" },
        { value1: [1, 2, 3], value2: [1, 2, 3], scenario: "arrays with identical primitive numbers" },
        { value1: ["a", "b"], value2: ["a", "b"], scenario: "arrays with identical strings" },
        { value1: [null, undefined], value2: [null, undefined], scenario: "arrays with null and undefined" },
        { value1: [new Date(1), new Date(2)], value2: [new Date(1), new Date(2)], scenario: "arrays with identical dates" },
        { value1: [1, ["a", true]], value2: [1, ["a", true]], scenario: "nested arrays with identical values" },
      ];

      equalTestCases.forEach(({ value1, value2, scenario }) => {
        it(`should return true for ${scenario}`, () => {
          expect(isEqual(value1, value2)).toBe(true);
        });
      });
    });

    describe("Values considered unequal (should return false)", () => {
      const date1 = new Date(2024, 0, 1);
      const date2 = new Date(2024, 0, 2);

      const unequalTestCases = [
        // Primitives
        { value1: "", value2: " ", scenario: "empty string vs whitespace string" },
        { value1: "abc", value2: "ABC", scenario: "different case strings" },
        { value1: " 14wd", value2: "14wd ", scenario: "strings with different whitespace" },
        { value1: 1, value2: "1", scenario: "number vs string" },
        { value1: NaN, value2: NaN, scenario: "NaN vs NaN (strict equality fails)" },
        // Null / Undefined
        { value1: null, value2: 0, scenario: "null vs zero" },
        { value1: undefined, value2: "", scenario: "undefined vs empty string" },
        { value1: null, value2: false, scenario: "null vs false" },
        { value1: undefined, value2: false, scenario: "undefined vs false" },
        // Dates
        { value1: date1, value2: date2, scenario: "different Date values" },
        { value1: new Date(), value2: Date.now(), scenario: "Date object vs number (timestamp)" },
        { value1: new Date('invalid date'), value2: new Date('invalid date'), scenario: "invalid dates (NaN getTime)" },
        { value1: new Date(), value2: new Date('invalid date'), scenario: "valid date vs invalid date" },
        // Arrays
        { value1: [], value2: [1], scenario: "empty array vs non-empty array" },
        { value1: [1, 2, 3], value2: [1, 2, 4], scenario: "arrays with different number element" },
        { value1: [1, 2, 3], value2: [1, 3, 2], scenario: "arrays with same elements in different order" },
        { value1: [1, 2], value2: [1, 2, 3], scenario: "arrays with different lengths" },
        { value1: [1, ["a", true]], value2: [1, ["a", false]], scenario: "nested arrays with different boolean value" },
        { value1: [1, 2], value2: { 0: 1, 1: 2 }, scenario: "array vs array-like object" }, // Type mismatch handled
        { value1: [" "], value2: [""], scenario: "arrays with whitespace string vs empty string" },
        // Objects (not handled deeply by the function)
        { value1: {}, value2: {}, scenario: "empty objects (different instances)" },
        { value1: {a: 1}, value2: {a: 1}, scenario: "identical objects (different instances)" },
      ];

      unequalTestCases.forEach(({ value1, value2, scenario }) => {
        it(`should return false for ${scenario}`, () => {
          expect(isEqual(value1, value2)).toBe(false);
        });
      });
    });
  });

  describe("isEmpty", () => {

    describe("Values considered empty (should return true)", () => {
      const emptyTestCases = [
        { value: null, scenario: "null" },
        { value: undefined, scenario: "undefined" },
        { value: "", scenario: "empty string" },
        { value: "   ", scenario: "whitespace-only string" },
        { value: [], scenario: "empty array" },
      ];
      emptyTestCases.forEach(({ value, scenario }) => {
        it(`should return true for ${scenario}`, () => {
          expect(isEmpty(value)).toBe(true);
        });
      });
    });

    describe("Values not considered empty (should return false)", () => {
      const nonEmptyTestCases = [
        { value: "a", scenario: "non-empty string" },
        { value: " a ", scenario: "string with surrounding whitespace but content" },
        { value: [1], scenario: "non-empty array containing a number" },
        { value: ["a"], scenario: "non-empty array containing a string" },
        { value: [null], scenario: "non-empty array containing null" },
      ];
      nonEmptyTestCases.forEach(({ value, scenario }) => {
        it(`should return false for ${scenario}`, () => {
          expect(isEmpty(value)).toBe(false);
        });
      });
    });
  });

  describe("isDateAfterLimit", () => {
    const earlierDate = new Date(2023, 0, 1); // 1 de janeiro de 2023
    const laterDate = new Date(2023, 0, 2); // 2 de janeiro de 2023

    it("should return true when date is strictly after the limit", () => {
      expect(isDateAfterLimit(laterDate, earlierDate)).toBe(true);
    });

    it("should return false when date is equal to or before the limit", () => {
      expect(isDateAfterLimit(earlierDate, earlierDate)).toBe(false); // Igual
      expect(isDateAfterLimit(earlierDate, laterDate)).toBe(false); // Anterior
    });
  });

  describe("isDateBeforeLimit", () => {
    const earlierDate = new Date(2023, 0, 1); // 1 de janeiro de 2023
    const laterDate = new Date(2023, 0, 2); // 2 de janeiro de 2023

    it("should return true when date is strictly before the limit", () => {
      expect(isDateBeforeLimit(earlierDate, laterDate)).toBe(true);
    });

    it("should return false when date is equal to or after the limit", () => {
      expect(isDateBeforeLimit(laterDate, laterDate)).toBe(false); // Igual
      expect(isDateBeforeLimit(laterDate, earlierDate)).toBe(false); // Posterior
    });
  });

  describe("lessThanOrEqualTo", () => {
    const defaultMax = 10;

    describe("When value is a number", () => {
      describe("should return true when number value is less than or equal to max", () => {
        const validCases = [
          // Números <= max
          { value: 10, max: defaultMax, scenario: "number equal to max" },
          {
            value: 9.9,
            max: defaultMax,
            scenario: "number slightly below max",
          },
          {
            value: 0,
            max: defaultMax,
            scenario: "zero number below positive max",
          },
          {
            value: -5,
            max: defaultMax,
            scenario: "negative number below positive max",
          },
          {
            value: -2,
            max: -1,
            scenario: "negative number below negative max",
          },
          { value: 0, max: 0, scenario: "zero number equal to zero max" },
        ];
        validCases.forEach(({ value, max, scenario }) => {
          it(`${scenario}`, () => {
            expect(lessThanOrEqualTo(value, max)).toBe(true);
          });
        });
      });

      describe("should return false when number value is greater than max", () => {
        const invalidCases = [
          // Números > max
          {
            value: 10.1,
            max: defaultMax,
            scenario: "number slightly above max",
          },
          { value: 11, max: defaultMax, scenario: "number well above max" },
          { value: 1, max: 0, scenario: "positive number above zero max" },
          {
            value: -1,
            max: -2,
            scenario: "negative number above smaller negative max",
          },
          {
            value: Infinity,
            max: defaultMax,
            scenario: "positive infinity number above finite max",
          },
        ];
        invalidCases.forEach(({ value, max, scenario }) => {
          it(`${scenario}`, () => {
            expect(lessThanOrEqualTo(value as any, max as any)).toBe(false);
          });
        });
      });
    });

    describe("When value is a string", () => {

      describe("should return true when string length is less than or equal to max", () => {
        const validCases = [
          // Strings: length <= max
          {
            value: "1234567890",
            max: defaultMax,
            scenario: "string length equal to max (10)",
          },
          {
            value: "short",
            max: defaultMax,
            scenario: "string length (5) below max",
          },
          {
            value: "",
            max: defaultMax,
            scenario: "empty string length (0) below positive max",
          },
          {
            value: "",
            max: 0,
            scenario: "empty string length (0) equal to zero max",
          },
        ];
        validCases.forEach(({ value, max, scenario }) => {
          it(`${scenario}`, () => {
            expect(lessThanOrEqualTo(value, max)).toBe(true);
          });
        });
      });

      describe("should return false when string length is greater than max", () => {
        // length > max
        const invalidCases = [
          {
            value: "12345678901",
            max: defaultMax,
            scenario: "string length (11) above max (10)",
          },
          {
            value: "a",
            max: 0,
            scenario: "string length (1) above zero max",
          },
        ];
        invalidCases.forEach(({ value, max, scenario }) => {
          it(`${scenario}`, () => {
            expect(lessThanOrEqualTo(value as any, max as any)).toBe(false);
          });
        });
      });
    });

    describe("When value is an array", () => {

      describe(`should return true when array length is less than or equal to max`, () => {
        const validCases = [
          // Arrays: length <= max
          {
            value: Array(10).fill(1),
            max: defaultMax,
            scenario: "array length equal to max (10)",
          },
          {
            value: [1, 2, 3],
            max: defaultMax,
            scenario: "array length (3) below max",
          },
          {
            value: [],
            max: defaultMax,
            scenario: "empty array length (0) below positive max",
          },
          {
            value: [],
            max: 0,
            scenario: "empty array length (0) equal to zero max",
          },
        ];
        validCases.forEach(({ value, max, scenario }) => {
          it(`${scenario}`, () => {
            expect(lessThanOrEqualTo(value, max)).toBe(true);
          });
        });
      });

      describe("should return false when array length is greater than max", () => {
        const invalidCases = [
          // Arrays: length > max
          {
            value: Array(11).fill(1),
            max: defaultMax,
            scenario: "array length (11) above max (10)",
          },
          { value: [1], max: 0, scenario: "array length (1) above zero max" },
        ];

        invalidCases.forEach(({ value, max, scenario }) => {
          it(`${scenario}`, () => {
            expect(lessThanOrEqualTo(value as any, max as any)).toBe(false);
          });
        });
      });
    });

    describe("When value is an object", () => {

      describe("should return true when object key count is less than or equal to max", () => {
        const validCases = [
          // Objects: key count <= max
          {
            value: {
              a: 1,
              b: 2,
              c: 3,
              d: 4,
              e: 5,
              f: 6,
              g: 7,
              h: 8,
              i: 9,
              j: 10,
            },
            max: defaultMax,
            scenario: "object key count equal to max (10)",
          },
          {
            value: { name: "test" },
            max: defaultMax,
            scenario: "object key count (1) below max",
          },
          {
            value: {},
            max: defaultMax,
            scenario: "empty object key count (0) below positive max",
          },
          {
            value: {},
            max: 0,
            scenario: "empty object key count (0) equal to zero max",
          },
        ];

        validCases.forEach(({ value, max, scenario }) => {
          it(`${scenario}`, () => {
            expect(lessThanOrEqualTo(value, max)).toBe(true);
          });
        });
      });

      describe("should return false when object key count is greater than max", () => {
        const invalidCases = [
          {
            value: {
              a: 1,
              b: 2,
              c: 3,
              d: 4,
              e: 5,
              f: 6,
              g: 7,
              h: 8,
              i: 9,
              j: 10,
              k: 11,
            },
            max: defaultMax,
            scenario: "object key count (11) above max (10)",
          },
          {
            value: { a: 1 },
            max: 0,
            scenario: "object key count (1) above zero max",
          },
        ];

        invalidCases.forEach(({ value, max, scenario }) => {
          it(`${scenario}`, () => {
            expect(lessThanOrEqualTo(value as any, max as any)).toBe(false);
          });
        });
      });
    });

    describe("when handling invalid/unsupported values or invalid max argument", () => {

      describe("for invalid value states (NaN, null, undefined)", () => {
        const invalidValues = [
          { value: NaN, max: defaultMax, scenario: "NaN value" },
          { value: null, max: defaultMax, scenario: "null value" },
          { value: undefined, max: defaultMax, scenario: "undefined value" },
        ];
        invalidValues.forEach(({ value, max, scenario }) => {
          it(`${scenario}`, () => {
            expect(lessThanOrEqualTo(value as any, max as any)).toBe(false);
          });
        });
      });

      describe("for invalid min arguments", () => {
        const invalidMaxValues = [
          { value: 5, max: NaN, scenario: "NaN max" },
          { value: 5, max: Infinity, scenario: "Infinity max" }, // Incluído explicitamente
          { value: 5, max: -Infinity, scenario: "-Infinity max" }, // Incluído explicitamente
          { value: 5, max: undefined as any, scenario: "undefined max" },
          { value: 5, max: null as any, scenario: "null max" },
          { value: 5, max: "10" as any, scenario: "string max" },
          { value: 5, max: {} as any, scenario: "object max" },
        ];
        invalidMaxValues.forEach(({ value, max, scenario }) => {
          it(`${scenario}`, () => {
            expect(lessThanOrEqualTo(value as any, max as any)).toBe(false);
          });
        });
      });

      describe("for unsupported value types", () => {
        const invalidValues = [
          {
            value: true,
            max: defaultMax,
            scenario: "boolean value",
          },
          {
            value: () => {},
            max: defaultMax,
            scenario: "function value",
          },
        ];
        invalidValues.forEach(({ value, max, scenario }) => {
          it(`${scenario}`, () => {
            expect(lessThanOrEqualTo(value as any, max as any)).toBe(false);
          });
        });
      });
    });
  });

  describe("greaterThanOrEqualTo", () => {
    const defaultMin = 5;

    describe("When value is a number", () => {

      describe("should return true when number value is greater than or equal to min", () => {
        const validCases = [
          // Números >= min
          { value: 5, min: defaultMin, scenario: "number equal to min" },
          {
            value: 5.1,
            min: defaultMin,
            scenario: "number slightly above min",
          },
          { value: 10, min: defaultMin, scenario: "number well above min" },
          { value: 0, min: 0, scenario: "zero number equal to zero min" },
          { value: 0, min: -1, scenario: "zero number above negative min" },
          {
            value: -1,
            min: -2,
            scenario: "negative number above greater negative min",
          },
          {
            value: Infinity,
            min: defaultMin,
            scenario: "positive infinity number above finite min",
          },
        ];
        // Mantendo a estrutura de loop solicitada (it dentro de forEach)
        validCases.forEach(({ value, min, scenario }) => {
          it(`${scenario}`, () => {
            expect(greaterThanOrEqualTo(value, min)).toBe(true);
          });
        });
      });

      describe("should return false when number value is less than min", () => {
        const invalidCases = [
          // Números < min
          {
            value: 4.9,
            min: defaultMin,
            scenario: "number slightly below min",
          },
          { value: 4, min: defaultMin, scenario: "number well below min" },
          { value: -1, min: 0, scenario: "negative number below zero min" },
          {
            value: -3,
            min: -2,
            scenario: "negative number below greater negative min",
          },
          {
            value: -Infinity,
            min: defaultMin,
            scenario: "negative infinity number below finite min",
          },
        ];
        // Mantendo a estrutura de loop solicitada
        invalidCases.forEach(({ value, min, scenario }) => {
          it(`${scenario}`, () => {
            // Não precisa de 'as any' aqui se os tipos estiverem corretos
            expect(greaterThanOrEqualTo(value, min)).toBe(false);
          });
        });
      });
    });

    describe("When value is a string", () => {

      describe("should return true when string length is greater than or equal to min", () => {
        const validCases = [
          // Strings: length >= min
          {
            value: "abcde",
            min: defaultMin,
            scenario: "string length equal to min (5)",
          },
          {
            value: "abcdef",
            min: defaultMin,
            scenario: "string length (6) above min",
          },
          {
            value: "",
            min: 0,
            scenario: "empty string length (0) equal to zero min",
          },
          {
            value: "a",
            min: 1,
            scenario: "string length (1) equal to min (1)",
          },
        ];
        // Mantendo a estrutura de loop solicitada
        validCases.forEach(({ value, min, scenario }) => {
          it(`${scenario}`, () => {
            expect(greaterThanOrEqualTo(value, min)).toBe(true);
          });
        });
      });

      describe("should return false when string length is less than min", () => {
        const invalidCases = [
          // length < min
          {
            value: "abcd",
            min: defaultMin,
            scenario: "string length (4) below min (5)",
          },
          {
            value: "",
            min: 1,
            scenario: "empty string length (0) below min (1)",
          },
        ];
        // Mantendo a estrutura de loop solicitada
        invalidCases.forEach(({ value, min, scenario }) => {
          it(`${scenario}`, () => {
            expect(greaterThanOrEqualTo(value, min)).toBe(false);
          });
        });
      });
    });

    describe("When value is an array", () => {

      describe(`should return true when array length is greater than or equal to min`, () => {
        const validCases = [
          // Arrays: length >= min
          {
            value: Array(5).fill(1),
            min: defaultMin,
            scenario: "array length equal to min (5)",
          },
          {
            value: [1, 2, 3, 4, 5, 6],
            min: defaultMin,
            scenario: "array length (6) above min",
          },
          {
            value: [],
            min: 0,
            scenario: "empty array length (0) equal to zero min",
          },
          { value: [1], min: 1, scenario: "array length (1) equal to min (1)" },
        ];
        // Mantendo a estrutura de loop solicitada
        validCases.forEach(({ value, min, scenario }) => {
          it(`${scenario}`, () => {
            expect(greaterThanOrEqualTo(value, min)).toBe(true);
          });
        });
      });

      describe("should return false when array length is less than min", () => {
        const invalidCases = [
          // Arrays: length < min
          {
            value: Array(4).fill(1),
            min: defaultMin,
            scenario: "array length (4) below min (5)",
          },
          {
            value: [],
            min: 1,
            scenario: "empty array length (0) below min (1)",
          },
        ];
        invalidCases.forEach(({ value, min, scenario }) => {
          it(`${scenario}`, () => {
            expect(greaterThanOrEqualTo(value, min)).toBe(false);
          });
        });
      });
    });

    describe("When value is an object", () => {

      describe("should return true when object key count is greater than or equal to min", () => {
        const validCases = [
          // Objects: key count >= min
          {
            value: { a: 1, b: 2, c: 3, d: 4, e: 5 },
            min: defaultMin,
            scenario: "object key count equal to min (5)",
          },
          {
            value: { a: 1, b: 2, c: 3, d: 4, e: 5, f: 6 },
            min: defaultMin,
            scenario: "object key count (6) above min",
          },
          {
            value: {},
            min: 0,
            scenario: "empty object key count (0) equal to zero min",
          },
          {
            value: { k: 1 },
            min: 1,
            scenario: "object key count (1) equal to min (1)",
          },
        ];
        // Mantendo a estrutura de loop solicitada
        validCases.forEach(({ value, min, scenario }) => {
          it(`${scenario}`, () => {
            expect(greaterThanOrEqualTo(value, min)).toBe(true);
          });
        });
      });

      describe("should return false when object key count is less than min", () => {
        const invalidCases = [
          // Objects: key count < min
          {
            value: { a: 1, b: 2, c: 3, d: 4 },
            min: defaultMin,
            scenario: "object key count (4) below min (5)",
          },
          {
            value: {},
            min: 1,
            scenario: "empty object key count (0) below min (1)",
          },
        ];
        invalidCases.forEach(({ value, min, scenario }) => {
          it(`${scenario}`, () => {
            expect(greaterThanOrEqualTo(value, min)).toBe(false);
          });
        });
      });
    });

    describe("when handling invalid/unsupported values or invalid min argument", () => {
      describe("for invalid value states (NaN, null, undefined)", () => {
        const invalidValueCases = [
          { value: NaN, min: defaultMin, scenario: "NaN value" },
          { value: null, min: defaultMin, scenario: "null value" },
          { value: undefined, min: defaultMin, scenario: "undefined value" },
        ];
        invalidValueCases.forEach(({ value, min, scenario }) => {
          it(`${scenario}`, () => {
            expect(greaterThanOrEqualTo(value as any, min)).toBe(false);
          });
        });
      });

      describe("for invalid min arguments", () => {
        const invalidMinCases = [
          { value: 5, min: NaN, scenario: "NaN min" },
          { value: 5, min: Infinity, scenario: "Infinity min" },
          { value: 5, min: -Infinity, scenario: "-Infinity min" },
          { value: 5, min: undefined as any, scenario: "undefined min" },
          { value: 5, min: null as any, scenario: "null min" },
          { value: 5, min: "5" as any, scenario: "string min" },
          { value: 5, min: {} as any, scenario: "object min" },
        ];
        invalidMinCases.forEach(({ value, min, scenario }) => {
          it(`${scenario}`, () => {
            expect(greaterThanOrEqualTo(value, min as any)).toBe(false);
          });
        });
      });

      describe("for unsupported value types", () => {
        const unsupportedValueCases = [
          { value: true, min: defaultMin, scenario: "boolean value" },
          {
            value: () => {},
            min: defaultMin,
            scenario: "function value",
          },
        ];
        unsupportedValueCases.forEach(({ value, min, scenario }) => {
          it(`${scenario}`, () => {
            expect(greaterThanOrEqualTo(value as any, min)).toBe(false);
          });
        });
      });
    });
  });

  // TODO: Testar REDOS
  describe("isMatch", () => {
    it("should return true when value matches the regex", () => {
      expect(isMatch(new RegExp("^abc"), "abc123")).toBe(true);
      expect(isMatch(new RegExp("\\d+"), "123")).toBe(true);
    });

    it("should return false when value does not match the regex", () => {
      expect(isMatch(new RegExp("^abc"), "123abc")).toBe(false);
      expect(isMatch(new RegExp("\\d+"), "abc")).toBe(false);
    });
  });

  describe("isEmail", () => {
    describe("Valid Email Formats", () => {
      const validEmailTestCases = [
        {
          email: "standard@example.com",
          scenario: "standard email format",
        },
        {
          email: "complex.name+filter@subdomain.example.co.uk",
          scenario: "complex email with subdomains and filters",
        },
        {
          email: "numeric123@example.io",
          scenario: "email containing numbers",
        },
        {
          email: "with_underscore@example.org",
          scenario: "email containing underscore",
        },
      ];

      validEmailTestCases.forEach(({ email, scenario }) => {
        it(`should validate ${scenario}`, () => {
          expect(isEmail(email)).toBe(true);
        });
      });
    });

    describe("Invalid Email Formats", () => {
      const invalidEmailTestCases = [
        {
          email: "plainaddress",
          scenario: "missing @ and domain",
        },
        {
          email: "@missingusername.com",
          scenario: "missing username part",
        },
        {
          email: "user@.com",
          scenario: "missing domain name",
        },
        {
          email: "user@domain..com",
          scenario: "double dot in domain",
        },
        {
          email: "user@domain.c",
          scenario: "invalid top-level domain",
        },
        {
          email: "user@domain,com",
          scenario: "invalid character in domain",
        },
        {
          email: "",
          scenario: "empty string",
        },
        {
          email: "   ",
          scenario: "whitespace only",
        },
      ];

      invalidEmailTestCases.forEach(({ email, scenario }) => {
        it(`should reject email with ${scenario}`, () => {
          expect(isEmail(email)).toBe(false);
        });
      });
    });
  });

  describe("isBlank", () => {
    describe("Valid Blank Values", () => {
      const blankTestCases = [
        { value: null, scenario: "null" },
        { value: undefined, scenario: "undefined" },
        { value: "", scenario: "empty string" },
        { value: "   ", scenario: "whitespace-only string" },
        { value: [], scenario: "empty array" },
        { value: {}, scenario: "empty object" },
      ];

      blankTestCases.forEach(({ value, scenario }) => {
        it(`should return true for ${scenario}`, () => {
          expect(isBlank(value)).toBe(true);
        });
      });
    });

    describe("Invalid Blank Values", () => {
      const nonBlankTestCases = [
        { value: "a", scenario: "non-empty string" },
        { value: " a ", scenario: "string with surrounding whitespace" },
        { value: [1], scenario: "non-empty array" },
        { value: { a: 1 }, scenario: "non-empty object" },
        { value: 0, scenario: "number zero" },
        { value: false, scenario: "boolean false" },
        {
          value: () => {},
          scenario: "function",
        },
      ];

      nonBlankTestCases.forEach(({ value, scenario }) => {
        it(`should return false for ${scenario}`, () => {
          expect(isBlank(value)).toBe(false);
        });
      });
    });
  });

  describe("isBetween", () => {
    const defaultMin = 2;
    const defaultMax = 5;

    describe("when value is a number", () => {

      describe("should return true for numbers within range (inclusive)", () => {
        const validCases = [
          { value: defaultMin, scenario: "equal to min" },
          { value: 3, scenario: "integer within range" },
          { value: defaultMax, scenario: "equal to max" },
          { value: 2.1, scenario: "float within range (near min)" },
          { value: 4.9, scenario: "float within range (near max)" },
          { value: 0, min: 0, max: 0, scenario: "zero within [0, 0] range" },
          {
            value: -3,
            min: -5,
            max: -1,
            scenario: "negative within negative range",
          },
        ];
        validCases.forEach(
          ({ value, min: testMin = defaultMin, max: testMax = defaultMax, scenario }) => {
            it(scenario, () => {
              expect(isBetween(value, testMin, testMax)).toBe(true);
            })
          },
        );
      });

      describe("should return false for numbers outside range", () => {
        const invalidCases = [
          { value: 1, scenario: "integer below min" },
          { value: 1.99, scenario: "float below min" },
          { value: 6, scenario: "integer above max" },
          { value: 5.01, scenario: "float above max" },
          { value: Infinity, scenario: "Infinity above max" },
          { value: -Infinity, scenario: "Negative Infinity below min" },
          {
            value: 1,
            min: 0,
            max: 0,
            scenario: "positive outside [0, 0] range",
          },
          {
            value: -6,
            min: -5,
            max: -1,
            scenario: "negative outside negative range",
          },
        ];
        invalidCases.forEach(
          ({ value, min: testMin = defaultMin, max: testMax = defaultMax, scenario }) => {
            it(scenario,() => {
              expect(isBetween(value, testMin, testMax)).toBe(false);
            })
          },
        );
      });
    });

    describe("when value is a string", () => {

      describe("should return true when string length is within range", () => {
        const validCases = [
          {
            value: "ab",
            scenario: `length (${"ab".length}) equal to min (${defaultMin})`,
          },
          {
            value: "abc",
            scenario: `length (${"abc".length}) within range [${defaultMin}, ${defaultMax}]`,
          },
          {
            value: "abcde",
            scenario: `length (${"abcde".length}) equal to max (${defaultMax})`,
          },
        ];
        validCases.forEach(({ value, scenario }) => {
          it(scenario, () => {
            expect(isBetween(value, defaultMin, defaultMax)).toBe(true);
          })
        });
      });

      describe("should return false when string length is outside range", () => {
        const invalidCases = [
          {
            value: "a",
            scenario: `length (${"a".length}) below min (${defaultMin})`,
          },
          {
            value: "",
            scenario: `empty string length (${"".length}) below min (${defaultMin})`,
          },
          {
            value: "abcdef",
            scenario: `length (${"abcdef".length}) above max (${defaultMax})`,
          },
        ];
        invalidCases.forEach(({ value, scenario }) => {
          it(scenario, () => {
            expect(isBetween(value, defaultMin, defaultMax)).toBe(false);
          })
        });
      });
    });

    describe("when value is an array", () => {

      describe("should return true when array length is within range", () => {
        const validCases = [
          {
            value: [1, 2],
            scenario: `length (${[1, 2].length}) equal to min (${defaultMin})`,
          },
          {
            value: ["a", "b", "c"],
            scenario: `length (${["a", "b", "c"].length}) within range [${defaultMin}, ${defaultMax}]`,
          },
          {
            value: [{}, {}, {}, {}, {}],
            scenario: `length (${[{}, {}, {}, {}, {}].length}) equal to max (${defaultMax})`,
          },
        ];
        validCases.forEach(({ value, scenario }) => {
          it(scenario, () => {
            expect(isBetween(value, defaultMin, defaultMax)).toBe(true);
          })
        });
      });

      describe("should return false when array length is outside range", () => {
        const invalidCases = [
          {
            value: [true],
            scenario: `length (${[true].length}) below min (${defaultMin})`,
          },
          {
            value: [],
            scenario: `empty array length (${[].length}) below min (${defaultMin})`,
          },
          {
            value: [1, 2, 3, 4, 5, 6],
            scenario: `length (${[1, 2, 3, 4, 5, 6].length}) above max (${defaultMax})`,
          },
        ];
        invalidCases.forEach(({ value, scenario }) => {
          it(scenario, () => {
            expect(isBetween(value, defaultMin, defaultMax)).toBe(false);
          })
        });
      });
    });

    describe("handling invalid limit arguments", () => {

      describe("should return false when min/max arguments are invalid", () => {
        const sampleValue = 3;
        const invalidLimitArgsCases = [
          {
            min: 5,
            max: 2,
            scenario: "invalid range where min > max",
          },
          {
            min: NaN,
            max: defaultMax,
            scenario: "invalid range where min is NaN",
          },
          {
            min: defaultMin,
            max: NaN,
            scenario: "invalid range where max is NaN",
          },
          {
            min: "2" as any,
            max: defaultMax,
            scenario: "invalid range where min is string",
          },
          {
            min: defaultMin,
            max: null as any,
            scenario: "invalid range where max is null",
          },
          {
            min: undefined as any,
            max: defaultMax,
            scenario: "invalid range where min is undefined",
          },
          {
            min: defaultMin,
            max: {} as any,
            scenario: "invalid range where max is object",
          },
        ];
        invalidLimitArgsCases.forEach(({ min, max, scenario }) => {
          it(scenario, () => {
            expect(isBetween(sampleValue, min, max)).toBe(false);
          })
        });
      });
    });

    describe("handling unsupported value types", () => {

      describe("should return false for unsupported value types", () => {
        const unsupportedValueTypesCases = [
          // Casos onde o tipo do 'value' não é suportado
          { val: null, scenario: "unsupported value type: null" },
          { val: undefined, scenario: "unsupported value type: undefined" },
          { val: {}, scenario: "unsupported value type: object" },
          { val: true, scenario: "unsupported value type: boolean" },
          {
            val: () => {},
            scenario: "unsupported value type: function",
          },
        ];

        unsupportedValueTypesCases.forEach(({ val, scenario }) => {
          it(scenario, () => {
            expect(isBetween(val as any, defaultMin, defaultMax)).toBe(false);
          })
        });
      });
    });
  });

  describe("isUIDv4", () => {
    it("should return true for valid UUID v4", () => {
      const validUUID = v4();
      expect(isUIDv4(validUUID)).toBe(true);
    });

    describe("should return false for invalid formats, non-v4 UUIDs, or non-string types", () => {
      const invalidCases = [
        // UUID de outra versão válida
        {
          uuid: v7(),
          scenario: "Valid UUID v7",
        },
        {
          uuid: "not-a-uuid",
          scenario: "String not resembling UUID format",
        },
        {
          uuid: v1(),
          scenario: "UUID format with incorrect version (e.g., v1)",
        },
        {
          uuid: v7(),
          scenario: "UUID format with incorrect version (e.g., v7)",
        },
        {
          uuid: "123e4567-e89b-42d3-a456",
          scenario: "String too short",
        },
        {
          uuid: "123e4567-e89b-42d3-a456-4266141740001",
          scenario: "String too long",
        },
        {
          uuid: "123e4567-e89b-42d3-Z456-426614174000",
          scenario: "String with invalid characters (Z)",
        },
        {
          uuid: "",
          scenario: "Empty string",
        },
        {
          uuid: "   ",
          scenario: "Whitespace-only string",
        },
        {
          uuid: null,
          scenario: "Null value",
        },
        {
          uuid: undefined,
          scenario: "Undefined value",
        },
      ];
      invalidCases.forEach(({ uuid, scenario }) => {
        it(scenario, () => {
          expect(isUIDv4(uuid as any)).toBe(false);
        })
      });
    });
  });

  describe("isUIDv7", () => {
    it("should return true for valid UUID v7", () => {
      const validUUID = v7();
      expect(isUIDv7(validUUID)).toBe(true);
    });

    describe("should return false for invalid formats, non-v7 UUIDs, or non-string types", () => {
      const invalidCases = [
        {
          uuid: "not-a-uuid",
          scenario: "String not resembling UUID format",
        },
        {
          uuid: "018b9b4e-2c3d-8a4f-9b5c-6d7e8f9a0b1c",
          scenario: "UUID format with incorrect version (e.g., v8-like)",
        },
        {
          uuid: v4(),
          scenario: "UUID format with incorrect version (v4-like structure)",
        },
        {
          uuid: "018b9b4e-2c3d-7a4f-9b5c",
          scenario: "String too short",
        },
        {
          uuid: "018b9b4e-2c3d-7a4f-9b5c-6d7e8f9a0b1cx",
          scenario: "String too long",
        },
        {
          uuid: "018b9b4e-2c3d-7a4f-Xb5c-6d7e8f9a0b1c",
          scenario: "String with invalid characters (X)",
        },
        {
          uuid: "",
          scenario: "Empty string",
        },
        {
          uuid: "   ",
          scenario: "Whitespace-only string",
        },
        {
          uuid: null,
          scenario: "Null value",
        },
        {
          uuid: undefined,
          scenario: "Undefined value",
        },
      ];

      invalidCases.forEach(({ uuid, scenario }) => {
        it(scenario, () => {
          expect(isUIDv7(uuid as any)).toBe(false);
        })
      });
    });
  });
});
