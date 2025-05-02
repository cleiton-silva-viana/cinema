import { Result, failure, success } from "../../../../shared/result/result";
import { Assert, Flow } from "../../../../shared/assert/assert";
import { not } from "../../../../shared/assert/not";
import { is } from "../../../../shared/assert/is";
import { SimpleFailure } from "../../../../shared/failure/simple.failure.type";
import { isNull } from "../../../../shared/validator/validator";
import { TechnicalError } from "../../../../shared/error/technical.error";
import { FailureCode } from "../../../../shared/failure/failure.codes.enum";

export class Email {
  private constructor(public readonly value: string) {}

  public static create(email: string): Result<Email> {
    const failures: SimpleFailure[] = [];

    Assert.all(
      failures,
      { field: "email" },
      not.null(email, FailureCode.NULL_ARGUMENT, {}, Flow.stop),
      not.empty(email, FailureCode.EMPTY_FIELD, {}, Flow.stop),
      is.email(email, FailureCode.INVALID_EMAIL_FORMAT),
    );

    return failures.length > 0 ? failure(failures) : success(new Email(email));
  }

  public static hydrate(email: string): Email {
    TechnicalError.if(isNull(email), FailureCode.NULL_ARGUMENT);
    return new Email(email);
  }

  public equal(other: Email): boolean {
    if (isNull(other)) return false;
    return other instanceof Email && other.value === this.value;
  }
}
