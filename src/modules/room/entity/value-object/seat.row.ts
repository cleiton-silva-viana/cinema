import { failure, Result, success } from '@shared/result/result'
import { SimpleFailure } from '@shared/failure/simple.failure.type'
import { TechnicalError } from '@shared/error/technical.error'
import { FailureFactory } from '@shared/failure/failure.factory'
import { ensureNotNull } from '@shared/validator/utils/validation.helpers'

/**
 * Mapeamento de letras para números (posição no alfabeto)
 * Usado para representar as colunas de assentos em uma fileira
 */
export const seatColumnLetters = new Map<string, number>([
  ['A', 1],
  ['B', 2],
  ['C', 3],
  ['D', 4],
  ['E', 5],
  ['F', 6],
  ['G', 7],
  ['H', 8],
  ['I', 9],
  ['J', 10],
  ['K', 11],
  ['L', 12],
  ['M', 13],
  ['N', 14],
  ['O', 15],
  ['P', 16],
  ['Q', 17],
  ['R', 18],
  ['S', 19],
  ['T', 20],
  ['U', 21],
  ['V', 22],
  ['W', 23],
  ['X', 24],
  ['Y', 25],
  ['Z', 26],
])

/**
 * Representa uma fileira de assentos em uma sala de cinema
 * Contém informações sobre a última coluna e assentos preferenciais
 */
export class SeatRow {
  /**
   * Número mínimo de assentos permitidos por fileira
   */
  private static readonly MINIMUM_SEATS_PER_ROW = 4

  /**
   * Número máximo de assentos permitidos por fileira
   */
  private static readonly MAXIMUM_SEATS_PER_ROW = 26

  /**
   * Número máximo de assentos preferenciais permitidos por fileira
   */
  private static readonly MAXIMUM_PREFERENTIAL_SEATS_PER_ROW = 4

  /**
   * Construtor privado para garantir que instâncias sejam criadas apenas através dos métodos estáticos
   * @param lastColumnLetter Letra da última coluna da fileira (define a quantidade de assentos)
   * @param preferentialSeatLetters Lista de letras dos assentos preferenciais na fileira
   */
  private constructor(
    public readonly lastColumnLetter: string,
    public readonly preferentialSeatLetters: readonly string[]
  ) {}

  /**
   * Obtém a capacidade (número total de assentos) desta fileira
   * @returns Número total de assentos na fileira
   */
  public get capacity(): number {
    return seatColumnLetters.get(this.lastColumnLetter) || 0
  }

  /**
   * Cria uma nova instância de SeatRow com validação
   * @param rowId Identificador da fileira
   * @param lastColumnLetter Letra da última coluna da fileira (define a quantidade de assentos)
   * @param preferentialSeatLetters Lista de letras dos assentos preferenciais
   * @returns Resultado contendo a instância de SeatRow ou falhas de validação
   */
  public static create(
    rowId: number,
    lastColumnLetter: string,
    preferentialSeatLetters: string[] = []
  ): Result<SeatRow> {
    const failures = ensureNotNull({ rowId, lastColumnLetter, preferentialSeatLetters })
    if (failures.length > 0) return failure(failures)

    const normalizedLastColumnLetter = lastColumnLetter.toUpperCase()
    const totalSeatsInRowResult = this.validateLastColumnLetter(rowId, normalizedLastColumnLetter)
    if (totalSeatsInRowResult.isInvalid()) return failure(totalSeatsInRowResult.failures)

    const totalSeatsInRow = totalSeatsInRowResult.value
    const preferentialSeatsResult = this.validatePreferentialSeatLetters(
      rowId,
      preferentialSeatLetters || [],
      totalSeatsInRow
    )
    if (preferentialSeatsResult.isInvalid()) return failure(preferentialSeatsResult.failures)

    const preferentialSeats = preferentialSeatsResult.value
    return success(new SeatRow(normalizedLastColumnLetter, preferentialSeats))
  }

  /**
   * Recria uma instância de SeatRow a partir de dados existentes sem validação.
   * Usado principalmente para reconstruir objetos a partir do banco de dados ou outras fontes confiáveis.
   *
   * @param lastColumnLetter Letra da última coluna da fileira
   * @param preferential Lista de letras dos assentos preferenciais
   * @throws {TechnicalError} Se os dados obrigatórios estiverem ausentes
   * @returns Instância de SeatRow
   */
  public static hydrate(lastColumnLetter: string, preferential?: string[]): SeatRow {
    TechnicalError.validateRequiredFields({ lastColumnLetter, preferential })

    const normalizedPreferentialSeatLetters = preferential
      ? preferential.map((seatLetter) => seatLetter.toUpperCase())
      : []

    return new SeatRow(lastColumnLetter.toUpperCase(), normalizedPreferentialSeatLetters)
  }

