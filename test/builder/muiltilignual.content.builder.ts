import { ITextContent } from '@/modules/image/entity/image'
import { SupportedLanguageEnum } from '@/shared/value-object/language-content/supported.language.enum'
import { faker } from '@faker-js/faker/.'

export function CreateTestTextContent(
  override?: Partial<{
    text?: string
    language?: SupportedLanguageEnum
  }>
): ITextContent {
  return {
    language: override?.language ?? SupportedLanguageEnum.PT,
    text: override?.text ?? faker.lorem.words(6),
  }
}

export function CreateMultilingualTextContent(
  baseText?: string,
  languages: string[] = Object.values(SupportedLanguageEnum)
): ITextContent[] {
  return languages.map((language) => ({
    language,
    text: baseText ?? faker.lorem.words(6),
  }))
}
