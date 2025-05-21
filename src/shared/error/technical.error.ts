import { FailureDetails, SimpleFailure } from "../failure/simple.failure.type";
import { FailureCode } from "../failure/failure.codes.enum";
import { FailureMapper } from "../failure/failure.mapper";
import { RichFailure } from "../failure/rich.failure.type";

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
    const richFailure = FailureMapper.getInstance().toRichFailure(
      failure,
      "pt",
    );

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
}
