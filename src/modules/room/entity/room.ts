import { failure, Result, success } from "../../../shared/result/result";
import { SimpleFailure } from "../../../shared/failure/simple.failure.type";
import { Screen } from "./value-object/screen";
import { Validate } from "../../../shared/validator/validate";
import { Seat } from "./value-object/seat";
import { isNull } from "../../../shared/validator/validator";
import { TechnicalError } from "../../../shared/error/technical.error";
import { FailureCode } from "../../../shared/failure/failure.codes.enum";
import { RoomUID } from "./value-object/room.uid";
import { RoomIdentifier } from "./value-object/room.identifier";

export interface ICreateRoomInput {
  id: number;
  seatConfig: ISeatRowConfiguration[];
  screen: ICreateScreenInput;
  status: string;
}

export interface IHydrateRoomInput {
  roomUID: string;
  id: number;
  rows: number;
  columns: string[];
  preferentialSeats: string[];
  capacity: number;
  screen: ICreateScreenInput;
  status: string;
}

/**
 * Interface para os dados necessários para criar uma tela de cinema.
 */
export interface ICreateScreenInput {
  /** Tamanho da tela em metros */
  size: number;
  /** Tipo da tela (2D, 3D, 2D_3D) */
  type: string;
}

/**
 * Configuração para criação de assentos em uma sala.
 * Especifica quantas colunas existem em cada linha.
 */
export interface ISeatRowConfiguration {
  /** Identificador da linha (ex: '1', '2', '3') */
  rowId: number;
  /** Colunas disponíveis nesta linha (ex: 'ABC' para colunas A, B e C) */
  columns: string;
  /** Assentos preferenciais nesta linha (identificadores como 'A1', 'B1', etc.) */
  preferentialSeats?: string[];
}

/**
 * Define os possíveis estados de uma sala.
 */
export enum RoomStatus {
  /** Sala disponível para agendamento de sessões */
  AVAILABLE = "AVAILABLE",
  /** Sala reservada para um evento específico */
  RESERVED = "RESERVED",
  /** Sala fechada para uso */
  CLOSED = "CLOSED",
  /** Sala em manutenção */
  MAINTENANCE = "MAINTENANCE",
  /** Sala em processo de limpeza */
  CLEANING = "CLEANING",
}

/**
 * Representa uma sala de cinema com seus dados físicos.
 *
 * Uma sala é caracterizada por seu identificador, configuração de assentos, capacidade,
 * tela de projeção e status atual.
 */
export class Room {
  private static MIN_COLUMNS_PER_ROW = 4;
  private static MAX_COLUMNS_PER_ROW = 20;

  /**
   * Construtor privado para garantir que instâncias sejam criadas apenas através dos métodos factory.
   *
   * @param roomUID Identificador único da sala
   * @param identifier Número da sala
   * @param rows Número de fileiras de assentos
   * @param columns Array com as colunas disponíveis em cada fileira
   * @param preferentialSeats Lista de identificadores de assentos preferenciais
   * @param capacity Capacidade total da sala (número de assentos)
   * @param screen Objeto Screen representando a tela da sala
   * @param status Status atual da sala
   */
  private constructor(
    public readonly roomUID: RoomUID,
    public readonly identifier: RoomIdentifier,
    public readonly rows: number,
    public readonly columns: string[],
    public readonly preferentialSeats: string[],
    public readonly capacity: number,
    public readonly screen: Screen,
    public readonly status: RoomStatus,
  ) {}

  public static create(params: ICreateRoomInput): Result<Room> {
    const failures: SimpleFailure[] = [];

    Validate.object(params)
      .field("params")
      .failures(failures)
      .isRequired()
      .property("id", () => {})
      .continue()
      .property("status", () => {
        Validate.string(params.status)
          .field("status")
          .failures(failures)
          .isRequired()
          .isInEnum(RoomStatus);
      })
      .continue()
      .property("seatConfig", () => {
        Validate.object(params.seatConfig)
          .field("seatsConfig")
          .failures(failures)
          .isRequired()
          .isNotEmpty();
      })
      .continue()
      .property("screen", () => {
        Validate.object(params.screen)
          .field("screen")
          .failures(failures)
          .property("size", () => {})
          .property("type", () => {});
      });
    if (failures.length > 0) return failure(failures);

    const identifierResult = RoomIdentifier.create(params.id);
    if (identifierResult.invalid) failures.push(...identifierResult.failures);

    const screenResult = Screen.create(params.screen.size, params.screen.type);
    if (screenResult.invalid) failures.push(...screenResult.failures);

    const rows = params.seatConfig.length;
    const columns = params.seatConfig.map((row) => row.columns);

    let capacity = 0;
    const preferentialSeats: string[] = [];

    for (const row of params.seatConfig) {
      Validate.string(row.columns)
        .field("row")
        .failures(failures)
        .isRequired() // Uma fileira deve possuir uma quantidade mínima de fileiras
        .hasLengthBetween(
          Room.MIN_COLUMNS_PER_ROW,
          Room.MAX_COLUMNS_PER_ROW,
          FailureCode.INSUFFICIENT_CINEMA_SEATS_IN_ROW,
        );

      capacity += row.columns.length;
      if (row.preferentialSeats && row.preferentialSeats.length > 0)
        preferentialSeats.push(...row.preferentialSeats);
    }

    if (failures.length > 0) return failure(failures);

    return success(
      new Room(
        RoomUID.create(),
        identifierResult.value,
        rows,
        columns,
        preferentialSeats,
        capacity,
        screenResult.value,
        params.status as RoomStatus,
      ),
    );
  }

