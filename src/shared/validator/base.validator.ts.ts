import { SimpleFailure } from "../failure/simple.failure.type";
import { isEqual, isNull } from "./validator";
import { FailureCode } from "../failure/failure.codes.enum";
import { Flow } from "../assert/assert";
import { TechnicalError } from "../error/technical.error";

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
 * class StringValidator extends BaseValidator<StringValidator> {
 *   // Implementação específica para strings
 * }
 *
 * const failuresArray: SimpleFailure[] = [];
 * const validator = new StringValidator({ nome: "valor" }, failuresArray)
 *   .isRequired({})
 *   .isEqualTo("valor esperado", {});
 * ```
 */
export abstract class BaseValidator<V extends BaseValidator<V>> {
  /**
   * Indica se alguma validação falhou
   */
  protected hasFailure: boolean = false;

  /**
   * Controla o fluxo de validação (continuar ou parar após falha)
   */
  protected _flow: Flow = Flow.stop;

  /**
   * O valor sendo validado
   */
  protected _value: any;

  /**
   * O nome do campo sendo validado (para mensagens de erro)
   */
  protected _field: string;

  /**
   * Array onde as falhas de validação serão adicionadas
   */
  protected _failures: SimpleFailure[];

  /**
   * Construtor protegido para ser usado por classes derivadas.
   * @param data Um objeto contendo uma única propriedade, onde a chave é o nome do campo e o valor é o valor a ser validado.
   * @param failures Array onde as falhas de validação serão adicionadas.
   * @throws Error se o objeto `data` não contiver exatamente uma propriedade.
   */
  protected constructor(data: Record<string, any>, failures: SimpleFailure[]) {
    const keys = Object.keys(data);
    TechnicalError.if(
      keys.length !== 1,
      FailureCode.VALIDATOR_WITH_INVALID_DATA_STRUCTURE,
    );

    this._field = keys[0];
    this._value = data[this._field];
    this._failures = failures;
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
  public if(expression: boolean): V {
    if (!expression) {
      this._flow = Flow.stop;
      this.hasFailure = true;
    }
    return this as unknown as V;
  }

  /**
   * Executa validações adicionais apenas se não houver falhas até o momento
   * @param validator Função que contém as validações a serem executadas
   */
  public then(validator: () => void): this {
    if (this._failures.length === 0 && this.hasFailure === false) {
      validator();
    }
    return this;
  }

  /**
   * Executa validações apenas se a condição for verdadeira
   * @param condition Condição que deve ser verdadeira para executar as validações
   * @param validator Função que contém as validações a serem executadas
   */
  public when(condition: boolean, validator: () => void): this {
    if (condition) {
      validator();
    }
    return this;
  }

  /**
   * Permite que as validações subsequentes sejam executadas apenas se a função de callback retornar true
   * @param expression Função que deve retornar true para permitir validações subsequentes
   */
  public guard(expression: () => boolean): this {
    if (!expression()) {
      this._flow = Flow.stop;
      this.hasFailure = true;
    }
    return this;
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
  public continue(): V {
    this._flow = Flow.continue;
    return this as unknown as V;
  }

  /**
   * Verifica se o valor não é nulo (null ou undefined)
   *
   * @param details - Detalhes adicionais para a mensagem de erro
   * @param code - Código de erro opcional
   * @returns A instância do validador para encadeamento
   *
   * @example
   * ```typescript
   * validator.isRequired({ customDetail: "info" }) // o 'field' já é conhecido
   * ```
   */
  public isRequired(
    details: Record<string, any> = {},
    code: FailureCode = FailureCode.MISSING_REQUIRED_DATA,
  ): V {
    // Alterado o retorno para V para consistência, embora o original não tivesse.
    return this.validate(() => isNull(this._value), {
      code,
      details,
    });
  }

  /**
   * Verifica se o valor é igual ao alvo
   *
   * @param target - Valor alvo para comparação
   * @param details - Detalhes adicionais para a mensagem de erro
   * @param code - Código de erro opcional
   * @returns A instância do validador para encadeamento
   *
   * @example
   * ```typescript
   * validator.isEqualTo("valor esperado", { customDetail: "info" })
   * ```
   */
  public isEqualTo(
    target: any,
    details: Record<string, any> = {},
    code: FailureCode = FailureCode.VALUES_NOT_EQUAL,
  ): V {
    return this.validate(() => !isEqual(this._value, target), {
      code: code,
      details: {
        value: JSON.stringify(this._value),
        target: JSON.stringify(target),
        ...details,
      },
    });
  }

  /**
   * Verifica se uma expressão booleana é verdadeira
   *
   * @param expression - Expressão booleana que deve ser verdadeira
   * @param code - Código de erro a ser usado se a validação falhar
   * @param details - Detalhes adicionais para a mensagem de erro
   * @returns A instância do validador para encadeamento
   *
   * @example
   * ```typescript
   * validator.isTrue(idade >= 18, FailureCode.AGE_TOO_LOW, { idadeMinima: 18 })
   * ```
   */
  public isTrue(
    expression: boolean,
    code: FailureCode,
    details: Record<string, any> = {},
  ): V {
    return this.validate(() => !expression, {
      code,
      details,
    });
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
  protected validate(expression: () => boolean, failure: SimpleFailure): V {
    if (this._flow === Flow.stop && this.hasFailure) {
      return this as unknown as V;
    }

    if (expression()) {
      this.hasFailure = true;
      this._failures.push({
        code: failure.code,
        details: { field: this._field, ...failure.details },
      });
    }

    this._flow = Flow.stop;
    return this as unknown as V;
  }
}
