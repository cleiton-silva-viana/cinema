import { Injectable } from '@nestjs/common'
import { IGeneralizeNumberOptions } from '../interface/generalize.number.options.interface'
import { ISanitizationStrategy } from '../interface/sanitization.strategy.interface'

/**
 * Estratégia que generaliza valores numéricos em faixas predefinidas
 *
 * Esta classe implementa uma estratégia de generalização que:
 * - Converte valores numéricos específicos em faixas genéricas
 * - Permite definir faixas personalizadas com rótulos descritivos
 * - Mantém valores que não se encaixam em nenhuma faixa inalterados
 * - Suporta apenas valores numéricos
 *
 * @implements {ISanitizationStrategy}
 */
@Injectable()
export class GeneralizeStrategy implements ISanitizationStrategy {
  /**
   * Executa a generalização do valor numérico fornecido
   *
   * @param value - Valor numérico que deve ser generalizado
   * @param options - Opções de generalização contendo as faixas
   * @returns Rótulo da faixa correspondente ou valor original
   * @example
   * ```
   *   const value = 25
   *   const options = {
   *     ranges: [
   *       { min: 0, max: 18, label: 'Menor de idade' },
   *       { min: 19, max: 65, label: 'Adulto' },
   *       { min: 66, max: 120, label: 'Idoso' }
   *     ]
   *   }
   *   const result = generalizeStrategy.run(value, options)
   *   console.log(result) // 'Adulto'
   * ```
   */
  public run(value: any, options: Partial<IGeneralizeNumberOptions>): any {
    if (!value || typeof value !== 'number') return value

    const generalizedValue = options.ranges?.find((r) => value >= r.min && value <= r.max)
    return generalizedValue?.label || value
  }
}