  /**
   * Valida a letra da última coluna da fileira
   * @param rowId Identificador da fileira para mensagens de erro
   * @param lastColumnLetter Letra da última coluna a ser validada
   * @returns Resultado contendo o número total de assentos na fileira ou falhas de validação
   */
  private static validateLastColumnLetter(rowId: number, lastColumnLetter: string): Result<number> {
    if (!seatColumnLetters.has(lastColumnLetter))
      return failure(FailureFactory.SEAT_WITH_INVALID_COLUMN_IDENTIFIER(lastColumnLetter, rowId.toString()))

    const totalSeatsInRow = seatColumnLetters.get(lastColumnLetter) || 0
    if (totalSeatsInRow < this.MINIMUM_SEATS_PER_ROW || totalSeatsInRow > this.MAXIMUM_SEATS_PER_ROW)
      return failure(
        FailureFactory.SEAT_COLUMN_OUT_OF_RANGE(
          rowId.toString(),
          totalSeatsInRow,
          this.MINIMUM_SEATS_PER_ROW,
          this.MAXIMUM_SEATS_PER_ROW
        )
      )

    return success(totalSeatsInRow)
  }

  /**
   * Valida as letras dos assentos preferenciais
   * @param rowId Identificador da fileira para mensagens de erro
   * @param seatLetters Lista de letras dos assentos preferenciais a serem validados
   * @param totalSeatsInRow Número total de assentos na fileira (baseado na última coluna)
   * @returns Resultado contendo a lista de letras dos assentos preferenciais validados ou falhas
   */
  private static validatePreferentialSeatLetters(
    rowId: number,
    seatLetters: string[],
    totalSeatsInRow: number
  ): Result<string[]> {
    const validationFailures: SimpleFailure[] = []
    const row = rowId.toString()

    if (seatLetters.length === 0) return success([])

    if (seatLetters.length > this.MAXIMUM_PREFERENTIAL_SEATS_PER_ROW)
      return failure(
        FailureFactory.SEAT_WITH_PREFERENTIAL_LIMIT_EXCEEDED(
          seatLetters.length,
          this.MAXIMUM_PREFERENTIAL_SEATS_PER_ROW,
          row
        )
      )

    const validatedSeatLetters: string[] = []

    for (const seatLetter of seatLetters) {
      const normalizedSeatLetter = seatLetter.toUpperCase()

      const seatPosition = seatColumnLetters.get(normalizedSeatLetter)
      if (seatPosition === undefined || seatPosition > totalSeatsInRow) {
        validationFailures.push(FailureFactory.SEAT_PREFERENTIAL_IN_ROW_IS_NOT_FOUND(rowId + normalizedSeatLetter, row))
        continue
      }

      if (validatedSeatLetters.includes(normalizedSeatLetter)) {
        validationFailures.push(FailureFactory.SEAT_PREFERENTIAL_IS_DUPLICATED(rowId + normalizedSeatLetter, row))
        continue
      }

      validatedSeatLetters.push(normalizedSeatLetter)
    }

    return validationFailures.length > 0 ? failure(validationFailures) : success(validatedSeatLetters)
  }

  /**
   * Verifica se um assento específico é preferencial
   * @param seatLetter Letra do assento a verificar
   * @returns true se o assento for preferencial, false caso contrário
   */
  public isPreferentialSeat(seatLetter: string): boolean {
    return this.preferentialSeatLetters.includes(seatLetter.toUpperCase())
  }

  /**
   * Verifica se um assento existe nesta fileira
   * @param seatLetter Letra do assento a verificar
   * @returns true se o assento existir na fileira, false caso contrário
   */
  public hasSeat(seatLetter: string): boolean {
    const seatPosition = seatColumnLetters.get(seatLetter.toUpperCase())
    const lastColumnPosition = seatColumnLetters.get(this.lastColumnLetter)

    return seatPosition !== undefined && lastColumnPosition !== undefined && seatPosition <= lastColumnPosition
  }
}
