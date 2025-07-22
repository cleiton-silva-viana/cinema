import { ISizes } from '@modules/image/entity/image'
import { faker } from '@faker-js/faker'
import { ICreateImageSizesInput } from '@modules/image/entity/value-object/image.sizes'

export function CreateTestSizes(override?: Partial<ICreateImageSizesInput>): ISizes {
  return {
    small: override?.small ?? faker.image.url(),
    normal: override?.normal ?? faker.image.url(),
    large: override?.large ?? faker.image.url(),
  }
}
