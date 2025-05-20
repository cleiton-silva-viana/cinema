import { SimpleFailure } from "../failure/simple.failure.type";
import { FailureCode } from "../failure/failure.codes.enum";
import { isNull } from "./validator";

/**
 * Verifica se um valor é nulo ou indefinido e, em caso afirmativo, adiciona uma falha ao array de falhas.
 *
 * @param value O valor a ser verificado.
 * @param fieldName O nome do campo que está sendo validado (usado nos detalhes da falha).
 * @param failures O array onde as falhas serão adicionadas.
 * @param errorCode O código de erro a ser usado (padrão: MISSING_REQUIRED_DATA).
 * @returns `true` se o valor não for nulo nem indefinido, `false` caso contrário.
 *
 * @example
 * const failures: SimpleFailure[] = [];
 * if (!ensureNotNull(movieUID, 'movieUID', failures)) {
 *   return failure(failures);
 * }
 */
export function ensureNotNull(
  value: any,
  fieldName: string,
  failures: SimpleFailure[],
  errorCode: FailureCode = FailureCode.MISSING_REQUIRED_DATA,
): boolean {
  if (isNull(value)) {
    failures.push({
      code: errorCode,
      details: { field: fieldName },
    });
    return false;
  }
  return true;
}

/**
 * Verifica se uma string não está vazia (nula, indefinida ou contendo apenas espaços em branco).
 * Em caso afirmativo, adiciona uma falha ao array de falhas.
 *
 * @param value A string a ser verificada.
 * @param fieldName O nome do campo que está sendo validado (usado nos detalhes da falha).
 * @param failures O array onde as falhas serão adicionadas.
 * @param errorCode O código de erro a ser usado (padrão: STRING_CANNOT_BE_EMPTY).
 * @returns `true` se a string não estiver vazia, `false` caso contrário.
 *
 * @example
 * const failures: SimpleFailure[] = [];
 * if (!ensureStringNotEmpty(name, 'name', failures)) {
 *   return failure(failures);
 * }
 */
export function ensureStringNotEmpty(
  value: string,
  fieldName: string,
  failures: SimpleFailure[],
  errorCode: FailureCode = FailureCode.STRING_CANNOT_BE_EMPTY,
): boolean {
  if (isNull(value) || value.trim() === "") {
    failures.push({
      code: errorCode,
      details: { field: fieldName },
    });
    return false;
  }
  return true;
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
