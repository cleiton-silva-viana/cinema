import { faker } from '@faker-js/faker'
import { IFilePaths } from '@modules/storage/filepath.interface'
import { ImageUID } from '@modules/image/entity/value-object/image.uid'

export function CreateTestFilepath(
  override?: Partial<{ uid?: string; small?: string; normal?: string; large?: string }>
): IFilePaths {
  return {
    uid: override?.uid ?? ImageUID.create().value,
    small: override?.small ?? faker.image.url(),
    normal: override?.normal ?? faker.image.url(),
    large: override?.large ?? faker.image.url(),
  }
}
