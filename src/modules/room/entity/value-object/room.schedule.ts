import { failure, Result, success } from "../../../../shared/result/result";
import { ScreeningUID } from "../../../screening/aggregate/value-object/screening.uid";
import { BookingSlot, BookingType } from "./booking.slot";
import { TechnicalError } from "../../../../shared/error/technical.error";
import { isNull } from "../../../../shared/validator/validator";
import { FailureCode } from "../../../../shared/failure/failure.codes.enum";
import { SimpleFailure } from "../../../../shared/failure/simple.failure.type";
import { Validate } from "../../../../shared/validator/validate";

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
      });
      TechnicalError.if(
        isNull(data.bookingUID),
        FailureCode.INVALID_HYDRATE_DATA,
        {
          field: "bookingData.bookingUID",
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
    const failures: SimpleFailure[] = [];

    Validate.object(startTime)
      .field("startTime")
      .failures(failures)
      .isRequired();
    Validate.object(endTime).field("endTime").failures(failures).isRequired();
    Validate.string(type)
      .field("type")
      .failures(failures)
      .isRequired()
      .when(type === BookingType.SCREENING, () => {
        Validate.object(screeningUID)
          .field("screeningUID")
          .failures(failures)
          .isRequired();
      });

    if (failures.length > 0) return failure(failures);

    if (!this.isAvailable(startTime, endTime, failures))
      return failure(failures);

    const bookingSlotResult = BookingSlot.create(
      screeningUID,
      startTime,
      endTime,
      type,
    );

    if (bookingSlotResult.invalid) return failure(bookingSlotResult.failures);

    const newBookings = [...this.bookings, bookingSlotResult.value].sort(
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
    if (isNull(bookingUID))
      return failure({
        code: FailureCode.MISSING_REQUIRED_DATA,
        details: {
          field: "bookingUID",
        },
      });

    const initialLength = this.bookings.length;
    const updatedBookings = this.bookings.filter(
      (booking) => !(booking.bookingUID === bookingUID),
    );

    return updatedBookings.length === initialLength
      ? failure({
          code: FailureCode.BOOKING_NOT_FOUND,
          details: { bookingUID: bookingUID },
        })
      : success(new RoomSchedule(updatedBookings));
  }

  /**
   * Retorna uma nova instância de RoomSchedule sem o BookingSlot correspondente à exibição.
   *
   * Remove um agendamento específico com base no identificador único da exibição.
   * Este método é útil quando uma exibição é cancelada e precisa ser removida da agenda.
   * Se nenhum agendamento for encontrado para a exibição, retorna uma falha.
   *
   * @param screeningUID Identificador único da exibição a ser removida
   * @returns Result com a nova instância de RoomSchedule ou falha (BOOKING_NOT_FOUND_FOR_SCREENING)
   */
  public removeScreening(screeningUID: ScreeningUID): Result<RoomSchedule> {
    if (isNull(screeningUID))
      return failure({
        code: FailureCode.MISSING_REQUIRED_DATA,
        details: {
          field: "screeningUID",
        },
      });

    const initialLength = this.bookings.length;

    const updatedBookings = this.bookings.filter(
      (booking) =>
        booking.screeningUID === null ||
        !booking.screeningUID.equal(screeningUID),
    );

    return updatedBookings.length === initialLength
      ? failure({
          code: FailureCode.BOOKING_NOT_FOUND_FOR_SCREENING,
          details: { screeningUID: screeningUID },
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
   *
   * Localiza um agendamento específico com base em seu identificador único e
   * retorna sua representação serializada.
   *
   * @param bookingUIDToFind Identificador único do agendamento a ser encontrado
   * @returns Dados brutos da reserva (IRoomBookingData) ou undefined se não encontrada
   */
  public findBookingDataByUID(
    bookingUIDToFind: string,
  ): IRoomBookingData | undefined {
    const foundBooking = this.bookings.find(
      (booking) => booking.bookingUID === bookingUIDToFind,
    );

    return foundBooking
      ? {
          bookingUID: foundBooking.bookingUID,
          screeningUID: foundBooking.screeningUID?.value || null,
          startTime: foundBooking.startTime,
          endTime: foundBooking.endTime,
          type: foundBooking.type,
        }
      : undefined;
  }

  /**
   * Busca um BookingSlot específico pelo UID da exibição e retorna seus dados brutos.
   *
   * Localiza um agendamento específico com base no identificador único da exibição e
   * retorna sua representação serializada. Útil para encontrar detalhes de uma
   * exibição específica na agenda da sala.
   *
   * @param screeningUIDToFind Identificador único da exibição a ser encontrada
   * @returns Dados brutos da reserva (IRoomBookingData) ou undefined se não encontrada
   */
  public findScreeningData(
    screeningUIDToFind: ScreeningUID,
  ): IRoomBookingData | undefined {
    const foundBooking = this.bookings.find(
      (booking) =>
        booking.screeningUID !== null &&
        booking.screeningUID.equal(screeningUIDToFind),
    );

    return foundBooking
      ? {
          bookingUID: foundBooking.bookingUID,
          screeningUID: foundBooking.screeningUID?.value || null,
          startTime: foundBooking.startTime,
          endTime: foundBooking.endTime,
          type: foundBooking.type,
        }
      : undefined;
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

    // Definir horários de início e fim do dia
    const dayStart = new Date(date);
    dayStart.setHours(RoomSchedule.DEFAULT_OPERATING_START_HOUR, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(RoomSchedule.DEFAULT_OPERATING_END_HOUR, 0, 0, 0);

    // Obter agendamentos do dia e criar intervalos ocupados
    const filteredBookings = this.filterBookingsByDate(date);
    const busyIntervals = this.createBusyIntervals(
      filteredBookings,
      dayStart,
      dayEnd,
    );
    const mergedIntervals = this.mergeOverlappingIntervals(busyIntervals);

    // Encontrar slots livres entre os intervalos ocupados
    return this.findFreeSlots(mergedIntervals, dayStart, dayEnd, minMinutes);
  }

  /**
   * Ajusta um horário para o próximo intervalo permitido de 5 minutos.
   * @param date Data a ser ajustada
   * @returns Nova data ajustada para o próximo intervalo de 5 minutos
   */
  private getNextAllowedTime(date: Date): Date {
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
  private getPreviousAllowedTime(date: Date): Date {
    const adjusted = new Date(date.getTime());
    const minutes = adjusted.getMinutes();
    adjusted.setMinutes(minutes - (minutes % 5), 0, 0);
    return adjusted;
  }

  /**
   * Filtra os agendamentos que ocorrem na data especificada.
   * @param date Data de referência
   * @returns Array de BookingSlot que ocorrem na data especificada
   */
  private filterBookingsByDate(date: Date): BookingSlot[] {
    const inputDate = new Date(date);
    inputDate.setHours(0, 0, 0, 0);

    return this.bookings.filter((booking) => {
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
  private createBusyIntervals(
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
  private mergeOverlappingIntervals(
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
  private findFreeSlots(
    mergedIntervals: Array<{ start: Date; end: Date }>,
    dayStart: Date,
    dayEnd: Date,
    minMinutes: number,
  ): Array<{ startTime: Date; endTime: Date }> {
    const freeSlots: { startTime: Date; endTime: Date }[] = [];
    let previousEnd = dayStart;

    // Verificar lacunas entre os intervalos ocupados
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

    // Verificar lacuna após o último intervalo até o fim do dia
    if (previousEnd < dayEnd) {
      this.addFreeSlotIfValid(previousEnd, dayEnd, minMinutes, freeSlots);
    }

    return freeSlots;
  }

  /**
   * Adiciona um slot livre se atender à duração mínima requerida.
   * @param gapStart Início do intervalo livre
   * @param gapEnd Fim do intervalo livre
   * @param minMinutes Duração mínima em minutos
   * @param freeSlots Array de slots livres para adicionar o novo slot
   */
  private addFreeSlotIfValid(
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
