import { Result } from "../../../shared/result/result";
import { Image, ItextContent, IUpdateImageParams } from "../entity/image";
import { ImageHandlerConfig } from "../handler/types/image.handler.config";

/**
 * Interface para o serviço de imagens.
 * Define as operações disponíveis para manipulação de imagens no sistema.
 */
export interface IImageService {
  /**
   * Cria uma nova imagem no sistema.
   *
   * @param title - Títulos da imagem em diferentes idiomas
   * @param description - Descrições da imagem em diferentes idiomas
   * @param image - Arquivo de imagem a ser processado
   * @param configs - Configurações para o processamento da imagem
   * @returns Result contendo a entidade Image criada ou falhas
   */
  create(
    title: ItextContent[],
    description: ItextContent[],
    image: Express.Multer.File,
    configs: ImageHandlerConfig,
  ): Promise<Result<Image>>;

  /**
   * Busca uma imagem pelo seu identificador único.
   *
   * @param uid - Identificador único da imagem
   * @returns Result contendo a entidade Image ou falha
   */
  findById(uid: string): Promise<Result<Image>>;

  /**
   * Remove uma imagem do sistema.
   *
   * @param uid - Identificador único da imagem
   * @returns Result indicando sucesso ou falha
   */
  delete(uid: string): Promise<Result<null>>;

  /**
   * Atualiza os metadados de uma imagem existente.
   *
   * @param uid - Identificador único da imagem
   * @param params - Parâmetros para atualização da imagem
   * @returns Result contendo a entidade Image atualizada ou falhas
   */
  update(uid: string, params: IUpdateImageParams): Promise<Result<Image>>;
}
