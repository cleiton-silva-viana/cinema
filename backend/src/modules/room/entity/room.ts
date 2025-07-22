import { Screen } from './value-object/screen'
import { RoomUID } from './value-object/room.uid'
import { RoomIdentifier } from './value-object/room.identifier'
import { SeatLayout } from './value-object/seat.layout'
import { SeatRow } from './value-object/seat.row'
import { IRoomBookingData, RoomSchedule } from './value-object/room.schedule'
import { BookingSlot, BookingType } from './value-object/booking.slot'
import { ScreeningUID } from '../../screening/aggregate/value-object/screening.uid'
import { combine, failure, Result, success } from '@shared/result/result'
import { TechnicalError } from '@shared/error/technical.error'
import { FailureFactory } from '@shared/failure/failure.factory'
import { ensureNotNull, hydrateEnum, parseToEnum } from '@shared/validator/utils/validation.helpers'

/**
 * Interface que define os parâmetros necessários para criar uma sala de cinema.
 *
 * @property identifier - Número identificador da sala
 * @property seatConfig - Configuração dos assentos da sala
 * @property screen - Configuração da tela de projeção
 * @property status - Status inicial da sala
 */
export interface ICreateRoomInput {
  identifier: number
  seatConfig: ISeatRowConfiguration[]
  screen: ICreateScreenInput
  status: string
}

/**
 * Interface que define os parâmetros para hidratação de uma sala.
 * Utilizada principalmente para reconstruir objetos a partir de dados persistidos.
 *
 * @property roomUID - Identificador único da sala
 * @property identifier - Número identificador da sala
 * @property layout - Configuração do layout de assentos
 * @property screen - Configuração da tela de projeção
 * @property status - Status atual da sala
 */
export interface IHydrateRoomInput {
  roomUID: string
  identifier: number
  layout: Array<ISeatRowConfiguration>
  screen: {
    size: number
    type: string
  }
  schedule: Array<IRoomBookingData>
  status: string
}

/**
 * Interface para os dados necessários para criar uma tela de cinema.
 */
export interface ICreateScreenInput {
  /** Tamanho da tela em metros */
  size: number
  /** Tipo da tela (2D, 3D, 2D_3D) */
  type: string
}

/**
 * Configuração para criação de assentos em uma sala.
 * Especifica quantas colunas existem em cada linha.
 */
export interface ISeatRowConfiguration {
  /** Identificador da linha (ex: '1', '2', '3') */
  rowNumber: number
  /** A letra da última coluna, ou seja, o último assento desta linha
   * exemplo: ao passarmos uma letra 'D', consideramos que os assentos são de A até D
   */
  lastColumnLetter: string
  /** Letras dos assentos preferenciais nesta linha (ex: ['A', 'B']) */
  preferentialSeatLetters?: string[]
}

/**
 * Define os possíveis estados de uma sala.
 */
export enum RoomAdministrativeStatus {
  /** Sala disponível para agendamento de sessões */
  AVAILABLE = 'AVAILABLE',
  /** Sala reservada para um evento específico */
  CLOSED = 'CLOSED',
}

/**
 * Representa uma sala de cinema com seus dados físicos.
 *
 * Esta classe implementa o padrão de Value Object para garantir a imutabilidade
 * e encapsular as regras de validação específicas para salas de cinema. Uma sala é
 * caracterizada por seu identificador único, número da sala, layout de assentos,
 * tela de projeção e status atual.
 *
 * A classe é imutável. Qualquer atualização resulta em uma nova instância.
 */
export class Room {
  /** Tempo de higienização da sala em minutos após cada exibição */
  private static readonly DEFAULT_CLEANING_TIME_IN_MINUTES = 30

  /** Tempo em minutos para os clientes entrarem na sala antes do início da exibição */
  private static readonly DEFAULT_ENTRY_TIME_IN_MINUTES = 15

  /** Tempo em minutos para os clientes saírem da sala após o término da exibição */
  private static readonly DEFAULT_EXIT_TIME_IN_MINUTES = 15

  /**
   * Construtor privado para garantir que instâncias sejam criadas apenas através dos métodos factory.
   *
   * @param uid Identificador único da sala
   * @param identifier Número da sala
   * @param _layout Layout dos assentos da sala
   * @param _screen Objeto Screen representando a tela da sala
   * @param _schedule Objeto contendo a agenda da sala
   * @param status Status atual da sala
   */
  private constructor(
    public readonly uid: RoomUID,
    public readonly identifier: RoomIdentifier,
    private readonly _layout: SeatLayout,
    private readonly _screen: Screen,
    private readonly _schedule: RoomSchedule,
    public readonly status: RoomAdministrativeStatus
  ) {}

