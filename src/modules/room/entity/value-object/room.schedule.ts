import { failure, Result, success } from "../../../../shared/result/result";
import { ScreeningUID } from "../../../screening/aggregate/value-object/screening.uid";
import { BookingSlot, BookingType } from "./booking.slot";
import { TechnicalError } from "../../../../shared/error/technical.error";
import { isNull } from "../../../../shared/validator/validator";
import { FailureCode } from "../../../../shared/failure/failure.codes.enum";
import { SimpleFailure } from "../../../../shared/failure/simple.failure.type";
import { Validate } from "../../../../shared/validator/validate";
import {
  collectNullFields,
  ensureNotNull,
  validateAndCollect,
} from "../../../../shared/validator/common.validators";
import { Room } from "../room";

/**
 * Interface para os dados brutos de um agendamento, usada para hidratação e serialização.
 *
 * Esta interface representa a estrutura de dados simplificada de um BookingSlot,
 * utilizada para persistência, transferência e reconstrução de objetos.
 */
export interface IRoomBookingData {
  bookingUID: string;
  screeningUID: string | null;
  startTime: Date;
  endTime: Date;
  type: BookingType;
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
  private static readonly DEFAULT_OPERATING_START_HOUR = 10;

  /**
   * Horário de fechamento padrão do cinema (22:00 / 10:00 PM).
   * Define o horário limite para início de qualquer agendamento.
   */
  private static readonly DEFAULT_OPERATING_END_HOUR = 22;

  /**
   * Intervalos de minutos permitidos para início de sessões (múltiplos de 5 minutos).
   * Todas as reservas devem iniciar em um destes valores de minuto para padronização
   * e melhor organização da grade de horários.
   */
  private static readonly ALLOWED_MINUTE_INTERVALS = [
    0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55,
  ];

