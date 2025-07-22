import { failure, Result, success } from '@shared/result/result'
import { SimpleFailure } from '@shared/failure/simple.failure.type'
import { Validate } from '@shared/validator/validate'
import { TechnicalError } from '@shared/error/technical.error'

/**
 * Interface que define os tamanhos de imagem necessários
 * Cada propriedade representa uma URL para uma versão da imagem
 */
export interface ICreateImageSizesInput {
  /** URL da imagem em tamanho pequeno */
  small: string
  /** URL da imagem em tamanho normal/médio */
  normal: string
  /** URL da imagem em tamanho grande */
  large: string
}

/**
 * Objeto de valor que representa os diferentes tamanhos de uma imagem
 * Garante que todas as URLs necessárias estejam presentes e válidas
 */
export class ImageSizes {
  private constructor(
    public readonly small: string,
    public readonly normal: string,
    public readonly large: string
  ) {}

  /**
   * Cria uma instância de ImageSizes com validação completa
   * @param sizes Objeto contendo as URLs para os diferentes tamanhos de imagem
   * @returns Result contendo a instância de ImageSizes ou falhas de validação
   */
  public static create(sizes: ICreateImageSizesInput): Result<ImageSizes> {
    const failures: SimpleFailure[] = []

    Validate.object({ sizes }, failures)
      .isRequired()
      .property('small', () => this.validateSize({ size_small: sizes.small }, failures))
      .property('normal', () => this.validateSize({ size_normal: sizes.normal }, failures))
      .property('large', () => this.validateSize({ size_large: sizes.large }, failures))

    return failures.length > 0 ? failure(failures) : success(new ImageSizes(sizes.small, sizes.normal, sizes.large))
  }

  /**
   * Cria uma instância de ImageSizes diretamente a partir de strings conhecidas como válidas.
   * Use com cautela, normalmente para hidratar a partir da persistência.
   *
   * @param sizes Objeto contendo as URLs para os diferentes tamanhos de imagem
   * @returns Instância de ImageSizes
   * @throws Error se algum dos tamanhos for nulo ou indefinido
   */
  public static hydrate(sizes: { small: string; normal: string; large: string }): ImageSizes {
    TechnicalError.validateRequiredFields({ sizes })
    TechnicalError.validateRequiredFields({
      sizes_small: sizes.small,
      size_normal: sizes.normal,
      sizes_large: sizes.large,
    })
    return new ImageSizes(sizes.small, sizes.normal, sizes.large)
  }

  /**
   * Valida um tamanho específico e adiciona falhas ao array de falhas
   * @param size Valor do tamanho (URL)
   * @param failures Array para armazenar as falhas
   */
  private static validateSize(size: Record<string, string>, failures: SimpleFailure[]): void {
    Validate.string(size, failures).isRequired().isNotEmpty()
  }
}
