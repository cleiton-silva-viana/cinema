import { TechnicalError } from '../error/technical.error'
import { SimpleFailure } from '../failure/simple.failure.type'
import { FailureFactory } from '../failure/failure.factory'

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

// Assinatura de sobrecarga para array
/**
 * Combina múltiplos resultados (Result) de um array em um único Result.
 * Se todos os resultados forem SUCCESS, retorna um SUCCESS contendo um array com os valores de cada resultado.
 * Se um ou mais resultados forem FAILURE, retorna um FAILURE contendo todas as falhas coletadas.
 * @template T Um array de instâncias de Result.
 * @param results Os resultados a serem combinados.
 * @returns Um Result que é SUCCESS com um array de valores ou FAILURE com um array de falhas.
 */
export function combine<T extends ReadonlyArray<Result<unknown>>>(
  ...results: T
): Result<{
  [K in keyof T]: T[K] extends Result<infer V> ? V : never
}>

// Assinatura de sobrecarga para objeto (Record)
/**
 * Combina múltiplos resultados (Result) de um objeto (Record) em um único Result.
 * Se todos os resultados forem SUCCESS, retorna um SUCCESS contendo um objeto com os valores de cada resultado.
 * Se um ou mais resultados forem FAILURE, retorna um FAILURE contendo todas as falhas coletadas.
 * @template T Um Record onde as chaves são strings e os valores são instâncias de Result.
 * @param results O objeto de resultados a serem combinados.
 * @returns Um Result que é SUCCESS com um objeto de valores ou FAILURE com um array de falhas.
 */
export function combine<T extends Record<string, Result<unknown>>>(
  results: T
): Result<{
  [K in keyof T]: T[K] extends Result<infer V> ? V : never
}>

// Implementação única que lida com ambos os casos
/**
 * Implementação principal da função combine que lida com arrays e objetos de Result.
 * Esta função coleta todos os sucessos ou todas as falhas dos resultados fornecidos.
 * @template T O tipo de entrada, que pode ser um array de Result ou um Record de Result.
 * @param results Os resultados a serem processados, seja um array ou um objeto.
 * @returns Um Result que é SUCCESS com os valores combinados ou FAILURE com as falhas coletadas.
 */
export function combine<T extends ReadonlyArray<Result<unknown>> | Record<string, Result<unknown>>>(
  results: T
): Result<unknown> {
  const failures: SimpleFailure[] = []

  if (Array.isArray(results)) {
    const values: unknown[] = []

    results.forEach((result) => {
      if (result.isInvalid()) failures.push(...result.failures)
      else values.push(result.value)
    })

    return failures.length > 0 ? failure(failures) : success(values)
  }

  if (typeof results === 'object' && results !== null) {
    const values: Record<string, unknown> = {}

    const entries = Object.entries(results)

    for (const [key, result] of entries) {
      if (result.isInvalid()) failures.push(...result.failures)
      else values[key] = result.value
    }

    return failures.length > 0 ? failure(failures) : success(values)
  }

  throw new TechnicalError(FailureFactory.INVALID_COMBINE_INPUT())
}
