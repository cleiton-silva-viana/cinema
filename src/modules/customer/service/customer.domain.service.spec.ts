import { faker } from "@faker-js/faker";
import { Customer } from "../entity/customer";
import { ICustomerRepository } from "../repository/customer.repository.interface";
import { CustomerUID } from "../entity/value-object/customer.uid";
import { Email } from "../entity/value-object/email";
import { v4, v7 } from "uuid";
import { FailureCode } from "../../../shared/failure/failure.codes.enum";
import { CustomerDomainService } from "./customer.domain.service";
import { SimpleFailure } from "../../../shared/failure/simple.failure.type";
import { validateAndCollect } from "../../../shared/validator/common.validators";

describe("CustomerService", () => {
  let customerService: CustomerDomainService;
  let repositoryMock: jest.Mocked<ICustomerRepository>;
  let customerMock: Customer;
  let validCustomerUID: CustomerUID;
  let failures: SimpleFailure[] = []

  beforeEach(() => {
    failures = []

    repositoryMock = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as jest.Mocked<ICustomerRepository>;

    customerService = new CustomerDomainService(repositoryMock);

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
    it("deve encontrar cliente por id", async () => {
      // Arrange
      repositoryMock.findById.mockResolvedValue(customerMock);

      // Act
      const result = validateAndCollect(await customerService.findById(validCustomerUID), failures);

      // Assert
      expect(result).toBeDefined();
      expect(result).toEqual(customerMock);
      expect(repositoryMock.findById).toHaveBeenCalledTimes(1);
      expect(repositoryMock.findById).toHaveBeenCalledWith(validCustomerUID);
    });

    it('deve retornar uma falha quando o parâmetor uid for nulo', async () => {
      // Arrange
      const falsyValues = [ null, undefined ] as Array<any>

      falsyValues.forEach(async (uid) => {
        // Act
        const result = validateAndCollect(await customerService.findById(uid), failures);

        // Assert
        expect(result).toBeNull();
        expect(failures[0].code).toBe(FailureCode.MISSING_REQUIRED_DATA);
        expect(repositoryMock.findById).not.toHaveBeenCalled();
      })
    })

    describe("deve retornar falha para", () => {
      const invalidCases = [
        {
          description: "uid de outra entidade",
          uid: `usr.${v7()}`,
        },
        {
          description: "uid com formato inválido",
          uid: `cust.${v4()}`,
        },
        {
          description: "uid sem prefixo",
          uid: v7(),
        },
        {
          description: "uid com formato UUID inválido",
          uid: "cus.invalid-uuid-format",
        },
      ];

      invalidCases.forEach((scenario) => {
        it(`${scenario.description}`, async () => {
          // Act
          const result = validateAndCollect(await customerService.findById(scenario.uid), failures);

          // Assert
          expect(result).toBeNull();
          expect(failures[0].code).toBe(FailureCode.UID_WITH_INVALID_FORMAT);
          expect(repositoryMock.findById).not.toHaveBeenCalled();
        });
      });
    });

    it("deve retornar falha para cliente inexistente", async () => {
      // Arrange
      repositoryMock.findById.mockResolvedValue(null);

      // Act
      const result = validateAndCollect(await customerService.findById(validCustomerUID), failures);

      // Assert
      expect(result).toBeNull();
      expect(failures[0].code).toBe(FailureCode.RESOURCE_NOT_FOUND);
    });
  });

  describe("findByEmail", () => {
    const validEmail = Email.hydrate(faker.internet.email());

    it("deve encontrar cliente por email", async () => {
      // Arrange
      repositoryMock.findByEmail.mockResolvedValue(customerMock);

      // Act
      const result = validateAndCollect(await customerService.findByEmail(validEmail), failures);

      // Assert
      expect(result).toBeDefined();
      expect(result).toEqual(customerMock);
    });

    it("deve retornar falha para email inválido", async () => {
      // Act
      const result = validateAndCollect(await customerService.findByEmail("invalid-email"), failures);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe("create", () => {
    const createProps = {
      name: faker.person.firstName(),
      email: faker.internet.email(),
      birthDate: faker.date.between({
        from: new Date(1940, 0, 0),
        to: new Date(2006, 0, 0),
      }),
    };

    it("deve criar cliente com sucesso", async () => {
      // Arrange
      const customerMock = Customer.hydrate(
        validCustomerUID.value,
        createProps.name,
        createProps.birthDate,
        createProps.email,
      );
      repositoryMock.findByEmail.mockResolvedValue(null);
      repositoryMock.create.mockResolvedValue(customerMock);

      // Act
      const result = validateAndCollect(await customerService.create(createProps), failures);

      // Assert
      expect(result).toBeDefined();
      expect(result.name.value).toEqual(createProps.name);
      expect(result.email.value).toEqual(createProps.email);
      expect(result.birthDate.value).toEqual(createProps.birthDate);
      expect(repositoryMock.create).not.toHaveBeenCalled();
    });

    it("deve retornar falha quando email já existe", async () => {
      // Arrange
      repositoryMock.findByEmail.mockResolvedValue(customerMock);

      // Act
      const result = validateAndCollect(await customerService.create(createProps), failures);

      // Assert
      expect(result).toBeNull();
      expect(failures[0].code).toBe(FailureCode.EMAIL_ALREADY_IN_USE);
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
      }),
    };

    it("deve atualizar cliente com sucesso", async () => {
      // Arrange
      const updatedCustomerMock = Customer.hydrate(
        validCustomerUID.value,
        updateProps.name,
        updateProps.birthDate,
        updateProps.email,
      );
      repositoryMock.findById.mockResolvedValue(customerMock);
      repositoryMock.findByEmail.mockResolvedValue(null);
      repositoryMock.update.mockResolvedValue(updatedCustomerMock);

      // Act
      const result = validateAndCollect(await customerService.update(validCustomerUID.value, updateProps), failures)

      // Assert
      expect(result).toBeDefined();
      expect(repositoryMock.update).not.toHaveBeenCalled();
    });

    it("deve retornar falha para props de atualização vazias", async () => {
      // Act
      const result = validateAndCollect(await customerService.update(validCustomerUID.value, null), failures);

      // Assert
      expect(result).toBeNull();
      expect(failures[0].code).toBe(FailureCode.MISSING_REQUIRED_DATA);
    });

    it("deve retornar falha quando cliente não encontrado", async () => {
      // Arrange
      repositoryMock.findById.mockResolvedValue(null);

      // Act
      const result = validateAndCollect(await customerService.update(validCustomerUID.value, updateProps), failures)

      // Assert
      expect(result).toBeNull();
      expect(failures[0].code).toBe(FailureCode.RESOURCE_NOT_FOUND);
    });

    it("deve retornar falha quando email já em uso", async () => {
      // Arrange
      repositoryMock.findById.mockResolvedValue(customerMock);
      repositoryMock.findByEmail.mockResolvedValue(customerMock);

      // Act
      const result = validateAndCollect(await customerService.update(validCustomerUID.value, updateProps), failures)

      // Assert
      expect(result).toBeNull();
      expect(failures[0].code).toBe(FailureCode.EMAIL_ALREADY_IN_USE);
    });
  });

  describe("delete", () => {
    it("deve deletar cliente com sucesso", async () => {
      // Arrange
      repositoryMock.findById.mockResolvedValue(customerMock);
      repositoryMock.delete.mockResolvedValue(void 0);

      // Act
      const result = validateAndCollect(await customerService.delete(validCustomerUID.value), failures)

      // Assert
      expect(result).toBeDefined();
      expect(repositoryMock.delete).not.toHaveBeenCalledWith(validCustomerUID);
    });

    it("deve retornar falha quando cliente não encontrado", async () => {
      // Arrange
      repositoryMock.findById.mockResolvedValue(null);

      // Act
      const result = validateAndCollect(await customerService.delete(validCustomerUID.value), failures);

      // Assert
      expect(result).toBeNull();
      expect(failures[0].code).toBe(FailureCode.RESOURCE_NOT_FOUND);
      expect(repositoryMock.delete).not.toHaveBeenCalled();
    });

    it("deve retornar falha para uid inválido", async () => {
      // Act
      const result = validateAndCollect(await customerService.delete("invalid-uid"), failures);

      // Assert
      expect(result).toBeNull();
      expect(repositoryMock.findById).not.toHaveBeenCalled();
      expect(repositoryMock.delete).not.toHaveBeenCalled();
    });
  });
});
