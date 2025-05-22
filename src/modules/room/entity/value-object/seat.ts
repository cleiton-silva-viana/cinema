import { failure, Result, success } from "../../../../shared/result/result";
import { Validate } from "../../../../shared/validator/validate";
import { FailureCode } from "../../../../shared/failure/failure.codes.enum";
import { TechnicalError } from "../../../../shared/error/technical.error";
import { collectNullFields, ensureNotNull } from "../../../../shared/validator/common.validators";

/**
 * Representa um assento em uma sala de cinema.
 *
 * Esta classe implementa o padrão Value Object e define regras específicas para
 * validação de assentos, incluindo:
 * - Formato da coluna (uma única letra A-Z)
 * - Limites válidos para o número da fileira
 * - Status preferencial do assento
 *
 * Um assento é identificado por sua coluna (letra) e fileira (número),
 * formando identificadores como "A1", "B12", "C5".
 */
export class Seat {
  private static readonly MIN_VALUE_ALLOWED = 1;
  private static readonly MAX_VALUE_ALLOWED = 250;

  /**
   * Construtor privado para forçar a criação via método fábrica `create`.
   */
  private constructor(
    public readonly column: string,
    public readonly row: number,
    public readonly preferential: boolean,
  ) {}

  /**
   * Método Fábrica para criar instâncias de Seat.
   * Realiza validações nos dados de entrada.
   * @param column A letra da coluna (e.g., 'A', 'B'). Case-insensitive, será convertido para maiúsculo.
   * @param row O número da linha (e.g., 1, 2).
   * @param preferential True se o assento for preferencial, False caso contrário.
   * @returns Result<Seat> contendo o Assento ou uma lista de falhas.
   */
  public static create(column: string, row: number, preferential: boolean): Result<Seat> {
    const failures = ensureNotNull({ column, row, preferentialSeats: preferential });
    if (failures.length > 0) return failure(failures)

    const columnUpper = column.trim().toUpperCase();

    Validate
      .string({ column: columnUpper }, failures)
      .isRequired()
      .matchesPattern(/^[A-Za-z]$/, FailureCode.SEAT_WITH_INVALID_COLUMN_IDENTIFIER);

    Validate
      .number({row}, failures)
      .isRequired()
      .isInteger(FailureCode.SEAT_WITH_INVALID_ROW_NUMBER, { row })
      .isPositive(FailureCode.SEAT_WITH_INVALID_ROW_NUMBER, { row })
      .isInRange(Seat.MIN_VALUE_ALLOWED, Seat.MAX_VALUE_ALLOWED);

    return failures.length > 0
      ? failure(failures)
      : success(new Seat(columnUpper, row, preferential));
  }

  /**
   * Recria uma instância de Seat a partir de dados existentes sem validação.
   * Usado principalmente para reconstruir objetos a partir do banco de dados.
   */
  public static hydrate(column: string, row: number, preferential: boolean): Seat {
    const fields = collectNullFields({ column, row, preferential });

    TechnicalError.if(
      fields.length > 0,
      FailureCode.MISSING_REQUIRED_DATA,
      { fields }
    );

    return new Seat(column.trim().toUpperCase(), row, preferential);
  }

  /**
   * Retorna uma nova instância de Seat com o status preferencial especificado.
   * Se o status já for o desejado, retorna a instância atual (otimização).
   * @param isPreferential O novo status preferencial desejado.
   * @returns Seat A nova instância de Seat ou a atual se não houver mudança.
   */
  public withPreferentialStatus(isPreferential: boolean): Seat {
    if (this.preferential === isPreferential) return this;
    return new Seat(this.column, this.row, isPreferential);
  }

  /**
   * Retorna um identificador único para o assento (e.g., "A10", "C5").
   */
  get identifier(): string {
    return `${this.column}${this.row}`;
  }

  /**
   * Compara este assento com outro para verificar igualdade de valor.
   * @param other O outro assento a ser comparado.
   * @returns boolean True se os assentos tiverem a mesma coluna, linha e status preferencial.
   */
  public equals(other: Seat): boolean {
    if (other === null || other === undefined) return false;
    if (!(other instanceof Seat)) return false;
    if (this.column !== other.column) return false;
    if (this.row !== other.row) return false;
    if (this.preferential !== other.preferential) return false
    return true
  }
}
