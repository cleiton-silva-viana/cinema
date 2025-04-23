import { UID } from "../../../../shared/value-object/uid";
import { failure, Result, success } from "../../../../shared/result/result";
import { isUIDv4 } from "../../../../shared/validator/validator";

export class ImageUID extends UID {
  protected static readonly PREFIX: string = 'IMG'

  public static generate(uid: string): Result<ImageUID> {
    return isUIDv4(uid)
      ? success(new ImageUID(uid))
      : failure({
        code: 'invalidUidProvided',
      })
  }
}
