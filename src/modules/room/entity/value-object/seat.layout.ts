import { failure, Result, success } from "../../../../shared/result/result";
import { Validate } from "../../../../shared/validator/validate";
import { ISeatRowConfiguration } from "../room";
import { SimpleFailure } from "../../../../shared/failure/simple.failure.type";
import { SeatRow } from "./seat.row";
import { FailureCode } from "../../../../shared/failure/failure.codes.enum";
import { TechnicalError } from "../../../../shared/error/technical.error";
import { isNull } from "../../../../shared/validator/validator";

export class SeatLayout {
  private static readonly MINIMUM_ROW_COUNT = 4;
  private static readonly MAXIMUM_ROW_COUNT = 20;
  private static readonly MINIMUM_ROOM_CAPACITY = 20;
  private static readonly MAXIMUM_ROOM_CAPACITY = 250;
  private static readonly MINIMUM_PREFERENTIAL_PERCENTAGE = 5; // 5% de assentos preferenciais
  private static readonly MAXIMUM_PREFERENTIAL_PERCENTAGE = 20; // 20% de assentos preferenciais

  private constructor(
    public readonly seatRows: Map<number, SeatRow>,
    public readonly preferentialSeatsByRow: Map<number, string[]>, // id da linha + array contendo as letras dos assentos
    public readonly totalCapacity: number,
  ) {}

  /**
   * Cria uma nova instância de SeatLayout com validação
   * @param rowConfigurations Configuração das fileiras de assentos
   * @returns Resultado contendo a instância de SeatLayout ou falhas de validação
   */
  public static create(
    rowConfigurations: ISeatRowConfiguration[],
  ): Result<SeatLayout> {
    const validationFailures: SimpleFailure[] = [];

    Validate.array(rowConfigurations)
      .field("rowConfigurations")
      .failures(validationFailures)
      .isRequired()
      .isNotEmpty()
      .hasLengthBetween(
        SeatLayout.MINIMUM_ROW_COUNT,
        SeatLayout.MAXIMUM_ROW_COUNT,
      );

    if (validationFailures.length > 0) return failure(validationFailures);

    const seatRowsMap = new Map<number, SeatRow>();
    const preferentialSeatsByRow = new Map<number, string[]>();
    let totalPreferentialSeatsCount = 0;
    let roomTotalCapacity = 0;

    for (const rowConfig of rowConfigurations) {
      const rowResult = SeatRow.create(
        rowConfig.rowId,
        rowConfig.columns,
        rowConfig?.preferentialSeats,
      );
      if (rowResult.invalid) {
        validationFailures.push(...rowResult.failures);
        continue;
      }

      const seatRow = rowResult.value;

      if (seatRow.preferentialSeatLetters.length > 0) {
        totalPreferentialSeatsCount += seatRow.preferentialSeatLetters.length;
        preferentialSeatsByRow.set(rowConfig.rowId, [
          ...seatRow.preferentialSeatLetters,
        ]);
      }

      roomTotalCapacity += seatRow.capacity;
      seatRowsMap.set(rowConfig.rowId, seatRow);
    }

    if (
      roomTotalCapacity < this.MINIMUM_ROOM_CAPACITY ||
      roomTotalCapacity > this.MAXIMUM_ROOM_CAPACITY
    )
      validationFailures.push({
        // a capacidade de uma sala deve estar entre os limites permitidos
        code: FailureCode.INVALID_ROOM_CAPACITY,
        details: {
          capacity: {
            actual: roomTotalCapacity,
            min: this.MINIMUM_ROOM_CAPACITY,
            max: this.MAXIMUM_ROOM_CAPACITY,
          },
        },
      });

    const minimumRequiredPreferentialSeats = Math.ceil(
      (roomTotalCapacity * this.MINIMUM_PREFERENTIAL_PERCENTAGE) / 100,
    );
    const maximumAllowedPreferentialSeats = Math.floor(
      (roomTotalCapacity * this.MAXIMUM_PREFERENTIAL_PERCENTAGE) / 100,
    );

    if (
      totalPreferentialSeatsCount < minimumRequiredPreferentialSeats ||
      totalPreferentialSeatsCount > maximumAllowedPreferentialSeats
    )
      validationFailures.push({
        // Quantidade de assentos preferenciais inválida
        code: FailureCode.INVALID_NUMBER_OF_PREFERENTIAL_SEATS,
        details: {
          preferentialSeats: {
            actual: totalPreferentialSeatsCount,
            min: minimumRequiredPreferentialSeats,
            max: maximumAllowedPreferentialSeats,
            minPercentage: this.MINIMUM_PREFERENTIAL_PERCENTAGE,
            maxPercentage: this.MAXIMUM_PREFERENTIAL_PERCENTAGE,
          },
        },
      });

    return validationFailures.length > 0
      ? failure(validationFailures)
      : success(
          new SeatLayout(
            seatRowsMap,
            preferentialSeatsByRow,
            roomTotalCapacity,
          ),
        );
  }

  /**
   * Recria uma instância de SeatLayout a partir de dados existentes sem validação.
   * Usado principalmente para reconstruir objetos a partir do banco de dados ou outras fontes confiáveis.
   *
   * @param seatRows Mapa de fileiras de assentos
   * @throws {TechnicalError} Se os dados obrigatórios estiverem ausentes
   * @returns Instância de SeatLayout
   */
  public static hydrate(seatRows: Map<number, SeatRow>): SeatLayout {
    TechnicalError.if(isNull(seatRows), FailureCode.INVALID_HYDRATE_DATA, {
      field: "seatRows",
    });

    const preferentialSeatsByRow = new Map<number, string[]>();
    let totalCapacity = 0;

    seatRows.forEach((seatRow, rowId) => {
      if (seatRow.preferentialSeatLetters.length > 0) {
        preferentialSeatsByRow.set(rowId, [...seatRow.preferentialSeatLetters]);
      }

      totalCapacity += seatRow.capacity;
    });

    return new SeatLayout(seatRows, preferentialSeatsByRow, totalCapacity);
  }

  /**
   * Verifica se um assento específico existe no layout
   * @param rowId ID da fileira
   * @param seatColumn Letra da coluna do assento
   * @returns true se o assento existir, false caso contrário
   */
  public hasSeat(rowId: number, seatColumn: string): boolean {
    const row = this.seatRows.get(rowId);
    return row !== undefined && row.hasSeat(seatColumn);
  }

  /**
   * Verifica se um assento específico é preferencial
   * @param rowId ID da fileira
   * @param seatColumn Letra da coluna do assento
   * @returns true se o assento for preferencial, false caso contrário
   */
  public isPreferentialSeat(rowId: number, seatColumn: string): boolean {
    const row = this.seatRows.get(rowId);
    return row !== undefined && row.isPreferentialSeat(seatColumn);
  }
}
