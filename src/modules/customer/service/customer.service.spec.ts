
/*
describe("UserService", () => {
  let userService: UserService;
  let userRepositoryMock: jest.Mocked<IUserRepository>;
  let userMock: User;

  beforeEach(() => {
    userRepositoryMock = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as jest.Mocked<IUserRepository>;

    userService = new UserService(userRepositoryMock);
    userMock = User.hydrate(
      uid(),
      faker.person.firstName(),
      faker.date.between({
        from: new Date(1940, 0, 0),
        to: new Date(2006, 0, 0),
      }),
      faker.internet.email(),
    );
  });

  describe("findUserById", () => {
    it("must have return user", async () => {
      // Arrange
      userRepositoryMock.findById.mockResolvedValue(Result.ok(userMock));

      // Act
      const result = await userService.findById(userMock.uid);

      // Assert
      expect(result.isValid).toBeTruthy();
      expect(result.value).toEqual(userMock);
      expect(userRepositoryMock.findById).toHaveBeenCalledTimes(1);
      expect(userRepositoryMock.findById).toHaveBeenCalledWith(userMock.uid);
    });
    it(`must have return error 404 for non-existent user`, async () => {
      // Arrange
      userRepositoryMock.findById.mockResolvedValue(
        Result.failure(findError),
      );

      // Act
      const result = await userService.findById(userMock.uid);

      // Assert
      expect(result.isValid).toEqual(false);
      expect(result.error).toEqual(findError);
      expect(userRepositoryMock.findById).toHaveBeenCalledTimes(1);
      expect(userRepositoryMock.findById).toHaveBeenCalledWith(userMock.uid);
    });
  });
  describe("create", () => {
    const pass = faker.internet.password({
      length: 8,
      pattern: /[A-Za-z\d!@#$%^&*()_+{}[\]:;"'<>,.?/-]/,
    });
    const dto: CreateUserDTO = {
      name: faker.person.firstName(),
      email: faker.internet.email(),
      birthDate: faker.date.between({
        from: "1940-01-01T00:00:00.000Z",
        to: "2003-01-01T00:00:00.000Z",
      }),
      password: pass,
      password_confirmation: pass,
    };

    it("must have create a new user", async () => {
      // Arrange
      userRepositoryMock.findByEmail.mockResolvedValue(Result.failure(findError));
      userRepositoryMock.create.mockResolvedValue(Result.ok(null));

      // Act
      const result = await userService.create(dto);

      // Assert
      expect(result.isValid).toEqual(true);
      expect(result.value).not.toBeNull();
      expect(result.value.name).toEqual(dto.name);
      expect(result.value.email).toEqual(dto.email);
      expect(result.value.birthDate).toEqual(dto.birthDate);
      expect(userRepositoryMock.findByEmail).toHaveBeenCalledTimes(1);
      expect(userRepositoryMock.findByEmail).toHaveBeenCalledWith(result.value.email);
      expect(userRepositoryMock.create).toHaveBeenCalledTimes(1);
    });
    it("user email already in use, must have return error", async () => {
      // Arrange
      userRepositoryMock.findByEmail.mockResolvedValue(Result.ok(userMock));

      // Act
      const result = await userService.create(dto);

      // Assert
      expect(result.isValid).toEqual(false);
      expect(result.error.code).toEqual(HttpStatus.CONFLICT);
      expect(userRepositoryMock.findByEmail).toHaveBeenCalledWith(dto.email);
      expect(userRepositoryMock.findByEmail).toHaveBeenCalledTimes(1);
      expect(userRepositoryMock.create).toHaveBeenCalledTimes(0);
    });

    const invalidDtoScenarios = [
      {
        dto: null,
        description: "null DTO",
      },
      {
        dto: undefined,
        description: "undefined DTO",
      },
    ]

    invalidDtoScenarios.forEach((test) => {
      it(`invalid DTO, but ${test.description} - should error`, async () => {
        // Act
        const result = await userService.create(test.dto);

        // Assert
        expect(result.isValid).toEqual(false);
        expect(result.error.code).toEqual(HttpStatus.BAD_REQUEST);
      });
    });
  });
  describe("update", () => {
    const validUpdateScenarios = [
      {
        description: "update user name only",
        data: { name: faker.person.firstName() } as Partial<User>,
      },
      {
        description: "update user email only",
        data: { email: faker.internet.email() } as Partial<User>,
      },
      {
        description: "update user birth date only",
        data: {
          birthDate: faker.date.between({
            from: "1940-01-01T00:00:00.000Z",
            to: "2006-01-01T00:00:00.000Z",
          }),
        } as Partial<User>,
      },
      {
        description: "update user name, email and birth date",
        data: {
          name: faker.person.firstName(),
          email: faker.internet.email(),
          birthDate: new Date("2000-01-01T00:00:00.000Z"),
        } as Partial<User>,
      },
    ]

    validUpdateScenarios.forEach((test) => {
      it(`has ${test.description} with success`, async () => {
        // Arrange
        userRepositoryMock.findByEmail.mockResolvedValue(
          Result.failure(findError),
        );
        userRepositoryMock.findById.mockResolvedValue(Result.ok(userMock));
        userRepositoryMock.update.mockResolvedValue(Result.ok(null));
        const dto: UpdateUserDTO = {
          email: test.data.email ?? null,
          name: test.data.name ?? null,
          birthDate: test.data.birthDate ?? null,
        };

        // Act
        const result = await userService.update(userMock.uid, dto);

        // Assert
        expect(result).toBeDefined();
        expect(result.error).toBeNull();
        expect(result.isValid).toEqual(true);
        expect(result.value).not.toBeNull();
        expect(result.value.uid).toEqual(userMock.uid);
        expect(result.value.name).toEqual(test.data.name ?? userMock.name);
        expect(result.value.email).toEqual(test.data.email ?? userMock.email);
        expect(result.value.birthDate).toEqual(test.data.birthDate ?? userMock.birthDate);
        expect(userRepositoryMock.findById).toHaveBeenCalledTimes(1);
        expect(userRepositoryMock.findById).toHaveBeenCalledWith(userMock.uid);
        expect(userRepositoryMock.update).toHaveBeenCalledTimes(1);
      });
    });

    it("must have return error 404 for not founded user", async () => {
      // Arrange
      const userUpdate: Partial<User> = { name: "Updated Name" };
      userRepositoryMock.findById.mockResolvedValue(
        Result.failure(findError),
      );

      // Act
      const result = await userService.update(userMock.uid, userUpdate);

      // Assert
      expect(result.isValid).toEqual(false);
      expect(result.error).not.toBeNull()
      expect(result.error).toEqual(findError);
      expect(userRepositoryMock.findById).toHaveBeenCalledTimes(1);
      expect(userRepositoryMock.findById).toHaveBeenCalledWith(userMock.uid);
      expect(userRepositoryMock.update).not.toHaveBeenCalled();
    });

    const invalidUpdateScenarios = [
      {
        dto: null,
        description: "dto é nulo",
      },
      {
        dto: undefined,
        description: "dto é undefined",
      },
      {
        dto: new UpdateUserDTO(),
        description: "dto não possui dados",
      },
    ];

    invalidUpdateScenarios.forEach((test) => {
      it(`dto is invalid, when ${test.description}`, async () => {
        // Act
        const result = await userService.update(userMock.uid, test.dto);

        // Assert
        expect(result.isValid).toEqual(false);
        expect(userRepositoryMock.findById).not.toHaveBeenCalled();
        expect(userRepositoryMock.update).not.toHaveBeenCalled();
      });
    });

    it("must return error for email in use", async () => {
      // Arrange
      const dto: UpdateUserDTO = { email: userMock.email };
      userRepositoryMock.findByEmail.mockResolvedValue(Result.ok(userMock));

      // Act
      const result = await userService.update(uid(), dto);

      // Assert
      expect(result.isValid).toEqual(false);
      expect(result.error.code).toEqual(HttpStatus.CONFLICT);
    });
  });
  describe("delete", () => {
    it("must have delete a user", async () => {
      // Arrange
      userRepositoryMock.findById.mockResolvedValue(Result.ok(userMock));
      userRepositoryMock.delete.mockResolvedValue(Result.ok(null));

      // Act
      const result = await userService.delete(userMock.uid);

      // Assert
      expect(result.isValid).toBeTruthy();
      expect(userRepositoryMock.findById).toHaveBeenCalledTimes(1);
      expect(userRepositoryMock.findById).toHaveBeenCalledWith(userMock.uid);
      expect(userRepositoryMock.delete).toHaveBeenCalledTimes(1);
      expect(userRepositoryMock.delete).toHaveBeenCalledWith(userMock.uid);
    });

    it("must return error 404 for not founded user for delete", async () => {
      // Arrange
      userRepositoryMock.findById.mockResolvedValue(
        Result.failure(findError),
      );
      userRepositoryMock.delete.mockResolvedValue(Result.ok(null));

      // Act
      const result = await userService.delete(userMock.uid);

      // Assert
      expect(result.isValid).toEqual(false);
      expect(userRepositoryMock.findById).toHaveBeenCalledTimes(1);
      expect(userRepositoryMock.findById).toHaveBeenCalledWith(userMock.uid);
      expect(userRepositoryMock.delete).not.toHaveBeenCalled();
    });
  });
});

 */

import { faker } from "@faker-js/faker";
import { Customer } from "../entity/customer";
import { ICustomerRepository } from "../repository/customer.repository.interface";
import { CustomerUID } from "../value-object/customer.uid";
import { CustomerService } from "./customer.service";
import {Email} from "../value-object/email";
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
        expect(result.failures[0].code).toBe('INVALID_UID');
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
      expect(repositoryMock.create).toHaveBeenCalledWith(customerMock);
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
      repositoryMock.findById.mockResolvedValue(customerMock);
      repositoryMock.findByEmail.mockResolvedValue(null);
      repositoryMock.update.mockResolvedValue(customerMock);

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