import {Injectable} from "@nestjs/common";
import {ICustomerRepository} from "../repository/customer.repository.interface";
import {CreateCustomerProps, ICustomerService, UpdateCustomerProps} from "./customer.service.interface";
import {Customer} from "../entity/customer";
import {failure, Result, success} from "../../../shared/result/result";
import {isNull} from "../../../shared/validator/validator";
import { Email } from "../value-object/email";
import {BirthDate} from "../value-object/birth.date";
import { Name } from "../value-object/name";
import {SimpleFailure} from "../../../shared/failure/simple.failure.type";
import { CustomerUID } from "../value-object/customer.uid";

@Injectable()
export class CustomerService implements ICustomerService {
    constructor(private readonly repository: ICustomerRepository) {}

    public async findById(uid: string | CustomerUID): Promise<Result<Customer>> {
        if (isNull(uid)) return failure({
            code: 'INVALID_UUID',
            details: { resource: 'customer' }
        });

        let result = (uid instanceof CustomerUID)
                ? success(uid)
                : CustomerUID.parse(uid)
        if (result.invalid) return failure(result.failures)

        const customer = await this.repository.findById(result.value);
        return (!customer)
            ? failure({
                code: 'RESOURCE_NOT_FOUND',
                details: { resource: 'customer' }
            })
            : success(customer);
    }

    public async findByEmail(email: string | Email): Promise<Result<Customer>> {
        const result = (email instanceof Email)
            ? success(email)
            : Email.create(email);
        if (result.invalid) return failure(result.failures)

        const customer = await this.repository.findByEmail(result.value);
        return (!customer)
            ? failure({
                code: 'RESOURCE_NOT_FOUND',
                details: { resource: 'customer' }
            })
            : success(customer);
    }

    public async create(createProps: CreateCustomerProps): Promise<Result<Customer>> {

        const createCustomerResult = Customer.create(
            createProps.name,
            createProps.birthDate,
            createProps.email,
        )
        if (createCustomerResult.invalid) return failure(createCustomerResult.failures)
        const customer = createCustomerResult.value

        const emailAlreadyInUse = await this.repository.findByEmail(customer.email);
        if (emailAlreadyInUse) return failure({
            code: 'EMAIL_ALREADY_IN_USE',
            details: {resource: 'customer'}
        });

        const customerSaved = await this.repository.create(customer);
        return success(customerSaved);
    }

    public async update(uid: string, updateProps: UpdateCustomerProps): Promise<Result<Customer>> {

        if (isNull(updateProps)) return failure({
            code: 'EMPTY_DATAS_FOR_UPDATE',
            details: {resource: 'customer'}
        })

        const { name: rawName, birthDate: rawBirthDate, email: rawEmail } = updateProps;
        if (isNull(rawName) && isNull(rawBirthDate) && isNull(rawEmail))
            return failure({
            code: 'EMPTY_DATAS_FOR_UPDATE',
            details: {resource: 'customer'}
        })

        const customerUidResult = CustomerUID.parse(uid)
        const nameResult = Name.create(rawName)
        const birthDateResult = BirthDate.create(rawBirthDate)
        const emailResult = Email.create(rawEmail)

        const failures: SimpleFailure[] = []

        if (customerUidResult.invalid) failures.push(...customerUidResult.failures)
        if (nameResult.invalid) failures.push(...nameResult.failures)
        if (birthDateResult.invalid) failures.push(...nameResult.failures)
        if (emailResult.invalid) failures.push(...emailResult.failures)

        const customerUID = customerUidResult.value
        const name = nameResult.value
        const birthDate = birthDateResult.value
        const email = emailResult.value

        if (failures.length > 0) return failure(failures)

        const emailsAlreadyInUse = await this.repository.findByEmail(email)
        if (emailsAlreadyInUse) return failure({
            code: 'EMAIL_ALREADY_IN_USE',
            details: {resource: 'customer'}
        })

        const customer = await this.repository.findById(customerUID)
        if (!customer) return failure({
            code: 'RESOURCE_NOT_FOUND',
            details: {resource: 'customer'}
        })

        const updateFailure = customer.update({name, email, birthDate})
        if (updateFailure.invalid) return failure(updateFailure.failures)

        const customerSaved = await this.repository.update(customerUID, customer)
        return success(customerSaved);
    }

    async delete(uid: string): Promise<Result<null>> {
        const customerUidResult = CustomerUID.parse(uid)
        if (customerUidResult.invalid) return failure(customerUidResult.failures)
        const customerUID = customerUidResult.value

        const findResult = await this.findById(customerUID);
        if (findResult.invalid) return failure(findResult.failures)

        await this.repository.delete(customerUID)
        return success(null);
    }
}
