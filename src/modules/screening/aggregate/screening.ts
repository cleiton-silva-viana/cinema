import { failure, Result, success } from "../../../shared/result/result";
import { ScreeningUID } from "./value-object/screening.uid";
import { MovieUID } from "../../movie/entity/value-object/movie.uid";
import { RoomUID } from "../../room/entity/value-object/room.uid";
import { FailureCode } from "../../../shared/failure/failure.codes.enum";
import { TechnicalError } from "../../../shared/error/technical.error";
import { SeatLayout } from "../../room/entity/value-object/seat.layout";
import {
  collectNullFields,
  ensureNotNull,
} from "../../../shared/validator/common.validators";
import { TicketUID } from "../../ticket/aggregate/value-object/ticket.uid";
import {
  DisplayPeriod,
  ScreeningStatus,
} from "../../movie/entity/value-object/display.period";
import { SeatRow } from "../../room/entity/value-object/seat.row";
import { isNull } from "../../../shared/validator/validator";

/** Define os possíveis estados de uma sessão de exibição. */
export enum ScreeningAdministrativeStatus {
  /** Agendada normalmente. */
  SCHEDULED = "SCHEDULED",

  /** Cancelada (não ocorrerá). */
  CANCELLED = "CANCELLED",
}

/** Define os possíveis estados de exibição baseados no tempo. */
export enum ScreeningTimeStatus {
  /** Agendada, ainda não iniciada. */
  SCHEDULED = "SCHEDULED",

  /** Em andamento (já iniciada, mas não finalizada). */
  IN_PROGRESS = "IN_PROGRESS",

  /** Concluída (tempo de término já passou). */
  FINALIZED = "FINALIZED",
}

/**
 * @param movieUID UID do filme a ser exibido.
 * @param roomUID UID da sala onde ocorrerá a exibição.
 * @param displayPeriod Período de exibição do filme nesta sessão (datas de início e fim).
 * @param layout Layout dos assentos da sala para esta exibição.
 * */
export interface ICreateScreeningInput {
  movieUID: MovieUID;
  roomUID: RoomUID;
  displayPeriod: DisplayPeriod;
  layout: SeatLayout;
}

/**
 * @param uid UID da exibição.
 * @param movieUID UID do filme.
 * @param roomUID UID da sala.
 * @param administrativeStatus Status administrativo da exibição (ex: "SCHEDULED", "CANCELLED").
 * @param bookedSeatsObj Objeto com assentos reservados, onde a chave é a identificação do assento (ex: "1A") e o valor é o UID do ticket.
 * @param layout Array com os dados de configuração de cada fileira de assentos.
 * @param startsIn Data e hora do início da exibição.
 * @param endsIn Data e hora do fim da exibição.
 * */
export interface IHydrateScreeningInput {
  uid: string;
  movieUID: string;
  roomUID: string;
  administrativeStatus: string;
  bookedSeatsObj: Record<string, string>;
  layout: {
    rowNumber: number;
    lastLetterColumn: string;
    preferentialSeats: string[];
  }[];
  startsIn: Date;
  endsIn: Date;
}

/**
 * Representa uma exibição, agregando o ShowTime e a Room.
 */
export class Screening {
  /**
   * Construtor da classe Screening.
   * @param uid Identificador único da exibição.
   * @param movieUID Identificador único do filme.
   * @param roomUID Identificador único da sala.
   * @param _administrativeStatus Status administrativo da exibição (ex: AGENDADA, CANCELADA).
   * @param _displayPeriod Período de exibição (datas de início e fim).
   * @param _bookedSeats Mapa dos assentos reservados, com a posição do assento como chave e o UID do ticket como valor.
   * @param _layout Layout dos assentos da sala para esta exibição.
   */
  constructor(
    public readonly uid: ScreeningUID,
    public readonly movieUID: MovieUID,
    public readonly roomUID: RoomUID,
    private readonly _administrativeStatus: ScreeningAdministrativeStatus,
    private readonly _displayPeriod: DisplayPeriod,
    private readonly _bookedSeats: Map<string, TicketUID>,
    private readonly _layout: SeatLayout,
  ) {}

