import { failure, Result, success } from "../../../../shared/result/result";
import { ScreeningUID } from "../../../screening/aggregate/value-object/screening.uid";
import { BookingSlot, BookingType } from "./booking.slot";
import { TechnicalError } from "../../../../shared/error/technical.error";
import { isNull } from "../../../../shared/validator/validator";
import { FailureCode } from "../../../../shared/failure/failure.codes.enum";
import { SimpleFailure } from "../../../../shared/failure/simple.failure.type";

/**
 * Interface para os dados brutos de um agendamento, usada para hidratação e serialização.
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
 */
export class RoomSchedule {
  // Horário de funcionamento padrão do cinema
  private static readonly DEFAULT_OPERATING_START_HOUR = 10; // 10:00 AM
  private static readonly DEFAULT_OPERATING_END_HOUR = 22; // 22:00 (10:00 PM)

  // Intervalo de minutos permitido para início de sessões (múltiplos de 5 minutos)
  private static readonly ALLOWED_MINUTE_INTERVALS = [
    0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55,
  ];

  private constructor(
    private readonly bookings: ReadonlyArray<BookingSlot> = [],
  ) {
    // Ordena os BookingSlot com base no startTime
    this.bookings = [...bookings].sort(
      (a, b) => a.startTime.getTime() - b.startTime.getTime(),
    );
  }

  /**
   * Cria uma nova instância de RoomSchedule vazia.
   * @returns Uma nova instância de RoomSchedule sem reservas
   */
  public static create(): RoomSchedule {
    return new RoomSchedule([]);
  }

