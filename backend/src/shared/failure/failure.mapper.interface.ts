import { RichFailure } from './rich.failure.type'
import { SimpleFailure } from './simple.failure.type'
import { SupportedLanguageEnum } from '@shared/value-object/language-content/supported.language.enum'

export interface IFailureMapper {
  toRichFailure(failure: SimpleFailure, language: SupportedLanguageEnum): RichFailure

  toRichFailures(failures: SimpleFailure[], language: SupportedLanguageEnum): RichFailure[]
}
