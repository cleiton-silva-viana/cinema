/**
 * Interface que define as opções para a estratégia de anonimização
 */
export interface IAnonymizeOptions {
  /** Tipo de anonimização a ser aplicada */
  type: 'uuid' | 'hash' | 'random'
  /** Se deve manter consistência entre valores iguais */
  consistent: boolean
  /** Prefixo personalizado para o valor anonimizado */
  prefix: string
  /** Separador entre prefixo e valor */
  separator: string
  /** Comprimento do hash quando type='hash' */
  hashLength: number
}
