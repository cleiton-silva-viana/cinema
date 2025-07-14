/**
 * Interface que define as opções para generalização de valores numéricos
 *
 * Permite definir faixas numéricas com rótulos correspondentes para
 * converter valores específicos em categorias genéricas.
 */
export interface IGeneralizeNumberOptions {
  /** Array de faixas numéricas com seus rótulos correspondentes */
  ranges: Array<{
    /** Valor mínimo da faixa (inclusivo) */
    min: number
    /** Valor máximo da faixa (inclusivo) */
    max: number
    /** Rótulo ou valor a ser retornado para esta faixa */
    label: string | number
  }>
}
