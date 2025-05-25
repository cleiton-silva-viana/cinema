import {SimpleFailure} from '../failure/simple.failure.type'

export type ResultStatus = 'SUCCESS' | 'FAILURE'

interface ISuccess<V> extends IBaseResult<V> {
  readonly type: 'SUCCESS'
  readonly value: V
}

interface IFailure extends IBaseResult<never> {
  readonly type: 'FAILURE'
  readonly failures: ReadonlyArray<SimpleFailure>
}

interface IBaseResult<V> {
  /**
   * Verifica se o resultado é um sucesso.
   * Se verdadeiro, o TypeScript inferirá o tipo como ISuccess<V> dentro do bloco condicional.
   */
  isValid(): this is ISuccess<V>

  /**
   * Verifica se o resultado é uma falha.
   * Se verdadeiro, o TypeScript inferirá o tipo como IFailure dentro do bloco condicional.
   */
  isInvalid(): this is IFailure
}

/**
 * Representa o resultado de uma operação que pode ter sucesso (ISuccess<V>) ou falha (IFailure).
 * Use os métodos `isValid()` ou `isInvalid()` para verificar o estado e aproveitar o type assertion.
 *
 * @template V O tipo do valor contido em caso de sucesso.
 */
export type Result<V> = ISuccess<V> | IFailure

/**
 * Cria uma instância de `Result<V>` representando um resultado bem-sucedido.
 * @template V O tipo do valor encapsulado no resultado.
 * @param value O valor a ser encapsulado.
 * @returns Uma instância de `ISuccess<V>`.
 */
export const success = <V>(value: V): Result<V> => ({
  type: 'SUCCESS',
  value,
  isValid(): this is ISuccess<V> {
    return this.type === 'SUCCESS'
  },
  isInvalid(): this is IFailure {
    return false
  },
})

/**
 * Cria uma instância de `Result<never>` representando um resultado de falha.
 * Especificamente, retorna um `IFailure`.
 * @param errors Um único erro (`SimpleFailure`) ou um array de erros a serem encapsulados.
 * @returns Uma instância de `IFailure`, que é compatível com `Result<V>` para qualquer `V`.
 */
export const failure = (errors: SimpleFailure | ReadonlyArray<SimpleFailure>): Result<never> => {
  const errorArray = Array.isArray(errors) ? [...errors] : [errors]
  return {
    type: 'FAILURE',
    failures: Object.freeze(errorArray),
    isValid(): this is ISuccess<never> {
      return false
    },
    isInvalid(): this is IFailure {
      return true
    },
  }
}
