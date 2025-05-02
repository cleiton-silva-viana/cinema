import { faker } from "@faker-js/faker/locale/pt_PT";
import { Customer } from "./customer";
import { Name } from "../../../shared/value-object/name";
import { Email } from "./value-object/email";
import { BirthDate } from "../../../shared/value-object/birth.date";
import { CustomerUID } from "./value-object/customer.uid";

describe("Customer", () => {
  const validName = faker.person.fullName();
  const validBirthDate = faker.date.between({
    from: new Date(1901, 0, 0),
    to: new Date(1969, 0, 0),
  });
  const validEmail = faker.internet.email();

  describe("Static Methods", () => {
    describe("create", () => {
      it("should create a valid customer", () => {
        // Act
        const result = Customer.create(validName, validBirthDate, validEmail);

        // Assert
        expect(result.invalid).toBe(false);
        expect(result.value.uid).toBeDefined();
        expect(result.value.name.value).toBe(validName);
        expect(result.value.email.value).toBe(validEmail);
        expect(result.value.birthDate.value).toEqual(validBirthDate);
      });

      [
        {
          name: "",
          description: "invalid name",
          expectedFailures: 1,
        },
        {
          email: "invalid_mail.com",
          description: "invalid email",
          expectedFailures: 1,
        },
        {
          birthDate: new Date(),
          description: "invalid birth date",
          expectedFailures: 1,
        },
        {
          name: "",
          email: "invalid_mail.com",
          description: "invalid name and email",
          expectedFailures: 2,
        },
        {
          name: "",
          birthDate: new Date(),
          description: "invalid name and birth date",
          expectedFailures: 2,
        },
        {
          email: "invalid_mail.com",
          birthDate: new Date(),
          description: "invalid email and birth date",
          expectedFailures: 2,
        },
        {
          name: "",
          email: "invalid_mail.com",
          birthDate: new Date(),
          description: "all fields invalid",
          expectedFailures: 3,
        },
      ].forEach((test) => {
        it(`should return failure for ${test.description}`, () => {
          // Arrange
          const name = test.name ?? validName;
          const birthDate = test.birthDate ?? validBirthDate;
          const email = test.email ?? validEmail;

          // Act
          const result = Customer.create(name, birthDate, email);

          // Assert
          expect(result.invalid).toBe(true);
          expect(result.failures).toHaveLength(test.expectedFailures);
        });
      });
    });

    describe("hydrate", () => {
      it("should restore a customer with provided data", () => {
        // Arrange
        const customerUid = CustomerUID.create().value;

        // Act
        const customer = Customer.hydrate(
          customerUid,
          validName,
          validBirthDate,
          validEmail,
        );

        // Assert
        expect(customer.uid.value).toBe(customerUid);
        expect(customer.name.value).toBe(validName);
        expect(customer.email.value).toBe(validEmail);
        expect(customer.birthDate.value).toEqual(validBirthDate);
      });

      it("should throw technical error for null values", () => {
        // Act & Assert
        expect(() =>
          Customer.hydrate(null, validName, validBirthDate, validEmail),
        ).toThrow("PROPERTIES_NOT_NULLABLES");
      });
    });
  });

  describe("Instance Methods", () => {
    let customer: Customer;
    let validNameVO: Name;
    let validEmailVO: Email;
    let validBirthDateVO: BirthDate;

    beforeEach(() => {
      customer = Customer.hydrate(
        "cus.123e4567-e89b-12d3-a456-426614174000",
        validName,
        validBirthDate,
        validEmail,
      );
      validNameVO = Name.hydrate(faker.person.firstName());
      validEmailVO = Email.hydrate(faker.internet.email());
      validBirthDateVO = BirthDate.hydrate(new Date("1995-01-01"));
    });

    describe("update", () => {
      it("should update with primitive values", () => {
        // Arrange
        const newName = faker.person.firstName();
        const newEmail = faker.internet.email();
        const newBirthDate = new Date("1995-01-01");

        const updates = {
          name: newName,
          email: newEmail,
          birthDate: newBirthDate,
        };

        // Act
        const result = customer.update(updates);

        // Assert
        expect(result.invalid).toBe(false);
        expect(customer.name.value).toBe(newName);
        expect(customer.email.value).toBe(newEmail);
        expect(customer.birthDate.value).toEqual(newBirthDate);
      });

      it("should update with value objects", () => {
        // Arrange
        const updates = {
          name: validNameVO,
          email: validEmailVO,
          birthDate: validBirthDateVO,
        };

        // Act
        const result = customer.update(updates);

        // Assert
        expect(result.invalid).toBe(false);
        expect(customer.name).toBe(validNameVO);
        expect(customer.email).toBe(validEmailVO);
        expect(customer.birthDate).toBe(validBirthDateVO);
      });

      it("should update partially", () => {
        // Arrange
        const originalEmail = customer.email;
        const originalBirthDate = customer.birthDate;
        const updates = {
          name: validNameVO,
        };

        // Act
        const result = customer.update(updates);

        // Assert
        expect(result.invalid).toBe(false);
        expect(customer.name).toBe(validNameVO);
        expect(customer.email).toBe(originalEmail);
        expect(customer.birthDate).toBe(originalBirthDate);
      });

      it("should fail with invalid data", () => {
        // Arrange
        const originalEmail = customer.email;
        const updates = {
          email: "invalid-email",
        };

        // Act
        const result = customer.update(updates);

        // Assert
        expect(result.invalid).toBe(true);
        expect(result.failures).toBeDefined();
        expect(result.failures).toHaveLength(1);
        expect(customer.email).toBe(originalEmail);
      });

      it("should apply all or nothing on multiple updates", () => {
        // Arrange
        const originalName = customer.name;
        const originalEmail = customer.email;
        const updates = {
          name: "a", // invalid name
          email: faker.internet.email(),
        };

        // Act
        const result = customer.update(updates);

        // Assert
        expect(result.invalid).toBe(true);
        expect(result.failures).toHaveLength(1);
        expect(customer.name).toBe(originalName);
        expect(customer.email).toBe(originalEmail);
      });

      it("should fail with no data to update", () => {
        // Arrange
        const updates = {};

        // Act
        const result = customer.update(updates);

        // Assert
        expect(result.invalid).toBe(true);
        expect(result.failures).toBeDefined();
        expect(result.failures).toHaveLength(1);
        expect(result.failures[0].code).toBe("ANY_DATA_IS_REQUIRED_FOR_UPDATE");
      });
    });
  });
});
