/**
 * Interface que define as opções para redação de valores
 *
 * Permite configurar como valores devem ser substituídos por texto de redação,
 * com opção de preservar o comprimento original do valor.
 */
export interface IRedactOptions {
  /** Texto que substituirá o valor original */
  text: string
  /** Se deve manter o comprimento original quando text é um único caractere */
  preserveLength: boolean
}
