import { Test } from "@nestjs/testing";
import { CustomerApplicationService } from "./customer.application.service";
import { CUSTOMER_REPOSITORY } from "../constant/customer.constants";
import { ICustomerRepository } from "../repository/customer.repository.interface";
import { Customer } from "../entity/customer";
import { FailureCode } from "../../../shared/failure/failure.codes.enum";
import { fa, faker } from "@faker-js/faker";
import { v4 } from "uuid";
import { SimpleFailure } from "../../../shared/failure/simple.failure.type";
import { validateAndCollect } from "../../../shared/validator/common.validators";
import * as inspector from "node:inspector";
import { CustomerUID } from "../entity/value-object/customer.uid";

describe("CustomerApplicationService", () => {
  let service: CustomerApplicationService;
  let failures: SimpleFailure[];
  let customerInstance: Customer;
  let mockRepository: jest.Mocked<ICustomerRepository>;

  function updatedInstance(
    customer: Customer,
    prop: Partial<{
      name?: string;
      email?: string;
      birthDate?: Date;
      cpf?: string;
      studentCard: { id: string; validity: Date };
    }>,
  ) {
    return Customer.hydrate({
      uid: customer.uid.value,
      name: prop.name || customer.name.value,
      email: prop.email || customer.email.value,
      cpf: prop.cpf || customer.cpf.value,
      birthDate: prop.birthDate || customer.birthDate.value,
      studentCard: customer.studentCard,
    });
  }

  beforeEach(async () => {
    failures = [];
    customerInstance = Customer.hydrate({
      uid: CustomerUID.create().value,
      name: faker.person.firstName(),
      cpf: "123.123.123-12",
      email: faker.internet.email(),
      birthDate: faker.date.birthdate(),
      studentCard: null,
    });

    const module = await Test.createTestingModule({
      providers: [
        CustomerApplicationService,
        {
          provide: CUSTOMER_REPOSITORY,
          useValue: {
            findById: jest.fn(),
            findByEmail: jest.fn(),
            hasEmail: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            hasCPF: jest.fn(),
            hasStudentCardID: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CustomerApplicationService>(
      CustomerApplicationService,
    );
    mockRepository = module.get(CUSTOMER_REPOSITORY);
  });

  describe("findById", () => {
    it("deve retornar um cliente quando encontrado pelo ID", async () => {
      // Arrange
      mockRepository.findById.mockResolvedValue(customerInstance);

      // Act
      const result = validateAndCollect(
        await service.findById(customerInstance.uid.value),
        failures,
      );

      // Assert
      expect(result).toBeDefined();
      expect(result).toEqual(customerInstance);
    });

    it("deve retornar um erro quando o cliente não for encontrado", async () => {
      // Arrange
      mockRepository.findById.mockResolvedValue(null);

      // Act
      const result = validateAndCollect(
        await service.findById(customerInstance.uid.value),
        failures,
      );

      // Assert
      expect(result).toBeNull();
      expect(failures[0].code).toBe(FailureCode.RESOURCE_NOT_FOUND);
    });
  });

  describe("findByEmail", () => {
    it("deve retornar um cliente quando encontrado pelo email", async () => {
      // Arrange
      mockRepository.findByEmail.mockResolvedValue(customerInstance);

      // Act
      const result = validateAndCollect(
        await service.findByEmail(customerInstance.email.value),
        failures,
      );

      // Assert
      expect(result).toBeDefined();
      expect(result).toEqual(customerInstance);
    });

    it("deve retornar um erro quando o cliente não for encontrado", async () => {
      // Arrange
      mockRepository.findByEmail.mockResolvedValue(null);

      // Act
      const result = validateAndCollect(
        await service.findByEmail(faker.internet.email()),
        failures,
      );

      // Assert
      expect(result).toBeNull();
      expect(failures[0].code).toBe(FailureCode.RESOURCE_NOT_FOUND);
    });
  });

  describe("create", () => {
    it("deve criar um novo cliente com dados válidos", async () => {
      // Arrange
      mockRepository.hasEmail.mockResolvedValue(false);
      mockRepository.create.mockResolvedValue(customerInstance);

      // Act
      const result = validateAndCollect(
        await service.create({
          name: customerInstance.name.value,
          birthDate: customerInstance.birthDate.value,
          email: customerInstance.email.value,
          password: "#R252f#@$R@65wvw",
        }),
        failures,
      );

      // Assert
      expect(result).toBeDefined();
      expect(result).toEqual(customerInstance);
      expect(mockRepository.create).toHaveBeenCalled();
      expect(mockRepository.create).toHaveBeenCalledTimes(1);
    });

    it("deve retornar erro quando o email já estiver em uso", async () => {
      // Arrange
      mockRepository.hasEmail.mockResolvedValue(true);

      // Act
      const result = validateAndCollect(
        await service.create({
          name: customerInstance.name.value,
          birthDate: customerInstance.birthDate.value,
          email: customerInstance.email.value,
          password: faker.internet.password(),
        }),
        failures,
      );

      // Assert
      expect(result).toBeNull();
      expect(failures[0].code).toBe(FailureCode.EMAIL_ALREADY_IN_USE);
      expect(mockRepository.create).not.toHaveBeenCalled();
    });
  });

  describe("updateCustomerEmail", () => {
    it("deve atualizar o email do cliente quando válido", async () => {
      // Arrange
      const email = faker.internet.email();
      const updatedCustomer = updatedInstance(customerInstance, { email });
      mockRepository.findById.mockResolvedValue(customerInstance);
      mockRepository.hasEmail.mockResolvedValue(false);
      mockRepository.update.mockResolvedValue(updatedCustomer);

      // Act
      const result = await service.updateCustomerEmail(
        customerInstance.uid.value,
        email,
      );

      // Assert
      expect(result.isValid()).toBeTruthy();
      expect(mockRepository.update).toBeCalledTimes(1);
    });

    it("deve retornar erro quando o novo email já estiver em uso", async () => {
      // Arrange
      mockRepository.hasEmail.mockResolvedValue(true);

      // Act
      const result = validateAndCollect(
        await service.updateCustomerEmail(v4(), faker.internet.email()),
        failures,
      );

      // Assert
      expect(result).toBeDefined();
      expect(failures[0].code).toBe(FailureCode.EMAIL_ALREADY_IN_USE);
      expect(mockRepository.update).not.toHaveBeenCalled();
    });
  });

  describe("updateCustomerName", () => {
    it("deve atualizar o nome do cliente quando válido", async () => {
      // Arrange
      const name = faker.person.firstName();
      const updatedCustomer = updatedInstance(customerInstance, { name });
      mockRepository.findById.mockResolvedValue(customerInstance);
      mockRepository.update.mockResolvedValue(updatedCustomer);

      // Act
      const result = validateAndCollect(
        await service.updateCustomerName(customerInstance.uid.value, name),
        failures,
      );

      // Assert
      expect(result).toBeDefined();
      expect(result).toEqual(updatedCustomer);
      expect(mockRepository.update).toBeCalledTimes(1);
    });

    it("deve retornar erro quando o novo nome for inválido", async () => {
      // Act
      const result = validateAndCollect(
        await service.updateCustomerName(customerInstance.uid.value, "sa"),
        failures,
      );

      // Assert
      expect(result).toBeNull();
      expect(mockRepository.update).not.toHaveBeenCalled();
    });
  });

  describe("updateCustomerBirthDate", () => {
    it("deve atualizar a data de nascimento quando válida", async () => {
      // Arrange
      const birthDate = faker.date.birthdate();
      const updatedCustomer = updatedInstance(customerInstance, { birthDate });
      mockRepository.findById.mockResolvedValue(customerInstance);
      mockRepository.update.mockResolvedValue(updatedCustomer);

      // Act
      const result = validateAndCollect(
        await service.updateCustomerBirthDate(
          customerInstance.uid.value,
          birthDate,
        ),
        failures,
      );

      // Assert
      expect(result).toBeDefined();
      expect(result).toEqual(updatedCustomer);
      expect(mockRepository.update).toBeCalledTimes(1);
    });

    it("deve retornar erro quando a nova data for inválida", async () => {
      // Arrange
      mockRepository.hasEmail.mockResolvedValue(true);

      // Act
      const result = validateAndCollect(
        await service.updateCustomerBirthDate(v4(), new Date()),
        failures,
      );

      // Assert
      expect(result).toBeNull();
      expect(failures.length).toBeGreaterThan(0);
      expect(mockRepository.update).not.toHaveBeenCalled();
    });
  });

  describe("assignCustomerCPF", () => {
    it("deve atribuir CPF quando válido e único", async () => {
      // Arrange
      const cpf = "222.222.222-33";
      const updatedCustomer = updatedInstance(customerInstance, { cpf });
      mockRepository.findById.mockResolvedValue(customerInstance);
      mockRepository.hasCPF.mockResolvedValue(false);
      mockRepository.update.mockResolvedValue(updatedCustomer);

      // Act
      const result = validateAndCollect(
        await service.assignCustomerCPF(customerInstance.uid.value, cpf),
        failures,
      );

      // Assert
      expect(result).toBeDefined();
      expect(result).toEqual(updatedCustomer);
      expect(mockRepository.update).toHaveBeenCalledTimes(1);
    });

    it("deve retornar erro quando o CPF já estiver em uso", async () => {
      // Arrange
      mockRepository.hasCPF.mockResolvedValue(true);

      // Act
      const result = validateAndCollect(
        await service.assignCustomerCPF(v4(), "123.456.789-09"),
        failures,
      );

      // Assert
      expect(result).toBeNull();
      expect(failures.length).toBeGreaterThan(0);
    });
  });

  describe("removeCustomerCPF", () => {
    it("deve remover o CPF do cliente", async () => {
      // Arrange
      const updatedCustomer = updatedInstance(customerInstance, { cpf: null });
      mockRepository.findById.mockResolvedValue(customerInstance);
      mockRepository.update.mockResolvedValue(updatedCustomer);

      // Act
      const result = validateAndCollect(
        await service.removeCustomerCPF(customerInstance.uid.value),
        failures,
      );

      // Assert
      expect(result).toBeDefined();
      expect(mockRepository.update).toHaveBeenCalledTimes(1);
    });
  });

  describe("assignCustomerStudentCard", () => {
    it("deve atribuir carteira de estudante quando válida e única", async () => {
      // Arrange
      const studentCard = {
        id: "STUDENT123",
        validity: new Date(Date.now() + 1000 + 60000),
      };
      const updatedCustomer = updatedInstance(customerInstance, {
        studentCard,
      });

      mockRepository.findById.mockResolvedValue(customerInstance);
      mockRepository.hasStudentCardID.mockResolvedValue(false);
      mockRepository.update.mockResolvedValue(updatedCustomer);

      // Act
      const result = validateAndCollect(
        await service.assignCustomerStudentCard(
          customerInstance.uid.value,
          studentCard,
        ),
        failures,
      );

      // Assert
      expect(result).toBeDefined();
      expect(result).toEqual(updatedCustomer);
      expect(mockRepository.update).toHaveBeenCalledTimes(1);
    });

    it("deve retornar erro quando a carteira já estiver em uso", async () => {
      // Arrange
      mockRepository.hasStudentCardID.mockResolvedValue(true);

      // Act
      const result = validateAndCollect(
        await service.assignCustomerStudentCard("valid-id", {
          id: "STUDENT123",
          validity: new Date("2025-12-31"),
        }),
        failures,
      );

      // Assert
      expect(result).toBeNull();
      expect(failures.length).toBeGreaterThan(0);
      expect(mockRepository.update).not.toHaveBeenCalled();
    });
  });

  describe("removeCustomerStudentCard", () => {
    it("deve remover a carteira de estudante do cliente", async () => {
      // Arrange
      const instance = updatedInstance(customerInstance, {
        studentCard: { id: "123ac1", validity: new Date() },
      });
      mockRepository.findById.mockResolvedValue(instance);
      mockRepository.update.mockResolvedValue(customerInstance);

      // Act
      const result = validateAndCollect(
        await service.removeCustomerStudentCard(customerInstance.uid.value),
        failures,
      );

      // Assert
      expect(result).toBeDefined();
      expect(result).toEqual(instance);
    });
  });
});
