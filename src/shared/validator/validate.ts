import { NumberValidator } from "./number.validator";
import { StringValidator } from "./string.validator";
import { DateValidator } from "./date.validator";
import { ArrayValidator } from "./array.validator";
import { ObjectValidator } from "./object.valdiator";

/**
 * Classe principal para iniciar validações tipadas
 */
export class Validate {
  /**
   * Inicia a validação de uma string
   * @param value Valor a ser validado
   */
  public static string(value: any): StringValidator {
    return new StringValidator(
      typeof value === "string" ? value : String(value),
    );
  }

  /**
   * Inicia a validação de um número
   * @param value Valor a ser validado
   */
  public static number(value: any): NumberValidator {
    return new NumberValidator(
      typeof value === "number" ? value : Number(value),
    );
  }

  /**
   * Inicia a validação de uma data
   * @param value Valor a ser validado
   */
  public static date(value: any): DateValidator {
    if (value instanceof Date) {
      return new DateValidator(value);
    }
    return new DateValidator(new Date(value));
  }

  /**
   * Inicia a validação de um array
   * @param value Valor a ser validado
   */
  public static array<T>(value: T[]): ArrayValidator<T> {
    return new ArrayValidator<T>(Array.isArray(value) ? value : []);
  }

  /**
   * Inicia a validação de um objeto
   * @param value Valor a ser validado
   */
  public static object<T extends object>(value: T): ObjectValidator<T> {
    return new ObjectValidator<T>(value || ({} as T));
  }
}
