import { failure, Result, success } from "../../../shared/result/result";
import { SimpleFailure } from "../../../shared/failure/simple.failure.type";
import { Screen } from "./value-object/screen";
import { Validate } from "../../../shared/validator/validate";
import { isNull } from "../../../shared/validator/validator";
import { TechnicalError } from "../../../shared/error/technical.error";
import { FailureCode } from "../../../shared/failure/failure.codes.enum";
import { RoomUID } from "./value-object/room.uid";
import { RoomIdentifier } from "./value-object/room.identifier";
import { SeatLayout } from "./value-object/seat.layout";
import { SeatRow } from "./value-object/seat.row";

/**
 * Interface que define os parâmetros necessários para criar uma sala de cinema.
 *
 * @property identifier - Número identificador da sala
 * @property seatConfig - Configuração dos assentos da sala
 * @property screen - Configuração da tela de projeção
 * @property status - Status inicial da sala
 */
export interface ICreateRoomInput {
  identifier: number;
  seatConfig: ISeatRowConfiguration[];
  screen: ICreateScreenInput;
  status: string;
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
  roomUID: string;
  identifier: number;
  layout: {
    seatRows: Array<ISeatRowConfiguration>;
  };
  screen: {
    size: number;
    type: string;
  };
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
  rowNumber: number;
  /** A letra da última coluna, ou seja, o último assento desta linha
   * exemplo: ao passarmos uma letra 'D', consideramos que os assentos são de A até D
   */
  lastColumnLetter: string;
  /** Letras dos assentos preferenciais nesta linha (ex: ['A', 'B']) */
  preferentialSeatLetters?: string[];
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
 * Esta classe implementa o padrão de Value Object para garantir a imutabilidade
 * e encapsular as regras de validação específicas para salas de cinema. Uma sala é
 * caracterizada por seu identificador único, número da sala, layout de assentos,
 * tela de projeção e status atual.
 *
 * A classe é imutável. Qualquer atualização resulta em uma nova instância.
 */
export class Room {
  /**
   * Construtor privado para garantir que instâncias sejam criadas apenas através dos métodos factory.
   *
   * @param roomUID Identificador único da sala
   * @param identifier Número da sala
   * @param layout Layout dos assentos da sala
   * @param screen Objeto Screen representando a tela da sala
   * @param status Status atual da sala
   */
  private constructor(
    public readonly roomUID: RoomUID,
    public readonly identifier: RoomIdentifier,
    public readonly layout: SeatLayout,
    public readonly screen: Screen,
    public readonly status: RoomStatus,
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
    const validationFailures: SimpleFailure[] = [];

    Validate.object(params)
      .field("params")
      .failures(validationFailures)
      .isRequired()
      .hasProperty("identifier")
      .hasProperty("status")
      .hasProperty("screen")
      .hasProperty("seatConfig");

    if (validationFailures.length > 0) return failure(validationFailures);

    Validate.string(params.status)
      .field("status")
      .failures(validationFailures)
      .isRequired()
      .isInEnum(RoomStatus);

    const identifierResult = RoomIdentifier.create(params.identifier);
    if (identifierResult.invalid)
      validationFailures.push(...identifierResult.failures);

    const screenResult = Screen.create(params.screen.size, params.screen.type);
    if (screenResult.invalid) validationFailures.push(...screenResult.failures);

    const layoutResult = SeatLayout.create(params.seatConfig);
    if (layoutResult.invalid) validationFailures.push(...layoutResult.failures);

    return validationFailures.length > 0
      ? failure(validationFailures)
      : success(
          new Room(
            RoomUID.create(),
            identifierResult.value,
            layoutResult.value,
            screenResult.value,
            params.status as RoomStatus,
          ),
        );
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
    TechnicalError.if(isNull(params), FailureCode.INVALID_HYDRATE_DATA, {
      field: "params",
    });

    TechnicalError.if(isNull(params.status), FailureCode.INVALID_HYDRATE_DATA, {
      field: "status",
    });

    const seatRowsMap = new Map<number, SeatRow>();
    params.layout.seatRows.forEach((rowData) => {
      const seatRow = SeatRow.hydrate(
        rowData.lastColumnLetter,
        rowData.preferentialSeatLetters,
      );
      seatRowsMap.set(rowData.rowNumber, seatRow);
    });

    return new Room(
      RoomUID.hydrate(params.roomUID),
      RoomIdentifier.hydrate(params.identifier),
      SeatLayout.hydrate(seatRowsMap),
      Screen.hydrate(params.screen.size, params.screen.type),
      params.status as RoomStatus,
    );
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
    const validationFailures: SimpleFailure[] = [];
    const statusUpper = status?.toUpperCase().trim();

    Validate.string(statusUpper)
      .field("status")
      .failures(validationFailures)
      .isRequired()
      .isInEnum(RoomStatus);

    if (validationFailures.length > 0) return failure(validationFailures);

    return this.status === statusUpper
      ? success(this)
      : success(
          new Room(
            this.roomUID,
            this.identifier,
            this.layout,
            this.screen,
            statusUpper as RoomStatus,
          ),
        );
  }
}
