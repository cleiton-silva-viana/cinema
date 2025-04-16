import { faker } from "@faker-js/faker/locale/pt_PT";
import { CustomerController } from "./customer.controller";
import { CustomerService } from "../service/customer.service";
import { Customer } from "../entity/customer";
import { HttpStatus } from "@nestjs/common";
import { SimpleFailure } from "../../../shared/failure/simple.failure.type";
import { JsonApiResponse } from "../../../shared/response/json.api.response";
import { IFailureMapper } from "../../../shared/failure/failure.mapper.interface";
import { ICustomerRepository } from "../repository/customer.repository.interface";
import { FailureMapper } from "../../../shared/failure/failure.mapper";
import { RichFailureType } from "src/shared/failure/rich.failure.type";
import { CreateCustomerDTO } from "./dto/create.customer.dto";
import { UpdateCustomerDTO } from "./dto/update.customer.dto";
import { CustomerUID } from "../entity/value-object/customer.uid";

const findError: SimpleFailure = {
  code: 'ERROR_FOR_TEST',
  details: { resource: 'test' }
};

const findRichFailure: RichFailureType = {
  code: findError.code,
  title: 'Error for test',
  details: findError.details,
  status: HttpStatus.NOT_FOUND,
}

describe("CustomerController", () => {
  let customer: Customer;
  let customerService: CustomerService;
  let customerController: CustomerController;
  let customerRepositoryMock: jest.Mocked<ICustomerRepository>;
  let failureMapperMock: IFailureMapper;

  beforeEach(() => {
    customerRepositoryMock = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    
    customer = Customer.hydrate(
      CustomerUID.create().value,
      faker.person.firstName(),
      faker.date.between({
        from: new Date(1940, 1, 1),
        to: new Date(2004, 1, 1),
      }),
      faker.internet.email(),
    );
    
    failureMapperMock = {
      toRichFailure: jest.fn().mockReturnValue(findRichFailure),
      toRichFailures: jest.fn().mockReturnValue([findRichFailure]),
    };
    
    jest.spyOn(FailureMapper, 'getInstance').mockReturnValue(failureMapperMock as any);
    
    customerService = new CustomerService(customerRepositoryMock);
    
    customerController = new CustomerController(customerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("findOne", () => {
    it("should return customer data when customer exists", async () => {
      // Arrange
      customerRepositoryMock.findById.mockResolvedValue(customer);

      // Act
      const result = (await customerController.findOne(customer.uid.value)).getAllDatas()

      // Assert
      expect(result.status).toBe(HttpStatus.OK);
      expect(result.data).not.toBeNull()
      expect(Array.isArray(result.data)).toBe(false)
      const data = Array.isArray(result.data) ? result.data[0] : result.data;
      expect(data.id).toBe(customer.uid.value);
      expect(data.type).toBe('customer');
      expect(data.attributes.name).toBe(customer.name.value);
      expect(data.attributes.email).toBe(customer.email.value);
      expect(data.attributes.birthDate).toBeDefined()
    });

    it("should return error when customer does not exist", async () => {
      // Arrange
      customerRepositoryMock.findById.mockResolvedValue(null);

      // Act
      const result = (await customerController.findOne(customer.uid.value)).getAllDatas()

      // Assert
      expect(result.status).toBe(HttpStatus.NOT_FOUND);
      expect(result.data).toBeNull()
      expect(result.errors).not.toBeNull()
      expect(result.errors[0].code).toBe(findError.code)
    });
  });

  describe("create", () => {
    const createDTO: CreateCustomerDTO = {
      name: faker.person.firstName(),
      email: faker.internet.email(),
      birthDate: faker.date.between({
        from: new Date(1940, 0, 0),
        to: new Date(2004, 0, 0),
      }),
    };

    it("should create a customer successfully", async () => {
      // Arrange
      customerRepositoryMock.findByEmail.mockResolvedValue(null);
      customerRepositoryMock.create.mockResolvedValue(customer);

      // Act
      const result = (await customerController.create(createDTO)).getAllDatas()

      // Assert
      expect(result.status).toBe(HttpStatus.CREATED);
      expect(result.data).not.toBeNull()
      expect(Array.isArray(result.data)).toBe(false)
      const data = Array.isArray(result.data) ? result.data[0] : result.data;
      expect(data.id).toBe(customer.uid.value);
      expect(data.type).toBe('customer');
      expect(data.attributes.name).toBe(customer.name.value);
      expect(data.attributes.email).toBe(customer.email.value);
      expect(data.attributes.birthDate).toBeDefined();
    });

    it("should return validation errors when create data is invalid", async () => {
      // Arrange
      const invalidDatasDTO = {
        ...createDTO,
        email: 'invalid@mail'
      }
      
      customerRepositoryMock.findByEmail.mockResolvedValue(null);

      // Act
      const result = (await customerController.create(invalidDatasDTO)).getAllDatas()

      // Assert
      expect(result.status).toBe(findRichFailure.status);
      expect(result.data).toBeNull();
      expect(result.errors).toBeDefined();
      expect(result.errors.length).toBe(1);
    });
  });

  describe("update", () => {
    it("should update customer data successfully", async () => {
      // Arrange
      const updateDTO: UpdateCustomerDTO = {
        name: faker.person.firstName(),
      };

      const updatedCustomer = Customer.hydrate(
        updateDTO.name,
        customer.name.value,
        customer.birthDate.value,
        customer.email.value,
      );

      customerRepositoryMock.findById.mockResolvedValue(customer);
      customerRepositoryMock.update.mockResolvedValue(updatedCustomer);

      // Act
      const result = (await customerController.update(customer.uid.value, updateDTO)).getAllDatas()

      // Assert
      expect(result.status).toBe(HttpStatus.OK);
      expect(Array.isArray(result.data)).toBe(false)
      const data = Array.isArray(result.data) ? result.data[0] : result.data;
      expect(data.id).toBe(updatedCustomer.uid.value);
      expect(data.type).toBe('customer'); // melhorar isso aqui...
      expect(data.attributes.name).toBe(updatedCustomer.name.value);
      expect(data.attributes.email).toBe(updatedCustomer.email.value);
      expect(data.attributes.birthDate).toBeDefined();
    });

    it("should return error when update data is invalid", async () => {
      // Arrange
      const validationError: SimpleFailure = {
        code: 'VALIDATION_ERROR',
        details: { field: 'name', message: 'Name is too short' }
      };
      
      customerRepositoryMock.findById.mockResolvedValue(null);

      // Act
      const response = await customerController.update(customer.uid.value, { name: "123" });
      const result = response.getAllDatas();
      
      // Assert
      expect(response).toBeInstanceOf(JsonApiResponse);
      expect(result.errors).toBeDefined();
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe("delete", () => {
    it("should delete customer successfully", async () => {
      // Arrange
      customerRepositoryMock.findById.mockResolvedValue(customer);
      customerRepositoryMock.delete.mockResolvedValue(null);

      // Act
      const response = await customerController.delete(customer.uid.value);
      const result = response.getAllDatas();
      
      // Assert
      expect(response).toBeInstanceOf(JsonApiResponse);
      expect(result.status).toBe(HttpStatus.NO_CONTENT);
      expect(result.data).toBeNull();
    });

    it("should return error when customer to delete is not found", async () => {
      // Arrange
      customerRepositoryMock.findById.mockResolvedValue(null);

      // Act
      const response = await customerController.delete(customer.uid.value);
      const result = response.getAllDatas();
      
      // Assert
      expect(response).toBeInstanceOf(JsonApiResponse);
      expect(result.errors).toBeDefined();
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});
