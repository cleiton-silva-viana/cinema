import { Test, TestingModule } from "@nestjs/testing";
import { PersonController } from "./person.controller";
import { PersonService } from "../service/person.service";
import { CreatePersonDTO } from "./dto/create.person.dto";
import { HttpStatus } from "@nestjs/common";
import { Person } from "../entity/person";
import { PersonUID } from "../entity/value-object/person.uid";
import { ResourceTypes } from "../../../shared/constant/resource.types";
import { FailureCode } from "../../../shared/failure/failure.codes.enum";
import { IPersonRepository } from "../repository/person.repository.interface";
import { faker } from "@faker-js/faker/.";
import { UpdatePersonDTO } from "./dto/update.person.dto";
import { v4 } from "uuid";

describe("PersonController", () => {
  let controller: PersonController;
  let service: PersonService;
  let repositoryMock: jest.Mocked<IPersonRepository>;
  let person: Person;

  beforeEach(async () => {
    repositoryMock = {
      findById: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PersonController],
      providers: [
        PersonService,
        {
          provide: "PersonRepository",
          useValue: repositoryMock,
        },
      ],
    }).compile();

    controller = module.get<PersonController>(PersonController);
    service = module.get<PersonService>(PersonService);

    person = Person.hydrate(
      PersonUID.create().value,
      faker.person.firstName(),
      faker.date.birthdate({ mode: "age", min: 18, max: 90 }),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("create", () => {
    it("deve criar uma pessoa com sucesso", async () => {
      // Arrange
      repositoryMock.save.mockResolvedValue(person);
      const createDto: CreatePersonDTO = {
        name: person.name.value,
        birthDate: person.birthDate.value.toISOString(),
      };

      // Act
      const result = (await controller.create(createDto)).getAllDatas();

      // Assert
      expect(result.status).toBe(HttpStatus.OK);
      expect(result.data).toBeDefined();
      expect(result.data).toMatchObject({
        type: ResourceTypes.PERSON,
        id: person.uid.value,
        attributes: {
          name: person.name.value,
          birthDate: person.birthDate.value.toISOString().split("T")[0],
        },
        links: {
          self: `/persons/${person.uid.value}`,
        },
      });
      expect(result.meta).toBeDefined();
      expect(result.meta.createdAt).toBeDefined();
      expect(new Date(result.meta.createdAt)).toBeInstanceOf(Date);
    });

    it("deve retornar erro quando dados estão ausentes", async () => {
      // Arrange
      const createDto = {} as CreatePersonDTO;

      // Act
      const result = (await controller.create(createDto)).getAllDatas();

      // Assert
      expect(result.status).toBe(HttpStatus.BAD_REQUEST);
      expect(result.errors[0].code).toBe(FailureCode.MISSING_REQUIRED_DATA);
    });

    it("deve retornar erro quando o serviço falha", async () => {
      // Arrange
      const createDto: CreatePersonDTO = {
        name: "invalid_chars┤", // special chars
        birthDate: new Date(new Date().setDate(+30)).toISOString(), // future birth date
      };

      // Act
      const result = (await controller.create(createDto)).getAllDatas();

      // Assert
      expect(result.status).toBe(HttpStatus.BAD_REQUEST);
      expect(result.errors.length).toBe(2);
    });

    it("deve definir o status HTTP correto para BAD_REQUEST quando DTO é null", async () => {
      // Arrange
      const createDto = null as unknown;

      // Act
      const response = await controller.create(createDto as any);
      const result = response.getAllDatas();

      // Assert
      expect(result.status).toBe(HttpStatus.BAD_REQUEST);
    });
  });

  describe("findById", () => {
    it("deve encontrar uma pessoa por ID com sucesso", async () => {
      // Arrange
      const uid = person.uid.value;
      repositoryMock.findById.mockResolvedValue(person);

      // Act
      const result = (await controller.findById(uid)).getAllDatas();

      // Assert
      expect(result.status).toBe(HttpStatus.OK);
      expect(result.data).toMatchObject({
        type: ResourceTypes.PERSON,
        id: person.uid.value,
        attributes: {
          name: person.name.value,
          birthDate: person.birthDate.value.toISOString().split("T")[0],
        },
        links: {
          self: `/persons/${person.uid.value}`,
        },
      });
    });

    it("deve retornar erro quando pessoa não é encontrada", async () => {
      // Arrange
      repositoryMock.findById.mockResolvedValue(null);

      // Act
      const result = (
        await controller.findById(person.uid.value)
      ).getAllDatas();

      // Assert
      expect(result.status).toBe(HttpStatus.NOT_FOUND);
    });

    it("deve lidar com parâmetro de ID inválido", async () => {
      // Arrange
      const invalidUid = v4();

      // Act
      const result = (await controller.findById(invalidUid)).getAllDatas();

      // Assert
      expect(result.status).toBe(HttpStatus.BAD_REQUEST);
      expect(result.errors[0].code).toBe(FailureCode.INVALID_UUID);
    });
  });

  describe("update", () => {
    it("deve atualizar uma pessoa com sucesso", async () => {
      // Arrange
      const uid = person.uid.value;
      const updateDto: UpdatePersonDTO = {
        name: faker.person.firstName(),
        birthDate: faker.date
          .birthdate({ mode: "age", min: 18, max: 90 })
          .toISOString(),
      };
      const updatedPerson = Person.hydrate(
        person.uid.value,
        updateDto.name,
        new Date(updateDto.birthDate),
      );
      repositoryMock.findById.mockResolvedValue(person);
      repositoryMock.update.mockResolvedValue(updatedPerson);

      // Act
      const result = (await controller.update(uid, updateDto)).getAllDatas();

      // Assert
      expect(result.status).toBe(HttpStatus.OK);
      expect(result.data).toMatchObject({
        type: ResourceTypes.PERSON,
        id: person.uid.value,
        attributes: {
          name: updatedPerson.name.value,
          birthDate: updatedPerson.birthDate.value.toISOString().split("T")[0],
        },
      });
      expect(result.meta).toBeDefined();
      expect(result.meta.updatedAt).toBeDefined();
      expect(new Date(result.meta.updatedAt)).toBeInstanceOf(Date);
    });

    it("deve retornar erro quando não há dados para atualizar", async () => {
      // Arrange
      const uid = person.uid.value;
      const updateDto = {} as UpdatePersonDTO;

      // Act
      const result = (await controller.update(uid, updateDto)).getAllDatas();

      // Assert
      expect(result.status).toBe(HttpStatus.BAD_REQUEST);
      expect(result.errors[0].code).toBe(FailureCode.MISSING_REQUIRED_DATA);
    });

    it("deve retornar erro quando o serviço falha na atualização", async () => {
      // Arrange
      const uid = person.uid.value;
      const updateDto: UpdatePersonDTO = {
        name: "an",
      };
      repositoryMock.findById.mockResolvedValue(person);

      // Act
      const result = (await controller.update(uid, updateDto)).getAllDatas();

      // Assert
      expect(result.status).toBe(HttpStatus.BAD_REQUEST);
      expect(result.errors.length).toBe(1);
      expect(result.errors[0].meta).toMatchObject({
        min: 3,
        max: 50,
      });
    });

    it("deve atualizar apenas o nome quando apenas o nome é fornecido", async () => {
      // Arrange
      const uid = person.uid.value;
      const updateDto: UpdatePersonDTO = {
        name: faker.person.firstName(),
      };
      const updatedPerson = Person.hydrate(
        person.uid.value,
        updateDto.name,
        person.birthDate.value,
      );
      repositoryMock.findById.mockResolvedValue(person);
      repositoryMock.update.mockResolvedValue(updatedPerson);

      // Act
      const result = (await controller.update(uid, updateDto)).getAllDatas();

      // Assert
      expect(result.status).toBe(HttpStatus.OK);
      expect(result.data).toMatchObject({
        type: ResourceTypes.PERSON,
        id: person.uid.value,
        attributes: {
          name: updatedPerson.name.value,
          birthDate: updatedPerson.birthDate.value.toISOString().split("T")[0],
        },
      });
    });

    it("deve atualizar apenas a data de nascimento quando apenas a data é fornecida", async () => {
      // Arrange
      const uid = person.uid.value;
      const newBirthDate = faker.date.birthdate({
        mode: "age",
        min: 18,
        max: 90,
      });
      const updateDto: UpdatePersonDTO = {
        birthDate: newBirthDate.toISOString(),
      };
      const updatedPerson = Person.hydrate(
        person.uid.value,
        person.name.value,
        newBirthDate,
      );
      repositoryMock.findById.mockResolvedValue(person);
      repositoryMock.update.mockResolvedValue(updatedPerson);

      // Act
      const result = (await controller.update(uid, updateDto)).getAllDatas();

      // Assert
      expect(result.status).toBe(HttpStatus.OK);
      expect(result.data).toMatchObject({
        type: ResourceTypes.PERSON,
        id: updatedPerson.uid.value,
        attributes: {
          name: updatedPerson.name.value,
          birthDate: updatedPerson.birthDate.value.toISOString().split("T")[0],
        },
      });
    });

    it("deve definir o status HTTP correto para BAD_REQUEST quando DTO é null", async () => {
      // Arrange
      const uid = person.uid.value;
      const updateDto = null as unknown;

      // Act
      const response = await controller.update(uid, updateDto as any);
      const result = response.getAllDatas();

      // Assert
      expect(result.status).toBe(HttpStatus.BAD_REQUEST);
      expect(result.errors[0].code).toBe(FailureCode.MISSING_REQUIRED_DATA);
    });
  });

  describe("delete", () => {
    it("deve deletar uma pessoa com sucesso", async () => {
      // Arrange
      const uid = person.uid.value;
      repositoryMock.findById.mockResolvedValue(person);

      // Act
      const result = (await controller.delete(uid)).getAllDatas();

      // Assert
      expect(result.status).toBe(HttpStatus.NO_CONTENT);
    });

    it("deve retornar erro quando falha quando recurso não for encontrado", async () => {
      // Arrange
      const uid = person.uid.value;
      repositoryMock.findById.mockResolvedValue(null);

      // Act
      const result = (await controller.delete(uid)).getAllDatas();

      // Assert
      expect(result.status).toBe(HttpStatus.NOT_FOUND);
      expect(result.errors.length).toBe(1);
      expect(result.errors[0].code).toBe(FailureCode.RESOURCE_NOT_FOUND);
    });
  });
});
