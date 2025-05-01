import { faker } from "@faker-js/faker/locale/pt_PT";
import { PersonService } from "./person.service";
import { Person } from "../entity/person";
import { PersonUID } from "../entity/value-object/person.uid";
import { IPersonRepository } from "../repository/person.repository.interface";

describe("PersonService", () => {
  let repository: jest.Mocked<IPersonRepository>;
  let service: PersonService;
  let validPerson: Person;

  beforeEach(() => {
    repository = {
      findById: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<IPersonRepository>;

    service = new PersonService(repository);
    validPerson = Person.hydrate(
      PersonUID.create().value,
      faker.person.firstName(),
      faker.date.birthdate(),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("findById", () => {
    it("deve retornar a pessoa se encontrada", async () => {
      // Arrange
      repository.findById.mockResolvedValue(validPerson);

      // Act
      const result = await service.findById(validPerson.uid.value);

      // Assert
      expect(result.invalid).toBe(false);
      expect(result.value).toBe(validPerson);
    });

    it("deve retornar falha se uid for inválido", async () => {
      // Act
      const result = await service.findById("INVALID-UID");

      // Assert
      expect(result.invalid).toBe(true);
      expect(result.failures.length).toBeGreaterThan(0);
    });

    it("deve retornar falha se pessoa não encontrada", async () => {
      // Arrange
      repository.findById.mockResolvedValue(undefined);
      const uid = PersonUID.create().value;

      // Act
      const result = await service.findById(uid);

      // Assert
      expect(result.invalid).toBe(true);
      expect(result.failures[0].code).toBe("PERSON_NOT_FOUND");
    });
  });

  describe("create", () => {
    it("deve criar uma pessoa válida", async () => {
      // Arrange
      const name = faker.person.fullName();
      const birthDate = faker.date.birthdate();
      repository.save.mockResolvedValue(undefined);

      // Act
      const result = await service.create(name, birthDate);

      // Assert
      expect(result.invalid).toBe(false);
      expect(result.value.name.value).toBe(name);
      expect(result.value.birthDate.value).toEqual(birthDate);
      expect(repository.save).toHaveBeenCalledWith(result.value);
    });

    it("deve retornar falha se dados inválidos", async () => {
      // Act
      const result = await service.create("", new Date());

      // Assert
      expect(result.invalid).toBe(true);
      expect(result.failures.length).toBeGreaterThan(0);
    });
  });

  describe("update", () => {
    it("deve atualizar nome e data de nascimento", async () => {
      // Arrange
      const originalName = "Nome Original";
      const originalBirthDate = new Date("1990-01-01");
      const person = Person.hydrate(
        PersonUID.create().value,
        originalName,
        originalBirthDate,
      );
      const newName = faker.person.fullName();
      const newBirth = faker.date.birthdate();
      const updatedPerson = Person.hydrate(person.uid.value, newName, newBirth);
      repository.findById.mockResolvedValue(person);
      repository.update.mockResolvedValue(updatedPerson);

      // Act
      const result = await service.update(person.uid.value, newName, newBirth);

      // Assert
      expect(result.invalid).toBe(false);
      expect(result.value.name.value).toBe(newName);
      expect(result.value.birthDate.value).toEqual(newBirth);
    });

    it("deve retornar falha se uid inválido", async () => {
      // Act
      const result = await service.update("INVALID", "Nome", new Date());

      // Assert
      expect(result.invalid).toBe(true);
    });

    it("deve retornar falha se pessoa não encontrada", async () => {
      // Arrange
      repository.findById.mockResolvedValue(undefined);
      const uid = PersonUID.create().value;

      // Act
      const result = await service.update(uid, "Nome", new Date());

      // Assert
      expect(result.invalid).toBe(true);
      expect(result.failures[0].code).toBe("PERSON_NOT_FOUND");
    });

    it("deve retornar falha se atualização inválida", async () => {
      // Arrange
      repository.findById.mockResolvedValue(validPerson);

      // Act
      const result = await service.update(
        validPerson.uid.value,
        "3#@$#@vd",
        new Date(),
      );

      // Assert
      expect(result.invalid).toBe(true);
      expect(result.failures.length).toBeGreaterThan(0);
    });

    it("deve retornar falha se não for fornecido nenhuma propriedade para atualização", async () => {
      // Arrange
      repository.findById.mockResolvedValue(validPerson);

      // Act
      const result = await service.update(
        validPerson.uid.value,
        undefined,
        undefined,
      );

      // Assert
      expect(result.invalid).toBe(true);
      expect(result.failures[0].code).toBe("NO_PROPERTIES_TO_UPDATE");
    });
  });

  describe("delete", () => {
    it("deve deletar uma pessoa sem associações", async () => {
      // Arrange
      repository.findById.mockResolvedValue(validPerson);
      repository.delete.mockResolvedValue(undefined);

      // Act
      const result = await service.delete(validPerson.uid.value);

      // Assert
      expect(result.invalid).toBe(false);
      expect(result.value).toBeNull();
      expect(repository.delete).toHaveBeenCalledWith(validPerson.uid.value);
    });

    it("deve retornar falha se uid inválido", async () => {
      // Act
      const result = await service.delete("INVALID");

      // Assert
      expect(result.invalid).toBe(true);
    });

    it("deve retornar falha se pessoa não encontrada", async () => {
      // Arrange
      repository.findById.mockResolvedValue(undefined);
      const uid = PersonUID.create().value;

      // Act
      const result = await service.delete(uid);

      // Assert
      expect(result.invalid).toBe(true);
      expect(result.failures[0].code).toBe("PERSON_NOT_FOUND");
    });
  });
});
