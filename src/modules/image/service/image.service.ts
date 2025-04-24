import { Injectable } from "@nestjs/common";
import { failure, Result, success } from "../../../shared/result/result";
import { Image, textContent } from "../entity/image";
import { IImageRepository } from "../repository/image.repository.interface";
import { IImageHandler } from "../handler/image.handler.interface";
import { IStorageService } from "../../storage/storage.service.interface";
import { ImageHandlerConfig } from "../handler/types/image.handler.config";
import { ImageUID } from "../entity/value-object/image-uid.vo";

@Injectable()
export class ImageService {
  constructor(
    private readonly handler: IImageHandler,
    private readonly storage: IStorageService,
    private readonly repository: IImageRepository,
  ) {}

  public async create(
    title: textContent[],
    description: textContent[],
    image: Express.Multer.File,
    configs: ImageHandlerConfig,
  ): Promise<Result<Image>> {
    const processResult = await this.handler.process(image, configs);
    if (processResult.invalid) return failure(processResult.failures);

    const path = "./storage/image/"; // TODO: mudar para uma env
    const saveResult = await this.storage.save(path, processResult.value);
    if (saveResult.invalid) return failure(saveResult.failures);
    const url = saveResult.value

    const imageResult = Image.create(url.uid, title, description, {
      small: url.small,
      normal: url.normal,
      large: url.large,
    });

    if (imageResult.invalid) {
      await this.storage.delete(saveResult.value.uid);
      return failure(imageResult.failures);
    }

    try {
      const image = await this.repository.create(imageResult.value);
      if (!image) {
        await this.storage.delete(saveResult.value.uid);
        return failure({ code: 'SAVE_ON_SAVE_IMAGE' });
      }
        return success(image);
    } catch (e){
        await this.storage.delete(saveResult.value.uid);
        throw e
    }
  }

  public async findById(uid: string): Promise<Result<Image>> {
    const uidResult = ImageUID.parse(uid)
    if (uidResult.invalid) return failure(uidResult.failures);

    const image = await this.repository.findById(uidResult.value);
    return image
      ? success(image)
      : failure({ code: 'RESOURCE_NOT_FOUND', details: { resourceId: uid } })
  }

  public async delete(uid: string): Promise<Result<null>> {
    const findImageResult = await this.findById(uid)
    if (findImageResult.invalid) return failure(findImageResult.failures);
    const imageUID = findImageResult.value.uid;

    const storageResult = await this.storage.delete(imageUID.value);
    if (storageResult.invalid) return failure(storageResult.failures);

    await this.repository.delete(imageUID);

    return success(null)
  }
}
