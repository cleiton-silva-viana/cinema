import { ISeatRowConfiguration } from '../room'
import { SeatRow } from './seat.row'
import { failure, Result, success } from '@shared/result/result'
import { Validate } from '@shared/validator/validate'
import { TechnicalError } from '@shared/error/technical.error'
import { ensureNotNull, validateAndCollect } from '@shared/validator/common.validators'
import { FailureFactory } from '@shared/failure/failure.factory'

export class SeatLayout {
  private static readonly MINIMUM_ROW_COUNT = 4
  private static readonly MAXIMUM_ROW_COUNT = 20
  private static readonly MINIMUM_ROOM_CAPACITY = 20
  private static readonly MAXIMUM_ROOM_CAPACITY = 250
  private static readonly MINIMUM_PREFERENTIAL_PERCENTAGE = 5 // 5% de assentos preferenciais
  private static readonly MAXIMUM_PREFERENTIAL_PERCENTAGE = 20 // 20% de assentos preferenciais

  private constructor(
    public readonly seatRows: Map<number, SeatRow>,
    public readonly preferentialSeatsByRow: Map<number, string[]>, // id da linha + array contendo as letras dos assentos
    public readonly totalCapacity: number
  ) {}

  /** Retorna a quantidade de assentos preferenicais */
  get preferentialSeatsCount(): number {
    let counter = 0
    this.preferentialSeatsByRow.forEach((row) => {
      counter += row.length
    })
    return counter
  }

  /**
   * Cria uma nova instância de SeatLayout com validação
   * @param rowConfigurations Configuração das fileiras de assentos
   * @returns Resultado contendo a instância de SeatLayout ou falhas de validação
   */
  public static create(rowConfigurations: ISeatRowConfiguration[]): Result<SeatLayout> {
    const failures = ensureNotNull({ rowConfigurations })
    if (failures.length > 0) return failure(failures)

    Validate.array({ rowConfigurations }, failures)
      .isRequired()
      .isNotEmpty()
      .hasLengthBetween(SeatLayout.MINIMUM_ROW_COUNT, SeatLayout.MAXIMUM_ROW_COUNT)
    if (failures.length > 0) return failure(failures)

    const seatRowsMap = new Map<number, SeatRow>()
    const preferentialSeatsByRow = new Map<number, string[]>()
    let totalPreferentialSeatsCount = 0
    let roomCapacity = 0

    for (const r of rowConfigurations) {
      const seatRow = validateAndCollect(
        SeatRow.create(r.rowNumber, r.lastColumnLetter, r?.preferentialSeatLetters),
        failures
      )
      if (seatRow === null) continue

      if (seatRow.preferentialSeatLetters.length > 0) {
        totalPreferentialSeatsCount += seatRow.preferentialSeatLetters.length
        preferentialSeatsByRow.set(r.rowNumber, [...seatRow.preferentialSeatLetters])
      }

      roomCapacity += seatRow.capacity
      seatRowsMap.set(r.rowNumber, seatRow)
    }

    if (roomCapacity < this.MINIMUM_ROOM_CAPACITY || roomCapacity > this.MAXIMUM_ROOM_CAPACITY)
      failures.push(
        FailureFactory.ROOM_WITH_INVALID_CAPACITY(roomCapacity, this.MINIMUM_ROOM_CAPACITY, this.MAXIMUM_ROOM_CAPACITY)
      )

    const minRequiredPreferentialSeats = Math.ceil((roomCapacity * this.MINIMUM_PREFERENTIAL_PERCENTAGE) / 100)
    const maxAllowedPreferentialSeats = Math.floor((roomCapacity * this.MAXIMUM_PREFERENTIAL_PERCENTAGE) / 100)

    if (
      totalPreferentialSeatsCount < minRequiredPreferentialSeats ||
      totalPreferentialSeatsCount > maxAllowedPreferentialSeats
    )
      failures.push(
        FailureFactory.ROOM_WITH_INVALID_NUMBER_OF_PREFERENTIAL_SEATS(
          totalPreferentialSeatsCount,
          this.MINIMUM_PREFERENTIAL_PERCENTAGE
        )
      )

    return failures.length > 0
      ? failure(failures)
      : success(new SeatLayout(seatRowsMap, preferentialSeatsByRow, roomCapacity))
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
    TechnicalError.validateRequiredFields({ seatRows })

    const preferentialSeatsByRow = new Map<number, string[]>()
    let totalCapacity = 0

    seatRows.forEach((seatRow, rowNumber) => {
      if (seatRow.preferentialSeatLetters.length > 0) {
        preferentialSeatsByRow.set(rowNumber, [...seatRow.preferentialSeatLetters])
      }

      totalCapacity += seatRow.capacity
    })

    return new SeatLayout(seatRows, preferentialSeatsByRow, totalCapacity)
  }

  /**
   * Verifica se um assento específico existe no layout
   * @param rowNumber ID da fileira
   * @param seatColumn Letra da coluna do assento
   * @returns true se o assento existir, false caso contrário
   */
  public hasSeat(rowNumber: number, seatColumn: string): boolean {
    const row = this.seatRows.get(rowNumber)
    return row !== undefined && row.hasSeat(seatColumn)
  }

  /**
   * Verifica se um assento específico é preferencial
   * @param rowNumber ID da fileira
   * @param seatColumn Letra da coluna do assento
   * @returns true se o assento for preferencial, false caso contrário
   */
  public isPreferentialSeat(rowNumber: number, seatColumn: string): boolean {
    const row = this.seatRows.get(rowNumber)
    return row !== undefined && row.isPreferentialSeat(seatColumn)
  }
}
