import { Image } from "../entity/image";
import { ImageUID } from "../entity/value-object/image-uid.vo";

export interface IImageRepository {
  create(image: Image): Promise<Image>;
  findById(uid: ImageUID): Promise<Image>;
  delete(uid: ImageUID): Promise<null>;
}