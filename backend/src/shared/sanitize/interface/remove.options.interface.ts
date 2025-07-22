/**
 * Interface que define as opções para remoção de chaves de objetos
 *
 * Permite configurar como chaves específicas devem ser removidas ou substituídas,
 * incluindo processamento recursivo e proteções de segurança.
 */
export interface IRemoveOptions {
  /** Se deve remover a chave completamente ou substituir por placeholder */
  removeKey: boolean
  /** Texto substituto quando removeKey é false */
  placeholder: string
  /** Se deve processar objetos aninhados recursivamente */
  recursive: boolean
  /** Conjunto de chaves específicas para remover */
  keysToRemove: Set<string>
  /** Se deve manter a estrutura com valores undefined */
  preserveStructure: boolean
  /** Limite máximo de profundidade na recursão */
  maxDepth: number
}
