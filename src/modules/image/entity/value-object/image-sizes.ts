import { failure, Result, success } from "../../../../shared/result/result";
import { SimpleFailure } from "../../../../shared/failure/simple.failure.type";
import { not } from "../../../../shared/assert/not";
import { is } from "../../../../shared/assert/is";
import { Assert, Flow } from "../../../../shared/assert/assert";

export const codes = {
  contentWithInvalidFormat: "CONTENT_INVALID_FORMAT",
  contentNullOrEmpty: "NULL_OR_EMPTY_ARGUMENT",
  invalidUrl: "INVALID_URL",
};

export interface Sizes {
  small: string;
  normal: string;
  large: string;
}

export class ImageSizes {
  private constructor(
    public readonly small: string,
    public readonly normal: string,
    public readonly large: string,
  ) {}

  public static create(sizes: Sizes): Result<ImageSizes> {
    const failures: SimpleFailure[] = [];

    Assert.all(failures, {}, not.null(sizes, codes.contentNullOrEmpty));
    if (failures.length > 0) return failure(failures);

    this.validateSize("small", sizes.small, failures);
    this.validateSize("normal", sizes.normal, failures);
    this.validateSize("large", sizes.large, failures);

    if (failures.length > 0) return failure(failures);

    return success(new ImageSizes(sizes.small, sizes.normal, sizes.large));
  }

  /**
   * Creates an ImageSizes instance directly from strings known to be valid.
   * Use with caution, typically for hydrating from persistence.
   */
  public static hydrate(sizes: {
    small: string;
    normal: string;
    large: string;
  }): ImageSizes {
    return new ImageSizes(sizes.small, sizes.normal, sizes.large);
  }

  /**
   * Valida um tamanho específico e adiciona falhas ao array de falhas
   * @param sizeKey Nome da chave do tamanho (small, normal, large)
   * @param sizeValue Valor do tamanho (URL)
   * @param failures Array para armazenar as falhas
   */
  private static validateSize(
    sizeKey: string,
    sizeValue: string,
    failures: SimpleFailure[],
  ): void {
    Assert.all(
      failures,
      { size: sizeKey },
      not.blank(sizeValue, codes.contentNullOrEmpty, {}, Flow.stop),
      is.string(sizeValue, codes.contentWithInvalidFormat, {}, Flow.stop),
      is.url(sizeValue, codes.invalidUrl, {}),
    );
  }
}
