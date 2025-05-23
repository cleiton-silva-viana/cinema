import { Inject, Injectable } from "@nestjs/common";
import { failure, Result, success } from "../../../shared/result/result";
import { Image, ItextContent, IUpdateImageParams } from "../entity/image";
import { IImageRepository } from "../repository/image.repository.interface";
import { IImageHandler } from "../handler/image.handler.interface";
import { IStorageService } from "../../storage/storage.service.interface";
import { ImageHandlerConfig } from "../handler/types/image.handler.config";
import { ImageUID } from "../entity/value-object/image.uid";
import { FailureCode } from "../../../shared/failure/failure.codes.enum";
import { ResourceTypes } from "../../../shared/constant/resource.types";
import { IMAGE_HANDLER, IMAGE_REPOSITORY } from "../constant/image.constant";
import { IImageService } from "./image.application.service.interface";
import {
  collectNullFields,
  ensureNotNull,
  validateAndCollect,
} from "../../../shared/validator/common.validators";
import { isNull } from "../../../shared/validator/validator";

/**
 * Serviço de aplicação para operações relacionadas a imagens.
 *
 * Este serviço orquestra o fluxo da aplicação, coordenando chamadas entre
 * serviços de domínio, repositórios e serviços de infraestrutura.
 */
@Injectable()
export class ImageApplicationService implements IImageService {
  constructor(
    @Inject(IMAGE_HANDLER) private readonly handler: IImageHandler,
    @Inject() private readonly storage: IStorageService,
    @Inject(IMAGE_REPOSITORY) private readonly repository: IImageRepository,
  ) {}

  /**
   * Busca uma imagem pelo seu identificador único.
   *
   * @param uid - Identificador único da imagem
   * @returns Result contendo a entidade Image ou falha
   */
  public async findById(uid: string): Promise<Result<Image>> {
    const failures = ensureNotNull({ uid });
    if (failures.length > 0) return failure(failures);

    const uidVO = validateAndCollect(ImageUID.parse(uid), failures);
    if (failures.length > 0) return failure(failures);

    const image = await this.repository.findById(uidVO);

    return image === null
      ? failure({
          code: FailureCode.RESOURCE_NOT_FOUND,
          details: {
            resource: ResourceTypes.IMAGE,
          },
        })
      : success(image);
  }

  /**
   * Cria uma nova imagem no sistema.
   *
   * Este método orquestra todo o processo de criação de uma imagem:
   * 1. Processa o arquivo de imagem
   * 2. Salva os arquivos processados no armazenamento
   * 3. Cria a entidade de domínio com os metadados
   * 4. Persiste a entidade no repositório
   *
   * @param title - Títulos da imagem em diferentes idiomas
   * @param description - Descrições da imagem em diferentes idiomas
   * @param image - Arquivo de imagem a ser processado
   * @param configs - Configurações para o processamento da imagem
   * @returns Result contendo a entidade Image criada ou falhas
   */
  public async create(
    title: ItextContent[],
    description: ItextContent[],
    image: Express.Multer.File,
    configs: ImageHandlerConfig,
  ): Promise<Result<Image>> {
    const failures = ensureNotNull({ title, description, image, configs });
    if (failures.length > 0) return failure(failures);

    const imageSizeBuffer = validateAndCollect(
      await this.handler.process(image, configs),
      failures,
    );
    if (failures.length > 0) return failure(failures);

    const path = "./storage/image/"; // TODO: recuperar este valor de uma variável de ambiente
    const filePaths = validateAndCollect(
      await this.storage.save(path, imageSizeBuffer),
      failures,
    );
    if (failures.length > 0) return failure(failures);

    const imageCreated = validateAndCollect(
      Image.create({
        uid: filePaths.uid,
        title,
        description,
        sizes: {
          small: filePaths.small,
          normal: filePaths.normal,
          large: filePaths.large,
        },
      }),
      failures,
    );
    if (failures.length > 0) {
      await this.storage.delete(filePaths.uid);
      return failure(failures);
    }

    try {
      const image = await this.repository.create(imageCreated);
      if (isNull(image)) {
        await this.storage.delete(imageCreated.uid.value);
        return failure({ code: FailureCode.FAILURE_TO_PERSIST_DATA });
      }
      return success(image);
    } catch (e) {
      await this.storage.delete(imageCreated.uid.value);
      throw e;
    }
  }

  /**
   * Atualiza os metadados de uma imagem existente.
   *
   * Este método orquestra todo o processo de atualização:
   * 1. Verifica se a imagem existe
   * 2. Atualiza a entidade com os novos dados
   * 3. Persiste a entidade atualizada no repositório
   *
   * @param uid - Identificador único da imagem
   * @param params - Parâmetros para atualização da imagem
   * @returns Result contendo a entidade Image atualizada ou falhas
   */
  public async update(
    uid: string,
    params: IUpdateImageParams,
  ): Promise<Result<Image>> {
    const failures = ensureNotNull({ uid, params });
    if (failures.length > 0) return failure(failures);

    const image = validateAndCollect(await this.findById(uid), failures);
    if (failures.length > 0) return failure(failures);

    const updatedImage = validateAndCollect(image.update(params), failures);
    if (failures.length > 0) return failure(failures);

    try {
      const savedImage = await this.repository.update(updatedImage);
      if (!savedImage) {
        return failure({ code: FailureCode.FAILURE_TO_PERSIST_DATA });
      }
      return success(savedImage);
    } catch (e) {
      throw e;
    }
  }

  /**
   * Remove uma imagem do sistema.
   *
   * Este método orquestra todo o processo de remoção:
   * 1. Verifica se a imagem existe
   * 2. Remove os arquivos do armazenamento
   * 3. Remove a entidade do repositório
   *
   * @param uid - Identificador único da imagem
   * @returns Result indicando sucesso ou falha
   */
  public async delete(uid: string): Promise<Result<null>> {
    const failures = ensureNotNull({ uid });
    if (failures.length > 0) return failure(failures);

    const imageUID = validateAndCollect(ImageUID.parse(uid), failures);
    if (failures.length > 0) return failure(failures);

    validateAndCollect(await this.storage.delete(imageUID.value), failures);
    if (failures.length > 0) return failure(failures);

    await this.repository.delete(imageUID);
    return success(null);
  }
}
