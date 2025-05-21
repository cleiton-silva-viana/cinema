import { SimpleFailure } from "../failure/simple.failure.type";
import { FailureCode } from "../failure/failure.codes.enum";
import { isNull } from "./validator";
import { fa } from "@faker-js/faker";
import { Result } from "../result/result";

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
export function ensureNotNull(
  fieldsToCheck: Record<string, any>,
): SimpleFailure[] {
  const failures: SimpleFailure[] = [];

  for (const [fieldName, fieldValue] of Object.entries(fieldsToCheck)) {
    if (isNull(fieldValue)) {
      failures.push({
        code: FailureCode.MISSING_REQUIRED_DATA,
        details: { field: fieldName },
      });
    }
  }

  return failures;
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
export function collectNullFields(
  fieldsToCheck: Record<string, any>,
): string[] {
  const nullFields: string[] = [];

  for (const [fieldName, fieldValue] of Object.entries(fieldsToCheck)) {
    if (isNull(fieldValue)) {
      nullFields.push(fieldName);
    }
  }

  return nullFields;
}

/**
 * Simplifica o processo de validação e coleta de falhas ao trabalhar com objetos Result<T>.
 * Verifica se um resultado é válido e, caso contrário, adiciona suas falhas a uma coleção existente.
 *
 * @template T O tipo do valor contido no Result em caso de sucesso
 * @param result O objeto Result a ser validado
 * @param failures Array onde as falhas serão coletadas, caso existam
 * @returns O valor contido no Result se for um sucesso, ou null se for uma falha
 */
export function validateAndCollect<T>(
  result: Result<T>,
  failures: SimpleFailure[],
): T | null {
  if (result.isInvalid()) {
    failures.push(...result.failures);
    return null;
  } else {
    return result.value;
  }
}
