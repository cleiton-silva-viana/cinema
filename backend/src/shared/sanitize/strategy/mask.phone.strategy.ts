import { Injectable } from '@nestjs/common'
import { IMaskPhoneOptions } from '../interface/mask.phone.options.interface'
import { ISanitizationStrategy } from '../interface/sanitization.strategy.interface'

/**
 * Estratégia que mascara números de telefone mantendo partes visíveis configuráveis
 *
 * Esta classe implementa uma estratégia de mascaramento de telefones que:
 * - Extrai apenas os dígitos do número fornecido
 * - Permite configurar quantos dígitos revelar no início e no fim
 * - Trata casos onde as partes reveladas se sobrepõem
 * - Suporta caracteres de mascaramento personalizados
 *
 * @implements {ISanitizationStrategy}
 */
@Injectable()
export class MaskPhoneStrategy implements ISanitizationStrategy {
  /**
   * Executa o mascaramento do número de telefone fornecido
   *
   * @param phone - Número de telefone em formato string
   * @param options - Opções de mascaramento para o número
   * @returns Número de telefone mascarado
   * @example
   * ```
   *   const value = '1234567890'
   *   const options = { revealStart: 2, revealEnd: 2, maskChar: '*' }
   *   const result = maskPhoneStrategy.run(value, options)
   *   console.log(result) // '12******90'
   * ```
   */
  public run(phone: string, options?: Partial<IMaskPhoneOptions>): string | undefined {
    if (!phone) return phone

    const rule: IMaskPhoneOptions = {
      maskChar: '*',
      revealStart: 0,
      revealEnd: 4,
      ...options,
    }

    const digitsOnly = phone.replace(/\D/g, '')

    if (digitsOnly.length === 0) return phone

    const length = digitsOnly.length
    const start = Math.min(rule.revealStart, length)
    const end = Math.max(0, length - rule.revealEnd)

    // Se start >= end, significa que as partes reveladas se sobrepõem
    // Neste caso, retorna o número completo sem mascaramento
    if (start >= end) {
      return digitsOnly
    }

    const maskedLength = end - start
    const maskedPart = rule.maskChar.repeat(maskedLength)

    const revealedStart = digitsOnly.substring(0, start)
    const revealedEnd = digitsOnly.substring(end)

    return `${revealedStart}${maskedPart}${revealedEnd}`
  }
}
