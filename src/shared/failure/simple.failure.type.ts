import {FailureCode} from './failure.codes.enum'

/**
 * Detalhes contextuais de uma falha.
 * Esta estrutura fornece informações adicionais sobre o motivo da falha,
 * permitindo mensagens de erro mais precisas e úteis.
 */
export type FailureDetails = {
  [key: string]: any
}

/**
 * Representa uma estrutura padronizada para um erro simples ou falha de validação.
 *
 * Esta estrutura é otimizada para transporte de erro, sendo enxuta e flexível.
 * É frequentemente usada dentro de objetos `Result` ou coletada em arrays
 * para indicar problemas de validação ou erros de negócio.
 *
 * Exemplos de uso:
 * - Validação de entrada de dados
 * - Erros de regras de negócio
 * - Falhas em operações de sistema
 */
export type SimpleFailure = {
  /**
   * Código de erro único que identifica o tipo de falha.
   *
   * Recomenda-se usar códigos descritivos em maiúsculas com underscores.
   * Exemplo: "INVALID_EMAIL_FORMAT", "MISSING_REQUIRED_DATA", "DUPLICATE_ENTRY"
   */
  readonly code: FailureCode

  /**
   * Objeto contendo informações contextuais adicionais sobre a falha.
   *
   * Estes detalhes ajudam a entender o contexto específico da falha
   * e podem ser usados para gerar mensagens de erro mais precisas.
   *
   * @see FailureDetails para os campos disponíveis
   */
  readonly details?: FailureDetails
}
