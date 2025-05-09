import { Image } from "../entity/image";
import { ImageUID } from "../entity/value-object/image-uid.vo";

/**
 * Interface para o repositório de imagens.
 * Define as operações de persistência disponíveis para imagens no sistema.
 */
export interface IImageRepository {
  /**
   * Cria uma nova imagem no repositório.
   *
   * @param image - Entidade Image a ser persistida
   * @returns Promise com a entidade Image persistida ou null em caso de falha
   */
  create(image: Image): Promise<Image | null>;

  /**
   * Busca uma imagem pelo seu identificador único.
   *
   * @param uid - Identificador único da imagem
   * @returns Promise com a entidade Image encontrada ou null se não existir
   */
  findById(uid: ImageUID): Promise<Image | null>;

  /**
   * Remove uma imagem do repositório.
   *
   * @param uid - Identificador único da imagem
   * @returns Promise<void>
   */
  delete(uid: ImageUID): Promise<void>;

  /**
   * Atualiza uma imagem existente no repositório.
   *
   * @param image - Entidade Image atualizada a ser persistida
   * @returns Promise com a entidade Image atualizada ou null em caso de falha
   */
  update(image: Image): Promise<Image | null>;
}
