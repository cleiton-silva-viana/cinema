import { failure, Result, success } from '@shared/result/result'
import { Validate } from '@shared/validator/validate'
import { TechnicalError } from '@shared/error/technical.error'
import { FailureCode } from '@shared/failure/failure.codes.enum'
import { hash, verify } from 'argon2'
import { SimpleFailure } from '@shared/failure/simple.failure.type'
import { FailureFactory } from '@shared/failure/failure.factory'

export class Password {
  private static MIN_LENGTH = 6

  private static MAX_LENGTH = 24

  private constructor(public readonly value: string) {}

  public static async create(password: string): Promise<Result<Password>> {
    const failures: SimpleFailure[] = []

    Validate.string({ password }, failures)
      .isRequired()
      .hasLengthBetween(this.MIN_LENGTH, this.MAX_LENGTH, () =>
        FailureFactory.PASSWORD_LENGTH_OUT_OF_RANGE(this.MIN_LENGTH, this.MAX_LENGTH)
      )
      .matchesPattern(/[A-Z]/, () => FailureFactory.PASSWORD_MISSING_UPPERCASE())
      .matchesPattern(/[a-z]/, () => FailureFactory.PASSWORD_MISSING_LOWERCASE())
      .matchesPattern(/[0-9]/, () => FailureFactory.PASSWORD_MISSING_DIGIT())
      .matchesPattern(/[^a-zA-Z0-9]/, () => FailureFactory.PASSWORD_MISSING_SPECIAL_CHARACTER())

    if (failures.length > 0) return failure(failures)

    const passwordHash = await hash(password)

    return failures.length > 0 ? failure(failures) : success(new Password(passwordHash))
  }

  public static hydrate(password: string): Password {
    TechnicalError.validateRequiredFields({ password })
    return new Password(password)
  }

  public static async Compare(storedHash: string, password: string): Promise<boolean> {
    try {
      return await verify(storedHash, password)
    } catch (e) {
      return false
    }
  }
}
