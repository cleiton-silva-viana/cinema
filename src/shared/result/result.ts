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

  /**
   * Aplica uma função de transformação ao valor se o resultado for um sucesso.
   * Se for uma falha, retorna a falha inalterada.
   */
  map<U>(fn: (value: V) => U): Result<U>

  /**
   * Aplica uma função que retorna um Result ao valor se o resultado for um sucesso.
   * Se for uma falha, retorna a falha inalterada.
   * Evita o aninhamento de Result<Result<U>>.
   */
  flatMap<U>(fn: (value: V) => Result<U>): Result<U>

  /**
   * Aplica uma função de transformação baseada no estado do resultado.
   * Se for sucesso, aplica onSuccess; se for falha, aplica onFailure.
   */
  fold<U>(onSuccess: (value: V) => U, onFailure: (failures: ReadonlyArray<SimpleFailure>) => U): U

  /**
   * Aplica uma função de transformação assíncrona ao valor se o resultado for um sucesso.
   * Se for uma falha, retorna a falha inalterada.
   */
  mapAsync<U>(fn: (value: V) => Promise<U>): Promise<Result<U>>

  /**
   * Aplica uma função assíncrona que retorna um Result ao valor se o resultado for um sucesso.
   * Se for uma falha, retorna a falha inalterada.
   * Evita o aninhamento de Promise<Result<Result<U>>>.
   */
  flatMapAsync<U>(fn: (value: V) => Promise<Result<U>>): Promise<Result<U>>

  /**
   * Executa uma função com efeito colateral (side-effect) se o resultado for um sucesso.
   * Retorna o Result original, permitindo encadeamento.
   */
  tap(fn: (value: V) => void): Result<V>
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
  map<U>(fn: (value: V) => U): Result<U> {
    return success(fn(this.value))
  },
  flatMap<U>(fn: (value: V) => Result<U>): Result<U> {
    return fn(this.value)
  },
  fold<U>(onSuccess: (value: V) => U, onFailure: (failures: ReadonlyArray<SimpleFailure>) => U): U {
    return onSuccess(this.value)
  },
  async mapAsync<U>(fn: (value: V) => Promise<U>): Promise<Result<U>> {
    return success(await fn(this.value))
  },
  async flatMapAsync<U>(fn: (value: V) => Promise<Result<U>>): Promise<Result<U>> {
    return fn(this.value)
  },
  tap(fn: (value: V) => void): Result<V> {
    fn(this.value)
    return this
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
    map<U>(fn: (value: never) => U): Result<U> {
      return this as any
    },
    flatMap<U>(fn: (value: never) => Result<U>): Result<U> {
      return this as any
    },
    fold<U>(onSuccess: (value: never) => U, onFailure: (failures: ReadonlyArray<SimpleFailure>) => U): U {
      return onFailure(this.failures)
    },
    async mapAsync<U>(fn: (value: never) => Promise<U>): Promise<Result<U>> {
      return this as any
    },
    async flatMapAsync<U>(fn: (value: never) => Promise<Result<U>>): Promise<Result<U>> {
      return this as any
    },
    tap(fn: (value: never) => void): Result<never> {
      return this
    },
  }
}

/**
 * Função utilitária para aplicar uma transformação assíncrona ao valor de um Result.
 * Se o Result for um sucesso, aplica a função `fn` ao valor.
 * Se o Result for uma falha, a falha é propagada.
 * @param fn Função de transformação assíncrona.
 * @returns Uma função que recebe um Result e retorna uma Promise de Result transformado.
 */
const mapAsync =
  <T, U>(fn: (value: T) => Promise<U>) =>
  async (result: Result<T>): Promise<Result<U>> => {
    return result.mapAsync(fn)
  }

/**
 * Função utilitária para aplicar uma transformação assíncrona que retorna um Result.
 * Se o Result original for um sucesso, aplica a função `fn` ao valor.
 * Se o Result original for uma falha, a falha é propagada.
 * Útil para encadear operações assíncronas que podem falhar.
 * @param fn Função de transformação assíncrona que retorna um Result.
 * @returns Uma função que recebe um Result e retorna uma Promise de Result transformado e achatado.
 */
const flatMapAsync =
  <T, U>(fn: (value: T) => Promise<Result<U>>) =>
  async (result: Result<T>): Promise<Result<U>> => {
    return result.flatMapAsync(fn)
  }

