import { faker } from "@faker-js/faker/locale/pt_PT";
import { Customer } from "./customer";
import { Name } from "../../../shared/value-object/name";
import { Email } from "./value-object/email";
import { BirthDate } from "../../../shared/value-object/birth.date";
import { CustomerUID } from "./value-object/customer.uid";
import { FailureCode } from "../../../shared/failure/failure.codes.enum";

describe("Customer", () => {
  const NAME = faker.person.fullName();
  const BIRTH_DATE = faker.date.birthdate({ mode: "age", min: 18, max: 90 });
  const EMAIL = faker.internet.email();

  describe("Métodos Estáticos", () => {
    describe("create", () => {
      it("deve criar um cliente válido", () => {
        // Act
        const result = Customer.create(NAME, BIRTH_DATE, EMAIL);

        // Assert
        expect(result.invalid).toBe(false);
        expect(result.value.uid).toBeDefined();
        expect(result.value.name.value).toBe(NAME);
        expect(result.value.email.value).toBe(EMAIL);
        expect(result.value.birthDate.value).toEqual(BIRTH_DATE);
      });

      describe("deve falhar ao criar um cliente com dados inválidos", () => {
        const failureCases = [
          {
            name: "",
            birthDate: BIRTH_DATE,
            email: EMAIL,
            description: "quando nome é inválido",
            expectedFailures: 1,
          },
          {
            name: NAME,
            birthDate: BIRTH_DATE,
            email: "invalid_mail.com",
            description: "quando email é inválido",
            expectedFailures: 1,
          },
          {
            name: NAME,
            birthDate: new Date(),
            email: EMAIL,
            description: "quando data de nascimento é inválida",
            expectedFailures: 1,
          },
          {
            name: "",
            birthDate: BIRTH_DATE,
            email: "invalid_mail.com",
            description: "quando nome e email são inválidos",
            expectedFailures: 2,
          },
          {
            name: NAME,
            birthDate: new Date(),
            email: "invalid_mail.com",
            description: "quando email e data de nascimento são inválidos",
            expectedFailures: 2,
          },
          {
            name: "",
            birthDate: new Date(),
            email: "invalid_mail.com",
            description: "quando todos os campos são inválidos",
            expectedFailures: 3,
          },
        ];

        failureCases.forEach(
          ({ name, birthDate, email, description, expectedFailures }) => {
            it(description, () => {
              // Act
              const result = Customer.create(name, birthDate, email);

              // Assert
              expect(result.invalid).toBe(true);
              expect(result.failures).toHaveLength(expectedFailures);
            });
          },
        );
      });
    });

    describe("hydrate", () => {
      it("deve criar um objeto Customer sem validação", () => {
        // Arrange
        const customerUid = CustomerUID.create().value;

        // Act
        const customer = Customer.hydrate(customerUid, NAME, BIRTH_DATE, EMAIL);

        // Assert
        expect(customer).toBeInstanceOf(Customer);
        expect(customer.uid.value).toBe(customerUid);
        expect(customer.name.value).toBe(NAME);
        expect(customer.email.value).toBe(EMAIL);
        expect(customer.birthDate.value).toEqual(BIRTH_DATE);
      });

      it("deve lançar TechnicalError quando algum valor é nulo", () => {
        // Act & Assert
        expect(() => Customer.hydrate(null, NAME, BIRTH_DATE, EMAIL)).toThrow(
          FailureCode.NULL_ARGUMENT,
        );
      });
    });
  });

  describe("Métodos de Instância", () => {
    describe("update", () => {
      let validNameVO = Name.hydrate(faker.person.firstName())
      let validEmailVO = Email.hydrate(faker.internet.email())
      let validBirthDateVO = BirthDate.hydrate(new Date(BIRTH_DATE))
      let customer = Customer.hydrate(
        CustomerUID.create().value,
        NAME,
        BIRTH_DATE,
        EMAIL
      );

      describe("deve atualizar um cliente com sucesso", () => {
        it("com valores primitivos - nome", () => {
          // Arrange
          const newName = faker.person.firstName();
          const updates = { name: newName };
          
          // Act
          const result = customer.update(updates);
          
          // Assert
          expect(result.invalid).toBe(false);
          expect(result.value).toBeInstanceOf(Customer);
          expect(result.value.name.value).toBe(newName);
          expect(result.value.email).toBe(customer.email);
          expect(result.value.birthDate).toBe(customer.birthDate);
        });
        
        it("com valores primitivos - email", () => {
          // Arrange
          const newEmail = faker.internet.email();
          const updates = { email: newEmail };
          
          // Act
          const result = customer.update(updates);
          
          // Assert
          expect(result.invalid).toBe(false);
          expect(result.value).toBeInstanceOf(Customer);
          expect(result.value.name).toBe(customer.name);
          expect(result.value.email.value).toBe(newEmail);
          expect(result.value.birthDate).toBe(customer.birthDate);
        });
        
        it("com valores primitivos - data de nascimento", () => {
          // Arrange
          const newBirthDate = new Date("1995-01-01");
          const updates = { birthDate: newBirthDate };
          
          // Act
          const result = customer.update(updates);
          
          // Assert
          expect(result.invalid).toBe(false);
          expect(result.value).toBeInstanceOf(Customer);
          expect(result.value.name).toBe(customer.name);
          expect(result.value.email).toBe(customer.email);
          expect(result.value.birthDate.value).toEqual(newBirthDate);
        });

        it("com valores primitivos - todos os campos", () => {
          // Arrange
          const newName = faker.person.firstName();
          const newEmail = faker.internet.email();
          const newBirthDate = new Date("1995-01-01");
          const updates = { 
            name: newName,
            email: newEmail,
            birthDate: newBirthDate
          };
          
          // Act
          const result = customer.update(updates);
          
          // Assert
          expect(result.invalid).toBe(false);
          expect(result.value).toBeInstanceOf(Customer);
          expect(result.value.name.value).toBe(newName);
          expect(result.value.email.value).toBe(newEmail);
          expect(result.value.birthDate.value).toEqual(newBirthDate);
        });
        
        it("com objetos de valor - nome", () => {
          // Arrange
          const updates = { name: validNameVO };
          
          // Act
          const result = customer.update(updates);
          
          // Assert
          expect(result.invalid).toBe(false);
          expect(result.value).toBeInstanceOf(Customer);
          expect(result.value.name).toBe(validNameVO);
          expect(result.value.email).toBe(customer.email);
          expect(result.value.birthDate).toBe(customer.birthDate);
        });
        
        it("com objetos de valor - email", () => {
          // Arrange
          const updates = { email: validEmailVO };
          
          // Act
          const result = customer.update(updates);
          
          // Assert
          expect(result.invalid).toBe(false);
          expect(result.value).toBeInstanceOf(Customer);
          expect(result.value.name).toBe(customer.name);
          expect(result.value.email).toBe(validEmailVO);
          expect(result.value.birthDate).toBe(customer.birthDate);
        });
        
        it("com objetos de valor - data de nascimento", () => {
          // Arrange
          const updates = { birthDate: validBirthDateVO };
          
          // Act
          const result = customer.update(updates);
          
          // Assert
          expect(result.invalid).toBe(false);
          expect(result.value).toBeInstanceOf(Customer);
          expect(result.value.name).toBe(customer.name);
          expect(result.value.email).toBe(customer.email);
          expect(result.value.birthDate).toBe(validBirthDateVO);
        });
        
        it("com objetos de valor - todos os campos", () => {
          // Arrange
          const updates = { 
            name: validNameVO,
            email: validEmailVO,
            birthDate: validBirthDateVO
          };
          
          // Act
          const result = customer.update(updates);
          
          // Assert
          expect(result.invalid).toBe(false);
          expect(result.value).toBeInstanceOf(Customer);
          expect(result.value.name).toBe(validNameVO);
          expect(result.value.email).toBe(validEmailVO);
          expect(result.value.birthDate).toBe(validBirthDateVO);
        });
      });

      describe("deve falhar ao atualizar com dados inválidos", () => {
        const failureCases = [
          {
            scenario: "quando email é inválido",
            updates: {
              email: "invalid-email",
            }
          },
          {
            scenario: "quando nome é inválido e email é válido (tudo ou nada)",
            updates: {
              name: "a", // nome inválido
              email: faker.internet.email(),
            }
          },
        ];
        failureCases.forEach(
          ({ scenario, updates }) => {
            it(scenario, () => {
              // Arrange
              const originalName = customer.name;
              const originalEmail = customer.email;
              const originalBirthDate = customer.birthDate;

              // Act
              const result = customer.update(updates);

              // Assert
              expect(result.invalid).toBe(true);
              expect(customer.name).toBe(originalName);
              expect(customer.email).toBe(originalEmail);
              expect(customer.birthDate).toBe(originalBirthDate);
            });
          },
        );
      });

      it('deve falhar quando receber um objeto nulo', () => {
        // Act
        const result = customer.update(null)

        // Assert
        expect(result.invalid).toBe(true);
        expect(result.failures).toBeDefined();
        expect(result.failures.length).toBe(1)
        expect(result.failures[0].code).toBe(FailureCode.NULL_ARGUMENT)
      })
    });
  });
});
