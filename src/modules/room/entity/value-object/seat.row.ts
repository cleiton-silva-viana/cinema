import { failure, Result, success } from "../../../../shared/result/result";
import { SimpleFailure } from "../../../../shared/failure/simple.failure.type";
import { ISeatRowConfiguration } from "../room";
import { FailureCode } from "../../../../shared/failure/failure.codes.enum";
import { TechnicalError } from "../../../../shared/error/technical.error";
import { isNull } from "../../../../shared/validator/validator";

/**
 * Mapeamento de letras para números (posição no alfabeto)
 * Usado para representar as colunas de assentos em uma fileira
 */
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

/**
 * Representa uma fileira de assentos em uma sala de cinema
 * Contém informações sobre a última coluna e assentos preferenciais
 */
export class SeatRow {
  /**
   * Número mínimo de assentos permitidos por fileira
   */
  private static readonly MIN_SEATS_PER_ROW = 4;

  /**
   * Número máximo de assentos permitidos por fileira
   */
  private static readonly MAX_SEATS_PER_ROW = 26;

  /**
   * Número máximo de assentos preferenciais permitidos por fileira
   */
  private static readonly MAX_PREFERENTIAL_SEATS_PER_ROW = 4;

  /**
   * Construtor privado para garantir que instâncias sejam criadas apenas através dos métodos estáticos
   * @param lastColumn Letra da última coluna da fileira (define a quantidade de assentos)
   * @param preferentialSeats Lista de assentos preferenciais na fileira
   */
  private constructor(
    public readonly lastColumn: string,
    public readonly preferentialSeats: readonly string[],
  ) {}

  /**
   * Cria uma nova instância de SeatRow com validação
   * @param rowID Identificador da fileira
   * @param columns Letra da última coluna da fileira (define a quantidade de assentos)
   * @param preferential Lista de assentos preferenciais
   * @returns Resultado contendo a instância de SeatRow ou falhas de validação
   */
  public static create(
    rowID: number,
    columns: string,
    preferential: string[],
  ): Result<SeatRow> {
    const validateColumnResult = this.validateColumn(rowID, columns);
    if (validateColumnResult.invalid)
      return failure(validateColumnResult.failures);

    const columnCount = validateColumnResult.value;

    const preferentialSeatsValidation = this.validatePreferentialSeats(
      rowID,
      preferential || [],
      columnCount,
    );
    if (preferentialSeatsValidation.invalid)
      return failure(preferentialSeatsValidation.failures);

    return success(new SeatRow(columns, preferentialSeatsValidation.value));
  }

  /**
   * Recria uma instância de SeatRow a partir de dados existentes sem validação.
   * Usado principalmente para reconstruir objetos a partir do banco de dados ou outras fontes confiáveis.
   *
   * @param lastColumn Letra da última coluna da fileira
   * @param preferentialSeats Lista de assentos preferenciais
   * @throws {TechnicalError} Se os dados obrigatórios estiverem ausentes
   * @returns Instância de SeatRow
   */
  public static hydrate(
    lastColumn: string,
    preferentialSeats?: string[],
  ): SeatRow {
    TechnicalError.if(!lastColumn, FailureCode.INVALID_HYDRATE_DATA);

    const preferential = preferentialSeats
      ? preferentialSeats.map((seat) => seat.toUpperCase())
      : [];

    return new SeatRow(lastColumn.toUpperCase(), preferential);
  }

  /**
   * Valida a coluna final da fileira
   * @param rowID Identificador da fileira para mensagens de erro
   * @param column Letra da coluna final a ser validada
   * @returns Resultado contendo o número de colunas ou falhas de validação
   */
  private static validateColumn(rowID: number, column: string): Result<number> {
    if (!columnsLetter.has(column)) {
      return failure({
        code: FailureCode.INVALID_SEAT_COLUMN,
        details: {
          value: column,
          rowID: rowID,
          validValues: Array.from(columnsLetter.keys()),
        },
      });
    }

    const columnCount = columnsLetter.get(column) || 0;
    if (
      columnCount < this.MIN_SEATS_PER_ROW ||
      columnCount > this.MAX_SEATS_PER_ROW
    ) {
      return failure({
        code: FailureCode.SEAT_COLUMN_OUT_OF_RANGE,
        details: {
          value: column,
          rowID: rowID,
          minSeatsPerRow: this.MIN_SEATS_PER_ROW,
          maxSeatsPerRow: this.MAX_SEATS_PER_ROW,
        },
      });
    }

    return success(columnCount);
  }

  /**
   * Valida os assentos preferenciais
   * @param rowID Identificador da fileira para mensagens de erro
   * @param seats Lista de assentos preferenciais a serem validados
   * @param maxColumnValue Valor máximo de coluna permitido (baseado na última coluna)
   * @returns Resultado contendo a lista de assentos preferenciais validados ou falhas
   */
  private static validatePreferentialSeats(
    rowID: number,
    seats: string[],
    maxColumnValue: number,
  ): Result<string[]> {
    const failures: SimpleFailure[] = [];

    if (seats.length === 0) return success([]);

    if (seats.length > this.MAX_PREFERENTIAL_SEATS_PER_ROW) {
      return failure({
        code: FailureCode.PREFERENTIAL_SEATS_LIMIT_EXCEEDED,
        details: {
          rowID: rowID,
          maxPreferentialSeatsPerRow: this.MAX_PREFERENTIAL_SEATS_PER_ROW,
        },
      });
    }

    const validatedSeats: string[] = [];
    const validColumns = Array.from(columnsLetter.entries())
      .filter(([_, value]) => value <= maxColumnValue)
      .map(([key]) => key);

    for (const seat of seats) {
      const seatUpper = seat.toUpperCase();

      const seatValue = columnsLetter.get(seatUpper);
      if (seatValue === undefined || seatValue > maxColumnValue) {
        failures.push({
          code: FailureCode.PREFERENTIAL_SEAT_NOT_IN_ROW,
          details: {
            rowID: rowID,
            value: seat,
            validValues: validColumns,
          },
        });
        continue;
      }

      if (validatedSeats.includes(seatUpper)) {
        failures.push({
          code: FailureCode.DUPLICATE_PREFERENTIAL_SEAT,
          details: {
            rowID: rowID,
            value: seatUpper,
          },
        });
        continue;
      }

      validatedSeats.push(seatUpper);
    }

    return failures.length > 0 ? failure(failures) : success(validatedSeats);
  }

  /**
   * Obtém a capacidade (número total de assentos) desta fileira
   * @returns Número total de assentos na fileira
   */
  public get capacity(): number {
    return columnsLetter.get(this.lastColumn) || 0;
  }

  /**
   * Obtém todas as letras de coluna para esta fileira em ordem alfabética
   * @returns Array com todas as letras de coluna disponíveis nesta fileira
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
   * @param column Letra da coluna do assento a verificar
   * @returns true se o assento for preferencial, false caso contrário
   */
  public isPreferentialSeat(column: string): boolean {
    return this.preferentialSeats.includes(column.toUpperCase());
  }

  /**
   * Verifica se um assento existe nesta fileira
   * @param column Letra da coluna do assento a verificar
   * @returns true se o assento existir na fileira, false caso contrário
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