/**
 * Função utilitária para executar um efeito colateral (side-effect) com o valor de um Result, se for sucesso.
 * O Result original é retornado, permitindo o encadeamento de outras operações.
 * @param fn Função a ser executada com o valor de sucesso.
 * @returns Uma função que recebe um Result e retorna o mesmo Result.
 */
const tap =
  <T>(fn: (value: T) => void) =>
  (result: Result<T>): Result<T> => {
    return result.tap(fn)
  }

/**
 * Combina dois resultados em um único Result com inferência de tipos precisa.
 */
export function combine<T1, T2>(results: readonly [Result<T1>, Result<T2>]): Result<[T1, T2]>

/**
 * Combina três resultados em um único Result com inferência de tipos precisa.
 */
export function combine<T1, T2, T3>(results: readonly [Result<T1>, Result<T2>, Result<T3>]): Result<[T1, T2, T3]>

/**
 * Combina quatro resultados em um único Result com inferência de tipos precisa.
 */
export function combine<T1, T2, T3, T4>(
  results: readonly [Result<T1>, Result<T2>, Result<T3>, Result<T4>]
): Result<[T1, T2, T3, T4]>

/**
 * Combina cinco resultados em um único Result com inferência de tipos precisa.
 */
export function combine<T1, T2, T3, T4, T5>(
  results: readonly [Result<T1>, Result<T2>, Result<T3>, Result<T4>, Result<T5>]
): Result<[T1, T2, T3, T4, T5]>

/**
 * Combina múltiplos resultados em um único Result, seguindo a semântica "all or nothing".
 *
 * **Comportamento:**
 * - Se TODOS os resultados forem SUCCESS: retorna SUCCESS com os valores combinados
 * - Se QUALQUER resultado for FAILURE: retorna FAILURE com todas as falhas coletadas
 *
 * @template T Um array de tipos Result ou Record de Result
 * @param results Array ou objeto contendo os resultados a serem combinados
 * @returns Result com valores combinados (SUCCESS) ou falhas coletadas (FAILURE)
 *
 * @example
 * // Combinando array de Results
 * const userResult = validateUser(userData)
 * const emailResult = validateEmail(email)
 * const passwordResult = validatePassword(password)
 *
 * const combinedResult = combine([userResult, emailResult, passwordResult])
 * // Se todos válidos: Result<[User, Email, Password]>
 * // Se algum inválido: Result<never> com todas as falhas
 *
 * @example
 * // Combinando objeto de Results
 * const validationResults = {
 *   name: validateName(input.name),
 *   age: validateAge(input.age),
 *   email: validateEmail(input.email)
 * }
 *
 * const result = combine(validationResults)
 * // Se todos válidos: Result<{name: string, age: number, email: string}>
 * // Se algum inválido: Result<never> com todas as falhas de validação
 */
