import { Injectable } from '@nestjs/common'
import { IRemoveOptions } from '../interface/remove.options.interface'
import { ISanitizationStrategy } from '../interface/sanitization.strategy.interface'

export type RequiredRemoveOptions = Required<Pick<IRemoveOptions, 'keysToRemove'>> &
  Partial<Omit<IRemoveOptions, 'keysToRemove'>>

/**
 * Estratégia que remove ou substitui chaves específicas de objetos
 *
 * Esta classe implementa uma estratégia de remoção de dados que:
 * - Remove ou substitui valores de chaves específicas em objetos
 * - Suporta processamento recursivo de estruturas aninhadas
 * - Inclui proteção contra referências circulares e profundidade excessiva
 * - Permite preservar a estrutura do objeto ou remover chaves completamente
 *
 * @implements {ISanitizationStrategy}
 */
@Injectable()
export class RemoveStrategy implements ISanitizationStrategy {
  private readonly DEFAULT_MAX_DEPTH = 5

  private readonly DEFAULT_OPTIONS: Omit<IRemoveOptions, 'keysToRemove'> = {
    placeholder: '[REMOVED]',
    removeKey: false,
    preserveStructure: true,
    recursive: true,
    maxDepth: this.DEFAULT_MAX_DEPTH,
  }

  /**
   * Executa a remoção ou substituição de chaves nos dados fornecidos
   *
   * @param data - Dados a serem processados
   * @param options - Opções de configuração da remoção
   * @returns Dados processados com as chaves removidas ou substituídas
   * @example
   * ```
   *   const data = { nome: 'João', senha: '123456', email: 'joao@email.com' }
   *   const options = { keysToRemove: new Set(['senha']), placeholder: '[REMOVIDO]' }
   *   const result = removeStrategy.run(data, options)
   *   console.log(result) // { nome: 'João', senha: '[REMOVIDO]', email: 'joao@email.com' }
   * ```
   */
  public run(data: any, options: RequiredRemoveOptions): any {
    if (!data) return data

    const mergedOptions: IRemoveOptions = {
      ...this.DEFAULT_OPTIONS,
      ...options,
    }

    //** Proteção contra referências circulares, NÃO REMOVER!!! */
    const visited = new WeakSet()

    return this.processValue(data, mergedOptions, visited, 0)
  }

  /**
   * Processa um valor individual aplicando as regras de remoção
   *
   * @param value - Valor a ser processado
   * @param options - Opções de configuração
   * @param visited - Set para controle de referências circulares
   * @param depth - Profundidade atual na recursão
   * @returns Valor processado
   */
  private processValue(value: any, options: IRemoveOptions, visited: WeakSet<object>, depth: number): any {
    // Proteção contra profundidade excessiva
    if (depth > options.maxDepth) {
      console.warn(`RemoveStrategy: Máxima profundidade (${options.maxDepth}) atingida`) // Pensar em melhorar...
      return options.placeholder
    }

    // Valores primitivos
    if (value === null || typeof value !== 'object') {
      return value
    }

    // Proteção contra referências circulares
    if (visited.has(value)) {
      console.warn('RemoveStrategy: Referência circular detectada') // Melhorar abordagem de log
      return options.placeholder
    }

    visited.add(value)

    try {
      if (Array.isArray(value)) {
        return this.processArray(value, options, visited, depth)
      } else {
        return this.processObject(value, options, visited, depth)
      }
    } finally {
      visited.delete(value)
    }
  }

  /**
   * Processa um objeto aplicando as regras de remoção em suas propriedades
   *
   * @param obj - Objeto a ser processado
   * @param options - Opções de configuração
   * @param visited - Set para controle de referências circulares
   * @param depth - Profundidade atual na recursão
   * @returns Objeto processado
   */
  private processObject(
    obj: Record<string, any>,
    options: IRemoveOptions,
    visited: WeakSet<object>,
    depth: number
  ): Record<string, any> {
    const result: Record<string, any> = {}

    for (const [key, value] of Object.entries(obj)) {
      // Corrigido: processar chaves que DEVEM ser removidas
      if (options.keysToRemove.has(key)) {
        if (options.removeKey && !options.preserveStructure) {
          // Remove a chave completamente
          continue
        }

        // Substitui o valor
        result[key] = options.removeKey && options.preserveStructure ? undefined : options.placeholder
      } else {
        // Chave não deve ser removida - processar recursivamente se necessário
        if (options.recursive && typeof value === 'object' && value !== null) {
          result[key] = this.processValue(value, options, visited, depth + 1)
        } else {
          result[key] = value
        }
      }
    }

    return result
  }

  /**
   * Processa um array aplicando as regras de remoção em seus elementos
   *
   * @param arr - Array a ser processado
   * @param options - Opções de configuração
   * @param visited - Set para controle de referências circulares
   * @param depth - Profundidade atual na recursão
   * @returns Array processado
   */
  private processArray(arr: any[], options: IRemoveOptions, visited: WeakSet<object>, depth: number): any[] {
    return arr.map((item) => {
      if (options.recursive && typeof item === 'object' && item !== null) {
        return this.processValue(item, options, visited, depth + 1)
      }
      return item
    })
  }
}
