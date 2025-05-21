import { FailureCode } from "./failure.codes.enum";

/**
 * Detalhes contextuais de uma falha.
 * Esta estrutura fornece informações adicionais sobre o motivo da falha,
 * permitindo mensagens de erro mais precisas e úteis.
 */
export type FailureDetails = {
  /**
   * O nome do campo ou propriedade que causou a falha.
   * Exemplo: 'email', 'nome', 'dataNascimento'
   */
  field?: string;

  /**
   * O valor que foi fornecido e considerado inválido.
   * Exemplo: para um email inválido, poderia ser 'usuario@dominio'
   */
  value?: any;

  /**
   * O valor mínimo permitido (para números ou comprimentos).
   * Exemplo: 0 para números positivos, 8 para comprimento mínimo de senha
   */
  min?: number;

  /**
   * O valor máximo permitido (para números ou comprimentos).
   * Exemplo: 100 para percentuais, 255 para comprimento máximo de texto
   */
  max?: number;

  /**
   * Valor que indica a quantidade de algo
   * */
  count?: number;

  date?: string
  max_date?: string
  start_date?: string
  end_date?: string
  max_days?: number

  object_type?: string

/*  /!**
   * O tipo de dado esperado para o campo.
   * Exemplo: 'string', 'number', 'Date', 'UUID'
   *!/
  expectedType?: string;

  /!**
   * O tipo de dado que foi realmente fornecido.
   * Exemplo: 'undefined', 'object', 'string'
   *!/
  providedType?: string;

  /!**
   * Uma descrição ou exemplo do formato esperado.
   * Exemplo: 'email@dominio.com', 'YYYY-MM-DD', '123.456.789-00'
   *!/
  expectedFormat?: string;

  /!**
   * Uma lista de valores que seriam considerados válidos.
   * Exemplo: ['ATIVO', 'INATIVO', 'PENDENTE'] para um campo de status
   *!/
  validValues?: any[];

  /!**
   * Contexto específico para falhas em itens de lista/array.
   * Fornece o índice e o item que causou a falha.
   *!/
  listContext?: {
    /!** Posição do item na lista (começando em 0) *!/
    index?: number;
    /!** O item que causou a falha *!/
    item?: any;
  };

  /!**
   * Nome da propriedade que causou a falha (alternativa a field).
   * Usado principalmente em validações de objetos.
   *!/
  property?: string;

  /!**
   * Comprimento atual do valor fornecido.
   * Útil para erros de validação de comprimento.
   *!/
  actualLength?: number;*/

  /**
   * Permite outros detalhes específicos não mapeados acima.
   * Campos adicionais podem ser incluídos conforme necessário.
   */
/*  [key: string]: any;*/
};

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
  readonly code: FailureCode;

  /**
   * Objeto contendo informações contextuais adicionais sobre a falha.
   *
   * Estes detalhes ajudam a entender o contexto específico da falha
   * e podem ser usados para gerar mensagens de erro mais precisas.
   *
   * @see FailureDetails para os campos disponíveis
   */
  readonly details?: FailureDetails;
};
