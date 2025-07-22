import { failure, Result, success } from '@shared/result/result'
import { SimpleFailure } from '@shared/failure/simple.failure.type'
import { TechnicalError } from '@shared/error/technical.error'
import { Validate } from '@shared/validator/validate'
import { isEmail, isNull } from '@shared/validator/utils/validation'
import { FailureFactory } from '@shared/failure/failure.factory'

export class Email {
  private constructor(public readonly value: string) {}

  public static create(email: string): Result<Email> {
    const failures: SimpleFailure[] = []

    Validate.string({ email }, failures)
      .isRequired()
      .isNotEmpty(() => FailureFactory.MISSING_REQUIRED_DATA('email'))
      .isTrue(isEmail(email), () => FailureFactory.EMAIL_WITH_INVALID_FORMAT(email))

    return failures.length > 0 ? failure(failures) : success(new Email(email))
  }

  public static hydrate(email: string): Email {
    TechnicalError.if(isNull(email), () => FailureFactory.MISSING_REQUIRED_DATA('email'))
    return new Email(email)
  }

  public equal(other: Email): boolean {
    if (isNull(other)) return false
    if (!(other instanceof Email)) return false
    return other.value === this.value
  }
}