  /**
   * Cria uma nova instância de Screening.
   *
   * @returns Result<Screening> Nova instância de Screening ou falhas
   */
  public static create(input: ICreateScreeningInput): Result<Screening> {
    const movieUID = input?.movieUID;
    const roomUID = input?.roomUID;
    const displayPeriod = input?.displayPeriod;
    const layout = input?.layout;

    const failures = ensureNotNull({
      input,
      movieUID,
      roomUID,
      displayPeriod,
      layout,
    });

    return failures.length > 0
      ? failure(failures)
      : success(
          new Screening(
            ScreeningUID.create(),
            input.movieUID,
            input.roomUID,
            ScreeningAdministrativeStatus.SCHEDULED,
            input.displayPeriod,
            new Map(),
            input.layout,
          ),
        );
  }

  /**
   * Hidrata uma instância de Screening a partir de dados primitivos.
   *
   * @returns Screening Instância hidratada de Screening
   */
  public static hydrate(input: IHydrateScreeningInput): Screening {
    TechnicalError.if(isNull(input), FailureCode.MISSING_REQUIRED_DATA, {
      field: "input",
    });

    const uid = input.uid;
    const movieUID = input.movieUID;
    const roomUID = input.roomUID;
    const layout = input.layout;
    const endsIn = input.endsIn;
    const startsIn = input.startsIn;
    const bookedSeatsObj = input.bookedSeatsObj;
    const administrativeStatus = input.administrativeStatus;

    const fields: string[] = collectNullFields({
      uid,
      movieUID,
      roomUID,
      administrativeStatus,
      bookedSeatsObj,
      layout,
      startsIn,
      endsIn,
    });

    TechnicalError.if(fields.length > 0, FailureCode.MISSING_REQUIRED_DATA, {
      fields: fields,
    });

    const bookedSeatsMap = new Map<string, TicketUID>();
    Object.entries(bookedSeatsObj).forEach(([seatId, ticketUIDValue]) => {
      bookedSeatsMap.set(seatId, TicketUID.hydrate(ticketUIDValue));
    });

    const layoutMap: Map<number, SeatRow> = new Map();
    layout.forEach((row) => {
      layoutMap.set(
        row.rowNumber,
        SeatRow.hydrate(row.lastLetterColumn, row.preferentialSeats),
      );
    });

    return new Screening(
      ScreeningUID.hydrate(uid),
      MovieUID.hydrate(movieUID),
      RoomUID.hydrate(roomUID),
      administrativeStatus as ScreeningAdministrativeStatus,
      DisplayPeriod.hydrate(startsIn, endsIn),
      bookedSeatsMap,
      SeatLayout.hydrate(layoutMap),
    );
  }

  /**
   * Retorna o status combinado da exibição.
   * Prioriza o status administrativo se for CANCELLED.
   * Caso contrário, retorna o status temporal (SCHEDULED, IN_PROGRESS, FINALIZED).
   */
  get status(): ScreeningAdministrativeStatus | ScreeningTimeStatus {
    if (this._administrativeStatus === ScreeningAdministrativeStatus.CANCELLED)
      return this._administrativeStatus;

    switch (this._displayPeriod.screeningStatus) {
      case ScreeningStatus.ENDED:
        return ScreeningTimeStatus.FINALIZED;
      case ScreeningStatus.SHOWING:
        return ScreeningTimeStatus.IN_PROGRESS;
      case ScreeningStatus.PRESALE:
        return ScreeningTimeStatus.SCHEDULED;
    }
  }

  /**
   * Retorna o status administrativo atual da exibição.
   */
  get administrativeStatus(): ScreeningAdministrativeStatus {
    return this._administrativeStatus;
  }

  /**
   * Retorna todos os assentos reservados.
   * @returns Array<string> Array com as posições dos assentos reservados
   */
  get bookedSeats(): string[] {
    return Array.from(this._bookedSeats.keys());
  }

  /**
   * Retorna a data de início da exibição.
   */
  get startDate(): Date {
    return this._displayPeriod.startDate;
  }

  /**
   * Retorna a data de término da exibição.
   */
  get endDate(): Date {
    return this._displayPeriod.endDate;
  }

  /**
   * Cancela a exibição, alterando seu status administrativo para CANCELLED.
   * Só pode ser cancelada se estiver no status SCHEDULED (agendada).
   * @returns Result<Screening> Nova instância com status CANCELLED ou falhas.
   */
  public cancel(): Result<Screening> {
    const actualStatus = this.status;
    if (actualStatus !== ScreeningTimeStatus.SCHEDULED)
      return failure({
        code: FailureCode.SCREENING_CANNOT_CANCEL_ACTIVE_OR_FINALIZED,
        details: {
          actualStatus,
        },
      });

    return success(
      new Screening(
        this.uid,
        this.movieUID,
        this.roomUID,
        ScreeningAdministrativeStatus.CANCELLED,
        this._displayPeriod,
        this._bookedSeats,
        this._layout,
      ),
    );
  }

