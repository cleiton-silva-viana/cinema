import { FailureCode } from './failure.codes.enum'
import { RichFailure } from './rich.failure.type'
import { SupportedLanguageEnum } from '@shared/value-object/language-content/supported.language.enum'

/**
 * Interface para provedores de mensagens de falha
 */
export interface IFailureMessageProvider {
  getMessageConfig(code: FailureCode, language: SupportedLanguageEnum): RichFailure
}
