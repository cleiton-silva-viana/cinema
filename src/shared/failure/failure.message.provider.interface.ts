import { FailureCode } from './failure.codes.enum'
import { FailureMessageConfig } from './failure.message.provider'

/**
 * Interface para provedores de mensagens de falha
 */
export interface IFailureMessageProvider {
  getMessageConfig(code: FailureCode): FailureMessageConfig
}
