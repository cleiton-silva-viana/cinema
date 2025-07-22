import { v7 } from 'uuid'
import * as crypto from 'crypto'
import { ISanitizationStrategy } from '../interface/sanitization.strategy.interface'
import { Injectable } from '@nestjs/common'
import { IAnonymizeOptions } from '../interface/anonymize.options.interface'

/**
 * Estratégia que anonimiza dados mantendo consistência
 *
 * Esta classe implementa uma estratégia de anonimização de dados que:
 * - Mantém consistência entre valores originais e anonimizados usando um mapa estático
 * - Suporta diferentes tipos de anonimização (uuid, hash, random)
 * - Permite desabilitar o mapeamento consistente via opção
 *
 * @implements {ISanitizationStrategy}
 */
@Injectable()
export class AnonymizeStrategy implements ISanitizationStrategy {
  /**
   * Mapa estático que mantém a relação entre valores originais e seus equivalentes anonimizados
   * para garantir consistência nas transformações
   */
  protected static anonymizationMap = new Map<string, string>()

  /**
   * Executa a anonimização do valor fornecido
   *
   * @param value - Valor original a ser anonimizado (string ou número)
   * @param options - Opções de configuração
   * @returns O valor anonimizado ou o valor original se vazio
   * @example
   * ```
   *   const value = '1234567890'
   *   const options = { type: 'hash', consistent: true, prefix: 'ANON_', hashLength: 8 }
   *   const result = anonymizeStrategy.run(value, options)
   *   console.log(result) // 'ANON_567890ab'
   * ```
   */
  public run(value: string | number, options?: Partial<IAnonymizeOptions>): string | number | undefined {
    if (!value) return value

    const rule = {
      type: 'random',
      consistent: true,
      prefix: 'ANON',
      separator: '_',
      hashLength: 8,
      ...options,
    }

    const stringValue = value.toString()
    const mapKey = `${rule.type}_${rule.prefix}_${rule.separator}_${stringValue}`

    if (rule.consistent && AnonymizeStrategy.anonymizationMap.has(mapKey)) {
      return AnonymizeStrategy.anonymizationMap.get(mapKey)!
    }

    let anonymizedValue: string

    switch (rule.type) {
      case 'uuid':
        anonymizedValue = `${rule.prefix}${rule.separator}${v7()}`
        break
      case 'hash':
        const hash = crypto.createHash('sha256').update(stringValue).digest('hex')
        anonymizedValue = `${rule.prefix}${rule.separator}${hash.substring(0, rule.hashLength)}`
        break
      default:
        anonymizedValue = `${rule.prefix}${rule.separator}${crypto.randomBytes(4).toString('hex')}`
    }

    if (rule.consistent) {
      AnonymizeStrategy.anonymizationMap.set(mapKey, anonymizedValue)
    }

    return anonymizedValue
  }
}
