import { failure, Result, success } from "../result/result";
import { Assert, Flow } from "../assert/assert";
import { not } from "../assert/not";
import { is } from "../assert/is";
import { SimpleFailure } from "../failure/simple.failure.type";
import { TechnicalError } from "../error/technical.error";

export class Name {

  private constructor(
    public readonly value: string
  ) {}

  public static create(name: string): Result<Name> {
    const failures: SimpleFailure[] = []
    const minNameLength = 3;
    const maxNameLength = 24;

    Assert.all(
      failures,
      { field: "name" },
      not.null(name, "PROPERTY_CANNOT_BE_NULL", {}, Flow.stop),
      not.empty(name, "FIELD_CANNOT_BE_EMPTY", {}, Flow.stop),
      is.between(name, minNameLength, maxNameLength, "FIELD_WITH_INVALID_SIZE", {}, Flow.stop),
      is.match(name, /^[a-zA-Z]{3,24}$/, "NAME_WITH_INVALID_FORMAT"),
    );

    return (failures.length > 0)
      ? failure(failures)
      : success(new Name(name));
  }

  public static hydrate(name: string): Name {
    TechnicalError.if(!name, 'NULL_ARGUMENT')
    return new Name(name)
  }

  public equal(other: Name): boolean {
    return (other instanceof Name && other.value === this.value)
  }
}