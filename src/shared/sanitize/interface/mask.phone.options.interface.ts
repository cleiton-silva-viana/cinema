/**
 * Interface que define as opções para mascaramento de números de telefone
 *
 * Permite configurar como os dígitos do telefone devem ser mascarados,
 * controlando quantos dígitos revelar no início e no fim do número.
 */
export interface IMaskPhoneOptions {
  /** Caractere a ser usado para mascarar os dígitos ocultos */
  maskChar: string
  /** Número de dígitos a serem revelados no início do telefone */
  revealStart: number
  /** Número de dígitos a serem revelados no final do telefone */
  revealEnd: number
}
