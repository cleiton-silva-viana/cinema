import { ISanitizationRules } from './sanitization.rules.interface'

/**
 * Interface que define a configuração completa para sanitização de dados
 *
 * Especifica as regras de sanitização por campo e opções globais de processamento,
 * controlando como os dados devem ser sanitizados de forma recursiva.
 */
export interface ISanitizationConfig {
  /** Mapeamento de nomes de campos para suas regras de sanitização */
  rules: ISanitizationRules
  /** Se deve processar objetos aninhados recursivamente (padrão: true) */
  recursive?: boolean
  /** Se deve preservar campos sem regras de sanitização (padrão: true) */
  preserveUnknownFields?: boolean
}
