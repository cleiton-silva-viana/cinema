import { failure, Result, success } from "../../../../shared/result/result";
import { SimpleFailure } from "../../../../shared/failure/simple.failure.type";
import { not } from "../../../../shared/assert/not";
import { is } from "../../../../shared/assert/is";
import { Assert, Flow } from "../../../../shared/assert/assert";
import { TechnicalError } from "../../../../shared/error/technical.error";
import { isNull } from "../../../../shared/validator/validator";

export class CPF {
  private constructor(public readonly value: string) {}

  public static create(cpf: string): Result<CPF> {
    const failures: SimpleFailure[] = [];
    const cpfLength = 13;

    Assert.all(
      failures,
      { field: "cpf" },
      not.null(cpf, "FIELD_CANNOT_BE_NULL", {}, Flow.stop),
      not.empty(cpf, "FIELD_CANNOT_BE_EMPTY", {}, Flow.stop),
      is.equal(cpf?.length, cpfLength, "INVALID_CPF_FORMAT", {}, Flow.stop),
      is.match(cpf, /^[0-9]{13}$/, "INVALID_CPF_FORMAT"),
    );

    return failures.length > 0 ? failure(failures) : success(new CPF(cpf));
  }

  public static hydrate(cpf: string): CPF {
    TechnicalError.if(isNull(cpf), "NULL_ARGUMENT");
    return new CPF(cpf);
  }

  public equal(other: CPF): boolean {
    if (isNull(other)) return false;
    return other instanceof CPF && other.value === this.value;
  }
}
