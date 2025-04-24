import { Result } from "../../shared/result/result";

export interface FilePaths {
  small: string;
  normal: string;
  large: string;
  uid: string;
}

export interface IStorageService {
  save(basePath: string, buffers: { small: Buffer; normal: Buffer; large: Buffer; }): Promise<Result<FilePaths>>;
  delete(uid: string): Promise<Result<null>>;
}