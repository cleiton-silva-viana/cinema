import { Inject, Injectable } from '@nestjs/common'
import { IImageService } from './image.application.service.interface'
import { IImageHandler } from '../handler/image.handler.interface'
import { IStorageService } from '../../storage/storage.service.interface'
import { ImageHandlerConfig } from '../handler/types/image.handler.config'
import { IImageRepository } from '../repository/image.repository.interface'
import { ImageUID } from '../entity/value-object/image.uid'
import { IMAGE_HANDLER, IMAGE_REPOSITORY } from '../constant/image.constant'
import { Image, ITextContent, IUpdateImageMetadataParams } from '../entity/image'
import { failure, Result, success } from '@shared/result/result'
import { ResourceTypesEnum } from '@shared/constant/resource.types'
import { FailureFactory } from '@shared/failure/failure.factory'
import { ensureNotNullResult } from '@shared/validator/utils/validation.helpers'

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
    @Inject(IMAGE_REPOSITORY) private readonly repository: IImageRepository
  ) {}

  /**
   * Busca uma imagem pelo seu identificador único.
   *
   * @param uid - Identificador único da imagem
   * @returns Result contendo a entidade Image ou falha
   */
  public async findById(uid: string): Promise<Result<Image>> {
    const result = ensureNotNullResult({ uid })
    if (result.isInvalid()) return result

    const parseUidResult = ImageUID.parse(uid)
    if (parseUidResult.isInvalid()) return parseUidResult

    const image = await this.repository.findById(parseUidResult.value)

    return image === null ? failure(FailureFactory.RESOURCE_NOT_FOUND(ResourceTypesEnum.IMAGE, uid)) : success(image)
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
    title: ITextContent[],
    description: ITextContent[],
    image: Express.Multer.File,
    configs: ImageHandlerConfig
  ): Promise<Result<Image>> {
    const result = ensureNotNullResult({ title, description, image, configs })
    if (result.isInvalid()) return result

    const imageBufferResult = await this.handler.process(image, configs)
    if (imageBufferResult.isInvalid()) return imageBufferResult
    const imageBuffer = imageBufferResult.value

    const path = './storage/image/' // TODO: recuperar este valor de uma variável de ambiente
    const filePaths = await this.storage.save(path, imageBuffer)

    const createImageResult = Image.create({
      uid: filePaths.uid,
      title,
      description,
      sizes: {
        small: filePaths.small,
        normal: filePaths.normal,
        large: filePaths.large,
      },
    })
    if (createImageResult.isInvalid()) {
      await this.storage.delete(filePaths.uid)
      return createImageResult
    }

    const imageCreated = createImageResult.value

    try {
      const image = await this.repository.create(imageCreated)
      if (!image) {
        await this.storage.delete(imageCreated.uid.value)
        return failure(FailureFactory.IMAGE_PERSISTENCE_FAILURE())
      }
      return success(image)
    } catch (e) {
      await this.storage.delete(imageCreated.uid.value)
      throw e
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
  public async updateMetadata(uid: string, params: IUpdateImageMetadataParams): Promise<Result<Image>> {
    const result = ensureNotNullResult({ uid, params })
    if (result.isInvalid()) return result

    const findImageResult = await this.findById(uid)
    if (findImageResult.isInvalid()) return findImageResult
    const image = findImageResult.value

    const updateImageResult = image.updateMetadata(params)
    if (updateImageResult.isInvalid()) return updateImageResult
    const updatedImage = updateImageResult.value

    return success(await this.repository.update(updatedImage))
  }

  /**
   * Remove uma imagem do sistema.
   *
   * Este método orquestra todo o processo de remoção, garantindo que a imagem
   * seja removida tanto do armazenamento quanto do repositório. Em caso de falha
   * na remoção do repositório, a imagem não é removida nem em repositório nem no storage
   *
   * @param uid - Identificador único da imagem
   * @returns Result indicando sucesso ou falha
   */
  public async delete(uid: string): Promise<Result<null>> {
    const parseImageUidResult = ImageUID.parse(uid)
    if (parseImageUidResult.isInvalid()) return parseImageUidResult

    const imageUID = parseImageUidResult.value

    await this.repository.delete(imageUID)
    
    await this.storage.delete(imageUID.value)

    return success(null)
  }
}
