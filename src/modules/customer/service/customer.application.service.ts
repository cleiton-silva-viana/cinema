import { Inject, Injectable } from "@nestjs/common";
import { CUSTOMER_REPOSITORY } from "../constant/customer.constants";
import { ICustomerRepository } from "../repository/customer.repository.interface";
import { CustomerUID } from "../entity/value-object/customer.uid";
import { failure, Result, success } from "../../../shared/result/result";
import { Customer } from "../entity/customer";
import {
  ensureNotNull,
  validateAndCollect,
} from "../../../shared/validator/common.validators";
import { FailureCode } from "../../../shared/failure/failure.codes.enum";
import { ResourceTypes } from "../../../shared/constant/resource.types";
import { Email } from "../entity/value-object/email";
import { Password } from "../entity/value-object/password";
import { CPF } from "../entity/value-object/cpf";
import { isNull } from "../../../shared/validator/validator";

export interface ICreateCustomerProps {
  name: string;
  birthDate: Date;
  email: string;
  password: string;
}

@Injectable()
export class CustomerApplicationService {
  constructor(
    @Inject(CUSTOMER_REPOSITORY)
    private readonly repository: ICustomerRepository,
  ) {}

  public async findById(uid: string | CustomerUID): Promise<Result<Customer>> {
    const failures = ensureNotNull({ uid });
    if (failures.length > 0) return failure(failures);

    let customerUID: CustomerUID | null =
      uid instanceof CustomerUID
        ? uid
        : validateAndCollect(CustomerUID.parse(uid), failures);

    if (failures.length > 0) return failure(failures);

    const customer = await this.repository.findById(customerUID);

    return !customer
      ? failure({
          code: FailureCode.RESOURCE_NOT_FOUND,
          details: { resource: ResourceTypes.CUSTOMER },
        })
      : success(customer);
  }

  public async findByEmail(email: string | Email): Promise<Result<Customer>> {
    const failures = ensureNotNull({ email });
    if (failures.length > 0) return failure(failures);

    const emailChecked: Email | null =
      email instanceof Email
        ? email
        : validateAndCollect(Email.create(email), failures);
    if (failures.length > 0) return failure(failures);

    const customer = await this.repository.findByEmail(emailChecked);
    return isNull(customer)
      ? failure({
          code: FailureCode.RESOURCE_NOT_FOUND,
          details: { resource: ResourceTypes.CUSTOMER },
        })
      : success(customer);
  }

  public async create(
    createProps: ICreateCustomerProps,
  ): Promise<Result<Customer>> {
    const failures = ensureNotNull({
      createProps,
      name: createProps.name,
      birthDate: createProps.birthDate,
      email: createProps.email,
    });
    if (failures.length > 0) return failure(failures);

    const emailAlreadyInUse = await this.repository.hasEmail(createProps.email);
    if (emailAlreadyInUse)
      return failure({
        code: FailureCode.EMAIL_ALREADY_IN_USE,
        details: {
          resource: ResourceTypes.CUSTOMER,
          email: createProps.email,
        },
      });

    const customer = validateAndCollect(
      Customer.create(
        createProps.name,
        createProps.birthDate,
        createProps.email,
      ),
      failures,
    );
    const password = validateAndCollect(
      await Password.create(createProps.password),
      failures,
    );
    if (failures.length > 0) return failure(failures);

    return success(await this.repository.create(customer, password));
  }

  public async updateCustomerEmail(
    customerId: string,
    email: string,
  ): Promise<Result<Customer>> {
    const failures = ensureNotNull({ customerId, email });
    if (failures.length > 0) return failure(failures);

    const emailVO = validateAndCollect(Email.create(email), failures);
    if (failures.length > 0) return failure(failures);

    const emailExists = await this.repository.hasEmail(emailVO);
    if (emailExists)
      return failure({
        code: FailureCode.EMAIL_ALREADY_IN_USE,
        details: {
          value: emailVO.value,
        },
      });

    const customer = validateAndCollect(
      await this.findById(customerId),
      failures,
    );
    if (failures.length > 0) return failure(failures);

    const updatedCustomer = validateAndCollect(
      customer.updateEmail(emailVO.value),
      failures,
    );
    if (failures.length > 0) return failure(failures);

    return success(
      await this.repository.update(customer.uid, {
        email: updatedCustomer.email,
      }),
    );
  }

