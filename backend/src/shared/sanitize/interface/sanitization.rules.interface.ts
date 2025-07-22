import { ISanitizationRule } from './sanitization.rule.interface'

/**
 * Interface que define um mapeamento de regras de sanitização por campo
 *
 * Permite associar nomes de campos específicos às suas respectivas regras
 * de sanitização, criando um dicionário de configurações por campo.
 */
export interface ISanitizationRules {
  /** Mapeamento de nome do campo para sua regra de sanitização */
  [fieldName: string]: ISanitizationRule
}
