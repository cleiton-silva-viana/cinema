import { failure, Result, success } from '@shared/result/result'
import { SimpleFailure } from '@shared/failure/simple.failure.type'
import { isEmail, isNull } from '@shared/validator/validator'
import { TechnicalError } from '@shared/error/technical.error'
import { FailureCode } from '@shared/failure/failure.codes.enum'
import { Validate } from '@shared/validator/validate'

export class Email {
  private constructor(public readonly value: string) {}

  public static create(email: string): Result<Email> {
    const failures: SimpleFailure[] = []

    Validate.string({ email }, failures)
      .isRequired()
      .isNotEmpty(FailureCode.MISSING_REQUIRED_DATA)
      .isTrue(isEmail(email), FailureCode.EMAIL_WITH_INVALID_FORMAT)

    return failures.length > 0 ? failure(failures) : success(new Email(email))
  }

  public static hydrate(email: string): Email {
    TechnicalError.if(isNull(email), FailureCode.MISSING_REQUIRED_DATA)
    return new Email(email)
  }

  public equal(other: Email): boolean {
    if (isNull(other)) return false
    if (!(other instanceof Email)) return false
    return other.value === this.value
  }
}
