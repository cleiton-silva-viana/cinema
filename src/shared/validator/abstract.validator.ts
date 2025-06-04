import { SimpleFailure } from '../failure/simple.failure.type'
import { isEqual } from './validator'
import { FailureCode } from '../failure/failure.codes.enum'
import { TechnicalError } from '../error/technical.error'
import { FailureFactory } from '../failure/failure.factory'

export enum FlowEnum {
  STOP = 'STOP',
  CONTINUE = 'CONTINUE',
}

/**
 * Classe base abstrata para validação de propriedades.
 *
 * Esta classe implementa o padrão Builder e permite encadear validações
 * de forma fluente. Ela serve como base para validadores específicos
 * que podem estender sua funcionalidade.
 *
 * @template V - O tipo do validador concreto que estende esta classe
 *
 * @example
 * ```typescript
 * class StringValidator extends AbstractValidator<StringValidator> {
 *   // Implementação específica para strings
 * }
 *
 * const failuresArray: SimpleFailure[] = [];
 * const validator = new StringValidator({ nome: "valor" }, failuresArray)
 *   .isRequired({})
 *   .isEqualTo("valor esperado", {});
 * ```
 */
export abstract class AbstractValidator<T extends AbstractValidator<T>> {
  /**
   * Indica se alguma validação falhou
   */
  protected _hasFailure: boolean = false

  /**
   * Controla o fluxo de validação (continuar ou parar após falha)
   */
  protected _flow: FlowEnum = FlowEnum.STOP

  /**
   * O valor sendo validado
   */
  protected _value: any

  /**
   * O nome do campo sendo validado (para mensagens de erro)
   */
  protected _field: string

  /**
   * Array onde as falhas de validação serão adicionadas
   */
  protected _failures: SimpleFailure[]

  /**
   * Construtor protegido para ser usado por classes derivadas.
   * @param data Um objeto contendo uma única propriedade, onde a chave é o nome do campo e o valor é o valor a ser validado.
   * @param failures Array onde as falhas de validação serão adicionadas.
   * @throws TechnicalError se o objeto `data` não contiver exatamente uma propriedade.
   */
  protected constructor(data: Record<string, any>, failures: SimpleFailure[]) {
    const keys = Object.keys(data)
    TechnicalError.if(keys.length !== 1, FailureCode.VALIDATOR_WITH_INVALID_DATA_STRUCTURE)

    this._field = keys[0]
    this._value = data[this._field]
    this._failures = failures
  }

  /**
   * Controla o fluxo de validação com base em uma expressão condicional
   *
   * Se a expressão for falsa, o fluxo é interrompido e as validações
   * subsequentes são ignoradas.
   *
   * @param expression - Expressão booleana que determina se a validação continua
   * @returns A instância do validador para encadeamento
   *
   * @example
   * ```typescript
   * validator.if(idade >= 18)
   * ```
   */
  public if(expression: boolean): T {
    if (!expression) {
      this._flow = FlowEnum.STOP
      this._hasFailure = true
    }
    return this as unknown as T
  }

  /**
   * Executa validações adicionais apenas se não houver falhas até o momento
   * @param validator Função que contém as validações a serem executadas
   */
  public then(validator: () => void): T {
    if (this._failures.length === 0 && this._hasFailure === false) {
      validator()
    }
    return this as unknown as T
  }

  /**
   * Executa validações apenas se a condição for verdadeira
   * @param condition Condição que deve ser verdadeira para executar as validações
   * @param validator Função que contém as validações a serem executadas
   */
  public when(condition: boolean, validator: () => void): T {
    if (condition) {
      validator()
    }
    return this as unknown as T
  }

  /**
   * Permite que as validações subsequentes sejam executadas apenas se a função de callback retornar true
   * @param expression Função que deve retornar true para permitir validações subsequentes
   */
  public guard(expression: () => boolean): T {
    if (!expression()) {
      this._flow = FlowEnum.STOP
      this._hasFailure = true
    }
    return this as unknown as T
  }

