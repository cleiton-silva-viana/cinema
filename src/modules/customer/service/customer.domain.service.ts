import { Inject, Injectable } from "@nestjs/common";
import { ICustomerRepository } from "../repository/customer.repository.interface";
import { Customer } from "../entity/customer";
import { failure, Result, success } from "../../../shared/result/result";
import { Email } from "../entity/value-object/email";
import { CustomerUID } from "../entity/value-object/customer.uid";
import { CUSTOMER_REPOSITORY } from "../constant/customer.constants";
import { FailureCode } from "../../../shared/failure/failure.codes.enum";
import { ResourceTypes } from "../../../shared/constant/resource.types";
import { ensureNotNull, validateAndCollect } from "../../../shared/validator/common.validators";
import { ICreateCustomerProps, ICustomerDomainService, IUpdateCustomerProps } from "./customer.domain.service.interface";

@Injectable()
export class CustomerDomainService implements ICustomerDomainService {
  constructor(
    @Inject(CUSTOMER_REPOSITORY)
    private readonly repository: ICustomerRepository,
  ) {}

  public async findById(uid: string | CustomerUID): Promise<Result<Customer>> {
    const failures = ensureNotNull({ uid })
    if (failures.length > 0) return failure(failures)

    let customerUID: CustomerUID | null =
      uid instanceof CustomerUID
        ? uid
        : validateAndCollect(CustomerUID.parse(uid), failures);

    if (failures.length > 0) return failure(failures)

    const customer = await this.repository.findById(customerUID);

    return (!customer)
      ? failure({
          code: FailureCode.RESOURCE_NOT_FOUND,
          details: { resource: ResourceTypes.CUSTOMER },
        })
      : success(customer);
  }

  public async findByEmail(email: string | Email): Promise<Result<Customer>> {
    const failures = ensureNotNull({ email })
    if (failures.length > 0) return failure(failures)

    const emailChecked: Email | null =
      email instanceof Email
        ? email
        : validateAndCollect(Email.create(email), failures);
    if (failures.length > 0) return failure(failures)

    const customer = await this.repository.findByEmail(emailChecked);
    return (!customer)
      ? failure({
          code: FailureCode.RESOURCE_NOT_FOUND,
          details: { resource: ResourceTypes.CUSTOMER },
        })
      : success(customer);
  }

  public async create(createProps: ICreateCustomerProps): Promise<Result<Customer>> {
    const failures = ensureNotNull({
      createProps,
      name: createProps.name,
      birthDate: createProps.birthDate,
      email: createProps.email
    });
    if (failures.length > 0) return failure(failures)

    const customerResult = Customer.create(createProps.name, createProps.birthDate, createProps.email)
    if (customerResult.isInvalid()) return customerResult

    const customer = customerResult.value

    const emailAlreadyInUse = await this.repository.findByEmail(customer.email);
    if (emailAlreadyInUse)
      return failure({
        code: FailureCode.EMAIL_ALREADY_IN_USE,
        details: {
          resource: ResourceTypes.CUSTOMER,
          email: customer.email.value,
        },
      });

    return success(customer);
  }

  public async update(uid: string, updateProps: IUpdateCustomerProps): Promise<Result<Customer>> {
    const failures = ensureNotNull({ uid, updateProps });
    if (failures.length > 0) return failure(failures)

    const customerUidResult = CustomerUID.parse(uid);
    if (customerUidResult.isInvalid()) return customerUidResult
    const customerUID = customerUidResult.value;

    if (updateProps.email) {
      const emailResult = Email.create(updateProps.email);
      if (emailResult.isInvalid()) return emailResult;

      const emailsAlreadyInUse = await this.repository.findByEmail(emailResult.value);
      if (emailsAlreadyInUse)
        return failure({
          code: FailureCode.EMAIL_ALREADY_IN_USE,
          details: {
            resource: ResourceTypes.CUSTOMER,
            email: emailResult.value.value
          },
        });
    }

    const findCustomerResult = await this.findById(customerUID);
    if (findCustomerResult.isInvalid()) return findCustomerResult;
    const customer = findCustomerResult.value;

    return customer.update(updateProps);
  }

  public async delete(uid: string): Promise<Result<boolean>> {
    const failures = ensureNotNull({ uid })
    if (failures.length > 0) return failure(failures)

    const customerUidResult = CustomerUID.parse(uid);
    if (customerUidResult.isInvalid()) return customerUidResult;
    const customerUID = customerUidResult.value;

    const findResult = await this.findById(customerUID);
    if (findResult.isInvalid()) return findResult;

    return success(true);
  }
}