  /**
   * Cria uma nova instância de Room com validação completa.
   *
   * Este método valida todos os dados de entrada e retorna um Result que pode
   * conter a nova instância de Room ou um conjunto de falhas de validação.
   *
   * Possíveis falhas incluem:
   * - Parâmetros obrigatórios ausentes
   * - Status inválido (não presente em RoomStatus)
   * - Identificador inválido (formato ou valor)
   * - Configuração de tela inválida (tamanho ou tipo)
   * - Layout de assentos inválido (quantidade, distribuição)
   *
   * @param params Parâmetros para criação da sala
   * @returns Result<Room> contendo a instância de Room ou falhas de validação
   */
  public static create(params: ICreateRoomInput): Result<Room> {
    const failures = ensureNotNull({ params })
    if (failures.length > 0) return failure(failures)

    const { identifier, seatConfig, screen, status } = params

    failures.push(...ensureNotNull({ identifier, seatConfig, screen, status }))
    if (failures.length > 0) return failure(failures)

    const result = combine({
      statusVO: parseToEnum('room_status', params.status, RoomAdministrativeStatus),
      identifierVO: RoomIdentifier.create(params.identifier),
      screenVO: Screen.create(params.screen.size, params.screen.type),
      layoutVO: SeatLayout.create(params.seatConfig),
    })

    if (result.isInvalid()) return failure(result.failures)

    const { identifierVO, statusVO, screenVO, layoutVO } = result.value

    return failures.length > 0
      ? failure(failures)
      : success(new Room(RoomUID.create(), identifierVO, layoutVO, screenVO, RoomSchedule.create(), statusVO))
  }

  /**
   * Recria uma instância de Room a partir de dados existentes sem validação completa.
   *
   * Este método é utilizado principalmente para reconstruir objetos a partir
   * de dados persistidos, assumindo que já foram validados anteriormente.
   * Realiza apenas verificações básicas de nulidade nos dados essenciais.
   *
   * @param params Parâmetros para hidratação da sala
   * @throws {TechnicalError} Se os dados obrigatórios estiverem ausentes
   * @returns Instância de Room
   */
  public static hydrate(params: IHydrateRoomInput): Room {
    TechnicalError.validateRequiredFields({ params })

    const seatRowsMap = new Map<number, SeatRow>()
    params.layout.forEach((rowData) => {
      const seatRow = SeatRow.hydrate(rowData.lastColumnLetter, rowData.preferentialSeatLetters)
      seatRowsMap.set(rowData.rowNumber, seatRow)
    })

    return new Room(
      RoomUID.hydrate(params.roomUID),
      RoomIdentifier.hydrate(params.identifier),
      SeatLayout.hydrate(seatRowsMap),
      Screen.hydrate(params.screen.size, params.screen.type),
      RoomSchedule.hydrate(params.schedule),
      hydrateEnum({ room_status: params.status }, RoomAdministrativeStatus)
    )
  }

  /**
   * Retorna o tamanho da tela.
   */
  get screenSize(): number {
    return this._screen.size
  }

  /**
   * Retorna o tipo da tela.
   */
  get screenType(): string {
    return this._screen.type
  }

  /**
   * Retorna a capacidade total de assentos da sala.
   */
  get totalSeatsCapacity(): number {
    return this._layout.totalCapacity
  }

  /**
   * Retorna a quantidade de assentos preferenciais da sala.
   */
  get preferentialSeatsCount(): number {
    let counter = 0
    this._layout.preferentialSeatsByRow.forEach((row) => (counter += row.length))
    return counter
  }

  /**
   * Retorna informações detalhadas sobre o layout de assentos da sala.
   *
   * @returns Objeto contendo:
   * - rows: número total de fileiras
   * - totalSeats: capacidade total de assentos
   * - preferentialSeats: quantidade de assentos preferenciais
   * - rowsInfo: informações detalhadas de cada fileira
   */
  get seatLayoutInfo(): {
    rows: number
    totalSeats: number
    preferentialSeats: number
    rowsInfo: Array<{
      rowNumber: number
      seats: number
      preferentialSeats: string[]
    }>
  } {
    const rowsInfo: Array<{
      rowNumber: number
      seats: number
      preferentialSeats: string[]
    }> = []

    this._layout.seatRows.forEach((row, rowNumber) => {
      rowsInfo.push({
        rowNumber,
        seats: row.capacity,
        preferentialSeats: this._layout.preferentialSeatsByRow.get(rowNumber) || [],
      })
    })

    return {
      rows: this._layout.seatRows.size,
      totalSeats: this._layout.totalCapacity,
      preferentialSeats: this._layout.preferentialSeatsCount,
      rowsInfo,
    }
  }

  get layout(): SeatLayout {
    return this._layout
  }

