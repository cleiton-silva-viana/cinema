import { Result, failure, success } from "../../../../shared/result/result";
import { Assert, Flow } from "../../../../shared/assert/assert";
import { not } from "../../../../shared/assert/not";
import { is } from "../../../../shared/assert/is";
import { SimpleFailure } from "../../../../shared/failure/simple.failure.type";
import { isEmail, isNull } from "../../../../shared/validator/validator";
import { TechnicalError } from "../../../../shared/error/technical.error";
import { FailureCode } from "../../../../shared/failure/failure.codes.enum";
import { Validate } from "../../../../shared/validator/validate";

export class Email {
  private constructor(public readonly value: string) {}

  public static create(email: string): Result<Email> {
    const failures: SimpleFailure[] = [];

    Validate.string(email)
      .field("email")
      .failures(failures)
      .isRequired()
      .isNotEmpty(FailureCode.MISSING_REQUIRED_DATA)
      .isTrue(isEmail(email), FailureCode.EMAIL_WITH_INVALID_FORMAT);

    return failures.length > 0 ? failure(failures) : success(new Email(email));
  }

  public static hydrate(email: string): Email {
    TechnicalError.if(isNull(email), FailureCode.MISSING_REQUIRED_DATA);
    return new Email(email);
  }

  public equal(other: Email): boolean {
    if (isNull(other)) return false;
    return other instanceof Email && other.value === this.value;
  }
}
