export type FailureDetails = {
  /** O nome do campo ou propriedade que causou a falha. */
  field?: string;
  /** O valor que foi fornecido e considerado inválido. */
  value?: any;
  /** O tipo de dado esperado para o campo. */
  expectedType?: string;
  /** O tipo de dado que foi realmente fornecido. */
  providedType?: string;
  /** Uma descrição ou exemplo do formato esperado (ex: 'email', 'UUID'). */
  expectedFormat?: string;
  /** Uma lista de valores que seriam considerados válidos. */
  validValues?: any[];
  /** O valor mínimo permitido (para números ou comprimentos). */
  min?: number;
  /** O valor máximo permitido (para números ou comprimentos). */
  max?: number;
  listContext?: { index?: number; item?: any; };
  /** Permite outros detalhes específicos não mapeados acima. */
  [key: string]: any;
};

/**
 * Representa uma estrutura padronizada para um erro simples ou falha de validação.
 * Tal estrutura é usada de modo a otimizar o transporte de erro, sendo uma estrutura enxuta.
 * Frequentemente usado dentro de objetos `Result` ou coletado em arrays para indicar problemas de validação.
 */
export type SimpleFailure = {
    /**
     * Uma string com um código de erro único.
     * Exemplo: "INVALID_EMAIL_FORMAT"
     */
    readonly code: string;
    /**
     * Um objeto contendo informações contextuais adicionais ou dados relacionados à falha.
     * Inclui campos padronizados opcionais e permite propriedades adicionais via [key: string]: any.
     */
    readonly details?: FailureDetails;
}