  /**
   * Calcula o tempo total necessário para uma exibição, incluindo entrada, filme, saída e limpeza.
   * @param durationInMinutes - A duração do filme em minutos
   * @returns O tempo total em minutos
   */
  public static calculateTotalScreeningTime(durationInMinutes: number): number {
    return (
      durationInMinutes +
      Room.DEFAULT_ENTRY_TIME_IN_MINUTES +
      Room.DEFAULT_EXIT_TIME_IN_MINUTES +
      Room.DEFAULT_CLEANING_TIME_IN_MINUTES
    )
  }

  /**
   * Altera o status da sala criando uma nova instância.
   *
   * Este método mantém a imutabilidade da classe, validando o novo status
   * e criando uma nova instância com o status atualizado em vez de modificar
   * a instância atual.
   *
   * Possíveis falhas incluem:
   * - Status nulo ou indefinido
   * - Status não presente no enum RoomStatus
   *
   * @param status Novo status da sala
   * @returns Result<Room> contendo a sala atualizada ou uma lista de falhas de validação
   */
  public changeStatus(status: string): Result<Room> {
    const newStatusResult = parseToEnum('room_status', status, RoomAdministrativeStatus)
    if (newStatusResult.isInvalid()) return newStatusResult
    const newStatus = newStatusResult.value

    if (newStatus === RoomAdministrativeStatus.CLOSED && this._schedule.getAllBookingsData().length > 0)
      return failure(FailureFactory.ROOM_HAS_FUTURE_BOOKINGS())

    return this.status === newStatus
      ? success(this)
      : success(new Room(this.uid, this.identifier, this._layout, this._screen, this._schedule, newStatus))
  }

  /**
   * Adiciona um novo agendamento de exibição à sala.
   * Após o término da exibição, adiciona automaticamente períodos de saída e higienização.
   * Calcula o tempo total necessário incluindo entrada, filme, saída e limpeza.
   *
   * @param screeningUID - O identificador único da exibição
   * @param startTime - A data e hora de início da exibição
   * @param durationInMinutes - A duração do filme em minutos
   * @returns Result<Room> - Uma nova instância de Room com o agendamento adicionado
   */
  public addScreening(screeningUID: ScreeningUID, startTime: Date, durationInMinutes: number): Result<Room> {
    const failures = ensureNotNull({ screeningUID, startTime, durationInMinutes })
    if (failures.length > 0) return failure(failures)

    const isAvailable = this.isPeriodAvailable(startTime, durationInMinutes)
    if (isAvailable.isInvalid()) return isAvailable

    let entryTime = Room.calculateEndTime(startTime, Room.DEFAULT_ENTRY_TIME_IN_MINUTES)
    let showTime: Date
    let exitTime: Date
    let cleaningTime: Date

    return this._schedule
      .addBooking(screeningUID, startTime, entryTime, BookingType.ENTRY_TIME)
      .flatMap((room) => {
        showTime = Room.calculateEndTime(entryTime, durationInMinutes)
        return room.addBooking(screeningUID, entryTime, showTime, BookingType.SCREENING)
      })
      .flatMap((room) => {
        exitTime = Room.calculateEndTime(showTime, Room.DEFAULT_EXIT_TIME_IN_MINUTES)
        return room.addBooking(screeningUID, showTime, exitTime, BookingType.EXIT_TIME)
      })
      .flatMap((room) => {
        cleaningTime = Room.calculateEndTime(exitTime, Room.DEFAULT_CLEANING_TIME_IN_MINUTES)
        return room.addBooking(screeningUID, exitTime, cleaningTime, BookingType.CLEANING)
      })
      .map((room) => {
        return this.withUpdate({ schedule: room })
      })
  }

  /**
   * Adiciona um período de manutenção à sala.
   *
   * @param startTime - A data e hora de início da manutenção
   * @param durationInMinutes - A duração da manutenção em minutos
   * @returns Result<Room> - Uma nova instância de Room com o agendamento de manutenção adicionado
   */
  public scheduleMaintenance(startTime: Date, durationInMinutes: number): Result<Room> {
    const failures = ensureNotNull({ startTime, durationInMinutes })
    if (failures.length > 0) return failure(failures)

    const endTime = Room.calculateEndTime(startTime, durationInMinutes)
    const result = this._schedule.addBooking(null, startTime, endTime, BookingType.MAINTENANCE)

    return result.isInvalid() ? result : success(this.withUpdate({ schedule: result.value }))
  }