  /**
   * Construtor privado para garantir que instâncias sejam criadas apenas através
   * dos métodos factory (create e hydrate).
   *
   * @param bookings Array de BookingSlot que representa as reservas da sala
   */
  private constructor(
    private readonly bookings: ReadonlyArray<BookingSlot> = [],
  ) {
    this.bookings = [...bookings].sort(
      (a, b) => a.startTime.getTime() - b.startTime.getTime(),
    );
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
    return new RoomSchedule([]);
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
    let fields = collectNullFields({ bookingDataArray });

    TechnicalError.if(fields.length > 0, FailureCode.MISSING_REQUIRED_DATA, {
      fields,
    });

    const bookings: BookingSlot[] = bookingDataArray.map((data) => {
      fields = collectNullFields({
        type: data.type,
        bookingUID: data.bookingUID,
      });

      TechnicalError.if(fields.length > 0, FailureCode.MISSING_REQUIRED_DATA, {
        fields,
      });

      return BookingSlot.hydrate(
        data.bookingUID,
        data.screeningUID,
        new Date(data.startTime),
        new Date(data.endTime),
        data.type,
      );
    });

    return new RoomSchedule(bookings);
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
   * @param failures Array opcional para armazenar as falhas encontradas durante a validação
   * @returns true se o período estiver disponível, false caso contrário
   */
  public isAvailable(
    requestedStartTime: Date,
    requestedEndTime: Date,
    failures: SimpleFailure[] = [],
  ): boolean {
    const init = failures.length;
    failures.push(...ensureNotNull({ requestedStartTime, requestedEndTime }));
    if (failures.length > init) return false;

    // Extraindo verificações para métodos privados
    if (
      !this._validateTimeSequence(
        requestedStartTime,
        requestedEndTime,
        failures,
      )
    )
      return false;
    if (!this._validateOperatingHours(requestedStartTime, failures))
      return false;
    if (!this._validateMinuteInterval(requestedStartTime, failures))
      return false;
    if (
      !this._checkBookingOverlap(requestedStartTime, requestedEndTime, failures)
    )
      return false;

    return true;
  }

  /**
   * Verifica se a data de término é posterior à data de início.
   * @param startTime Data e hora de início
   * @param endTime Data e hora de término
   * @param failures Array para armazenar as falhas
   * @returns true se a sequência for válida, false caso contrário
   */
  private _validateTimeSequence(
    startTime: Date,
    endTime: Date,
    failures: SimpleFailure[],
  ): boolean {
    if (endTime <= startTime) {
      failures.push({
        code: FailureCode.DATE_WITH_INVALID_SEQUENCE,
        details: {
          start_date: startTime.toISOString(),
          end_date: endTime.toISOString(),
        },
      });
      return false;
    }
    return true;
  }

  /**
   * Verifica se o horário de início está dentro do período de funcionamento do cinema.
   * @param startTime Data e hora de início
   * @param failures Array para armazenar as falhas
   * @returns true se estiver dentro do horário de funcionamento, false caso contrário
   */
  private _validateOperatingHours(
    startTime: Date,
    failures: SimpleFailure[],
  ): boolean {
    const startHour = startTime.getHours();
    if (
      startHour < RoomSchedule.DEFAULT_OPERATING_START_HOUR ||
      startHour >= RoomSchedule.DEFAULT_OPERATING_END_HOUR
    ) {
      failures.push({
        code: FailureCode.ROOM_OPERATING_HOURS_VIOLATION,
        details: {
          time: startTime.getHours().toString(), // Corrigido para usar startTime
          start_time: RoomSchedule.DEFAULT_OPERATING_START_HOUR.toString(),
          end_time: RoomSchedule.DEFAULT_OPERATING_END_HOUR.toString(),
        },
      });
      return false;
    }
    return true;
  }

  /**
   * Verifica se o minuto de início está em um intervalo permitido (múltiplos de 5).
   * @param startTime Data e hora de início
   * @param failures Array para armazenar as falhas
   * @returns true se o minuto estiver em um intervalo permitido, false caso contrário
   */
  private _validateMinuteInterval(
    startTime: Date,
    failures: SimpleFailure[],
  ): boolean {
    const startMinute = startTime.getMinutes();
    if (!RoomSchedule.ALLOWED_MINUTE_INTERVALS.includes(startMinute)) {
      failures.push({
        code: FailureCode.BOOKING_WITH_INVAlID_TIME_INTERVAL,
        details: {
          start_time: startTime.getTime().toString(),
          interval: RoomSchedule.ALLOWED_MINUTE_INTERVALS.toString(),
        },
      });
      return false;
    }
    return true;
  }

  /**
   * Verifica se há sobreposição com outras reservas existentes.
   * @param requestedStartTime Data e hora de início solicitada
   * @param requestedEndTime Data e hora de término solicitada
   * @param failures Array para armazenar as falhas
   * @returns true se não houver sobreposição, false caso contrário
   */
  private _checkBookingOverlap(
    requestedStartTime: Date,
    requestedEndTime: Date,
    failures: SimpleFailure[],
  ): boolean {
    for (const booking of this.bookings) {
      const hasOverlap =
        requestedStartTime < booking.endTime &&
        requestedEndTime > booking.startTime;
      if (hasOverlap) {
        failures.push({
          code: FailureCode.ROOM_NOT_AVAILABLE_FOR_PERIOD,
          details: {
            start_date: requestedStartTime.toISOString(),
            end_date: requestedEndTime.toISOString(),
          },
        });
        return false;
      }
    }
    return true;
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
    type: BookingType,
  ): Result<RoomSchedule> {
    const failures = ensureNotNull({ startTime, endTime, type });
    if (failures.length > 0) return failure(failures);

    Validate.string({ type }, failures)
      .isRequired()
      .when(
        type === BookingType.SCREENING || type === BookingType.EXIT_TIME,
        () => {
          Validate.object({ screeningUID }, failures).isRequired();
        },
      );
    if (failures.length > 0) return failure(failures);

    const isAvailable = this.isAvailable(startTime, endTime, failures);
    if (!isAvailable) return failure(failures);

    const bookingSlot = validateAndCollect(
      BookingSlot.create(screeningUID, startTime, endTime, type),
      failures,
    );
    if (failures.length > 0) return failure(failures);

    const newBookings = [...this.bookings, bookingSlot].sort(
      (a, b) => a.startTime.getTime() - b.startTime.getTime(),
    );

    return success(new RoomSchedule(newBookings));
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
    const failures = ensureNotNull({ bookingUID });
    if (failures.length > 0) return failure(failures);

    const initLength = this.bookings.length;
    const updatedBookings = this.bookings.filter(
      (booking) => !(booking.bookingUID === bookingUID),
    );

    return updatedBookings.length === initLength
      ? failure({ code: FailureCode.BOOKING_NOT_FOUND_IN_ROOM })
      : success(new RoomSchedule(updatedBookings));
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
    const failures = ensureNotNull({ screeningUID });
    if (failures.length > 0) return failure(failures);

    const initialLength = this.bookings.length;

    const updatedBookings = this.bookings.filter(
      (booking) =>
        booking.screeningUID === null ||
        !booking.screeningUID.equal(screeningUID),
    );

    return updatedBookings.length === initialLength
      ? failure({
          code: FailureCode.BOOKING_NOT_FOUND_FOR_SCREENING,
          details: { screening_uid: screeningUID.value },
        })
      : success(new RoomSchedule(updatedBookings));
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
    return [...this.bookings];
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
    return this.bookings.find((b) => b.bookingUID === bookingUID);
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
  public findScreeningData(
    screeningUID: ScreeningUID,
  ): BookingSlot | undefined {
    return this.bookings.find(
      (booking) =>
        booking.screeningUID !== null &&
        booking.screeningUID.equal(screeningUID),
    );
  }

  /**
   * Encontra todas as janelas de tempo livres em um determinado dia que atendam a uma duração mínima.
   *
   * @param date Data para buscar slots livres (apenas a data é considerada, o horário é ignorado)
   * @param minMinutes Duração mínima em minutos para considerar um slot como válido
   * @returns Array de slots livres com startTime e endTime, ordenados cronologicamente
   */
  public getFreeSlotsForDate(
    date: Date,
    minMinutes: number,
  ): Array<{ startTime: Date; endTime: Date }> {
    if (isNull(date) || isNull(minMinutes) || minMinutes <= 0) return [];

    const dayStart = new Date(date);
    dayStart.setHours(RoomSchedule.DEFAULT_OPERATING_START_HOUR, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(RoomSchedule.DEFAULT_OPERATING_END_HOUR, 0, 0, 0);

    const filteredBookings = RoomSchedule.filterBookingsByDate(date, [
      ...this.bookings,
    ]);
    const busyIntervals = RoomSchedule.createBusyIntervals(
      filteredBookings,
      dayStart,
      dayEnd,
    );
    const mergedIntervals =
      RoomSchedule.mergeOverlappingIntervals(busyIntervals);

    return RoomSchedule.findFreeSlots(
      mergedIntervals,
      dayStart,
      dayEnd,
      minMinutes,
    );
  }

  /**
   * Ajusta um horário para o próximo intervalo permitido de 5 minutos.
   * @param date Data a ser ajustada
   * @returns Nova data ajustada para o próximo intervalo de 5 minutos
   */
  private static getNextAllowedTime(date: Date): Date {
    const adjusted = new Date(date.getTime());
    const minutes = adjusted.getMinutes();
    const remainder = minutes % 5;
    if (remainder !== 0) {
      adjusted.setMinutes(minutes + (5 - remainder), 0, 0);
    }
    return adjusted;
  }

  /**
   * Ajusta um horário para o intervalo permitido de 5 minutos anterior.
   * @param date Data a ser ajustada
   * @returns Nova data ajustada para o intervalo de 5 minutos anterior
   */
  private static getPreviousAllowedTime(date: Date): Date {
    const adjusted = new Date(date.getTime());
    const minutes = adjusted.getMinutes();
    adjusted.setMinutes(minutes - (minutes % 5), 0, 0);
    return adjusted;
  }

  /**
   * Filtra os agendamentos que ocorrem na data especificada.
   * @param date Data de referência
   * @param bookings O array contendo todas as reservas da sala
   * @returns Array de BookingSlot que ocorrem na data especificada
   */
  private static filterBookingsByDate(
    date: Date,
    bookings: BookingSlot[],
  ): BookingSlot[] {
    const inputDate = new Date(date);
    inputDate.setHours(0, 0, 0, 0);

    return bookings.filter((booking) => {
      const bookingDate = new Date(booking.startTime);
      bookingDate.setHours(0, 0, 0, 0);
      return bookingDate.getTime() === inputDate.getTime();
    });
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
    dayEnd: Date,
  ): Array<{ start: Date; end: Date }> {
    const busyIntervals: { start: Date; end: Date }[] = [];

    for (const booking of filteredBookings) {
      const adjustedStart = new Date(
        Math.max(booking.startTime.getTime(), dayStart.getTime()),
      );
      const adjustedEnd = new Date(
        Math.min(booking.endTime.getTime(), dayEnd.getTime()),
      );

      if (adjustedStart < adjustedEnd) {
        busyIntervals.push({ start: adjustedStart, end: adjustedEnd });
      }
    }

    return busyIntervals;
  }

  /**
   * Mescla intervalos de tempo sobrepostos para evitar duplicidades.
   * @param busyIntervals Intervalos ocupados
   * @returns Array de intervalos mesclados
   */
  private static mergeOverlappingIntervals(
    busyIntervals: Array<{ start: Date; end: Date }>,
  ): Array<{ start: Date; end: Date }> {
    if (busyIntervals.length === 0) return [];

    const mergedIntervals: { start: Date; end: Date }[] = [];
    mergedIntervals.push({ ...busyIntervals[0] });

    for (let i = 1; i < busyIntervals.length; i++) {
      const current = busyIntervals[i];
      const last = mergedIntervals[mergedIntervals.length - 1];

      if (current.start <= last.end) {
        last.end = current.end > last.end ? current.end : last.end;
      } else {
        mergedIntervals.push({ ...current });
      }
    }

    return mergedIntervals;
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
    minMinutes: number,
  ): Array<{ startTime: Date; endTime: Date }> {
    const freeSlots: { startTime: Date; endTime: Date }[] = [];
    let previousEnd = dayStart;

    for (const interval of mergedIntervals) {
      if (previousEnd < interval.start) {
        this.addFreeSlotIfValid(
          previousEnd,
          interval.start,
          minMinutes,
          freeSlots,
        );
      }
      previousEnd = interval.end;
    }

    if (previousEnd < dayEnd)
      this.addFreeSlotIfValid(previousEnd, dayEnd, minMinutes, freeSlots);

    return freeSlots;
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
    freeSlots: Array<{ startTime: Date; endTime: Date }>,
  ): void {
    const adjustedStart = this.getNextAllowedTime(gapStart);
    const adjustedEnd = this.getPreviousAllowedTime(gapEnd);

    if (adjustedStart < adjustedEnd) {
      const durationMinutes =
        (adjustedEnd.getTime() - adjustedStart.getTime()) / 60000;
      if (durationMinutes >= minMinutes) {
        freeSlots.push({ startTime: adjustedStart, endTime: adjustedEnd });
      }
    }
  }
}
