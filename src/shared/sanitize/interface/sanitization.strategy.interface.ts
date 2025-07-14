/**
 * Interface base para estratégias de sanitização
 *
 * Define o contrato que todas as estratégias de sanitização devem implementar,
 * fornecendo um método padronizado para processar valores com opções configuráveis.
 *
 * @template T - Tipo das opções específicas da estratégia
 */
export interface ISanitizationStrategy<T = any> {
  /**
   * Executa a estratégia de sanitização no valor fornecido
   *
   * @param value - Valor a ser sanitizado (string ou número)
   * @param options - Opções específicas da estratégia de sanitização
   * @returns Valor sanitizado ou undefined se removido
   */
  run(value: string | number, options?: T): string | number | undefined
}
