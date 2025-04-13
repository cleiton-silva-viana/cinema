import { Assert, Flow } from "../../../../shared/assert/assert";
import { not } from "../../../../shared/assert/not";
import { failure, Result, success } from "../../../../shared/result/result";
import { SimpleFailure } from "../../../../shared/failure/simple.failure.type";
import { TechnicalError } from "../../../../shared/error/technical.error";
import { isNull } from "../../../../shared/validator/validator";
import { is } from "../../../../shared/assert/is";

export class BirthDate {
  private constructor(private readonly _value: Date) {}

  public get value(): Date {
    return new Date(this._value);
  }

  public static create(birthDate: Date): Result<BirthDate> {
    const failures: SimpleFailure[] = [];
    const maxBirthDate = new Date(1900, 0, 0, 0, 0, 0, 0);
    const minAge = 18;
    const minBirthDate = new Date()
    minBirthDate.setFullYear(minBirthDate.getFullYear() - minAge);

    Assert.all(
      failures,
      { field: "birth date" },
      not.null(birthDate, "FIELD_CANNOT_BE_NULL", {}, Flow.stop),
      is.true(birthDate < minBirthDate, "DATE_IS_TOO_YOUNG", {}, Flow.stop),
      is.true(birthDate > maxBirthDate, "DATE_IS_TOO_OLD", {}, Flow.stop),
    );

    return failures.length > 0
      ? failure(failures)
      : success(new BirthDate(birthDate));
  }

  public static hydrate(birthDate: Date): BirthDate {
    TechnicalError.if(isNull(birthDate), "NULL_ARGUMENT");
    return new BirthDate(birthDate);
  }

  public equal(other: BirthDate): boolean {
    if (isNull(other)) return false;
    return (
      other instanceof BirthDate &&
      other.value.toISOString() === this.value.toISOString()
    );
  }
}
