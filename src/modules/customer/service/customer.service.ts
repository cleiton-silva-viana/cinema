import { Inject, Injectable } from "@nestjs/common";
import { ICustomerRepository } from "../repository/customer.repository.interface";
import {
  CreateCustomerProps,
  ICustomerService,
  UpdateCustomerProps,
} from "./customer.service.interface";
import { Customer } from "../entity/customer";
import { failure, Result, success } from "../../../shared/result/result";
import { isNull } from "../../../shared/validator/validator";
import { Email } from "../entity/value-object/email";
import { CustomerUID } from "../entity/value-object/customer.uid";
import { CUSTOMER_REPOSITORY } from "../constant/customer.constants";
import { FailureCode } from "../../../shared/failure/failure.codes.enum";
import { ResourceTypes } from "../../../shared/constant/resource.types";

@Injectable()
export class CustomerService implements ICustomerService {
  constructor(
    @Inject(CUSTOMER_REPOSITORY) private readonly repository: ICustomerRepository
  ) {}

  public async findById(uid: string | CustomerUID): Promise<Result<Customer>> {
    if (isNull(uid))
      return failure({ code: FailureCode.INVALID_UUID });

    let result =
      uid instanceof CustomerUID ? success(uid) : CustomerUID.parse(uid);
    if (result.invalid) return failure(result.failures);

    const customer = await this.repository.findById(result.value);
    return !customer
      ? failure({
          code: FailureCode.RESOURCE_NOT_FOUND,
          details: { resource: ResourceTypes.CUSTOMER },
        })
      : success(customer);
  }

  public async findByEmail(email: string | Email): Promise<Result<Customer>> {
    const result =
      email instanceof Email ? success(email) : Email.create(email);
    if (result.invalid) return failure(result.failures);

    const customer = await this.repository.findByEmail(result.value);
    return !customer
      ? failure({
        code: FailureCode.RESOURCE_NOT_FOUND,
        details: { resource: ResourceTypes.CUSTOMER },
        })
      : success(customer);
  }

  public async create(
    createProps: CreateCustomerProps,
  ): Promise<Result<Customer>> {
    const createCustomerResult = Customer.create(
      createProps.name,
      createProps.birthDate,
      createProps.email,
    );
    if (createCustomerResult.invalid)
      return failure(createCustomerResult.failures);
    const customer = createCustomerResult.value;

    const emailAlreadyInUse = await this.repository.findByEmail(customer.email);
    if (emailAlreadyInUse)
      return failure({
        code: FailureCode.EMAIL_ALREADY_IN_USE,
        details: { resource: ResourceTypes.CUSTOMER },
      });

    const customerSaved = await this.repository.create(customer);
    return success(customerSaved);
  }

  public async update(
    uid: string,
    updateProps: UpdateCustomerProps,
  ): Promise<Result<Customer>> {
    if (isNull(updateProps))
      return failure({
        code: FailureCode.MISSING_REQUIRED_DATA,
        details: { resource: ResourceTypes.CUSTOMER },
      });

    const customerUidResult = CustomerUID.parse(uid);
    if (customerUidResult.invalid) return failure(customerUidResult.failures);
    const customerUID = customerUidResult.value;

    if (updateProps.email) {
      const emailResult = Email.create(updateProps.email);
      if (emailResult.invalid) failure(emailResult.failures);

      const emailsAlreadyInUse = await this.repository.findByEmail(emailResult.value);
      if (emailsAlreadyInUse)
        return failure({
          code: FailureCode.EMAIL_ALREADY_IN_USE,
          details: { resource: ResourceTypes.CUSTOMER },
        });
    }

    const findCustomerResult = await this.findById(customerUID);
    if (findCustomerResult.invalid) return failure(findCustomerResult.failures);
    const customer = findCustomerResult.value;

    const updateResult = customer.update(updateProps);
    if (updateResult.invalid) return failure(updateResult.failures);

    await this.repository.update(customerUID, customer);

    const customerSaved = await this.repository.update(customerUID, customer);
    return success(customerSaved);
  }

  async delete(uid: string): Promise<Result<null>> {
    const customerUidResult = CustomerUID.parse(uid);
    if (customerUidResult.invalid) return failure(customerUidResult.failures);
    const customerUID = customerUidResult.value;

    const findResult = await this.findById(customerUID);
    if (findResult.invalid) return failure(findResult.failures);

    await this.repository.delete(customerUID);
    return success(null);
  }
}