  public static hydrate(params: IHydrateRoomInput): Room {
    TechnicalError.if(isNull(params), FailureCode.MISSING_REQUIRED_DATA, {
      field: "params",
    });

    const fields: string[] = [];

    if (isNull(params.id)) fields.push("id");
    if (isNull(params.rows)) fields.push("rows");
    if (isNull(params.columns)) fields.push("columns");
    if (isNull(params.preferentialSeats)) fields.push("preferentialSeats");
    if (isNull(params.capacity)) fields.push("capacity");
    if (isNull(params.status)) fields.push("status");

    TechnicalError.if(fields.length > 0, FailureCode.MISSING_REQUIRED_DATA, {
      fields: fields,
    });

    return new Room(
      RoomUID.hydrate(params.roomUID),
      RoomIdentifier.hydrate(params.id),
      params.rows,
      params.columns,
      params.preferentialSeats,
      params.capacity,
      Screen.hydrate(params.screen.size, params.screen.type),
      params.status as RoomStatus,
    );
  }

  /**
   * Obtém um assento específico com base na coluna e fileira.
   *
   * Este método realiza as seguintes validações:
   * - Fileira: deve existir na sala
   * - Coluna: deve existir na fileira especificada
   *
   * @param column Letra da coluna (ex: 'A', 'B')
   * @param row Número da fileira
   * @returns Result<Seat> contendo o assento ou uma lista de falhas de validação
   */
  public getSeat(column: string, row: number): Result<Seat> {
    const failures: SimpleFailure[] = [];

    Validate.number(row)
      .field("row")
      .failures(failures)
      .isRequired()
      .isInteger()
      .isInRange(1, this.rows, FailureCode.INVALID_SEAT_ROW);

    if (failures.length > 0) return failure(failures);

    const columnUpper = column.toUpperCase().trim();
    const availableColumns = this.columns[row - 1];

    if (!availableColumns.includes(columnUpper)) {
      return failure({
        code: FailureCode.INVALID_SEAT_COLUMN, // "A coluna solicitada não existe nesta fileira"
        details: {
          providedColumn: columnUpper,
          availableColumns: availableColumns,
        },
      });
    }

    const seatId = `${columnUpper}${row}`;
    const isPreferential = this.preferentialSeats.includes(seatId);

    return Seat.create(columnUpper, row, isPreferential);
  }

  /**
   * Obtém todos os assentos da sala como objetos Seat.
   *
   * Este método cria objetos Seat para cada posição válida na sala,
   * organizados em uma matriz bidimensional onde o primeiro índice
   * representa a fileira e o segundo índice representa a coluna.
   *
   * @returns Matriz bidimensional de objetos Seat
   */
  public getAllSeats(): Seat[][] {
    const seats: Seat[][] = [];

    for (let row = 1; row <= this.rows; row++) {
      const rowSeats: Seat[] = [];
      const availableColumns = this.columns[row - 1];

      for (const column of availableColumns) {
        const seatId = `${column}${row}`;
        const isPreferential = this.preferentialSeats.includes(seatId);
        const seatResult = Seat.create(column, row, isPreferential);

        if (!seatResult.invalid) {
          rowSeats.push(seatResult.value);
        }
      }
      seats.push(rowSeats);
    }

    return seats;
  }

  /**
   * Altera o status da sala.
   *
   * Este método valida o novo status e cria uma nova instância da sala
   * com o status atualizado, mantendo a imutabilidade do objeto.
   *
   * @param status Novo status da sala
   * @returns Result<Room> contendo a sala atualizada ou uma lista de falhas de validação
   */
  public changeStatus(status: string): Result<Room> {
    const failures: SimpleFailure[] = [];
    const statusUpper = status?.toUpperCase().trim();

    Validate.string(statusUpper)
      .field("status")
      .failures(failures)
      .isRequired()
      .isInEnum(RoomStatus);

    if (failures.length > 0) return failure(failures);

    return this.status === statusUpper
      ? success(this)
      : success(
          new Room(
            this.roomUID,
            this.identifier,
            this.rows,
            this.columns,
            this.preferentialSeats,
            this.capacity,
            this.screen,
            status as RoomStatus,
          ),
        );
  }

  /**
   * Verifica se um assento específico é preferencial.
   *
   * @param column Letra da coluna (ex: 'A', 'B')
   * @param row Número da fileira
   * @returns true se o assento for preferencial, false caso contrário
   */
  public isPreferentialSeat(column: string, row: number): boolean {
    const seatId = `${column.toUpperCase().trim()}${row}`;
    return this.preferentialSeats.includes(seatId);
  }
}
