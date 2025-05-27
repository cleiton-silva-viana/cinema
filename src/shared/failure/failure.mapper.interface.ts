import { RichFailure } from './rich.failure.type'
import { SimpleFailure } from './simple.failure.type'
import { SupportedLanguage } from '@shared/value-object/multilingual-content'

export interface IFailureMapper {
  toRichFailure(failure: SimpleFailure, language: SupportedLanguage): RichFailure

  toRichFailures(failures: SimpleFailure[], language: SupportedLanguage): RichFailure[]
}
