import { Injectable } from '@nestjs/common'
import { ISanitizationStrategy } from '../interface/sanitization.strategy.interface'
import { ITruncateOptions } from '../interface/truncate.options.interface'

/**
 * Estratégia de truncamento de texto que implementa a interface ISanitizationStrategy
 * Permite truncar strings em diferentes posições (início, meio ou fim) com opções configuráveis
 */
@Injectable()
export class TruncateStrategy implements ISanitizationStrategy<ITruncateOptions> {
  /**
   * Executa o truncamento da string com base nas opções fornecidas
   * @param value String a ser truncada
   * @param options Opções de truncamento (opcional)
   * @returns String truncada ou valor original se não necessitar truncamento
   */
  public run(value: string, options?: Partial<ITruncateOptions>): string {
    if (!value || typeof value !== 'string') return value

    const rule: ITruncateOptions = {
      maxLength: 50,
      position: 'end',
      ellipsis: '...',
      preserveWords: false,
      minLength: 0,
      ...options,
    }

    if (value.length <= rule.maxLength) return value

    return this.performTruncation(value, rule)
  }

  /**
   * Realiza o truncamento efetivo da string de acordo com as regras definidas
   * @param value String a ser truncada
   * @param options Opções de truncamento
   * @returns String truncada com as regras aplicadas
   */
  private performTruncation(value: string, options: ITruncateOptions): string {
    const { maxLength, position, ellipsis, preserveWords } = options
    const ellipsisLength = ellipsis.length
    const availableLength = maxLength - ellipsisLength

    if (availableLength <= 0) return ellipsis.substring(0, maxLength)

    switch (position) {
      case 'start':
        return this.truncateStart(value, availableLength, ellipsis, preserveWords)

      case 'middle':
        return this.truncateMiddle(value, availableLength, ellipsis, preserveWords)

      default:
        return this.truncateEnd(value, availableLength, ellipsis, preserveWords)
    }
  }

  /**
   * Trunca a string no final, mantendo o início
   * @param value String original
   * @param availableLength Comprimento disponível para o texto
   * @param ellipsis Caracteres de reticências
   * @param preserveWords Se deve preservar palavras inteiras
   * @returns String truncada no final
   * @example
   * ```
   *   const value = 'Texto longo que precisa ser truncado'
   *   const ellipsis = '...'
   *   const maxLength = 15
   *   const preserveWords = true
   *   const result = truncateEnd(value, maxLength, ellipsis, preserveWords)
   *   console.log(result) // 'Texto long...'
   * ```
   */
  private truncateEnd(value: string, availableLength: number, ellipsis: string, preserveWords: boolean): string {
    let truncated = value.substring(0, availableLength)

    if (preserveWords) {
      const lastSpaceIndex = truncated.lastIndexOf(' ')
      if (lastSpaceIndex > 0) {
        truncated = truncated.substring(0, lastSpaceIndex)
      }
    }

    return truncated + ellipsis
  }

  /**
   * Trunca a string no início, mantendo o final
   * @param value String original
   * @param availableLength Comprimento disponível para o texto
   * @param ellipsis Caracteres de reticências
   * @param preserveWords Se deve preservar palavras inteiras
   * @returns String truncada no início
   * @example
   * ```
   *   const value = 'Texto longo que precisa ser truncado'
   *   const ellipsis = '...'
   *   const maxLength = 15
   *   const preserveWords = true
   *   const result = truncateStart(value, maxLength, ellipsis, preserveWords)
   *   console.log(result) // '...to ser truncado'
   * ```
   */
  private truncateStart(value: string, availableLength: number, ellipsis: string, preserveWords: boolean): string {
    let truncated = value.substring(value.length - availableLength)

    if (preserveWords) {
      const firstSpaceIndex = truncated.indexOf(' ')
      if (firstSpaceIndex >= 0 && firstSpaceIndex < truncated.length - 1) {
        truncated = truncated.substring(firstSpaceIndex + 1)
      }
    }

    return ellipsis + truncated
  }

  /**
   * Trunca a string no meio, mantendo início e fim
   * @param value String original
   * @param availableLength Comprimento disponível para o texto
   * @param ellipsis Caracteres de reticências
   * @param preserveWords Se deve preservar palavras inteiras
   * @returns String truncada no meio
   * @example
   * ```
   *   const value = 'Texto longo que precisa ser truncado'
   *   const ellipsis = '...'
   *   const maxLength = 15
   *   const preserveWords = true
   *   const result = truncateMiddle(value, maxLength, ellipsis, preserveWords)
   *   console.log(result) // 'Texto...truncado'
   * ```
   */
  private truncateMiddle(value: string, availableLength: number, ellipsis: string, preserveWords: boolean): string {
    const halfLength = Math.floor(availableLength / 2)
    const startPart = value.substring(0, halfLength)
    const endPart = value.substring(value.length - (availableLength - halfLength))

    let finalStartPart = startPart
    let finalEndPart = endPart

    if (preserveWords) {
      // Ajustar início para preservar palavras
      const lastSpaceInStart = startPart.lastIndexOf(' ')
      if (lastSpaceInStart > 0) {
        finalStartPart = startPart.substring(0, lastSpaceInStart)
      }

      // Ajustar final para preservar palavras
      const firstSpaceInEnd = endPart.indexOf(' ')
      if (firstSpaceInEnd >= 0 && firstSpaceInEnd < endPart.length - 1) {
        finalEndPart = endPart.substring(firstSpaceInEnd + 1)
      }
    }

    return finalStartPart + ellipsis + finalEndPart
  }
}
