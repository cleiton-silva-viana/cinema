import { NumberValidator } from "./number.validator";
import { StringValidator } from "./string.validator";
import { DateValidator } from "./date.validator";
import { ArrayValidator } from "./array.validator";
import { ObjectValidator } from "./object.valdiator";
import { SimpleFailure } from "../failure/simple.failure.type";

/**
 * Classe principal para iniciar validações tipadas
 */
export class Validate {
  /**
   * Inicia a validação de uma string
   * @param value Objeto contendo um par chave-valor onde a chave é o nome do campo e o valor é a string a ser validada
   * @param failures Array onde as falhas de validação serão adicionadas
   * @returns Uma instância de StringValidator configurada com o valor e o array de falhas
   */
  public static string(
    value: Record<string, string>,
    failures: SimpleFailure[],
  ): StringValidator {
    return new StringValidator(value, failures);
  }

  /**
   * Inicia a validação de um número
   * @param value Objeto contendo um par chave-valor onde a chave é o nome do campo e o valor é o número a ser validado
   * @param failures Array onde as falhas de validação serão adicionadas
   * @returns Uma instância de NumberValidator configurada com o valor e o array de falhas
   */
  public static number(
    value: Record<string, number>,
    failures: SimpleFailure[],
  ): NumberValidator {
    return new NumberValidator(value, failures);
  }

  /**
   * Inicia a validação de uma data
   * @param value Objeto contendo um par chave-valor onde a chave é o nome do campo e o valor é a data a ser validada
   * @param failures Array onde as falhas de validação serão adicionadas
   * @returns Uma instância de DateValidator configurada com o valor e o array de falhas
   */
  public static date(
    value: Record<string, Date>,
    failures: SimpleFailure[],
  ): DateValidator {
    return new DateValidator(value, failures);
  }

  /**
   * Inicia a validação de um array
   * @param value Objeto contendo um par chave-valor onde a chave é o nome do campo e o valor é o array a ser validado
   * @param failures Array onde as falhas de validação serão adicionadas
   * @returns Uma instância de ArrayValidator configurada com o valor e o array de falhas
   */
  public static array<T>(
    value: Record<string, T[]>,
    failures: SimpleFailure[],
  ): ArrayValidator<T> {
    return new ArrayValidator(value, failures);
  }

  /**
   * Inicia a validação de um objeto
   * @param value Objeto contendo um par chave-valor onde a chave é o nome do campo e o valor é o objeto a ser validado
   * @param failures Array onde as falhas de validação serão adicionadas
   * @returns Uma instância de ObjectValidator configurada com o valor e o array de falhas`
   */
  public static object<T extends object>(
    value: Record<string, T>,
    failures: SimpleFailure[],
  ): ObjectValidator<T> {
    return new ObjectValidator(value, failures);
  }
}
