import { FailureDetails, SimpleFailure } from "../failure/simple.failure.type";
import { FailureCode } from "../failure/failure.codes.enum";
import { FailureMapper } from "../failure/failure.mapper";
import { RichFailure } from "../failure/rich.failure.type";
import { collectNullFields } from "../validator/common.validators";

/**
 * Representa um erro técnico inesperado na aplicação.
 * Deve ser usado para situações que indicam um problema no código ou infraestrutura,
 * não erros de validação de negócio ou de input do usuário.
 * Encapsula uma `SimpleFailure` para padronização.
 */
export class TechnicalError extends Error {
  public readonly richFailure: RichFailure;
  public readonly details: Record<string, any>;

  /**
   * Cria uma instância de TechnicalError.
   * @param failure O objeto SimpleFailure que descreve o erro técnico.
   */
  constructor(failure: SimpleFailure) {
    const failureMapper = FailureMapper.getInstance();

    const richFailure = failureMapper.toRichFailure(failure, "pt");

    const detailsString = failure.details
      ? "\n" + JSON.stringify(failure.details, null, 2)
      : "";

    const message =
      `TechnicalError: ${richFailure.code}\n` +
      `[${richFailure.title}]\n` +
      `[${richFailure.message}]\n` +
      `[DETAILS]${detailsString}`;

    super(message);

    this.name = "TechnicalError";
    this.details = failure.details;
    this.richFailure = richFailure;
    Object.setPrototypeOf(this, TechnicalError.prototype);
  }

  /**
   * Método estático helper para lançar um `TechnicalError` se uma condição for verdadeira.
   * Útil para verificações concisas de pré-condições ou estados inesperados.
   * @param condition Condição que, se verdadeira, dispara o lançamento do erro.
   * @param code Código de erro único que identifica a falha técnica.
   * @param details Detalhes adicionais sobre o erro (opcional). Pode incluir contexto ou variáveis relevantes.
   * @throws {TechnicalError} Se a `condition` for `true`.
   */
  public static if(
    condition: boolean,
    code: FailureCode,
    details?: FailureDetails,
  ): void {
    if (condition) throw new TechnicalError({ code, details });
  }

  /**
   * Valida se todos os campos obrigatórios estão presentes em um objeto.
   * Se algum campo for nulo ou indefinido, lança um erro técnico.
   *
   * @param fields Objeto com os campos a serem validados
   * @param failureCode Código de falha a ser usado (padrão: MISSING_REQUIRED_DATA)
   * @param additionalDetails Detalhes adicionais para incluir na mensagem de erro
   * @throws TechnicalError se algum campo for nulo ou indefinido
   *
   * @example
   * // Valida se todos os campos obrigatórios estão presentes
   * TechnicalError.validateRequiredFields({
   *   sizes,
   *   small: sizes?.small,
   *   normal: sizes?.normal,
   *   large: sizes?.large
   * });
   */
  public static validateRequiredFields(
    fields: Record<string, any>,
    failureCode: FailureCode = FailureCode.MISSING_REQUIRED_DATA,
    additionalDetails: Record<string, any> = {},
  ): void {
    const nullFields = collectNullFields(fields);

    this.if(nullFields.length > 0, failureCode, {
      fields: nullFields,
      ...additionalDetails,
    });
  }
}
