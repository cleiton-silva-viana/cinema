import { SanitizationStrategyEnum } from '../enum/sanitization.strategy.enum'
import { IGeneralizeNumberOptions } from './generalize.number.options.interface'
import { IMaskEmailOptions } from './mask.email.options.interface'
import { IMaskPhoneOptions } from './mask.phone.options.interface'
import { IRedactOptions } from './redact.options.interface'
import { IRemoveOptions } from './remove.options.interface'
import { ITruncateOptions } from './truncate.options.interface'

/**
 * Interface que define uma regra de sanitização para um campo específico
 *
 * Combina uma estratégia de sanitização com suas opções correspondentes,
 * permitindo configurar como um campo deve ser processado durante a sanitização.
 */
export interface ISanitizationRule {
  /** Estratégia de sanitização a ser aplicada */
  strategy: SanitizationStrategyEnum
  /** Opções específicas da estratégia selecionada */
  options?:
    | IRedactOptions
    | IMaskEmailOptions
    | IMaskPhoneOptions
    | IGeneralizeNumberOptions
    | ITruncateOptions
    | IRemoveOptions
}