  /**
   * Adiciona um período de higienização manual à sala.
   * Diferente da higienização automática após exibições, esta é agendada manualmente.
   *
   * @param startTime - A data e hora de início da higienização
   * @param durationInMinutes - A duração da higienização em minutos
   * @returns Result<Room> - Uma nova instância de Room com o agendamento de higienização adicionado
   */
  public scheduleCleaning(startTime: Date, durationInMinutes: number): Result<Room> {
    const failures = ensureNotNull({ startTime, durationInMinutes })
    if (failures.length > 0) return failure(failures)

    const endTime = Room.calculateEndTime(startTime, durationInMinutes)
    const result = this._schedule.addBooking(null, startTime, endTime, BookingType.CLEANING)

    return result.isInvalid() ? result : success(this.withUpdate({ schedule: result.value }))
  }

  /**
   * Remove um agendamento da sala pelo UID do agendamento.
   * Retorna uma nova instância de Room com o agendamento removido.
   */
  public removeBookingByUID(bookingUID: string): Result<Room> {
    const result = this._schedule.removeBookingByUID(bookingUID)
    return result.isInvalid() ? result : success(this.withUpdate({ schedule: result.value }))
  }

  /**
   * Remove um agendamento da sala pelo UID da exibição.
   * Também remove os agendamentos de EXIT_TIME associados ao mesmo screeningUID.
   * Retorna uma nova instância de Room com os agendamentos removidos.
   */
  public removeScreening(screeningUID: ScreeningUID): Result<Room> {
    const result = this._schedule.removeScreening(screeningUID)
    return result.isInvalid() ? result : success(this.withUpdate({ schedule: result.value }))
  }

  /**
   * Verifica se um período com duração específica está disponível na sala.
   * Considera o tempo total necessário incluindo:
   * - Tempo de entrada (DEFAULT_ENTRY_TIME_IN_MINUTES)
   * - Duração do filme (durationInMinutes)
   * - Tempo de saída (DEFAULT_EXIT_TIME_IN_MINUTES)
   * - Tempo de limpeza (DEFAULT_CLEANING_TIME_IN_MINUTES)
   *
   * @param startTime - A data e hora de início do período (início da entrada)
   * @param durationInMinutes - A duração do filme em minutos
   * @returns Result<boolean> - Resultado indicando se o período está disponível
   */
  public isPeriodAvailable(startTime: Date, durationInMinutes: number): Result<true> {
    const failures = ensureNotNull({ startTime, durationInMinutes })
    if (failures.length > 0) return failure(failures)

    const totalDuration =
      durationInMinutes +
      Room.DEFAULT_ENTRY_TIME_IN_MINUTES +
      Room.DEFAULT_EXIT_TIME_IN_MINUTES +
      Room.DEFAULT_CLEANING_TIME_IN_MINUTES

    const endTime = Room.calculateEndTime(startTime, totalDuration)

    const result = this._schedule.isAvailable(startTime, endTime)
    return result.isInvalid() ? result : success(true)
  }

  /**
   * Retorna os horários livres para uma data específica, considerando uma duração mínima.
   */
  public getFreeSlotsForDate(date: Date, minMinutes: number): Array<{ startTime: Date; endTime: Date }> {
    return this._schedule.getFreeSlotsForDate(date, minMinutes)
  }

  /**
   * Retorna todos os agendamentos da sala.
   */
  public getAllBookings(): Array<BookingSlot> {
    return this._schedule.getAllBookingsData()
  }

  /**
   * Busca um agendamento específico pelo UID do agendamento.
   */
  public findBookingDataByUID(bookingUID: string): BookingSlot | undefined {
    return this._schedule.findBookingDataByUID(bookingUID)
  }

  /**
   * Busca um agendamento específico pelo UID da sessão.
   */
  public findScreeningData(screeningUID: ScreeningUID): BookingSlot | undefined {
    return this._schedule.findScreeningData(screeningUID)
  }

  public hasSeat(number: number, column: string): boolean {
    return this._layout.hasSeat(number, column)
  }

  public isPreferentialSeat(rowNumber: number, letter: string): boolean {
    return this._layout.isPreferentialSeat(rowNumber, letter)
  }

  /**
   * Calcula a data e hora de término com base na data de início e duração em minutos.
   * Utilizado para calcular os horários de término dos diferentes períodos de agendamento.
   *
   * @param startTime - A data e hora de início
   * @param durationInMinutes - A duração em minutos
   * @returns Date - A data e hora de término calculada
   * @private
   */
  private static calculateEndTime(startTime: Date, durationInMinutes: number): Date {
    const date = new Date(startTime)
    date.setMinutes(date.getMinutes() + durationInMinutes)
    return date
  }

  private withUpdate(
    input: Partial<{
      identifier: RoomIdentifier
      layout: SeatLayout
      screen: Screen
      schedule: RoomSchedule
      status: RoomAdministrativeStatus
    }>
  ): Room {
    return new Room(
      this.uid,
      input.identifier || this.identifier,
      input.layout || this._layout,
      input.screen || this._screen,
      input.schedule || this._schedule,
      input.status || this.status
    )
  }
}
