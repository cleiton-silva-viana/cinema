import { ScreeningUID } from '../../../screening/aggregate/value-object/screening.uid'
import { BookingSlot, BookingType } from './booking.slot'
import { failure, Result, success } from '@shared/result/result'
import { TechnicalError } from '@shared/error/technical.error'
import { SimpleFailure } from '@shared/failure/simple.failure.type'
import { Validate } from '@shared/validator/validate'
import { FailureFactory } from '@shared/failure/failure.factory'
import { ensureNotNull } from '@shared/validator/utils/validation.helpers'
import { isNullOrUndefined } from '@shared/validator/utils/validation'
import { DateUtils } from '@shared/utils/date.utils'

/**
 * Interface para os dados brutos de um agendamento, usada para hidratação e serialização.
 *
 * Esta interface representa a estrutura de dados simplificada de um BookingSlot,
 * utilizada para persistência, transferência e reconstrução de objetos.
 */
export interface IRoomBookingData {
  bookingUID: string
  screeningUID: string | null
  startTime: Date
  endTime: Date
  type: BookingType
}

/**
 * Representa a agenda de uma sala de cinema, gerenciando todas as reservas de horários.
 *
 * Este Value Object é responsável por:
 * - Manter uma lista ordenada de BookingSlots (reservas)
 * - Verificar disponibilidade de horários
 * - Adicionar e remover reservas
 * - Encontrar períodos livres para agendamento
 *
 * RoomSchedule é imutável, todas as operações retornam novas instâncias.
 * Implementa o padrão Value Object para garantir a integridade dos dados e
 * encapsular as regras de negócio relacionadas ao agendamento de salas.
 */
export class RoomSchedule {
  /**
   * Horário de abertura padrão do cinema (10:00 AM).
   * Define o horário mais cedo possível para início de qualquer agendamento.
   */
  private static readonly DEFAULT_OPERATING_START_HOUR = 10

  /**
   * Horário de fechamento padrão do cinema (22:00 / 10:00 PM).
   * Define o horário limite para início de qualquer agendamento.
   */
  private static readonly DEFAULT_OPERATING_END_HOUR = 22

