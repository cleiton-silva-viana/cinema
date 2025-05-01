import { Person } from "./person";
import { faker } from "@faker-js/faker";

describe("Person", () => {
  const fullName = faker.person.firstName();
  const birthDate = faker.date.between({
    from: new Date(1940, 0, 1),
    to: new Date(2005, 0, 1),
  });

  describe("Static Methods", () => {
    describe("create", () => {
      it("deve criar uma pessoa válida", () => {
        // Act
        const result = Person.create(fullName, birthDate);

        // Assert
        expect(result.invalid).toBe(false);
        const person = result.value;
        expect(person.name.value).toBe(fullName);
        expect(person.birthDate.value.toISOString()).toEqual(
          birthDate.toISOString(),
        );
      });

      it("deve falhar ao criar pessoa com nome inválido", () => {
        // Arrange
        const invalidName = "";

        // Act
        const result = Person.create(invalidName, birthDate);

        // Assert
        expect(result.invalid).toBe(true);
        expect(result.failures).toHaveLength(1);
      });

      it("deve falhar ao criar pessoa com data de nascimento inválida", () => {
        // Arrange
        const futureDate = faker.date.soon({ days: 365 }); // data futura

        // Act
        const result = Person.create(fullName, futureDate);

        // Assert
        expect(result.invalid).toBe(true);
        expect(result.failures.length).toBeGreaterThan(0);
      });
    });

    describe("hydrate", () => {
      it("deve hidratar uma pessoa corretamente", () => {
        // Arrange
        const uid = "PRSN." + faker.string.alphanumeric(8);

        // Act
        const person = Person.hydrate(uid, fullName, birthDate);

        // Assert
        expect(person.uid.value).toBe(uid);
        expect(person.name.value).toBe(fullName);
        expect(person.birthDate.value).toEqual(birthDate);
      });
    });
  });

  describe("Instance Methods", () => {
    describe("updateName", () => {
      it("deve atualizar o nome da pessoa", () => {
        // Arrange
        const person = Person.create(fullName, birthDate).value;
        const newName = faker.person.fullName();

        // Act
        const result = person.updateName(newName);

        // Assert
        expect(result.invalid).toBe(false);
        expect(result.value.name.value).toBe(newName);
      });

      it("deve falhar ao atualizar o nome para inválido", () => {
        // Arrange
        const person = Person.create(fullName, birthDate).value;
        const invalidName = "";

        // Act
        const result = person.updateName(invalidName);

        // Assert
        expect(result.failures.length).toBeGreaterThan(0);
        expect(person.name.value).toBe(fullName);
        expect(person.birthDate.value.toISOString()).toBe(
          birthDate.toISOString(),
        );
      });
    });

    describe("updateBirthDate", () => {
      it("deve atualizar a data de nascimento", () => {
        // Arrange
        const person = Person.create(fullName, birthDate).value;
        const newDate = faker.date.between({
          from: new Date(1940, 0, 1),
          to: new Date(2005, 0, 1),
        });

        // Act
        const result = person.updateBirthDate(newDate);

        // Assert
        expect(result.invalid).toBe(false);
        expect(result.value.birthDate.value).toEqual(newDate);
      });

      it("deve falhar ao atualizar para data de nascimento inválida", () => {
        // Arrange
        const person = Person.create(fullName, birthDate).value;
        const invalidDate = faker.date.soon({ days: 365 }); // data futura

        // Act
        const result = person.updateBirthDate(invalidDate);

        // Assert
        expect(result.failures.length).toBeGreaterThan(0);
        expect(person.birthDate.value.toISOString()).toEqual(
          birthDate.toISOString(),
        );
      });
    });
  });
});