  /**
   * Verifica se um assento está disponível.
   * @param row A fileira da poltrona
   * @param letter A letra da poltrona
   * @returns Result<boolean> Resultado indicando se o assento está disponível ou falhas
   */
  public isSeatAvailable(row: number, letter: string): Result<boolean> {
    const failures = ensureNotNull({ row, letter });
    if (failures.length > 0) return failure(failures);

    if (!this._layout.hasSeat(row, letter)) {
      return failure({
        code: FailureCode.SEAT_DOES_NOT_EXIST,
        details: {
          screeningUID: this.uid.value,
          seatPosition: `${row}${letter.toUpperCase()}`,
        },
      });
    }

    // Verificar se o assento está reservado
    return success(!this._bookedSeats.has(row + letter));
  }

  /**
   * Reserva um assento para um cliente.
   * @param row Fileira onde a poltrona encontra-se
   * @param letter Letra da poltrona
   * @param ticketUID Uid do ticket da poltrona
   * @returns Result<Screening> Nova instância com o assento reservado ou falhas
   */
  public bookSeat(
    row: number,
    letter: string,
    ticketUID: TicketUID,
  ): Result<Screening> {
    const failures = ensureNotNull({ row, letter, ticketUID });
    if (failures.length > 0) return failure(failures);

    // Verificar se a exibição está disponível para reservas
    const actualStatus = this.status;
    if (actualStatus !== ScreeningTimeStatus.SCHEDULED)
      return failure({
        code: FailureCode.SCREENING_NOT_AVAILABLE_FOR_BOOKING,
        details: {
          screeningUID: this.uid.value,
          status: actualStatus,
        },
      });

    // Verificar se o assento já está reservado
    const isAvailableResult = this.isSeatAvailable(row, letter);
    if (isAvailableResult.invalid) return failure(isAvailableResult.failures);

    if (!isAvailableResult.value)
      return failure({
        code: FailureCode.SEAT_ALREADY_BOOKED,
        details: {
          screeningUID: this.uid.value,
          seat: {
            row: row,
            letter: letter,
          },
        },
      });

    // Criar nova instância com o assento reservado
    const newBookedSeats = new Map(this._bookedSeats);
    newBookedSeats.set(row + letter, ticketUID);

    return success(
      new Screening(
        this.uid,
        this.movieUID,
        this.roomUID,
        this.administrativeStatus,
        this._displayPeriod,
        newBookedSeats,
        this._layout,
      ),
    );
  }

  /**
   * Cancela a reserva de um assento.
   * @param row Fileira onde a poltrona encontra-se
   * @param letter Letra da poltrona
   * @returns Result<Screening> Nova instância com a reserva cancelada ou falhas
   */
  public cancelSeatBooking(row: number, letter: string): Result<Screening> {
    const failures = ensureNotNull({ row, letter });
    if (failures.length > 0) return failure(failures);

    const actualStatus = this.status;
    if (actualStatus !== ScreeningTimeStatus.SCHEDULED)
      return failure({
        code: FailureCode.SCREENING_NOT_AVAILABLE_FOR_BOOKING_CANCELLATION,
        details: {
          screeningUID: this.uid.value,
          status: actualStatus,
        },
      });

    const seatID = row + letter.toUpperCase();
    const seatExists = this._layout.hasSeat(row, letter);
    if (!seatExists)
      return failure({
        code: FailureCode.SEAT_DOES_NOT_EXIST,
        details: {
          screeningUID: this.uid.value,
          seatPosition: seatID,
        },
      });

    const seatIsBooked = this._bookedSeats.has(seatID);
    if (!seatIsBooked)
      return failure({
        code: FailureCode.SEAT_NOT_BOOKED,
        details: {
          screeningUID: this.uid.value,
          seatPosition: seatID,
        },
      });

    const newBookedSeats = new Map(this._bookedSeats);
    newBookedSeats.delete(seatID);

    return success(
      new Screening(
        this.uid,
        this.movieUID,
        this.roomUID,
        this.administrativeStatus,
        this._displayPeriod,
        newBookedSeats,
        this._layout,
      ),
    );
  }
}
