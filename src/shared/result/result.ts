import { SimpleFailure } from "../failure/simple.failure.type";
import { TechnicalError } from "../error/technical.error";

/**
 * Cria uma instância de `Result<T>` representando um resultado bem-sucedido.
 * @template T O tipo do valor encapsulado no resultado.
 * @param value O valor a ser encapsulado (ex: dados, objetos, etc.).
 * @returns Uma instância de `Result<T>` no estado de sucesso, com o valor fornecido e sem falhas.
 */
export const success = <T, E>(value: T): Result<T> => new Result<T>(value, []);

/**
 * Cria uma instância de `Result<T>` representando um resultado de falha.
 * @template T O tipo do valor esperado (geralmente `null` em casos de falha).
 * @param errors Um único erro (`SimpleFailure`) ou um array de erros a serem encapsulados.
 * @returns Uma instância de `Result<T>` no estado de falha, com valor `null` e as falhas fornecidas.
 */
export const failure = <T, E>(
  errors: SimpleFailure | SimpleFailure[],
): Result<T> => {
  const errorArray = Array.isArray(errors) ? errors : [errors];
  return new Result<T>(null, errorArray);
};

/**
 * Representa o resultado de uma operação que pode ter sucesso (Ok) ou falha (Failure).
 * Um resultado de sucesso contém um `value` e um array de `errors` vazio.
 * Um resultado de falha contém um array de `errors` com uma ou mais falhas e um `value` indefinido.
 * A classe é imutável após a criação.
 *
 * @template V O tipo do valor contido em caso de sucesso.
 */
export class Result<V> {
  /**
   * Indica se o resultado representa a falha.
   * Use esta propriedade para verificar o estado do resultado.
   */
  public readonly invalid: boolean;

  /**
   * O valor resultante em caso de sucesso.
   * Será `undefined` se o resultado for de falha.
   * **Atenção:** Verifique `isSuccess` antes de acessar `value` diretamente.
   */
  private readonly _value: V;

  /**
   * Um array contendo as falhas (`SimpleFailure`) ocorridas.
   * Será um array vazio (`[]`) se o resultado for de sucesso.
   */
  private readonly _failures: SimpleFailure[] = [];

  /**
   * Construtor privado para ser usado pelos métodos fábrica estáticos `ok` e `failure`.
   * @param value O valor (para sucesso) ou undefined (para falha).
   * @param errors Um array de SimpleFailure (para falha) ou um array vazio (para sucesso).
   */
  // Como alterar a visibilidade desta propriedades para escopo deste arquivo?
  public constructor(value: V, errors?: SimpleFailure[]) {
    this._failures = errors || [];
    this._value = value;
    this.invalid = this._failures.length > 0;
  }

  get value(): V {
    TechnicalError.if(this.invalid, "INVALID_VALUE_RETRIEVAL");
    return this._value!;
  }

  get failures(): SimpleFailure[] {
    TechnicalError.if(!this.invalid, "INVALID_FAILURE_RETRIEVAL");
    return [...this._failures];
  }
}
