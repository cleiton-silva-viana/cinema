import { failure, Result, success } from "../../../shared/result/result";
import { TechnicalError } from "../../../shared/error/technical.error";
import { SimpleFailure } from "../../../shared/failure/simple.failure.type";
import { CustomerUID } from "./value-object/customer.uid";
import { Email } from "./value-object/email";
import { BirthDate } from "../../../shared/value-object/birth.date";
import { CPF } from "./value-object/cpf";
import { Name } from "../../../shared/value-object/name";

export class Customer {
  private constructor(
    public readonly uid: CustomerUID,
    private _name: Name,
    private _birthDate: BirthDate,
    private _email: Email,
    public readonly cpf?: CPF,
    public readonly carteiraEstudantil?: {
      id: string;
      validade: Date;
    },
  ) {}

  public static create(
    name: string,
    birthDate: Date,
    email: string,
  ): Result<Customer> {
    const failures = [];

    const nameResult = Name.create(name);
    if (nameResult.invalid) failures.push(...nameResult.failures);

    const birthDateResult = BirthDate.create(birthDate);
    if (birthDateResult.invalid) failures.push(...birthDateResult.failures);

    const emailResult = Email.create(email);
    if (emailResult.invalid) failures.push(...emailResult.failures);

    return failures.length
      ? failure(failures)
      : success(new Customer(
            CustomerUID.create(),
            nameResult.value,
            birthDateResult.value,
            emailResult.value,));
  }

  public static hydrate(
    uid: string,
    name: string,
    birthDate: Date,
    email: string,
  ): Customer {
    // Invalid hydrate user data, properties are not nullable
    TechnicalError.if(
      !uid || !name || !birthDate || !email,
      "PROPERTIES_NOT_NULLABLES",
    );
    return new Customer(
      CustomerUID.hydrate(uid),
      Name.hydrate(name),
      BirthDate.hydrate(birthDate),
      Email.hydrate(email),
    );
  }

  public update(updates: {
    name?: string | Name;
    email?: string | Email;
    birthDate?: Date | BirthDate;
  }): Result<void> {
    const failures: SimpleFailure[] = [];

    if (!updates.name && !updates.email && !updates.birthDate)
      return failure({
        code: "ANY_DATA_IS_REQUIRED_FOR_UPDATE",
      });

    const pendingUpdates = new Map();

    if (updates.name) {
      const nameResult =
        updates.name instanceof Name
          ? success(updates.name)
          : Name.create(updates.name);

      if (nameResult.invalid) failures.push(...nameResult.failures);
      else pendingUpdates.set("name", nameResult.value);
    }

    if (updates.email) {
      const emailResult =
        updates.email instanceof Email
          ? success(updates.email)
          : Email.create(updates.email);

      if (emailResult.invalid) failures.push(...emailResult.failures);
      else pendingUpdates.set("email", emailResult.value);
    }

    if (updates.birthDate) {
      const birthDateResult =
        updates.birthDate instanceof BirthDate
          ? success(updates.birthDate)
          : BirthDate.create(updates.birthDate);

      if (birthDateResult.invalid) failures.push(...birthDateResult.failures);
      else pendingUpdates.set("birthDate", birthDateResult.value);
    }

    if (failures.length > 0) return failure(failures);

    pendingUpdates.forEach((value, key) => {
      switch (key) {
        case "name":
          this._name = value;
          break;
        case "email":
          this._email = value;
          break;
        case "birthDate":
          this._birthDate = value;
          break;
      }
    });

    return success(void 0);
  }

  get name(): Name {
    return this._name;
  }

  get email(): Email {
    return this._email;
  }

  get birthDate(): BirthDate {
    return this._birthDate;
  }
}
