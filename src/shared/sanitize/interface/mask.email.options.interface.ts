/**
 * Interface que define as opções para mascaramento de emails
 */
export interface IMaskEmailOptions {
  /** Caractere usado para mascarar (padrão: '*') */
  maskChar: string

  // Configurações para a parte local (antes do @)
  /** Número de caracteres a revelar no início da parte local */
  localRevealStart: number
  /** Número de caracteres a revelar no final da parte local */
  localRevealEnd: number
  /** Comprimento mínimo da parte local para aplicar mascaramento */
  localMinLength: number

  // Configurações para o domínio (depois do @)
  /** Estratégia de mascaramento do domínio */
  domainStrategy: 'reveal' | 'partial' | 'full' | 'preserve'
  /** Número de caracteres a revelar no início do domínio */
  domainRevealStart: number
  /** Número de caracteres a revelar no final do domínio (incluindo TLD) */
  domainRevealEnd: number
  /** Se deve preservar TLDs conhecidos (.com, .org, etc.) */
  preserveTLD: boolean
  /** Lista de domínios que devem ser preservados completamente */
  preservedDomains: string[]
}
