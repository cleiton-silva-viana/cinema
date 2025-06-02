import { FailureCode } from './failure.codes.enum'
import { SupportedLanguageEnum } from '@shared/value-object/multilingual-content'
import { RichFailure } from '@shared/failure/rich.failure.type'

/**
 * Interface para provedores de mensagens de falha
 */
export interface IFailureMessageProvider {
  getMessageConfig(code: FailureCode, language: SupportedLanguageEnum): RichFailure
}
