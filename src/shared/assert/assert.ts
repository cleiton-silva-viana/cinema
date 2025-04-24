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
   * @param failures Array para armazenar os erros encontrados
   * @param context Informações adicionais a serem incluídas em todos os erros
   * @param validations Funções de validação a serem executadas
   */
  public static all(
    failures: Array<any>,
    context: Record<string, any>,
    ...validations: Function[]
  ): void {
    for (const validationFn of validations) {

      const result = validationFn();

      if (!result.valid) {
        failures.push({
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

  /**
   * Executa uma série de validações em sequência, parando na primeira falha encontrada
   * @param failures Array para armazenar os erros encontrados
   * @param contextOrValidation Contexto adicional ou primeira validação (se for uma função)
   * @param validations Funções de validação a serem executadas
   */
  public static untilFirstFailure(
    failures: Array<any>,
    contextOrValidation: Record<string, any> | Function,
    ...validations: Function[]
  ): void {
    const isContextObject = typeof contextOrValidation !== 'function';
    
    const context = isContextObject ? contextOrValidation : {};
    const allValidations = isContextObject ? validations : [contextOrValidation, ...validations];
    
    for (const validationFn of allValidations) {
      const result = validationFn();

      if (!result.valid) {
        failures.push({
          ...context,
          code: result.code,
          ...result.details
        });
        
        break;
      }
    }
  }
}
