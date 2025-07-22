import { faker } from '@faker-js/faker'
import { ICreateImageParams, IHydrateImageParams, Image, IUpdateImageMetadataParams } from '@modules/image/entity/image'
import { ImageUID } from '@modules/image/entity/value-object/image.uid'
import { SupportedLanguageEnum } from '@shared/value-object/language-content/supported.language.enum'
import { CreateTestSizes } from '@test/builder/sizes.builder'

export function CreateTestImage(override?: Partial<IHydrateImageParams>) {
  const uid = override?.uid ?? ImageUID.create().value
  const title = override?.title ?? {
    language: 'pt',
    text: faker.lorem.words(3),
  }
  const description = override?.description ?? {
    language: 'pt',
    text: faker.lorem.sentence(),
  }
  const sizes = override?.sizes ?? {
    small: faker.image.url({ width: 300, height: 200 }),
    normal: faker.image.url({ width: 600, height: 400 }),
    large: faker.image.url({ width: 1200, height: 800 }),
  }

  return Image.hydrate({
    uid,
    title,
    description,
    sizes,
  })
}

export function CloneTestImageWithOverrides(image: Image, override: Partial<Omit<IUpdateImageMetadataParams, 'uid'>>) {
  return Image.hydrate({
    uid: image.uid.value,
    title: override?.title?.[0] ?? {
      language: SupportedLanguageEnum.PT,
      text: image.title.content(SupportedLanguageEnum.PT) ?? faker.lorem.words(3),
    },
    description: override?.description?.[0] ?? {
      language: SupportedLanguageEnum.PT,
      text: image.description.content(SupportedLanguageEnum.PT) ?? faker.lorem.sentence(),
    },
    sizes: image.sizes,
  })
}

export function CreateTestImageParams(override?: Partial<ICreateImageParams>): ICreateImageParams {
  return {
    uid: override?.uid ?? ImageUID.create().value,
    title: override?.title ?? [
      {
        language: SupportedLanguageEnum.PT,
        text: faker.lorem.words(10),
      },
      {
        language: SupportedLanguageEnum.EN,
        text: faker.lorem.words(10),
      },
    ],
    description: override?.description ?? [
      {
        language: SupportedLanguageEnum.PT,
        text: faker.lorem.words(15),
      },
      {
        language: SupportedLanguageEnum.EN,
        text: faker.lorem.words(15),
      },
    ],
    sizes: override?.sizes ?? CreateTestSizes(),
  }
}

export function CreateTestExpressMulterFiler(): Express.Multer.File {
  return {
    buffer: Buffer.from('test'),
    mimetype: 'image/jpeg',
    size: 100,
    fieldname: 'image-for-test',
    originalname: 'test.jpg',
    path: '',
    filename: 'test.png',
    destination: '',
    stream: {} as any,
  } as Express.Multer.File
}
