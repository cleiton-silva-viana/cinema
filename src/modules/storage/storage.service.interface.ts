import { Result } from '@shared/result/result'
import { ImageUID } from '@/modules/image/entity/value-object/image.uid'

export interface FilePaths {
  small: string
  normal: string
  large: string
  uid: string
}

export interface IStorageService {
  save(basePath: string, buffers: { small: Buffer; normal: Buffer; large: Buffer }): Promise<Result<FilePaths>>

  delete(uid: ImageUID): Promise<Result<null>>
}
