import { faker } from "@faker-js/faker/locale/pt_PT";
import { PersonDomainService } from "./person.domain.service";
import { Person } from "../entity/person";
import { PersonUID } from "../entity/value-object/person.uid";
import { IPersonRepository } from "../repository/person.repository.interface";
import { FailureCode } from "../../../shared/failure/failure.codes.enum";
import { v4 } from "uuid";
import { SimpleFailure } from "../../../shared/failure/simple.failure.type";
import { validateAndCollect } from "../../../shared/validator/common.validators";

describe("PersonService", () => {
  let repository: jest.Mocked<IPersonRepository>;
  let service: PersonDomainService;
  let validPerson: Person;
  let failures: SimpleFailure[];

  beforeEach(() => {
    failures = [];
    repository = {
      findById: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<IPersonRepository>;

    service = new PersonDomainService(repository);
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
      const result = validateAndCollect(
        await service.findById(validPerson.uid.value),
        failures,
      );

      // Assert
      expect(result).toBeDefined();
      expect(result).toBe(validPerson);
    });

    it("deve retornar falha se uid for inválido", async () => {
      // Act
      const result = validateAndCollect(
        await service.findById("INVALID-UID"),
        failures,
      );

      // Assert
      expect(result).toBeNull();
      expect(failures.length).toBeGreaterThan(0);
    });

    it("deve retornar falha se pessoa não encontrada", async () => {
      // Arrange
      repository.findById.mockResolvedValue(undefined);
      const uid = PersonUID.create().value;

      // Act
      const result = validateAndCollect(await service.findById(uid), failures);

      // Assert
      expect(result).toBeNull();
      expect(failures[0].code).toBe(FailureCode.RESOURCE_NOT_FOUND);
    });
  });

  describe("create", () => {
    it("deve criar uma pessoa válida", async () => {
      // Arrange
      const name = "JOSE JOSE";
      const birthDate = faker.date.birthdate();
      const instance = Person.hydrate(v4(), name, birthDate);

      repository.save.mockResolvedValue(instance);

      // Act
      const result = validateAndCollect(
        await service.create(name, birthDate),
        failures,
      );

      // Assert
      expect(result).toBeDefined();
      expect(result.name.value).toBe(name);
      expect(result.birthDate.value).toEqual(birthDate);
    });

    it("deve retornar falha se dados inválidos", async () => {
      // Act
      const result = validateAndCollect(
        await service.create("", new Date()),
        failures,
      );

      // Assert
      expect(result).toBeNull();
      expect(failures.length).toBeGreaterThan(0);
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
      const result = validateAndCollect(
        await service.update(person.uid.value, newName, newBirth),
        failures,
      );

      // Assert
      expect(result).toBeDefined();
      expect(result.name.value).toBe(newName);
      expect(result.birthDate.value).toEqual(newBirth);
    });

    it("deve retornar falha se uid inválido", async () => {
      // Act
      const result = validateAndCollect(
        await service.update("INVALID", "Nome", new Date()),
        failures,
      );

      // Assert
      expect(result).toBeNull();
      expect(failures.length).toBeGreaterThan(0);
    });

    it("deve retornar falha se pessoa não encontrada", async () => {
      // Arrange
      repository.findById.mockResolvedValue(null);
      const uid = PersonUID.create().value;

      // Act
      const result = validateAndCollect(
        await service.update(uid, faker.person.firstName(), new Date()),
        failures,
      );

      // Assert
      expect(result).toBeNull();
      expect(failures[0].code).toBe(FailureCode.RESOURCE_NOT_FOUND);
    });

    it("deve retornar falha se atualização inválida", async () => {
      // Arrange
      repository.findById.mockResolvedValue(validPerson);

      // Act
      const result = validateAndCollect(
        await service.update(validPerson.uid.value, "3#@$#@vd", new Date()),
        failures,
      );

      // Assert
      expect(result).toBeNull();
      expect(failures.length).toBeGreaterThan(0);
    });

    it("deve retornar falha se não for fornecido nenhuma propriedade para atualização", async () => {
      // Arrange
      repository.findById.mockResolvedValue(validPerson);

      // Act
      const result = validateAndCollect(
        await service.update(validPerson.uid.value, null, null),
        failures,
      );

      // Assert
      expect(result).toBeDefined();
      expect(failures[0].code).toBe(FailureCode.MISSING_REQUIRED_DATA);
    });
  });
});
