import { failure, Result, success } from "../../../../shared/result/result";
import { SimpleFailure } from "../../../../shared/failure/simple.failure.type";
import { not } from "../../../../shared/assert/not";
import { is } from "../../../../shared/assert/is";
import { Assert, Flow } from "../../../../shared/assert/assert";
import { TechnicalError } from "../../../../shared/error/technical.error";
import { isNull } from "../../../../shared/validator/validator";
import { FailureCode } from "../../../../shared/failure/failure.codes.enum";

export class CPF {
  private constructor(public readonly value: string) {}

  private static readonly FORMAT_REGEX = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;

  public static create(cpf: string): Result<CPF> {
    const failures: SimpleFailure[] = [];

    Assert.all(
      failures,
      { field: "cpf" },
      not.null(cpf, FailureCode.NULL_ARGUMENT, {}, Flow.stop),
      not.empty(cpf, FailureCode.EMPTY_FIELD, {}, Flow.stop),
      is.match(cpf, CPF.FORMAT_REGEX, FailureCode.INVALID_CPF_FORMAT),
    );

    return failures.length > 0 ? failure(failures) : success(new CPF(cpf));
  }

  public static hydrate(cpf: string): CPF {
    TechnicalError.if(isNull(cpf), FailureCode.NULL_ARGUMENT);
    return new CPF(cpf);
  }

  public equal(other: CPF): boolean {
    if (isNull(other)) return false;
    return other instanceof CPF && other.value === this.value;
  }
}
