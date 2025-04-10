import { FailureDetails, SimpleFailure } from "../failure/simple.failure.type";

/**
 * Representa um erro técnico inesperado na aplicação.
 * Deve ser usado para situações que indicam um problema no código ou infraestrutura,
 * não erros de validação de negócio ou de input do usuário.
 * Encapsula uma `SimpleFailure` para padronização.
 */
export class TechnicalError extends Error {
  public readonly failure: SimpleFailure;

  /**
   * Cria uma instância de TechnicalError.
   * @param failure O objeto SimpleFailure que descreve o erro técnico.
   */
  constructor(failure: SimpleFailure) {
    super(`Technical Error: ${failure.code}` + (failure.details?.message ? ` - ${failure.details.message}` : ''));
    this.name = "TechnicalError";
    this.failure = failure;
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
  public static if(condition: boolean, code: string, details?: FailureDetails): void {
    if (condition) {
      throw new TechnicalError({ code, details });
    }
  }
}
