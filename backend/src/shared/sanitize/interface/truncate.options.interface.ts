/**
 * Interface que define as opções para truncamento de texto
 *
 * Permite configurar como strings devem ser truncadas, incluindo posição
 * do truncamento, indicadores visuais e preservação de palavras.
 */
export interface ITruncateOptions {
  /** Comprimento máximo permitido para o texto */
  maxLength: number
  /** Posição onde aplicar o truncamento */
  position: 'start' | 'middle' | 'end'
  /** Indicador visual de truncamento (ex: '...') */
  ellipsis: string
  /** Se deve evitar quebrar palavras no meio */
  preserveWords: boolean
  /** Comprimento mínimo antes de aplicar truncamento */
  minLength: number
}
