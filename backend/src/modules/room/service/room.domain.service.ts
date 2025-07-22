import { IRoomRepository } from "../repository/room.repository.interface";
import { ICreateScreenInput, ISeatRowConfiguration, Room} from "../entity/room";
import { Inject, Injectable } from "@nestjs/common";
import { ROOM_REPOSITORY } from "../constant/room.constant";
import { FailureCode } from "../../../shared/failure/failure.codes.enum";
import { failure, Result, success } from "../../../shared/result/result";
import { isNull } from "../../../shared/validator/validator";
import { IRoomDomainService } from "./room.domain.service.interface";
import { BookingSlot, BookingType } from "../entity/value-object/booking.slot";
import { ensureNotNull } from "../../../shared/validator/common.validators";
import { ResourceTypes } from "../../../shared/constant/resource.types";

/**
 * Serviço de Domínio responsável por gerenciar a lógica de negócio e validações
 * relacionadas às salas de cinema.
 *
 * Este serviço foca em validar operações e retornar o estado resultante da entidade,
 * mas NÃO realiza operações de escrita (persistência) no repositório.
 * As operações de escrita devem ser orquestradas pelo Application Service.
 */
@Injectable()
export class RoomDomainService implements IRoomDomainService {
  constructor(
    @Inject(ROOM_REPOSITORY) private readonly repository: IRoomRepository,
  ) {}

  /**
   * Busca uma sala pelo seu identificador único.
   *
   * @param id Identificador único da sala
   * @returns Result contendo a sala encontrada ou falha caso não exista
   */
  public async findById(id: number): Promise<Result<Room>> {
    const failures = ensureNotNull({ id })
    if (failures.length > 0) return failure(failures)

    const room = await this.repository.findById(id);

    return isNull(room)
      ? failure({
          code: FailureCode.RESOURCE_NOT_FOUND,
          details: {
            resource: ResourceTypes.ROOM,
            id,
          },
        })
      : success(room);
  }

  /**
   * Valida e cria uma nova instância de sala de cinema com base em uma configuração de layout.
   *
   * Este método valida os dados de entrada e retorna uma instância da entidade Room
   * se os dados forem válidos. Ele NÃO persiste a sala no repositório.
   *
   * @param id Identificador único da sala
   * @param seatConfig Configuração dos assentos da sala
   * @param screen Configuração da tela da sala
   * @param status Status inicial da sala (opcional)
   * @returns Result contendo a instância da sala criada ou falhas de validação
   */
  public async create(id: number, seatConfig: ISeatRowConfiguration[], screen: ICreateScreenInput, status?: string): Promise<Result<Room>> {
    const roomExists = await this.repository.roomExists(id);
    if (roomExists)
      return failure({
        code: FailureCode.RESOURCE_ALREADY_EXISTS, // criar codigo de erro...
        details: { id },
      });

    return Room.create({
      seatConfig: seatConfig,
      screen: screen,
      identifier: id,
      status: status,
    });
  }

  /**
   * Método genérico para validar o agendamento de atividades em uma sala.
   *
   * Este método valida os parâmetros e a disponibilidade da sala para o período
   * e retorna o BookingSlot criado se a operação for válida.
   * Ele NÃO persiste o agendamento no repositório.
   *
   * @param roomId Identificador único da sala
   * @param activityType Tipo de atividade (MAINTENANCE ou CLEANING)
   * @param startIn Data de início da atividade
   * @param duration Duração da atividade em minutos
   * @returns Result contendo o BookingSlot criado ou falhas de validação
   */
  public async scheduleActivity(roomId: number, activityType: string, startIn: Date, duration: number): Promise<Result<Room>> {
    const failures = ensureNotNull({ roomId, activityType, startIn, duration })
    if (failures.length > 0) return failure(failures)

    const now = new Date();
    if (startIn < now)
      return failure({
        code: FailureCode.DATE_CANNOT_BE_PAST,
        details: {
          field: 'startIn'
        },
      });

    const findRoomResult = await this.findById(roomId);
    if (findRoomResult.isInvalid()) return findRoomResult;

    const room = findRoomResult.value;
    let result: Result<Room>;

    switch (activityType.toUpperCase()) {
      case BookingType.CLEANING:
        result = room.scheduleCleaning(startIn, duration);
        break;
      case BookingType.MAINTENANCE:
        result = room.scheduleMaintenance(startIn, duration);
        break;
      case BookingType.EXIT_TIME:
      case BookingType.ENTRY_TIME:
      case BookingType.SCREENING:
        return failure({
          code: FailureCode.BOOKING_TYPE_IS_INVALID_FOR_REMOVAL,
          details: {
            type: activityType,
          },
        });
      default:
        return failure({
          code: FailureCode.BOOKING_WITH_INVALID_ACTIVITY_TYPE,
          details: {
            type: activityType,
            allowed_types: [BookingType.MAINTENANCE, BookingType.CLEANING],
          },
        });
    }
    return result
  }

  /**
   * Valida a remoção de uma atividade agendada de uma sala.
   *
   * Este método valida se o agendamento pode ser removido (ex: tipo correto, não no passado)
   * e retorna `true` se a operação for válida. Ele NÃO remove o agendamento do repositório.
   *
   * @param roomId Identificador único da sala
   * @param bookingUID Identificador único do agendamento
   * @returns Result contendo `true` se a remoção for válida ou falhas de validação
   */
  public async removeScheduledActivity(roomId: number, bookingUID: string): Promise<Result<boolean>> {
    const failures = ensureNotNull({ roomId, bookingUID });
    if (failures.length > 0) return failure(failures)

    const findRoomResult = await this.findById(roomId);
    if (findRoomResult.isInvalid()) return findRoomResult;

    const booking = findRoomResult.value.findBookingDataByUID(bookingUID);

    if (!booking)
      return failure({
        code: FailureCode.BOOKING_NOT_FOUND_IN_FUTURE_SCHEDULE,
        details: {
          uuid: bookingUID,
        },
      });

    const now = new Date();
    if (booking.startTime <= now)
      return failure({ code: FailureCode.BOOKING_ALREADY_STARTED });

    if (booking.type !== BookingType.MAINTENANCE && booking.type !== BookingType.CLEANING)
      return failure({
        code: FailureCode.BOOKING_TYPE_IS_INVALID_FOR_REMOVAL,
        details: {
          type: booking.type,
          allowed_types: [BookingType.CLEANING, BookingType.MAINTENANCE],
        },
      });

    if (booking.type === BookingType.CLEANING && booking.screeningUID)
      return failure({ code: FailureCode.CLEANING_ASSOCIATED_WITH_SCREENING });

    return success(true);
  }
}
