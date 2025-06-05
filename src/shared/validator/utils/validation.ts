/**
 * Utilitários de validação para diversos tipos de dados.
 * Cada função retorna 'true' se a validação passar e 'false' caso contrário
 * (com exceção de `isBetween` que atualmente lança erro para argumentos inválidos).
 * Estas funções NÃO lançam erros por falhas de validação *do valor sendo testado*.
 */

// --- Verificações Gerais ---

/**
 * Verifica se o valor é estritamente nulo (null) ou indefinido (undefined).
 * @param value O valor a ser verificado.
 * @returns boolean True se o valor for null ou undefined, False caso contrário.
 */
export const isNull = (value: any): boolean => {
  return value === null || value === undefined
}

/**
 * Verifica se uma string (ignorando espaços nas bordas) ou um array está vazio.
 * Retorna true também se o valor for null ou undefined.
 * @param value A string ou array a ser verificado.
 * @returns boolean True se for vazio, null ou undefined, False caso contrário.
 */
export const isEmpty = (value: string | Array<any> | null | undefined): boolean => {
  if (isNull(value)) return true // Considera null/undefined como vazio

  if (typeof value === 'string') return value.trim().length === 0

  if (Array.isArray(value)) return value.length === 0

  return false
}

/**
 * Checks if a value is empty, considering different types:
 * - null/undefined: returns true
 * - string: returns true if empty or only whitespace
 * - array: returns true if length is 0
 * - object: returns true if has no own properties
 * - other types: returns false
 * @param value The value to check
 * @returns boolean True if the value is considered empty, false otherwise
 */
export const isBlank = (value: any): boolean => {
  if (value === null || value === undefined) {
    return true
  }

  if (typeof value === 'string') {
    return value.trim().length === 0
  }

  if (Array.isArray(value)) {
    return value.length === 0
  }

  if (typeof value === 'object') {
    return Object.keys(value).length === 0
  }

  return false
}

/**
 * Verifica se dois valores são iguais.
 * Suporta tipos primitivos (string, number, boolean), Date e Arrays (comparação rasa ou profunda - CUIDADO com recursão).
 * @param value O primeiro valor.
 * @param target O segundo valor.
 * @returns boolean True se os valores forem considerados iguais, False caso contrário.
 */
export const isEqual = <T extends boolean | number | string | Date | Array<any>>(value: T, target: T): boolean => {
  if (value === target) return true
  if (isNull(value) !== isNull(target)) return false
  if (isNull(value) && isNull(target)) return true

  if (typeof value !== typeof target) return false

  if (value instanceof Date && target instanceof Date)
    return !isNaN(value.getTime()) && !isNaN(target.getTime()) && value.getTime() === target.getTime()

  // todo: Risco de StackOverflow
  if (Array.isArray(value) && Array.isArray(target)) {
    if (value.length !== target.length) return false
    // TODO: Implementar limite de profundidade para a recursão ou usar abordagem iterativa.
    try {
      return value.every((element, index) => isEqual(element, target[index]))
    } catch (e) {
      if (e instanceof RangeError) {
        console.error(
          'isEqual: Maximum call stack size exceeded during array comparison. Consider limiting depth or using an iterative approach.'
        )
        return false
      }
      throw e
    }
  }

  return false
}

/**
 * Verifica se um valor (número) ou comprimento (string/array) está entre min e max (inclusivo).
 * @param value O valor (number) ou item (string/array) a ter seu comprimento verificado.
 * @param min O valor/comprimento mínimo permitido.
 * @param max O valor/comprimento máximo permitido.
 * @returns boolean True se estiver dentro do intervalo, False caso contrário ou se os tipos forem inválidos.
 * @throws {TechnicalError} SE min ou max não forem números (Comportamento atual, mas não recomendado).
 */
export const isBetween = (value: number | string | Array<any>, min: number, max: number): boolean => {
  if (typeof min !== 'number' || typeof max !== 'number' || min > max) return false

  if (typeof value === 'number') return value >= min && value <= max

  if (typeof value === 'string') return value.length >= min && value.length <= max

  if (Array.isArray(value)) return value.length >= min && value.length <= max

  return false
}

