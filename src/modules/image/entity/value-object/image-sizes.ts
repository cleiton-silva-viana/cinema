import { failure, Result, success } from "../../../../shared/result/result";
import { SimpleFailure } from "../../../../shared/failure/simple.failure.type";
import { Validate } from "../../../../shared/validator/validate";
import { isNull } from "../../../../shared/validator/validator";
import { FailureCode } from "../../../../shared/failure/failure.codes.enum";
import { TechnicalError } from "../../../../shared/error/technical.error";

/**
 * Interface que define os tamanhos de imagem necessários
 * Cada propriedade representa uma URL para uma versão da imagem
 */
export interface Sizes {
  /** URL da imagem em tamanho pequeno */
  small: string;
  /** URL da imagem em tamanho normal/médio */
  normal: string;
  /** URL da imagem em tamanho grande */
  large: string;
}

/**
 * Objeto de valor que representa os diferentes tamanhos de uma imagem
 * Garante que todas as URLs necessárias estejam presentes e válidas
 */
export class ImageSizes {
  private constructor(
    public readonly small: string,
    public readonly normal: string,
    public readonly large: string,
  ) {}

  /**
   * Cria uma instância de ImageSizes com validação completa
   * @param sizes Objeto contendo as URLs para os diferentes tamanhos de imagem
   * @returns Result contendo a instância de ImageSizes ou falhas de validação
   */
  public static create(sizes: Sizes): Result<ImageSizes> {
    const failures: SimpleFailure[] = [];

    Validate.object(sizes)
      .field("sizes")
      .failures(failures)
      .isRequired()
      .property("small", () =>
        this.validateSize("small", sizes.small, failures),
      )
      .property("normal", () =>
        this.validateSize("normal", sizes.normal, failures),
      )
      .property("large", () =>
        this.validateSize("large", sizes.large, failures),
      );

    return failures.length > 0
      ? failure(failures)
      : success(new ImageSizes(sizes.small, sizes.normal, sizes.large));
  }

  /**
   * Cria uma instância de ImageSizes diretamente a partir de strings conhecidas como válidas.
   * Use com cautela, normalmente para hidratar a partir da persistência.
   *
   * @param sizes Objeto contendo as URLs para os diferentes tamanhos de imagem
   * @returns Instância de ImageSizes
   * @throws Error se algum dos tamanhos for nulo ou indefinido
   */
  public static hydrate(sizes: {
    small: string;
    normal: string;
    large: string;
  }): ImageSizes {
    const fields = [];

    if (isNull(sizes)) fields.push("sizes");
    if (isNull(sizes.small)) fields.push("small");
    if (isNull(sizes.normal)) fields.push("normal");
    if (isNull(sizes.large)) fields.push("large");

    TechnicalError.if(fields.length > 0, FailureCode.MISSING_REQUIRED_DATA, {
      fields: fields,
    });

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
    Validate.string(sizeValue)
      .field(sizeKey)
      .failures(failures)
      .isRequired()
      .isNotEmpty();
  }
}
