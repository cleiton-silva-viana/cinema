import { failure, Result, success } from "../../../../shared/result/result";
import { SimpleFailure } from "../../../../shared/failure/simple.failure.type";
import { ISeatRowConfiguration } from "../room";
import { FailureCode } from "../../../../shared/failure/failure.codes.enum";

// Mapeamento de letras para números (posição no alfabeto)
export const columnsLetter = new Map<string, number>([
  ["A", 1],
  ["B", 2],
  ["C", 3],
  ["D", 4],
  ["E", 5],
  ["F", 6],
  ["G", 7],
  ["H", 8],
  ["I", 9],
  ["J", 10],
  ["K", 11],
  ["L", 12],
  ["M", 13],
  ["N", 14],
  ["O", 15],
  ["P", 16],
  ["Q", 17],
  ["R", 18],
  ["S", 19],
  ["T", 20],
  ["U", 21],
  ["V", 22],
  ["W", 23],
  ["X", 24],
  ["Y", 25],
  ["Z", 26],
]);

export class SeatRow {
  // Constantes com nomes mais descritivos
  private static readonly MIN_SEATS_PER_ROW = 4;
  private static readonly MAX_SEATS_PER_ROW = 26;
  private static readonly MAX_PREFERENTIAL_SEATS_PER_ROW = 4;

  private constructor(
    public readonly lastColumn: string,
    public readonly preferentialSeats: readonly string[],
  ) {}

  /**
   * Cria uma nova instância de SeatRow
   * @param rowConfig Configuração da fileira
   * @returns Resultado contendo a instância de SeatRow ou falhas
   */
  public static create(rowConfig: ISeatRowConfiguration): Result<SeatRow> {
    const validateColumnResult = this.validateColumn(rowConfig.columns);
    if (validateColumnResult.invalid)
      return failure(validateColumnResult.failures);

    const columnCount = validateColumnResult.value;

    const preferentialSeatsValidation = this.validatePreferentialSeats(
      rowConfig.preferentialSeats || [],
      columnCount,
    );
    if (preferentialSeatsValidation.invalid)
      return failure(preferentialSeatsValidation.failures);

    return success(
      new SeatRow(rowConfig.columns, preferentialSeatsValidation.value),
    );
  }

  /**
   * Valida a coluna final da fileira
   * @param column Letra da coluna final
   * @returns Resultado da validação
   */
  private static validateColumn(column: string): Result<number> {
    // Validar se a letra final é válida
    if (!columnsLetter.has(column)) {
      return failure({
        code: FailureCode.INVALID_SEAT_COLUMN,
        details: {
          value: column,
          validValues: Array.from(columnsLetter.keys()),
        },
      });
    }

    // Validar se a quantidade de colunas está dentro dos limites
    const columnCount = columnsLetter.get(column) || 0;
    if (
      columnCount < this.MIN_SEATS_PER_ROW ||
      columnCount > this.MAX_SEATS_PER_ROW
    ) {
      return failure({
        code: FailureCode.SEAT_COLUMN_OUT_OF_RANGE,
        details: {
          value: column,
          minSeatsPerRow: this.MIN_SEATS_PER_ROW,
          maxSeatsPerRow: this.MAX_SEATS_PER_ROW,
        },
      });
    }

    return success(columnCount);
  }

  /**
   * Valida os assentos preferenciais
   * @param seats Lista de assentos preferenciais
   * @param maxColumnValue Valor máximo de coluna permitido
   * @returns Resultado da validação
   */
  private static validatePreferentialSeats(
    seats: string[],
    maxColumnValue: number,
  ): Result<string[]> {
    const failures: SimpleFailure[] = [];

    if (seats.length === 0) return success([]);

    // Validar quantidade máxima de assentos preferenciais
    if (seats.length > this.MAX_PREFERENTIAL_SEATS_PER_ROW) {
      return failure({
        code: FailureCode.PREFERENTIAL_SEATS_LIMIT_EXCEEDED,
        details: {
          maxPreferentialSeatsPerRow: this.MAX_PREFERENTIAL_SEATS_PER_ROW,
        },
      });
    }

    const validatedSeats: string[] = [];
    const validColumns = Array.from(columnsLetter.entries())
      .filter(([_, value]) => value <= maxColumnValue)
      .map(([key]) => key);

    // Validar cada assento preferencial
    for (const seat of seats) {
      const seatUpper = seat.toUpperCase();

      // Verificar se o assento existe na fileira
      const seatValue = columnsLetter.get(seatUpper);
      if (seatValue === undefined || seatValue > maxColumnValue) {
        failures.push({
          code: FailureCode.PREFERENTIAL_SEAT_NOT_IN_ROW,
          details: {
            value: seatUpper,
            validValues: validColumns,
          },
        });
        continue;
      }

      // Verificar se o assento já foi definido como preferencial
      if (validatedSeats.includes(seatUpper)) {
        failures.push({
          code: FailureCode.DUPLICATE_PREFERENTIAL_SEAT,
          details: {
            value: seatUpper,
            message: "Assento já definido como preferencial",
          },
        });
        continue;
      }

      validatedSeats.push(seatUpper);
    }

    return failures.length > 0 ? failure(failures) : success(validatedSeats);
  }

  /**
   * Obtém a capacidade (número de assentos) desta fileira
   */
  public get capacity(): number {
    return columnsLetter.get(this.lastColumn) || 0;
  }

  /**
   * Obtém todas as letras de coluna para esta fileira
   */
  public getColumns(): string[] {
    const lastColumnValue = columnsLetter.get(this.lastColumn) || 0;
    return Array.from(columnsLetter.entries())
      .filter(([_, value]) => value <= lastColumnValue)
      .map(([key]) => key)
      .sort(
        (a, b) => (columnsLetter.get(a) || 0) - (columnsLetter.get(b) || 0),
      );
  }

  /**
   * Verifica se um assento específico é preferencial
   */
  public isPreferentialSeat(column: string): boolean {
    return this.preferentialSeats.includes(column.toUpperCase());
  }

  /**
   * Verifica se um assento existe nesta fileira
   */
  public hasSeat(column: string): boolean {
    const columnValue = columnsLetter.get(column.toUpperCase());
    const lastColumnValue = columnsLetter.get(this.lastColumn);

    return (
      columnValue !== undefined &&
      lastColumnValue !== undefined &&
      columnValue <= lastColumnValue
    );
  }
}