  /**
   * Intervalos de minutos permitidos para início de sessões (múltiplos de 5 minutos).
   * Todas as reservas devem iniciar em um destes valores de minuto para padronização
   * e melhor organização da grade de horários.
   */
  private static readonly ALLOWED_MINUTE_INTERVALS = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]

  /**
   * Construtor privado para garantir que instâncias sejam criadas apenas através
   * dos métodos factory (create e hydrate).
   *
   * @param bookings Array de BookingSlot que representa as reservas da sala
   */
  private constructor(private readonly bookings: ReadonlyArray<BookingSlot> = []) {
    this.bookings = [...bookings].sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
  }

  /**
   * Cria uma nova instância de RoomSchedule vazia.
   *
   * Este método factory é o ponto de entrada principal para criar uma agenda
   * de sala sem nenhuma reserva inicial.
   *
   * @returns Uma nova instância de RoomSchedule sem reservas
   */
  public static create(): RoomSchedule {
    return new RoomSchedule([])
  }

  /**
   * Recria uma instância de RoomSchedule a partir de dados brutos.
   *
   * Este método é utilizado principalmente para reconstruir o objeto a partir
   * de dados persistidos em um repositório. Realiza validações básicas nos dados
   * e converte cada elemento do array em um BookingSlot.
   *
   * @param bookingDataArray Array de dados brutos de reservas (IRoomBookingData[])
   * @returns Uma nova instância de RoomSchedule com as reservas hidratadas
   * @throws TechnicalError se os dados de hidratação forem inválidos, como:
   *         - bookingDataArray for nulo ou indefinido
   *         - Algum elemento do array não possuir type ou bookingUID
   */
  public static hydrate(bookingDataArray: IRoomBookingData[]): RoomSchedule {
    TechnicalError.validateRequiredFields({ bookingDataArray })

    const bookings: BookingSlot[] = bookingDataArray.map((data) => {
      return BookingSlot.hydrate(
        data.bookingUID,
        data.screeningUID,
        new Date(data.startTime),
        new Date(data.endTime),
        data.type
      )
    })

    return new RoomSchedule(bookings)
  }

  /**
   * Ajusta um horário para o próximo intervalo permitido de 5 minutos.
   * @param date Data a ser ajustada
   * @returns Nova data ajustada para o próximo intervalo de 5 minutos
   */
  private static getNextAllowedTime(date: Date): Date {
    const adjusted = new Date(date.getTime())
    const minutes = adjusted.getMinutes()
    const remainder = minutes % 5
    if (remainder !== 0) adjusted.setMinutes(minutes + (5 - remainder), 0, 0)
    return adjusted
  }

  /**
   * Ajusta um horário para o intervalo permitido de 5 minutos anterior.
   * @param date Data a ser ajustada
   * @returns Nova data ajustada para o intervalo de 5 minutos anterior
   */
  private static getPreviousAllowedTime(date: Date): Date {
    const adjusted = new Date(date.getTime())
    const minutes = adjusted.getMinutes()
    adjusted.setMinutes(minutes - (minutes % 5), 0, 0)
    return adjusted
  }

  /**
   * Filtra os agendamentos que ocorrem na data especificada.
   * @param date Data de referência
   * @param bookings O array contendo todas as reservas da sala
   * @returns Array de BookingSlot que ocorrem na data especificada
   */
  private static filterBookingsByDate(date: Date, bookings: BookingSlot[]): BookingSlot[] {
    const inputDate = new Date(date)
    inputDate.setHours(0, 0, 0, 0)

    return bookings.filter((booking) => {
      const bookingDate = new Date(booking.startTime)
      bookingDate.setHours(0, 0, 0, 0)
      return bookingDate.getTime() === inputDate.getTime()
    })
  }

  /**
   * Cria intervalos de tempo ocupados ajustados ao horário de funcionamento.
   * @param filteredBookings Agendamentos filtrados por data
   * @param dayStart Início do dia de operação
   * @param dayEnd Fim do dia de operação
   * @returns Array de intervalos ocupados
   */
  private static createBusyIntervals(
    filteredBookings: BookingSlot[],
    dayStart: Date,
    dayEnd: Date
  ): Array<{ start: Date; end: Date }> {
    const busyIntervals: { start: Date; end: Date }[] = []

    for (const booking of filteredBookings) {
      const adjustedStart = new Date(Math.max(booking.startTime.getTime(), dayStart.getTime()))
      const adjustedEnd = new Date(Math.min(booking.endTime.getTime(), dayEnd.getTime()))

      if (adjustedStart < adjustedEnd) busyIntervals.push({ start: adjustedStart, end: adjustedEnd })
    }

    return busyIntervals
  }

  /**
   * Mescla intervalos de tempo sobrepostos para evitar duplicidades.
   * @param busyIntervals Intervalos ocupados
   * @returns Array de intervalos mesclados
   */
  private static mergeOverlappingIntervals(
    busyIntervals: Array<{ start: Date; end: Date }>
  ): Array<{ start: Date; end: Date }> {
    if (busyIntervals.length === 0) return []

    const mergedIntervals: { start: Date; end: Date }[] = []
    mergedIntervals.push({ ...busyIntervals[0] })

    for (let i = 1; i < busyIntervals.length; i++) {
      const current = busyIntervals[i]
      const last = mergedIntervals[mergedIntervals.length - 1]

      if (current.start <= last.end) last.end = current.end > last.end ? current.end : last.end
      else mergedIntervals.push({ ...current })
    }

    return mergedIntervals
  }

  /**
   * Identifica e cria slots livres entre intervalos ocupados.
   * @param mergedIntervals Intervalos ocupados mesclados
   * @param dayStart Início do dia de operação
   * @param dayEnd Fim do dia de operação
   * @param minMinutes Duração mínima em minutos
   * @returns Array de slots livres
   */
  private static findFreeSlots(
    mergedIntervals: Array<{ start: Date; end: Date }>,
    dayStart: Date,
    dayEnd: Date,
    minMinutes: number
  ): Array<{ startTime: Date; endTime: Date }> {
    const freeSlots: { startTime: Date; endTime: Date }[] = []
    let previousEnd = dayStart

    for (const interval of mergedIntervals) {
      if (previousEnd < interval.start) this.addFreeSlotIfValid(previousEnd, interval.start, minMinutes, freeSlots)
      previousEnd = interval.end
    }

    if (previousEnd < dayEnd) this.addFreeSlotIfValid(previousEnd, dayEnd, minMinutes, freeSlots)

    return freeSlots
  }

  /**
   * Adiciona um slot livre se atender à duração mínima requerida.
   * @param gapStart Início do intervalo livre
   * @param gapEnd Fim do intervalo livre
   * @param minMinutes Duração mínima em minutos
   * @param freeSlots Array de slots livres para adicionar o novo slot
   */
  private static addFreeSlotIfValid(
    gapStart: Date,
    gapEnd: Date,
    minMinutes: number,
    freeSlots: Array<{ startTime: Date; endTime: Date }>
  ): void {
    const adjustedStart = this.getNextAllowedTime(gapStart)
    const adjustedEnd = this.getPreviousAllowedTime(gapEnd)

    if (adjustedStart < adjustedEnd) {
      const durationMinutes = (adjustedEnd.getTime() - adjustedStart.getTime()) / 60000
      if (durationMinutes >= minMinutes) freeSlots.push({ startTime: adjustedStart, endTime: adjustedEnd })
    }
  }

  /**
   * Verifica se o período solicitado está livre, comparando com os BookingSlots existentes.
   *
   * Realiza diversas validações para garantir que o período solicitado seja válido:
   * 1. Verifica se a data de término é posterior à data de início
   * 2. Verifica se o horário está dentro do período de funcionamento do cinema
   * 3. Verifica se o minuto de início está em um intervalo permitido (múltiplos de 5)
   * 4. Verifica se não há sobreposição com outras reservas existentes
   *
   * @param requestedStartTime Data e hora de início solicitada
   * @param requestedEndTime Data e hora de término solicitada
   * @returns true se o período estiver disponível, false caso contrário
   */
  public isAvailable(requestedStartTime: Date, requestedEndTime: Date): Result<true> {
    const failures: SimpleFailure[] = ensureNotNull({ requestedStartTime, requestedEndTime })
    if (failures.length > 0) return failure(failures)

    return this._validateTimeSequence(requestedStartTime, requestedEndTime)
      .flatMap(() => this._validateOperatingHours(requestedStartTime))
      .flatMap(() => this._validateMinuteInterval(requestedStartTime))
      .flatMap(() => this._checkBookingOverlap(requestedStartTime, requestedEndTime))
  }

  /**
   * Retorna uma nova instância de RoomSchedule com o novo BookingSlot adicionado, se disponível.
   *
   * Este método realiza as seguintes operações:
   * 1. Valida os parâmetros de entrada
   * 2. Verifica se o período solicitado está disponível
   * 3. Cria um novo BookingSlot
   * 4. Adiciona o BookingSlot à lista de reservas
   * 5. Retorna uma nova instância de RoomSchedule com a lista atualizada
   *
   * @param screeningUID Identificador único da exibição (obrigatório apenas para type=SCREENING)
   * @param startTime Data e hora de início da reserva
   * @param endTime Data e hora de término da reserva
   * @param type O tipo de agendamento (SCREENING, CLEANING ou MAINTENANCE)
   * @returns Result com a nova instância de RoomSchedule ou falhas de validação
   */
  public addBooking(
    screeningUID: ScreeningUID | null,
    startTime: Date,
    endTime: Date,
    type: BookingType
  ): Result<RoomSchedule> {
    return this._validateRequiredField({ startTime, endTime, type })
      .flatMap(() => this._addBookingValidation(screeningUID, type))
      .flatMap(() => this.isAvailable(startTime, endTime))
      .flatMap(() => BookingSlot.create(screeningUID, startTime, endTime, type))
      .map((bookingSlot) =>
        [...this.bookings, bookingSlot].sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
      )
      .map((newBookings) => new RoomSchedule(newBookings))
  }

  private _validateRequiredField(fields: Record<string, any>): Result<true> {
    const failures = ensureNotNull(fields)
    return failures.length > 0 ? failure(failures) : success(true)
  }

  /**
   * Retorna uma nova instância de RoomSchedule sem o BookingSlot correspondente.
   *
   * Remove um agendamento específico com base em seu identificador único.
   * Se o agendamento não for encontrado, retorna uma falha.
   *
   * @param bookingUID Identificador único do agendamento a ser removido
   * @returns Result com a nova instância de RoomSchedule ou falha (BOOKING_NOT_FOUND)
   */
  public removeBookingByUID(bookingUID: string): Result<RoomSchedule> {
    const failures = ensureNotNull({ bookingUID })
    if (failures.length > 0) return failure(failures)

    const initLength = this.bookings.length
    const updatedBookings = this.bookings.filter((booking) => !(booking.bookingUID === bookingUID))

    return updatedBookings.length === initLength
      ? failure(FailureFactory.BOOKING_NOT_FOUND_IN_ROOM())
      : success(new RoomSchedule(updatedBookings))
  }

  /**
   * Retorna uma nova instância de RoomSchedule sem o BookingSlot correspondente à exibição.
   *
   * Remove todos os agendamentos associados ao identificador único da exibição,
   * incluindo os agendamentos de tipo SCREENING e EXIT_TIME.
   * Este método é útil quando uma exibição é cancelada e precisa ser removida da agenda.
   * Se nenhum agendamento for encontrado para a exibição, retorna uma falha.
   *
   * @param screeningUID Identificador único da exibição a ser removida
   * @returns Result com a nova instância de RoomSchedule ou falha (BOOKING_NOT_FOUND_FOR_SCREENING)
   */
  public removeScreening(screeningUID: ScreeningUID): Result<RoomSchedule> {
    const failures = ensureNotNull({ screeningUID })
    if (failures.length > 0) return failure(failures)

    const initialLength = this.bookings.length

    const updatedBookings = this.bookings.filter(
      (booking) => booking.screeningUID === null || !booking.screeningUID.equal(screeningUID)
    )

    return updatedBookings.length === initialLength
      ? failure(FailureFactory.BOOKING_NOT_FOUND_FOR_SCREENING(screeningUID.value))
      : success(new RoomSchedule(updatedBookings))
  }

  /**
   * Retorna os dados brutos de todos os BookingSlots agendados.
   *
   * Converte todos os BookingSlots em sua representação serializada (IRoomBookingData),
   * mantendo a ordem cronológica das reservas.
   *
   * @returns Array de dados brutos de reservas (IRoomBookingData[])
   */
  public getAllBookingsData(): BookingSlot[] {
    return [...this.bookings]
  }

  /**
   * Busca um BookingSlot específico pelo UID do agendamento e retorna seus dados brutos.
   *
   * Localiza um agendamento específico com base em seu identificador único e
   * retorna sua representação serializada.
   *
   * @param bookingUID Identificador único do agendamento a ser encontrado
   * @returns Dados brutos da reserva (IRoomBookingData) ou undefined se não encontrada
   */
  public findBookingDataByUID(bookingUID: string): BookingSlot | undefined {
    return this.bookings.find((b) => b.bookingUID === bookingUID)
  }

  /**
   * Busca um BookingSlot específico pelo UID da exibição e retorna seus dados brutos.
   *
   * Localiza um agendamento específico com base no identificador único da exibição e
   * retorna sua representação serializada. Útil para encontrar detalhes de uma
   * exibição específica na agenda da sala.
   *
   * @param screeningUID Identificador único da exibição a ser encontrada
   * @returns Dados brutos da reserva (IRoomBookingData) ou undefined se não encontrada
   */
  public findScreeningData(screeningUID: ScreeningUID): BookingSlot | undefined {
    return this.bookings.find((booking) => booking.screeningUID !== null && booking.screeningUID.equal(screeningUID))
  }

  /**
   * Encontra todas as janelas de tempo livres em um determinado dia que atendam a uma duração mínima.
   *
   * @param date Data para buscar slots livres (apenas a data é considerada, o horário é ignorado)
   * @param minMinutes Duração mínima em minutos para considerar um slot como válido
   * @returns Array de slots livres com startTime e endTime, ordenados cronologicamente
   */
  public getFreeSlotsForDate(date: Date, minMinutes: number): Array<{ startTime: Date; endTime: Date }> {
    if (isNullOrUndefined(date) || isNullOrUndefined(minMinutes) || minMinutes <= 0) return []

    const dayStart = new Date(date)
    dayStart.setHours(RoomSchedule.DEFAULT_OPERATING_START_HOUR, 0, 0, 0)
    const dayEnd = new Date(date)
    dayEnd.setHours(RoomSchedule.DEFAULT_OPERATING_END_HOUR, 0, 0, 0)

    const filteredBookings = RoomSchedule.filterBookingsByDate(date, [...this.bookings])
    const busyIntervals = RoomSchedule.createBusyIntervals(filteredBookings, dayStart, dayEnd)
    const mergedIntervals = RoomSchedule.mergeOverlappingIntervals(busyIntervals)

    return RoomSchedule.findFreeSlots(mergedIntervals, dayStart, dayEnd, minMinutes)
  }

  /**
   * Verifica se a data de término é posterior à data de início.
   * @param startTime Data e hora de início
   * @param endTime Data e hora de término
   * @returns true se a sequência for válida, false caso contrário
   */
  private _validateTimeSequence(startTime: Date, endTime: Date): Result<true> {
    return endTime <= startTime
      ? failure(FailureFactory.DATE_WITH_INVALID_SEQUENCE(startTime.toISOString(), endTime.toISOString()))
      : success(true)
  }

  /**
   * Verifica se o horário de início está dentro do período de funcionamento do cinema.
   * @param startTime Data e hora de início
   * @returns true se estiver dentro do horário de funcionamento, false caso contrário
   */
  private _validateOperatingHours(startTime: Date): Result<true> {
    const startHour = startTime.getHours()
    if (startHour < RoomSchedule.DEFAULT_OPERATING_START_HOUR || startHour >= RoomSchedule.DEFAULT_OPERATING_END_HOUR) {
      return failure(
        FailureFactory.ROOM_OPERATING_HOURS_VIOLATION(
          startTime.getHours().toString(),
          RoomSchedule.DEFAULT_OPERATING_START_HOUR.toString(),
          RoomSchedule.DEFAULT_OPERATING_END_HOUR.toString()
        )
      )
    }
    return success(true)
  }

  /**
   * Verifica se o minuto de início está em um intervalo permitido (múltiplos de 5).
   * @param startTime Data e hora de início
   * @returns true se o minuto estiver em um intervalo permitido, false caso contrário
   */
  private _validateMinuteInterval(startTime: Date): Result<true> {
    const startMinute = startTime.getMinutes()
    if (!RoomSchedule.ALLOWED_MINUTE_INTERVALS.includes(startMinute)) {
      return failure(
        FailureFactory.BOOKING_WITH_INVAlID_TIME_INTERVAL(
          DateUtils.formatDateToISOString(startTime),
          RoomSchedule.ALLOWED_MINUTE_INTERVALS
        )
      )
    }
    return success(true)
  }

  /**
   * Verifica se há sobreposição com outras reservas existentes.
   * @param requestedStartTime Data e hora de início solicitada
   * @param requestedEndTime Data e hora de término solicitada
   * @returns true se não houver sobreposição, false caso contrário
   */
  private _checkBookingOverlap(requestedStartTime: Date, requestedEndTime: Date): Result<true> {
    for (const booking of this.bookings) {
      const hasOverlap = requestedStartTime < booking.endTime && requestedEndTime > booking.startTime
      if (hasOverlap)
        return failure(
          FailureFactory.ROOM_NOT_AVAILABLE_FOR_PERIOD(requestedStartTime.toISOString(), requestedEndTime.toISOString())
        )
    }
    return success(true)
  }

  private _addBookingValidation(screeningUID: ScreeningUID | null, type: BookingType): Result<true> {
    const failures: SimpleFailure[] = []
    Validate.string({ type }, failures)
      .isRequired()
      .when(type === BookingType.SCREENING || type === BookingType.EXIT_TIME, () => {
        if (isNullOrUndefined(screeningUID)) failures.push(FailureFactory.MISSING_REQUIRED_DATA('screeningUID'))
      })
    return failures.length > 0 ? failure(failures) : success(true)
  }
}