  /**
   * Recria uma instância de RoomSchedule a partir de dados brutos.
   * @param bookingDataArray Array de dados brutos de reservas
   * @returns Uma nova instância de RoomSchedule com as reservas hidratadas
   * @throws TechnicalError se os dados de hidratação forem inválidos
   */
  public static hydrate(bookingDataArray: IRoomBookingData[]): RoomSchedule {
    TechnicalError.if(
      isNull(bookingDataArray),
      FailureCode.INVALID_HYDRATE_DATA,
      {
        field: "bookingDataArray",
      },
    );

    const bookings: BookingSlot[] = bookingDataArray.map((data) => {
      TechnicalError.if(isNull(data.type), FailureCode.INVALID_HYDRATE_DATA, {
        field: "bookingData.type",
        details: "Booking type is required for hydration",
      });
      TechnicalError.if(
        isNull(data.bookingUID),
        FailureCode.INVALID_HYDRATE_DATA,
        {
          field: "bookingData.bookingUID",
          details: "Booking UID is required for hydration",
        },
      );
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
   * @param requestedStartTime Data e hora de início solicitada
   * @param requestedEndTime Data e hora de término solicitada
   * @param failures Array para armazenar as falhas encontradas
   * @returns true se o período estiver disponível, false caso contrário
   */
  public isAvailable(
    requestedStartTime: Date,
    requestedEndTime: Date,
    failures: SimpleFailure[] = [],
  ): boolean {
    if (requestedEndTime <= requestedStartTime) {
      failures.push({
        code: FailureCode.DATE_WITH_INVALID_SEQUENCE,
        details: {
          field: "endTime",
          startTime: requestedStartTime.toISOString(),
          endTime: requestedEndTime.toISOString(),
        },
      });
      return false;
    }

    // Verifica se o horário está dentro do período de funcionamento
    const startHour = requestedStartTime.getHours();
    if (
      startHour < RoomSchedule.DEFAULT_OPERATING_START_HOUR ||
      startHour >= RoomSchedule.DEFAULT_OPERATING_END_HOUR
    ) {
      failures.push({
        code: FailureCode.ROOM_OPERATING_HOURS_VIOLATION,
        details: {
          field: "startTime",
          requestedHour: startHour,
          allowedStartHour: RoomSchedule.DEFAULT_OPERATING_START_HOUR,
          allowedEndHour: RoomSchedule.DEFAULT_OPERATING_END_HOUR,
        },
      });
      return false;
    }

    // Verifica se o minuto está em um intervalo permitido (múltiplos de 5)
    const startMinute = requestedStartTime.getMinutes();
    if (!RoomSchedule.ALLOWED_MINUTE_INTERVALS.includes(startMinute)) {
      failures.push({
        code: FailureCode.INVALID_BOOKING_TIME_INTERVAL,
        details: {
          field: "startTime",
          requestedMinute: startMinute,
          allowedMinutes: RoomSchedule.ALLOWED_MINUTE_INTERVALS,
        },
      });
      return false;
    }

    // Verifica sobreposição com outras reservas
    for (const booking of this.bookings) {
      const hasOverlap =
        requestedStartTime < booking.endTime &&
        requestedEndTime > booking.startTime;
      if (hasOverlap) {
        failures.push({
          code: FailureCode.ROOM_NOT_AVAILABLE_FOR_PERIOD,
          details: {
            field: "period",
            requestedStartTime: requestedStartTime.toISOString(),
            requestedEndTime: requestedEndTime.toISOString(),
            conflictingBooking: {
              bookingUID: booking.bookingUID,
              screeningUID: booking.screeningUID?.value || null,
              startTime: booking.startTime.toISOString(),
              endTime: booking.endTime.toISOString(),
            },
          },
        });
        return false;
      }
    }

    return true;
  }

  /**
   * Retorna uma nova instância de RoomSchedule com o novo BookingSlot adicionado, se disponível.
   * @param screeningUID Identificador único da exibição
   * @param startTime Data e hora de início da reserva
   * @param endTime Data e hora de término da reserva
   * @param type O tipo de agendamento
   * @returns Result com a nova instância de RoomSchedule ou falhas
   */
  public addBooking(
    screeningUID: ScreeningUID | null,
    startTime: Date,
    endTime: Date,
    type: BookingType,
  ): Result<RoomSchedule> {
    const failures: SimpleFailure[] = [];

    // Verifica se o período está disponível
    if (!this.isAvailable(startTime, endTime, failures)) {
      return failure(failures);
    }

    // Cria o novo booking slot
    const bookingSlotResult = BookingSlot.create(
      screeningUID,
      startTime,
      endTime,
      type,
    );

    if (bookingSlotResult.invalid) return failure(bookingSlotResult.failures);

    // Adiciona o novo booking e ordena a lista
    const newBookings = [...this.bookings, bookingSlotResult.value].sort(
      (a, b) => a.startTime.getTime() - b.startTime.getTime(),
    );

    return success(new RoomSchedule(newBookings));
  }

  /**
   * Retorna uma nova instância de RoomSchedule sem o BookingSlot correspondente.
   * @param bookingUID Identificador único do agendamento a ser removido
   * @returns Result com a nova instância de RoomSchedule ou falhas
   */
  public removeBookingByUID(bookingUID: string): Result<RoomSchedule> {
    const initialLength = this.bookings.length;

    const updatedBookings = this.bookings.filter(
      (booking) => !(booking.bookingUID === bookingUID),
    );

    return updatedBookings.length === initialLength
      ? failure([
          {
            code: FailureCode.BOOKING_NOT_FOUND,
            details: { bookingUID: bookingUID },
          },
        ])
      : success(new RoomSchedule(updatedBookings));
  }

  /**
   * Retorna uma nova instância de RoomSchedule sem o BookingSlot correspondente à exibição.
   * @param screeningUID Identificador único da exibição a ser removida
   * @returns Result com a nova instância de RoomSchedule ou falhas
   */
  public removeScreening(screeningUID: ScreeningUID): Result<RoomSchedule> {
    const initialLength = this.bookings.length;

    const updatedBookings = this.bookings.filter(
      (booking) =>
        booking.screeningUID === null ||
        !booking.screeningUID.equal(screeningUID),
    );

    return updatedBookings.length === initialLength
      ? failure([
          {
            code: FailureCode.BOOKING_NOT_FOUND_FOR_SCREENING,
            details: { screeningUID: screeningUID.value },
          },
        ])
      : success(new RoomSchedule(updatedBookings));
  }

  /**
   * Retorna os dados brutos de todos os BookingSlots agendados.
   * @returns Array de dados brutos de reservas
   */
  public getAllBookingsData(): IRoomBookingData[] {
    return this.bookings.map((bookingSlot) => ({
      bookingUID: bookingSlot.bookingUID,
      screeningUID: bookingSlot.screeningUID?.value || null,
      startTime: bookingSlot.startTime,
      endTime: bookingSlot.endTime,
      type: bookingSlot.type,
    }));
  }

  /**
   * Busca um BookingSlot específico pelo UID do agendamento e retorna seus dados brutos.
   * @param bookingUIDToFind Identificador único do agendamento a ser encontrado
   * @returns Dados brutos da reserva ou undefined se não encontrada
   */
  public findBookingDataByUID(
    bookingUIDToFind: string,
  ): IRoomBookingData | undefined {
    const foundBooking = this.bookings.find(
      (booking) => booking.bookingUID === bookingUIDToFind,
    );

    if (foundBooking) {
      return {
        bookingUID: foundBooking.bookingUID,
        screeningUID: foundBooking.screeningUID?.value || null,
        startTime: foundBooking.startTime,
        endTime: foundBooking.endTime,
        type: foundBooking.type,
      };
    }

    return undefined;
  }

  /**
   * Busca um BookingSlot específico pelo UID da exibição e retorna seus dados brutos.
   * @param screeningUIDToFind Identificador único da exibição a ser encontrada
   * @returns Dados brutos da reserva ou undefined se não encontrada
   */
  public findScreeningData(
    screeningUIDToFind: ScreeningUID,
  ): IRoomBookingData | undefined {
    const foundBooking = this.bookings.find(
      (booking) =>
        booking.screeningUID !== null &&
        booking.screeningUID.equal(screeningUIDToFind),
    );

    if (foundBooking) {
      return {
        bookingUID: foundBooking.bookingUID,
        screeningUID: foundBooking.screeningUID?.value || null,
        startTime: foundBooking.startTime,
        endTime: foundBooking.endTime,
        type: foundBooking.type,
      };
    }

    return undefined;
  }

  /**
   * Encontra todas as janelas de tempo livres em um determinado dia que atendam a uma duração mínima.
   * @param date Data para buscar slots livres
   * @param minMinutes Duração mínima em minutos para considerar um slot como válido
   * @returns Array de slots livres com startTime e endTime
   */
  public getFreeSlotsForDate(
    date: Date,
    minMinutes: number,
  ): Array<{ startTime: Date; endTime: Date }> {
    // Função auxiliar para encontrar o próximo horário alinhado com múltiplos de 5 minutos
    function getNextAllowedTime(date: Date): Date {
      const adjusted = new Date(date.getTime());
      const minutes = adjusted.getMinutes();
      const remainder = minutes % 5;
      if (remainder !== 0) {
        adjusted.setMinutes(minutes + (5 - remainder), 0, 0);
      }
      return adjusted;
    }

    // Função auxiliar para encontrar o último horário alinhado com múltiplos de 5 minutos
    function getPreviousAllowedTime(date: Date): Date {
      const adjusted = new Date(date.getTime());
      const minutes = adjusted.getMinutes();
      adjusted.setMinutes(minutes - (minutes % 5), 0, 0);
      return adjusted;
    }

    // Definir horários de início e fim do dia
    const dayStart = new Date(date);
    dayStart.setHours(RoomSchedule.DEFAULT_OPERATING_START_HOUR, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(RoomSchedule.DEFAULT_OPERATING_END_HOUR, 0, 0, 0);

    // Filtrar bookings que ocorrem na mesma data
    const filteredBookings = this.bookings.filter((booking) => {
      const bookingDate = new Date(booking.startTime);
      bookingDate.setHours(0, 0, 0, 0);
      const inputDate = new Date(date);
      inputDate.setHours(0, 0, 0, 0);
      return bookingDate.getTime() === inputDate.getTime();
    });

    // Ajustar os horários dos bookings para dentro do horário de funcionamento
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

    // Mesclar intervalos sobrepostos
    const mergedIntervals: { start: Date; end: Date }[] = [];
    if (busyIntervals.length > 0) {
      mergedIntervals.push({ ...busyIntervals[0] });
      for (let i = 1; i < busyIntervals.length; i++) {
        const current = busyIntervals[i];
        const last = mergedIntervals[mergedIntervals.length - 1];
        if (current.start <= last.end) {
          // Mesclar intervalos sobrepostos
          last.end = current.end > last.end ? current.end : last.end;
        } else {
          mergedIntervals.push({ ...current });
        }
      }
    }

    // Encontrar os intervalos livres
    const freeSlots: { startTime: Date; endTime: Date }[] = [];
    let previousEnd = dayStart;

    // Verificar lacunas entre os intervalos ocupados
    for (const interval of mergedIntervals) {
      if (previousEnd < interval.start) {
        const gapStart = previousEnd;
        const gapEnd = interval.start;

        const adjustedStart = getNextAllowedTime(gapStart);
        const adjustedEnd = getPreviousAllowedTime(gapEnd);

        if (adjustedStart < adjustedEnd) {
          const durationMinutes =
            (adjustedEnd.getTime() - adjustedStart.getTime()) / 60000;
          if (durationMinutes >= minMinutes) {
            freeSlots.push({ startTime: adjustedStart, endTime: adjustedEnd });
          }
        }
      }
      previousEnd = interval.end;
    }

    // Verificar lacuna após o último intervalo até o fim do dia
    if (previousEnd < dayEnd) {
      const gapStart = previousEnd;
      const gapEnd = dayEnd;

      const adjustedStart = getNextAllowedTime(gapStart);
      const adjustedEnd = getPreviousAllowedTime(gapEnd);

      if (adjustedStart < adjustedEnd) {
        const durationMinutes =
          (adjustedEnd.getTime() - adjustedStart.getTime()) / 60000;
        if (durationMinutes >= minMinutes) {
          freeSlots.push({ startTime: adjustedStart, endTime: adjustedEnd });
        }
      }
    }

    return freeSlots;
  }
}
