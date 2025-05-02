import { Email } from "./email";

describe("Email", () => {
  describe("create", () => {
    describe("should create a valid", () => {
      const successCases = [
        { email: "test@example.com", scenario: "with standard format" },
        { email: "user.name@domain.com", scenario: "with dots in local part" },
        { email: "user+tag@example.org", scenario: "with plus tag" },
        {
          email: "user@subdomain.example.co.uk",
          scenario: "with subdomain and country TLD",
        },
      ];

      successCases.forEach(({ email, scenario }) => {
        it(`Email object ${scenario}`, () => {
          // Act
          const result = Email.create(email);

          // Assert
          expect(result.invalid).toBe(false);
          expect(result.value).toBeInstanceOf(Email);
          expect(result.value.value).toBe(email);
        });
      });
    });

    describe("should fail to create an invalid", () => {
      const failureCases = [
        {
          email: null as unknown as string,
          scenario: "when email is null",
          errorCodeExpected: "FIELD_CANNOT_BE_NULL",
        },
        {
          email: undefined as unknown as string,
          scenario: "when email is undefined",
          errorCodeExpected: "FIELD_CANNOT_BE_NULL",
        },
        {
          email: "",
          scenario: "when email is empty",
          errorCodeExpected: "FIELD_CANNOT_BE_EMPTY",
        },
        {
          email: "plainaddress",
          scenario: "when email has no @ symbol",
          errorCodeExpected: "EMAIL_WITH_INVALID_FORMAT",
        },
        {
          email: "@missingusername.com",
          scenario: "when email has no username",
          errorCodeExpected: "EMAIL_WITH_INVALID_FORMAT",
        },
        {
          email: "user@",
          scenario: "when email has no domain",
          errorCodeExpected: "EMAIL_WITH_INVALID_FORMAT",
        },
        {
          email: "user@.com",
          scenario: "when email has no domain name",
          errorCodeExpected: "EMAIL_WITH_INVALID_FORMAT",
        },
        {
          email: "user@domain,com",
          scenario: "when email has invalid character in domain",
          errorCodeExpected: "EMAIL_WITH_INVALID_FORMAT",
        },
      ];

      failureCases.forEach(({ email, scenario, errorCodeExpected }) => {
        it(`Email object ${scenario}`, () => {
          // Act
          const result = Email.create(email);

          // Assert
          expect(result.invalid).toBe(true);
          expect(result.failures[0].code).toBe(errorCodeExpected);
        });
      });
    });
  });

  describe("hydrate", () => {
    it("should create an Email object without validation", () => {
      // Arrange
      const emailString = "test@example.com";

      // Act
      const hydratedEmail = Email.hydrate(emailString);

      // Assert
      expect(hydratedEmail).toBeInstanceOf(Email);
      expect(hydratedEmail.value).toBe(emailString);
    });

    it("should throw TechnicalError when email is null or undefined", () => {
      // Arrange
      const values = [null, undefined];

      // Act & Assert
      values.forEach((value) => {
        expect(() => {
          Email.hydrate(value);
        }).toThrow("NULL_ARGUMENT");
      });
    });
  });

  describe("equal", () => {
    it("should return true when emails are equal", () => {
      // Arrange
      const emailString = "test@example.com";
      const result1 = Email.create(emailString);
      const result2 = Email.create(emailString);

      // Assert
      expect(result1.value.equal(result2.value)).toBe(true);
    });

    it("should return false when emails are different", () => {
      // Arrange
      const result1 = Email.create("test1@example.com");
      const result2 = Email.create("test2@example.com");

      // Assert
      expect(result1.value.equal(result2.value)).toBe(false);
    });

    it("should return false when comparing with null", () => {
      // Arrange
      const result = Email.create("test@example.com");

      // Assert
      expect(result.value.equal(null)).toBe(false);
    });

    it("should return false when comparing with non-Email object", () => {
      // Arrange
      const result = Email.create("test@example.com");
      const notEmailObject = { value: "test@example.com" };

      // Assert
      expect(result.value.equal(notEmailObject as unknown as Email)).toBe(
        false,
      );
    });
  });
});
