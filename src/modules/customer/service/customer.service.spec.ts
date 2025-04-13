import { faker } from "@faker-js/faker";
import { Customer } from "../entity/customer";
import { ICustomerRepository } from "../repository/customer.repository.interface";
import { CustomerUID } from "../entity/value-object/customer.uid";
import { CustomerService } from "./customer.service";
import {Email} from "../entity/value-object/email";
import { v4, v7 } from "uuid";

describe("CustomerService", () => {
  let customerService: CustomerService;
  let repositoryMock: jest.Mocked<ICustomerRepository>;
  let customerMock: Customer;
  let validCustomerUID: CustomerUID;

  beforeEach(() => {
    repositoryMock = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as jest.Mocked<ICustomerRepository>;

    customerService = new CustomerService(repositoryMock);
    
    validCustomerUID = CustomerUID.create();
    customerMock = Customer.hydrate(
      validCustomerUID.value,
      faker.person.firstName(),
      faker.date.between({
        from: new Date(1940, 0, 0),
        to: new Date(2006, 0, 0),
      }),
      faker.internet.email(),
    );
  });

  describe("findById", () => {
    it("should find customer by id", async () => {
      // Arrange
      repositoryMock.findById.mockResolvedValue(customerMock);

      // Act
      const result = await customerService.findById(validCustomerUID);

      // Assert
      expect(result.invalid).toBe(false);
      expect(result.value).toEqual(customerMock);
      expect(repositoryMock.findById).toHaveBeenCalledTimes(1)
      expect(repositoryMock.findById).toHaveBeenCalledWith(validCustomerUID);
    });

    [
      {
        description: "null uid",
        uid: null,
      },
      {
        description: "undefined uid",
        uid: undefined,
      },
      {
        description: "uid from another entity",
        uid: `usr.${v7()}`,
      },
      {
        description: "uid with invalid format",
        uid: `cust.${v4()}`,
      },
      {
        description: "uid without prefix",
        uid: v7(),
      },
      {
        description: "uid with invalid UUID format",
        uid: "cus.invalid-uuid-format",
      },
    ].forEach((scenario) => {
      it(`should return failure for ${scenario.description}`, async () => {
        // Act
        const result = await customerService.findById(scenario.uid);

        // Assert
        expect(result.invalid).toBe(true);
        expect(result.failures[0].code).toBe('INVALID_UUID');
        expect(repositoryMock.findById).not.toHaveBeenCalled();
      });
    });

    it("should return failure for non-existent customer", async () => {
      // Arrange
      repositoryMock.findById.mockResolvedValue(null);

      // Act
      const result = await customerService.findById(validCustomerUID);

      // Assert
      expect(result.invalid).toBe(true);
      expect(result.failures[0].code).toBe('RESOURCE_NOT_FOUND');
    });
  });

  describe("findByEmail", () => {
    const validEmail = Email.hydrate(faker.internet.email());

    it("should find customer by email", async () => {
      // Arrange
      repositoryMock.findByEmail.mockResolvedValue(customerMock);

      // Act
      const result = await customerService.findByEmail(validEmail);

      // Assert
      expect(result.invalid).toBe(false);
      expect(result.value).toEqual(customerMock);
    });

    it("should return failure for invalid email", async () => {
      // Act
      const result = await customerService.findByEmail("invalid-email");

      // Assert
      expect(result.invalid).toBe(true);
    });
  });

  describe("create", () => {
    const createProps = {
      name: faker.person.firstName(),
      email: faker.internet.email(),
      birthDate: faker.date.between({
        from: new Date(1940, 0, 0),
        to: new Date(2006, 0, 0),
      })
    };

    it("should create customer successfully", async () => {
      // Arrange
      const customerMock = Customer.hydrate(
          validCustomerUID.value,
          createProps.name,
          createProps.birthDate,
          createProps.email
      )
      repositoryMock.findByEmail.mockResolvedValue(null);
      repositoryMock.create.mockResolvedValue(customerMock);

      // Act
      const result = await customerService.create(createProps);

      // Assert
      expect(result.invalid).toBe(false);
      expect(result.value).toBeDefined();
      expect(result.value).toEqual(customerMock);
      expect(result.value.name.value).toEqual(createProps.name);
      expect(result.value.email.value).toEqual(createProps.email);
      expect(result.value.birthDate.value).toEqual(createProps.birthDate);
      expect(repositoryMock.create).toHaveBeenCalled();
      expect(repositoryMock.create).toHaveBeenCalledTimes(1);

    });

    it("should return failure when email already exists", async () => {
      // Arrange
      repositoryMock.findByEmail.mockResolvedValue(customerMock);

      // Act
      const result = await customerService.create(createProps);

      // Assert
      expect(result.invalid).toBe(true);
      expect(result.failures[0].code).toBe('EMAIL_ALREADY_IN_USE');
      expect(repositoryMock.create).not.toHaveBeenCalled();
    });
  });

  describe("update", () => {
    const updateProps = {
      name: faker.person.firstName(),
      email: faker.internet.email(),
      birthDate: faker.date.between({
        from: new Date(1940, 0, 0),
        to: new Date(2006, 0, 0),
      })
    };

    it("should update customer successfully", async () => {
      // Arrange
      const updatedCustomerMock = Customer.hydrate(validCustomerUID.value, updateProps.name, updateProps.birthDate, updateProps.email);
      repositoryMock.findById.mockResolvedValue(customerMock);
      repositoryMock.findByEmail.mockResolvedValue(null);
      repositoryMock.update.mockResolvedValue(updatedCustomerMock);

      // Act
      const result = await customerService.update(validCustomerUID.value, updateProps);

      // Assert
      expect(result.invalid).toBe(false);
      expect(result.value).toBeDefined();
      expect(repositoryMock.update).toHaveBeenCalled();
    });

    it("should return failure for empty update props", async () => {
      // Act
      const result = await customerService.update(validCustomerUID.value, null);

      // Assert
      expect(result.invalid).toBe(true);
      expect(result.failures[0].code).toBe('EMPTY_DATAS_FOR_UPDATE');
    });

    it("should return failure when customer not found", async () => {
      // Arrange
      repositoryMock.findById.mockResolvedValue(null);

      // Act
      const result = await customerService.update(validCustomerUID.value, updateProps);

      // Assert
      expect(result.invalid).toBe(true);
      expect(result.failures[0].code).toBe('RESOURCE_NOT_FOUND');
    });

    it("should return failure when email already in use", async () => {
      // Arrange
      repositoryMock.findById.mockResolvedValue(customerMock);
      repositoryMock.findByEmail.mockResolvedValue(customerMock);

      // Act
      const result = await customerService.update(validCustomerUID.value, updateProps);

      // Assert
      expect(result.invalid).toBe(true);
      expect(result.failures[0].code).toBe('EMAIL_ALREADY_IN_USE');
    });
  });

  describe("delete", () => {
    it("should delete customer successfully", async () => {
      // Arrange
      repositoryMock.findById.mockResolvedValue(customerMock);
      repositoryMock.delete.mockResolvedValue(void 0);

      // Act
      const result = await customerService.delete(validCustomerUID.value);

      // Assert
      expect(result.invalid).toBe(false);
      expect(repositoryMock.delete).toHaveBeenCalledWith(validCustomerUID);
    });

    it("should return failure when customer not found", async () => {
      // Arrange
      repositoryMock.findById.mockResolvedValue(null);

      // Act
      const result = await customerService.delete(validCustomerUID.value);

      // Assert
      expect(result.invalid).toBe(true);
      expect(result.failures[0].code).toBe('RESOURCE_NOT_FOUND');
      expect(repositoryMock.delete).not.toHaveBeenCalled();
    });

    it("should return failure for invalid uid", async () => {
      // Act
      const result = await customerService.delete("invalid-uid");

      // Assert
      expect(result.invalid).toBe(true);
      expect(repositoryMock.findById).not.toHaveBeenCalled();
      expect(repositoryMock.delete).not.toHaveBeenCalled();
    });
  });
});