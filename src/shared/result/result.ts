import { SimpleFailure } from "../failure/simple.failure.type";

interface ISuccess<V> {
  readonly type: "success";
  readonly invalid: false;
  readonly value: V;
}

interface IFailure {
  readonly type: "failure";
  readonly invalid: true;
  readonly failures: ReadonlyArray<SimpleFailure>;
}

/**
 * Representa o resultado de uma operação que pode ter sucesso (ISuccess<V>) ou falha (IFailure).
 * Use a propriedade `type` ('success' | 'failure') ou `invalid` (boolean) como discriminante.
 *
 * @template V O tipo do valor contido em caso de sucesso.
 */
export type Result<V> = ISuccess<V> | IFailure;

/**
 * Cria uma instância de `Result<V>` representando um resultado bem-sucedido.
 * @template V O tipo do valor encapsulado no resultado.
 * @param value O valor a ser encapsulado.
 * @returns Uma instância de `ISuccess<V>`.
 */
export const success = <V>(value: V): Result<V> => ({
  type: "success",
  invalid: false,
  value,
});

/**
 * Cria uma instância de `Result<never>` representando um resultado de falha.
 * Especificamente, retorna um `IFailure`.
 * @param errors Um único erro (`SimpleFailure`) ou um array de erros a serem encapsulados.
 * @returns Uma instância de `IFailure`, que é compatível com `Result<V>` para qualquer `V`.
 */
export const failure = (
  errors: SimpleFailure | ReadonlyArray<SimpleFailure>,
): Result<never> => {
  const errorArray = Array.isArray(errors) ? [...errors] : [errors];
  return {
    type: "failure",
    invalid: true,
    failures: Object.freeze(errorArray),
  };
};
