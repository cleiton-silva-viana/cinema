import { Injectable } from '@nestjs/common'
import { IRedactOptions } from '../interface/redact.options.interface'
import { ISanitizationStrategy } from '../interface/sanitization.strategy.interface'

/**
 * Estratégia que substitui valores por texto de redação
 *
 * Esta classe implementa uma estratégia de redação que:
 * - Substitui valores por texto de redação configurável
 * - Permite preservar o comprimento original do valor
 * - Suporta caracteres de redação personalizados
 * - Funciona com valores string e numéricos
 *
 * @implements {ISanitizationStrategy}
 */
@Injectable()
export class RedactStrategy implements ISanitizationStrategy {
  /**
   * Executa a redação do valor fornecido
   *
   * @param value - Valor a ser redigido (string ou número)
   * @param options - Opções de redação
   * @returns Valor redigido conforme configuração
   * @example
   * ```
   *   const value = 'Informação confidencial'
   *   const options = { text: '*', preserveLength: true }
   *   const result = redactStrategy.run(value, options)
   *   console.log(result) // '***********************'
   * ```
   */
  public run(value: string | number, options?: Partial<IRedactOptions>): string {
    if (!options || !options.text) return '[REDACTED]'
    if (typeof options.text !== 'string' || options.text.length !== 1 || !options.preserveLength) return options.text
    if (typeof value === 'string') return options.text.repeat(value.length)
    if (typeof value === 'number') return options.text.repeat(value.toString().length)
    return options.text
  }
}
