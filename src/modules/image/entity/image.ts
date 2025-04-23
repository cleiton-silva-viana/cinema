import { failure, Result, success } from "../../../shared/result/result";
import { SimpleFailure } from "../../../shared/failure/simple.failure.type";
import { ImageUID } from "./value-object/image-uid.vo";
import { ImageTitle } from "./value-object/image-title";
import { ImageDescription } from "./value-object/image-description";
import { ImageSizes } from "./value-object/image-sizes";

export interface textContent {
  language: string;
  text: string
}

export interface Sizes {
  small: string;
  normal: string;
  large: string;
}

/**
 * Representa os metadados de uma imagem processada, incluindo URLs para diferentes tamanhos.
 */
export class Image {
  private constructor(
    public readonly uid: ImageUID,
    public readonly title: ImageTitle,
    public readonly description: ImageDescription,
    public readonly sizes: ImageSizes
  ) {}

  /**
   * Cria uma nova instância de Image com validação completa
   * @param uidV4 Id da imagem salva no storage
   * @param titleContents Conteúdo multilíngue do título
   * @param descriptionContents Conteúdo multilíngue da descrição
   * @param imageSizes URLs para os diferentes tamanhos da imagem
   */
  public static create(
    uidV4: string,
    titleContents: textContent[],
    descriptionContents: textContent[],
    imageSizes: Sizes
  ): Result<Image> {
    const failures: SimpleFailure[] = [];

    const uidResult = ImageUID.generate(uidV4)
    const titleResult = ImageTitle.create(titleContents);
    const descriptionResult = ImageDescription.create(descriptionContents);
    const sizesResult = ImageSizes.create(imageSizes);

    if (uidResult.invalid) failures.push(...uidResult.failures);
    if (titleResult.invalid) failures.push(...titleResult.failures);
    if (descriptionResult.invalid) failures.push(...descriptionResult.failures);
    if (sizesResult.invalid) failures.push(...sizesResult.failures);

    if (failures.length > 0) return failure(failures);

    return success(
      new Image(
        uidResult.value,
        titleResult.value,
        descriptionResult.value,
        sizesResult.value
      )
    );
  }

  /**
   * Cria uma instância de Image a partir de dados já validados
   * @param uid UID da imagem
   * @param title Título da imagem
   * @param description Descrição da imagem
   * @param sizes Tamanhos da imagem
   */
  public static hydrate(
    uid: string,
    title: textContent,
    description: textContent,
    sizes: Sizes
  ): Image {
    return new Image(
      ImageUID.hydrate(uid),
      ImageTitle.hydrate(title.language, title.text),
      ImageDescription.hydrate(description.language, description.text),
      ImageSizes.hydrate(sizes)
    );
  }
}