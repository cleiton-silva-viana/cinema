import { Result, success, failure } from "../../../../shared/result/result";
import { SimpleFailure } from "../../../../shared/failure/simple.failure.type";
import { Validate } from "../../../../shared/validator/validate";
import { TechnicalError } from "../../../../shared/error/technical.error";
import { isNull } from "../../../../shared/validator/validator";
import { FailureCode } from "../../../../shared/failure/failure.codes.enum";

export class RoomIdentifier {
  private static readonly MIN_VALUE = 1;
  private static readonly MAX_VALUE = 100;

  private constructor(public readonly value: number) {}

  public static create(roomIdentifier: number): Result<RoomIdentifier> {
    const failures: SimpleFailure[] = [];

    Validate.number({ roomIdentifier }, failures)
      .isRequired()
      .isInteger()
      .isInRange(this.MIN_VALUE, this.MAX_VALUE);

    return failures.length > 0
      ? failure(failures)
      : success(new RoomIdentifier(roomIdentifier));
  }

  public static hydrate(roomIdentifier: number): RoomIdentifier {
    TechnicalError.if(
      isNull(roomIdentifier),
      FailureCode.MISSING_REQUIRED_DATA,
      { field: "roomIdentifier" },
    );
    return new RoomIdentifier(roomIdentifier);
  }

  public equals(other?: RoomIdentifier): boolean {
    if (other === null || other === undefined) return false;
    return this.value === other.value;
  }
}