  public async updateCustomerName(
    customerId: string,
    newName: string,
  ): Promise<Result<Customer>> {
    const customerResult = await this.findById(customerId);
    if (customerResult.isInvalid()) return customerResult;

    const customer = customerResult.value;
    const updateResult = customer.updateName(newName);
    if (updateResult.isInvalid()) return updateResult;

    return success(
      await this.repository.update(customer.uid, { name: customer.name }),
    );
  }

  public async updateCustomerBirthDate(
    customerId: string,
    birthDate: Date,
  ): Promise<Result<Customer>> {
    const failures = ensureNotNull({ customerId, birthDate });
    if (failures.length > 0) return failure(failures);

    const customer = validateAndCollect(
      await this.findById(customerId),
      failures,
    );
    if (failures.length > 0) return failure(failures);

    const updateResult = validateAndCollect(
      customer.updateBirthDate(birthDate),
      failures,
    );
    if (failures.length > 0) return failure(failures);

    return success(
      await this.repository.update(customer.uid, {
        birthDate: updateResult.birthDate,
      }),
    );
  }

  public async assignCustomerCPF(
    customerUID: string,
    cpf: string,
  ): Promise<Result<Customer>> {
    const failures = ensureNotNull({ customerUID, cpf });
    if (failures.length > 0) return failure(failures);

    const cpfVO = validateAndCollect(CPF.create(cpf), failures);
    const customerUidVO = validateAndCollect(
      CustomerUID.parse(customerUID),
      failures,
    );
    if (failures.length > 0) return failure(failures);

    const cpfAlreadyInUse = await this.repository.hasCPF(cpfVO);
    if (cpfAlreadyInUse)
      return failure({
        code: FailureCode.CPF_ALREADY_IN_USE,
        details: {
          resource: ResourceTypes.CUSTOMER,
          value: cpf,
        },
      });

    const customer = validateAndCollect(
      await this.findById(customerUID),
      failures,
    );
    if (failures.length > 0) return failure(failures);

    const assignResult = customer.assignCPF(cpf);
    if (assignResult.isInvalid()) return assignResult;

    return success(
      await this.repository.update(customer.uid, { cpf: customer.cpf }),
    );
  }

  public async removeCustomerCPF(
    customerId: string,
  ): Promise<Result<Customer>> {
    const customerResult = await this.findById(customerId);
    if (customerResult.isInvalid()) return customerResult;

    const customer = customerResult.value;
    const withoutCPF = validateAndCollect(customer.removeCPF(), []);

    return success(
      await this.repository.update(customer.uid, { cpf: withoutCPF.cpf }),
    );
  }

  public async assignCustomerStudentCard(
    customerId: string,
    studentCard: { id: string; validity: Date },
  ): Promise<Result<Customer>> {
    const failures = ensureNotNull({ customerId, studentCard });
    if (failures.length > 0) return failure(failures);

    const { id, validity } = studentCard;
    failures.push(
      ...ensureNotNull({ studentCardId: id, studentCardValidity: validity }),
    );

    const customer = validateAndCollect(
      await this.findById(customerId),
      failures,
    );
    if (failures.length > 0) return failure(failures);

    const withAssign = validateAndCollect(
      customer.assignStudentCard(id, validity),
      failures,
    );
    if (failures.length > 0) return failure(failures);

    const studentCardExists = await this.repository.hasStudentCardID(
      withAssign.studentCard.id,
    );
    if (studentCardExists) {
      return failure({
        code: FailureCode.STUDENT_CARD_ALREADY_IN_USE,
        details: {
          value: withAssign.studentCard.id,
        },
      });
    }

    return success(
      await this.repository.update(customer.uid, {
        studentCard: withAssign.studentCard,
      }),
    );
  }

  public async removeCustomerStudentCard(
    customerId: string,
  ): Promise<Result<Customer>> {
    const customerResult = await this.findById(customerId);
    if (customerResult.isInvalid()) return customerResult;

    const customer = customerResult.value;

    const removeResult = customer.removeStudentCard();
    if (removeResult.isInvalid()) return removeResult;

    return success(
      await this.repository.update(customer.uid, {
        studentCard: removeResult.value.studentCard,
      }),
    );
  }
}
