import { SimpleFailure } from '../failure/simple.failure.type'
import { FailureCode } from '../failure/failure.codes.enum'
import { isNull } from './validator'
import { failure, Result, success } from '../result/result'
import { TechnicalError } from '../error/technical.error'
import { FailureFactory } from '../failure/failure.factory'

/**
 * Verifica se valores são nulos ou indefinidos e cria falhas para cada campo inválido.
 *
 * @param fieldsToCheck Um objeto com pares de {nome: valor} para verificar.
 * @returns Um array de SimpleFailure contendo as falhas para cada campo nulo ou indefinido.
 *
 * @example
 * const failures = ensureNotNull({
 *   movieUID,
 *   roomUID,
 *   layout
 * });
 *
 * if (failures.length > 0) {
 *   return failure(failures);
 * }
 */
export function ensureNotNull(fieldsToCheck: Record<string, any>): SimpleFailure[] {
  const failures: SimpleFailure[] = []

  for (const [fieldName, fieldValue] of Object.entries(fieldsToCheck)) {
    if (isNull(fieldValue)) {
      failures.push({
        code: FailureCode.MISSING_REQUIRED_DATA,
        details: { field: fieldName },
      })
    }
  }

  return failures
}

/**
 * Coleta nomes de campos nulos ou indefinidos em um array.
 * Útil para o padrão de validação usado em métodos hydrate.
 *
 * @param fieldsToCheck Um objeto com pares de {nome: valor} para verificar.
 * @returns Um array com os nomes dos campos que são nulos ou indefinidos.
 *
 * @example
 * const nullFields = collectNullFields({
 *   uid,
 *   movieUID,
 *   roomUID,
 *   administrativeStatus
 * });
 *
 * if (nullFields.length > 0) {
 *   throw new TechnicalError(FailureCode.MISSING_REQUIRED_DATA, { fields: nullFields });
 * }
 */
export function collectNullFields(fieldsToCheck: Record<string, any>): string[] {
  const nullFields: string[] = []

  for (const [fieldName, fieldValue] of Object.entries(fieldsToCheck)) {
    if (isNull(fieldValue)) {
      nullFields.push(fieldName)
    }
  }

  return nullFields
}

/**
 * Simplifica o processo de validação e coleta de falhas ao trabalhar com objetos Result<T>.
 * Verifica se um resultado é válido e, caso contrário, adiciona suas falhas a uma coleção existente.
 *
 * @template T O tipo do valor contido no Result em caso de sucesso
 * @param result O objeto Result a ser validado
 * @param failures Array onde as falhas serão coletadas, caso existam
 * @returns O valor contido no Result se for um sucesso, ou null se for uma falha
 **/
export function validateAndCollect<T>(result: Result<T>, failures: SimpleFailure[]): T {
  if (result.isInvalid()) {
    failures.push(...result.failures)
    return null!
  } else {
    return result.value
  }
}

export const enum Mode {
  IGNORE_CASE = 'IGNORE_CASE',
  SENSITIVE_CASE = 'SENSITIVE_CASE',
}

/**
 * Tenta converter uma string para um valor de enum.
 *
 * @param fieldName Nome do campo que deve te rum valor correspondente ao enum
 * @param value A string a ser convertida.
 * @param enumType O tipo do enum.
 * @param mode O modo de comparação (IgnoreCase ou CaseSensitive).
 * @returns Um Result contendo o valor do enum em caso de sucesso, ou falhas caso a string não corresponda a nenhum valor do enum.
 */
export function parseToEnum<T extends Record<string, string | number>>(
  fieldName: string,
  value: string | null | undefined,
  enumType: T,
  mode: Mode = Mode.IGNORE_CASE
): Result<T[keyof T]> {
  TechnicalError.validateRequiredFields({ enumType })

  const enumValues = Object.values(enumType)

  if (isNull(value)) return failure(FailureFactory.INVALID_ENUM_VALUE('N/D', fieldName))

  const stringValue = mode === Mode.IGNORE_CASE ? String(value).toUpperCase() : String(value)

  const foundValue = enumValues.find((enumValue) => {
    const enumString = String(enumValue)
    return enumString === stringValue
  })

  if (isNull(foundValue)) return failure(FailureFactory.INVALID_ENUM_VALUE(value?.toString() || 'N/D', fieldName))

  return success(foundValue as T[keyof T])
}

export function hydrateEnum<T extends Record<string, string | number>>(
  fieldName: string,
  value: string | null | undefined,
  enumType: T
): T[keyof T] {
  const result = parseToEnum(fieldName, value, enumType, Mode.IGNORE_CASE)
  if (result.isValid()) {
    return result.value
  }
  throw new TechnicalError(result.failures[0])
}