/**
 * Verifica se o comprimento de uma string, array ou número de chaves de um objeto
 * é maior ou igual a um mínimo.
 * @param value A string, array ou objeto a ser verificado.
 * @param min O comprimento mínimo exigido (deve ser >= 0).
 * @returns boolean True se o comprimento for >= min, False caso contrário ou se o tipo for inválido/null/min inválido.
 */
export const minLengthEqualTo = (value: string | Array<any> | object | null | undefined, min: number): boolean => {
  // TODO: (Validação Arg) Retorna false se min for inválido. OK.
  if (isNull(value) || typeof min !== 'number' || min < 0) return false

  if (typeof value === 'string') return value.length >= min

  if (Array.isArray(value)) return value.length >= min

  // TODO: (Documentação) Clarificar que para objetos, compara o número de chaves próprias.
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) return Object.keys(value).length >= min

  return false
}

/**
 * Verifica se o comprimento de uma string, array ou número de chaves de um objeto
 * é menor ou igual a um máximo.
 * @param value A string, array ou objeto a ser verificado.
 * @param max O comprimento máximo permitido (deve ser >= 0).
 * @returns boolean True se o comprimento for <= max, False caso contrário ou se o tipo for inválido/null/max inválido.
 */
export const maxLengthEqualTo = (value: string | Array<any> | object | null | undefined, max: number): boolean => {
  if (isNull(value) || typeof max !== 'number' || max < 0) return false

  if (typeof value === 'string') return value.length <= max

  if (Array.isArray(value)) return value.length <= max

  if (typeof value === 'object' && value !== null && !Array.isArray(value)) return Object.keys(value).length <= max

  return false
}

/**
 * Verifica se um valor numérico é menor ou igual a 'max', OU
 * se o comprimento de uma string/array/objeto (número de chaves próprias) é menor ou igual a 'max'.
 * Retorna false para tipos não suportados (boolean, function, symbol etc.),
 * se 'value' for null/undefined, se 'value' for NaN (quando number),
 * ou se 'max' não for um número finito válido.
 *
 * @param value O valor a ser comparado (number) ou cujo comprimento será comparado (string, array, object).
 * @param max O valor/comprimento máximo permitido (deve ser um número finito).
 * @returns boolean True se a condição (valor <= max ou comprimento <= max) for satisfeita, False caso contrário.
 */
export const lessThanOrEqualTo = (
  value: number | string | Array<any> | object | null | undefined,
  max: number
): boolean => {
  if (typeof max !== 'number' || !isFinite(max)) return false

  if (isNull(value)) return false

  if (typeof value === 'number') {
    if (isNaN(value)) return false
    return value <= max
  }

  if (typeof value === 'string') return value.length <= max

  if (Array.isArray(value)) return value.length <= max

  if (typeof value === 'object') return Object.keys(value as Object).length <= max

  return false
}

/**
 * Verifica se um valor numérico é maior ou igual a 'min', OU
 * se o comprimento de uma string/array/objeto (número de chaves próprias) é maior ou igual a 'min'.
 * Retorna false para tipos não suportados (boolean, function, symbol etc.),
 * se 'value' for null/undefined, se 'value' for NaN (quando number),
 * ou se 'min' não for um número finito válido.
 *
 * @param value O valor a ser comparado (number) ou cujo comprimento será comparado (string, array, object).
 * @param min O valor/comprimento mínimo permitido (deve ser um número finito).
 * @returns boolean True se a condição (valor >= min ou comprimento >= min) for satisfeita, False caso contrário.
 */
export const greaterThanOrEqualTo = (
  value: number | string | Array<any> | object | null | undefined,
  min: number
): boolean => {
  if (typeof min !== 'number' || !isFinite(min)) return false

  if (isNull(value)) return false

  if (typeof value === 'number') {
    if (isNaN(value)) return false
    return value >= min
  }

  if (typeof value === 'string') return value.length >= min

  if (Array.isArray(value)) return value.length >= min

  if (typeof value === 'object') return Object.keys(value as Object).length >= min

  return false
}

