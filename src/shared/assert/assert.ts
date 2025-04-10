import { greaterThanOrEqualTo, isEmpty, isNull } from "../validator/validator";

/**
 * Enum para controlar o fluxo da execução das validações.
 */
export enum Flow {
  /** Indica que, se esta validação falhar, a execução de 'Assert.all' deve parar imediatamente. */
  stop = "stop",
  /** Indica que, se esta validação falhar, o erro deve ser coletado e a execução deve continuar para a próxima validação (padrão). */
  continue = "continue"
}

export class Assert {
  /**
   * Executa uma série de validações em sequência
   * @param errors Array para armazenar os erros encontrados
   * @param context Informações adicionais a serem incluídas em todos os erros
   * @param validations Funções de validação a serem executadas
   */
  public static all(
    errors: Array<any>,
    context: Record<string, any>,
    ...validations: Function[]
  ): void {
    for (const validationFn of validations) {

      const result = validationFn();

      if (!result.valid) {
        errors.push({
          ...context,
          code: result.code,
          ...result.details
        });

        if (result.flow === Flow.stop) {
          break;
        }
      }
    }
  }
}
