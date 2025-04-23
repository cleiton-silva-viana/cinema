import { Result } from "../../../shared/result/result";
import { ImageResizedBuffer } from "./types/image.buffer";
import { ImageHandlerConfig } from "./types/image.handler.config";

export interface IImageHandler {
  process(file: Express.Multer.File, config: ImageHandlerConfig): Promise<Result<ImageResizedBuffer>>;
}