// --- Verificações de String/Padrão ---

/**
 * Verifica se a string corresponde à expressão regular fornecida.
 * Retorna false se a string for null/undefined ou se o RegExp for inválido.
 * @param regExp A expressão regular (objeto RegExp).
 * @param value A string a ser testada.
 * @returns boolean True se a string corresponder ao padrão, False caso contrário.
 */
export const isMatch = (regExp: RegExp, value: string | null | undefined): boolean => {
  if (!(regExp instanceof RegExp) || isNull(value)) return false

  try {
    return regExp.test(value as string)
  } catch (e) {
    console.error('Error during RegExp.test:', e)
    return false
  }
}

/**
 * Verifica se a string parece ser um endereço de e-mail válido (formato básico).
 * // Evitar regexes excessivamente complexas que podem ser vulneráveis a ReDoS.
 * @param email A string a ser verificada.
 * @returns boolean True se parecer um e-mail válido, False caso contrário.
 */
export const isEmail = (email: string | null | undefined): boolean => {
  if (isNull(email) || typeof email !== 'string') return false

  const emailRegex = /^[^\s@]+@([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/
  return isMatch(emailRegex, email)
}

/**
 * Verifica se a string é um UUID v4 válido.
 * @param uid A string a ser verificada.
 * @returns boolean True se for um UUID v4 válido, False caso contrário.
 */
export const isUIDv4 = (uid: string | null | undefined): boolean => {
  if (isNull(uid) || typeof uid !== 'string') return false

  const uuidV4Regex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/
  return isMatch(uuidV4Regex, uid)
}

/**
 * Verifica se a string é um UUID v7 válido.
 * @param uid A string a ser verificada.
 * @returns boolean True se for um UUID v7 válido, False caso contrário.
 */
export const isUIDv7 = (uid: string | null | undefined): boolean => {
  if (isNull(uid) || typeof uid !== 'string') return false

  const uuidV7Regex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-7[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/
  return isMatch(uuidV7Regex, uid)
}

// --- Verificações de Data ---

/**
 * Verifica se a data 'value' é estritamente posterior à data 'limitDate'.
 * Retorna false se alguma das datas for inválida ou não for instância de Date.
 * @param value A data a ser verificada.
 * @param limitDate A data limite.
 * @returns boolean True se value > limitDate, False caso contrário.
 */
export const isDateAfterLimit = (value: Date, limitDate: Date): boolean => {
  if (!(value instanceof Date) || isNaN(value.getTime()) || !(limitDate instanceof Date) || isNaN(limitDate.getTime()))
    return false

  return value.getTime() > limitDate.getTime()
}

/**
 * Verifica se a data 'value' é estritamente anterior à data 'limitDate'.
 * Retorna false se alguma das datas for inválida ou não for instância de Date.
 * @param value A data a ser verificada.
 * @param limitDate A data limite.
 * @returns boolean True se value < limitDate, False caso contrário.
 */
export const isDateBeforeLimit = (value: Date, limitDate: Date): boolean => {
  if (!(value instanceof Date) || isNaN(value.getTime()) || !(limitDate instanceof Date) || isNaN(limitDate.getTime()))
    return false

  return value.getTime() < limitDate.getTime()
}

/**
 * Verifica se um valor (string, array ou objeto/record) contém um valor específico.
 * - Para strings: verifica se a substring está presente.
 * - Para arrays: verifica se o elemento está presente.
 * - Para objetos/records: verifica se algum valor do objeto é igual ao valor buscado.
 * Retorna false para tipos não suportados ou se container/target for null/undefined.
 * @param value A string, array ou objeto/record a ser verificado.
 * @param target O valor a ser buscado.
 * @returns boolean True se o valor for encontrado, False caso contrário.
 */
export const contains = (value: any, target: any): boolean => {
  if (isNull(value)) return false

  if (typeof value === 'string') {
    if (typeof target !== 'string') return false
    return value.includes(target)
  }

  if (Array.isArray(value)) {
    return value.includes(target)
  }

  if (typeof value === 'object') {
    return Object.values(value).includes(target)
  }

  return false
}