  /**
   * Configura o validador para continuar validando mesmo após a validação imediatamente anterior encontrar erros
   *
   * @returns A instância do validador para encadeamento
   *
   * @example
   * ```typescript
   * validator.continue()
   * ```
   */
  public continue(): T {
    this._flow = FlowEnum.CONTINUE
    return this as unknown as T
  }

  /**
   * Verifica se o valor não é nulo (null ou undefined)
   *
   * @param failure - Uma função que retorna um objeto SimpleFailure ou um objeto SimpleFailure diretamente, para ser adicionado se a validação falhar.
   * @returns A instância do validador para encadeamento
   *
   * @example
   * ```typescript
   * validator.isRequired(() => FailureFactory.MISSING_REQUIRED_DATA("fieldName"))
   * ```
   */
  public isRequired(failure?: () => SimpleFailure): T {
    return this.validate(() => !this._value, failure ? failure() : FailureFactory.MISSING_REQUIRED_DATA(this._field))
  }

  /**
   * Verifica se o valor é igual ao alvo
   *
   * @param target - Objeto contendo uma única propriedade, onde a chave é o nome do campo e o valor é o valor alvo para comparação.
   * @param failure - Uma função que retorna um objeto SimpleFailure ou um objeto SimpleFailure diretamente, para ser adicionado se a validação falhar.
   * @returns A instância do validador para encadeamento
   *
   * @example
   * ```typescript
   * validator.isEqualTo({ expectedField: "expectedValue" }, () => FailureFactory.VALUES_NOT_EQUAL("field1", "field2", "value1", "value2"))
   * ```
   */
  public isEqualTo(target: Record<string, any>, failure?: () => SimpleFailure): T {
    const targetKeys = Object.keys(target)
    TechnicalError.if(targetKeys.length !== 1, FailureCode.VALIDATOR_WITH_INVALID_DATA_STRUCTURE)

    const targetField = targetKeys[0]
    const targetValue = target[targetField]

    return this.validate(
      () => !isEqual(this._value, targetValue),
      failure ? failure() : FailureFactory.VALUES_NOT_EQUAL(this._field, targetField, this._value, targetValue)
    )
  }

  /**
   * Verifica se uma expressão booleana é verdadeira
   *
   * @param expression - Expressão booleana que deve ser verdadeira
   * @param failure - Uma função que retorna um objeto SimpleFailure ou um objeto SimpleFailure diretamente, para ser adicionado se a validação falhar.
   * @returns A instância do validador para encadeamento
   *
   * @example
   * ```typescript
   * validator.isTrue(idade >= 18, () => FailureFactory.AGE_TOO_LOW({ idadeMinima: 18 }))
   * ```
   */
  public isTrue(expression: boolean, failure: () => SimpleFailure): T {
    return this.validate(() => !expression, failure())
  }

  /**
   * Método protegido para executar validações
   *
   * Este método avalia uma expressão e, se ela retornar true, adiciona
   * uma falha ao array de falhas. A expressão é avaliada apenas se o
   * fluxo de validação estiver configurado para continuar.
   *
   * @param expression - Função que retorna true se a validação falhar
   * @param failure - Objeto de falha a ser adicionado se a validação falhar
   * @returns A instância do validador para encadeamento
   *
   * @example
   * ```typescript
   * this.validate(() => value.length < 8, {
   *   code: FailureCode.PASSWORD_TOO_SHORT,
   *   details: { minLength: 8 }
   * })
   * ```
   */
  protected validate(expression: () => boolean, failure: SimpleFailure): T {
    if (this._flow === FlowEnum.STOP && this._hasFailure) {
      return this as unknown as T
    }

    if (expression()) {
      this._hasFailure = true
      this._failures.push(failure)
    }

    this._flow = FlowEnum.STOP
    return this as unknown as T
  }
}
