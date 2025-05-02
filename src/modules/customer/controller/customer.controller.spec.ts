import { Test, TestingModule } from "@nestjs/testing";
import { faker } from "@faker-js/faker/locale/pt_PT";
import { CustomerController } from "./customer.controller";
import { CustomerService } from "../service/customer.service";
import { Customer } from "../entity/customer";
import { HttpStatus } from "@nestjs/common";
import { ResourceTypes } from "../../../shared/constant/resource.types";
import { FailureCode } from "../../../shared/failure/failure.codes.enum";
import { ICustomerRepository } from "../repository/customer.repository.interface";
import { CustomerUID } from "../entity/value-object/customer.uid";
import { CreateCustomerDTO } from "./dto/create.customer.dto";
import { UpdateCustomerDTO } from "./dto/update.customer.dto";
import { v4 } from "uuid";
import {
  CUSTOMER_REPOSITORY,
  CUSTOMER_SERVICE,
} from "../constant/customer.constants";

describe("CustomerController", () => {
  let controller: CustomerController;
  let service: CustomerService;
  let repositoryMock: jest.Mocked<ICustomerRepository>;
  let customer: Customer;

  beforeEach(async () => {
    repositoryMock = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CustomerController],
      providers: [
        CustomerService,
        {
          provide: CUSTOMER_SERVICE,
          useClass: CustomerService,
        },
        {
          provide: CUSTOMER_REPOSITORY,
          useValue: repositoryMock,
        },
      ],
    }).compile();

    controller = module.get<CustomerController>(CustomerController);
    service = module.get<CustomerService>(CustomerService);

    customer = Customer.hydrate(
      CustomerUID.create().value,
      faker.person.firstName(),
      faker.date.birthdate({ mode: "age", min: 18, max: 90 }),
      faker.internet.email(),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("findById", () => {
    it("deve retornar dados do cliente quando ele existe", async () => {
      // Arrange
      repositoryMock.findById.mockResolvedValue(customer);

      // Act
      const result = (
        await controller.findById(customer.uid.value)
      ).getAllDatas();

      // Assert
      expect(result.status).toBe(HttpStatus.OK);
      expect(result.data).toBeDefined();
      expect(result.data).toMatchObject({
        id: customer.uid.value,
        type: ResourceTypes.CUSTOMER,
        attributes: {
          email: customer.email.value,
          name: customer.name.value,
          birthDate: customer.birthDate.value.toISOString().split("T")[0],
        },
        links: {
          self: `/customers/${customer.uid.value}`,
        },
      });
    });

    it("deve retornar erro quando o cliente não existe", async () => {
      // Arrange
      repositoryMock.findById.mockResolvedValue(null);

      // Act
      const result = (
        await controller.findById(customer.uid.value)
      ).getAllDatas();

      // Assert
      expect(result.status).toBe(HttpStatus.NOT_FOUND);
      expect(result.errors).toBeDefined();
      expect(result.errors.length).toBe(1);
      expect(result.errors[0].code).toBe(FailureCode.RESOURCE_NOT_FOUND);
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

  describe("create", () => {
    it("deve criar um cliente com sucesso", async () => {
      // Arrange
      const createDTO: CreateCustomerDTO = {
        name: customer.name.value,
        email: customer.email.value,
        birthDate: customer.birthDate.value,
      };
      repositoryMock.findByEmail.mockResolvedValue(null);
      repositoryMock.create.mockResolvedValue(customer);

      // Act
      const result = (await controller.create(createDTO)).getAllDatas();

      // Assert
      expect(result.status).toBe(HttpStatus.CREATED);
      expect(result.data).toBeDefined();
      expect(result.data).toMatchObject({
        type: ResourceTypes.CUSTOMER,
        id: customer.uid.value,
        attributes: {
          name: customer.name.value,
          email: customer.email.value,
          birthDate: customer.birthDate.value.toISOString().split("T")[0],
        },
        links: {
          self: `/customers/${customer.uid.value}`,
        },
      });
      expect(result.meta).toBeDefined();
      expect(result.meta.createdAt).toBeDefined();
      expect(new Date(result.meta.createdAt)).toBeInstanceOf(Date);
    });

    it("deve retornar erro quando dados estão ausentes", async () => {
      // Arrange
      const createDto = {} as CreateCustomerDTO;

      // Act
      const result = (await controller.create(createDto)).getAllDatas();

      // Assert
      expect(result.status).toBe(HttpStatus.BAD_REQUEST);
      expect(result.errors).toBeDefined();
      expect(result.errors[0].code).toBe(FailureCode.MISSING_REQUIRED_DATA);
    });

    it("deve retornar erro quando o serviço falha", async () => {
      // Arrange
      const invalidDatasDTO = {
        name: customer.name.value,
        birthDate: customer.birthDate.value,
        email: "invalid@mail",
      };

      // Act
      const result = (await controller.create(invalidDatasDTO)).getAllDatas();

      // Assert
      expect(result.status).toBe(HttpStatus.BAD_REQUEST);
      expect(result.errors).toBeDefined();
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("deve definir o status HTTP correto para BAD_REQUEST quando DTO é null", async () => {
      // Arrange
      const createDto = null as unknown;

      // Act
      const response = await controller.create(createDto as any);
      const result = response.getAllDatas();

      // Assert
      expect(result.status).toBe(HttpStatus.BAD_REQUEST);
      expect(result.errors[0].code).toBe(FailureCode.MISSING_REQUIRED_DATA);
    });
  });

  describe("update", () => {
    it("deve atualizar um cliente com sucesso", async () => {
      // Arrange
      const uid = customer.uid.value;
      const updateDTO: UpdateCustomerDTO = {
        name: faker.person.firstName(),
      };
      const updatedCustomer = Customer.hydrate(
        customer.uid.value,
        updateDTO.name,
        customer.birthDate.value,
        customer.email.value,
      );
      repositoryMock.findById.mockResolvedValue(customer);
      repositoryMock.update.mockResolvedValue(updatedCustomer);

      // Act
      const result = (await controller.update(uid, updateDTO)).getAllDatas();

      // Assert
      expect(result.status).toBe(HttpStatus.OK);
      expect(result.data).toMatchObject({
        type: ResourceTypes.CUSTOMER,
        id: updatedCustomer.uid.value,
        attributes: {
          name: updatedCustomer.name.value,
          email: updatedCustomer.email.value,
          birthDate: updatedCustomer.birthDate.value
            .toISOString()
            .split("T")[0],
        },
      });
      expect(result.meta).toBeDefined();
      expect(result.meta.updatedAt).toBeDefined();
      expect(new Date(result.meta.updatedAt)).toBeInstanceOf(Date);
    });

    it("deve retornar erro quando não há dados para atualizar", async () => {
      // Arrange
      const uid = customer.uid.value;
      const updateDto = {} as UpdateCustomerDTO;

      // Act
      const result = (await controller.update(uid, updateDto)).getAllDatas();

      // Assert
      expect(result.status).toBe(HttpStatus.BAD_REQUEST);
      expect(result.errors[0].code).toBe(FailureCode.MISSING_REQUIRED_DATA);
    });

    it("deve retornar erro quando o serviço falha na atualização", async () => {
      // Arrange
      const uid = customer.uid.value;
      const updateDto: UpdateCustomerDTO = {
        name: "an", // nome muito curto
      };
      repositoryMock.findById.mockResolvedValue(customer);

      // Act
      const result = (await controller.update(uid, updateDto)).getAllDatas();

      // Assert
      expect(result.status).toBe(HttpStatus.BAD_REQUEST);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("deve definir o status HTTP correto para BAD_REQUEST quando DTO é null", async () => {
      // Arrange
      const uid = customer.uid.value;
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
    it("deve deletar um cliente com sucesso", async () => {
      // Arrange
      const uid = customer.uid.value;
      repositoryMock.findById.mockResolvedValue(customer);
      repositoryMock.delete.mockResolvedValue(null);

      // Act
      const result = (await controller.delete(uid)).getAllDatas();

      // Assert
      expect(result.status).toBe(HttpStatus.NO_CONTENT);
    });

    it("deve retornar erro quando o uid do recurso for inválido", async () => {
      // Act
      const result = (await controller.delete("invalid.uid")).getAllDatas();

      // Assert
      expect(result.status).toBe(HttpStatus.BAD_REQUEST);
      expect(result.errors[0].code).toBe(FailureCode.INVALID_UUID);
    });

    it("deve retornar erro quando recurso não for encontrado", async () => {
      // Arrange
      const uid = customer.uid.value;
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
