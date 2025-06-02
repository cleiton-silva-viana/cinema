import { MultilingualContent } from '@shared/value-object/multilingual-content'

export class ImageDescription extends MultilingualContent {
  protected static readonly MIN_LENGTH: number = 8

  protected static readonly MAX_LENGTH: number = 240

  protected static readonly FORMAT_REGEX = /^[A-Za-zÀ-ÖØ-öø-ÿ\d\s\-_.,<>?!@#$%&*+\/]+$/
}