export function combine<T extends ReadonlyArray<Result<unknown>>>(
  results: T
): Result<{
  [K in keyof T]: T[K] extends Result<infer V> ? V : never
}>

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

    results.forEach((result: Result<unknown>) => {
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

/**
 * Função utilitária Transformar o valor de sucesso com a função fornecida, mantendo o erro inalterado se for uma falha.
 * @param fn Função de transformação a ser aplicada ao valor
 * @returns Uma função que aceita um Result e retorna um Result transformado
 * @example
 * result.map(customer => customer.name) // retorna um Result<string>
 */
/**
 * Transforma o valor contido em um Result de sucesso aplicando uma função de mapeamento.
 *
 * **Comportamento:**
 * - Se o Result for SUCCESS: aplica a função ao valor e retorna novo Result com valor transformado
 * - Se o Result for FAILURE: retorna a falha inalterada (não executa a função)
 *
 * **Características:**
 * - Operação "pura" - não produz efeitos colaterais
 * - Preserva o contexto de erro
 * - Permite encadeamento de transformações
 *
 * @template T Tipo do valor de entrada
 * @template U Tipo do valor de saída após transformação
 * @param fn Função de transformação que converte T em U
 * @returns Função que aceita Result<T> e retorna Result<U>
 *
 * @example
 * // Transformando dados de usuário
 * const userResult: Result<User> = getUser(id)
 *
 * const userNameResult = userResult.map(user => user.name.toUpperCase())
 * // Se userResult for SUCCESS: Result<string> com nome em maiúsculas
 * // Se userResult for FAILURE: Result<never> com as mesmas falhas
 *
 * @example
 * // Encadeamento de transformações
 * const result = getUserById(123)
 *   .map(user => user.profile)
 *   .map(profile => profile.displayName)
 *   .map(name => `Bem-vindo, ${name}!`)
 * // Cada map só executa se o anterior foi bem-sucedido
 */
const map =
  <T, U>(fn: (value: T) => U) =>
  (result: Result<T>): Result<U> => {
    return result.map(fn)
  }

/**
 * Aplica uma função que retorna um Result, "achatando" o resultado para evitar aninhamento.
 * 
 * **Comportamento:**
 * - Se o Result for SUCCESS: aplica a função e retorna o Result resultante diretamente
 * - Se o Result for FAILURE: retorna a falha inalterada (não executa a função)
 * 
 * **Diferença do map:**
 * - `map`: T => U (função retorna valor simples)
 - `flatMap`: T => Result<Q> (função retorna Result, evita Result<Result<Q>>)
 *
 * @template T Tipo do valor de entrada
 * @template U Tipo do valor de saída após transformação
 * @param fn Função que recebe T e retorna Result<U>
 * @returns Função que aceita Result<T> e retorna Result<U> (achatado)
 * 
 * @example
 * // Operações que podem falhar
 * const userResult: Result<User> = getUser(id)
 * 
 * const updatedUserResult = userResult.flatMap(user => 
 *   updateUserEmail(user, newEmail) // retorna Result<User>
 * )
 * // Se getUser falhar: retorna a falha original
 * // Se getUser suceder mas updateUserEmail falhar: retorna falha do update
 * // Se ambos sucederem: retorna Result<User> com dados atualizados
 * 
 * @example
 * // Pipeline de validação e processamento
 * const result = parseUserInput(rawData)
 *   .flatMap(data => validateUserData(data))     // Result<ValidatedUser>
 *   .flatMap(user => saveUserToDatabase(user))   // Result<SavedUser>
 *   .flatMap(saved => sendWelcomeEmail(saved))   // Result<EmailSent>
 * // Cada operação só executa se a anterior foi bem-sucedida
 * // Qualquer falha interrompe a cadeia e é propagada
 */
const flatMap =
  <T, U>(fn: (value: T) => Result<U>) =>
  (result: Result<T>): Result<U> => {
    return result.flatMap(fn)
  }

/**
 * Combina os casos de sucesso e falha em um único valor, aplicando a função apropriada.
 * Útil para extrair um valor final de um `Result` ou para lidar com ambos os caminhos (sucesso/falha).
 *
 * **Comportamento:**
 * - Se o Result for SUCCESS: aplica a função `onSuccess` ao valor de sucesso
 * - Se o Result for FAILURE: aplica a função `onFailure` às falhas
 *
 * **Características:**
 * - Permite transformar um `Result` em qualquer outro tipo `U`.
 * - É uma operação terminal no encadeamento de `Result`s, pois retorna um valor simples, não outro `Result`.
 *
 * @template T Tipo do valor de sucesso do Result.
 * @template U Tipo do valor retornado pela função `fold`.
 * @param onSuccess Função a ser aplicada se o Result for um sucesso. Recebe o valor de sucesso.
 * @param onFailure Função a ser aplicada se o Result for uma falha. Recebe um array de `SimpleFailure`.
 * @returns O valor transformado de tipo `U`.
 *
 * @example
 * // Exemplo 1: Retornando um objeto de resposta HTTP
 * const processResult: Result<ProcessedData> = processData(input);
 *
 * const httpResponse = processResult.fold(
 *   (data) => ({ status: 200, body: { message: 'Sucesso!', data } }),
 *   (failures) => ({ status: 400, body: { message: 'Falha na operação.', errors: failures } })
 * );
 * // httpResponse será { status: 200, body: { ... } } ou { status: 400, body: { ... } }
 *
 * @example
 * // Exemplo 2: Extraindo um valor padrão ou o valor de sucesso
 * const configResult: Result<AppConfig> = loadConfig();
 *
 * const config = configResult.fold(
 *   (cfg) => cfg, // Retorna a configuração se for sucesso
 *   (failures) => defaultAppConfig // Retorna uma configuração padrão se for falha
 * );
 * // config será AppConfig (carregada ou padrão)
 */
const fold =
  <T, U>(onSuccess: (value: T) => U, onFailure: (failures: ReadonlyArray<SimpleFailure>) => U) =>
  (result: Result<T>): U => {
    return result.fold(onSuccess, onFailure)
  }
