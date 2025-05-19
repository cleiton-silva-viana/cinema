import { IRoomRepository } from "../repository/room.repository.interface";
import {
  ICreateScreenInput,
  ISeatRowConfiguration,
  Room,
  RoomAdministrativeStatus,
} from "../entity/room";
import { Inject, Injectable } from "@nestjs/common";
import { ROOM_REPOSITORY } from "../constant/room.constant";
import { FailureCode } from "../../../shared/failure/failure.codes.enum";
import { failure, Result, success } from "../../../shared/result/result";
import { isNull } from "../../../shared/validator/validator";
import { IRoomService } from "./room.service.interface";
import { BookingType } from "../entity/value-object/booking.slot";

/**
 * Serviço responsável por gerenciar operações relacionadas às salas de cinema.
 *
 * Este serviço implementa a lógica de negócio para criação, atualização,
 * busca e exclusão de salas, além de operações específicas como fechamento.
 */
@Injectable()
export class RoomService implements IRoomService {
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
    if (isNull(id))
      return failure({
        code: FailureCode.MISSING_REQUIRED_DATA,
        details: {
          field: "id",
        },
      });

    const room = await this.repository.findById(id);
    if (isNull(room))
      return failure({
        code: FailureCode.RESOURCE_NOT_FOUND,
        details: {
          id,
        },
      });

    return success(room);
  }

  /**
   * Cria uma nova sala de cinema com base em uma configuração de layout.
   *
   * @param id Identificador único da sala
   * @param seatConfig Configuração dos assentos da sala
   * @param screen Configuração da tela da sala
   * @param status Status inicial da sala (opcional)
   * @returns Result contendo a sala criada ou falhas de validação
   */
  public async create(
    id: number,
    seatConfig: ISeatRowConfiguration[],
    screen: ICreateScreenInput,
    status?: string,
  ): Promise<Result<Room>> {
    const roomExists = await this.repository.roomExists(id);
    if (roomExists)
      return failure({
        code: FailureCode.RESOURCE_ALREADY_EXISTS,
        details: { id },
      });

    const roomResult = Room.create({
      seatConfig: seatConfig,
      screen: screen,
      identifier: id,
      status: status,
    });
    if (roomResult.invalid) return roomResult;

    const room = await this.repository.create(roomResult.value);
    return success(room);
  }

  /**
   * Remove uma sala do sistema.
   *
   * @param id Identificador único da sala
   * @returns Result indicando sucesso ou falha na operação
   */
  public async delete(id: number): Promise<Result<null>> {
    const findResult = await this.findById(id);
    if (findResult.invalid) return failure(findResult.failures);

    await this.repository.delete(id);
    return success(null);
  }

  /**
   * Fecha uma sala, alterando seu status para CLOSED.
   *
   * Uma sala só pode ser fechada se não houver exibições futuras agendadas.
   *
   * @param id Identificador único da sala
   * @returns Result contendo a sala atualizada ou falhas de validação
   */
  public async closeRoom(id: number): Promise<Result<Room>> {
    const findResult = await this.findById(id);
    if (findResult.invalid) return failure(findResult.failures);
    const room = findResult.value;

    const changeStatusResult = room.changeStatus(
      RoomAdministrativeStatus.CLOSED,
    );
    if (changeStatusResult.invalid) return failure(changeStatusResult.failures);

    const updatedRoom = await this.repository.update(id, room); // passar um partial aqui, para salvarmos apena so novo status
    return success(updatedRoom);
  }

  /**
   * Agenda uma limpeza para uma sala.
   *
   * @param id Identificador único da sala
   * @param startIn Data de início da limpeza
   * @param duration Duração da limpeza em minutos
   * @returns Result contendo a sala atualizada ou falhas de validação
   */
  public async scheduleCleaning(
    id: number,
    startIn: Date,
    duration: number,
  ): Promise<Result<Room>> {
    return this.scheduleActivity(id, "CLEANING", startIn, duration);
  }

  /**
   * Agenda uma manutenção para uma sala.
   *
   * @param id Identificador único da sala
   * @param startIn Data de início da manutenção
   * @param duration Duração da manutenção em minutos
   * @returns Result contendo a sala atualizada ou falhas de validação
   */
  public async scheduleMaintenance(
    id: number,
    startIn: Date,
    duration: number,
  ): Promise<Result<Room>> {
    return this.scheduleActivity(id, "MAINTENANCE", startIn, duration);
  }

  public async removeCleaningScheduled(
    id: number,
    bookingUID: string,
  ): Promise<Result<null>> {
    return this.removeScheduledActivity(id, bookingUID);
  }

  /**
   * Remove uma manutenção agendada para uma sala.
   *
   * @param id Identificador único da sala
   * @param bookingUID Identificador único da atividade de manutenção
   * @returns Result contendo a sala atualizada ou falhas de validação
   */
  public async removeMaintenanceScheduled(
    id: number,
    bookingUID: string,
  ): Promise<Result<null>> {
    return this.removeScheduledActivity(id, bookingUID);
  }

  /**
   * Método genérico para agendar atividades em uma sala.
   *
   * @param roomId Identificador único da sala
   * @param activityType Tipo de atividade (MAINTENANCE ou CLEANING)
   * @param startIn Data de início da atividade
   * @param duration Duração da atividade em minutos
   * @returns Result contendo a sala atualizada ou falhas de validação
   */
  private async scheduleActivity(
    roomId: number,
    activityType: string,
    startIn: Date,
    duration: number,
  ): Promise<Result<Room>> {
    if (!roomId || !startIn || !duration)
      return failure({
        code: FailureCode.MISSING_REQUIRED_DATA,
        details: {
          fields: ["roomID", "startsIn", "duration"],
        },
      });

    const now = new Date();
    if (startIn < now)
      return failure({
        code: FailureCode.DATE_CANNOT_BE_PAST,
        details: {
          startIn: startIn.toISOString(),
          currentDate: now.toISOString(),
        },
      });

    const findRoomResult = await this.findById(roomId);
    if (findRoomResult.invalid) return failure(findRoomResult.failures);

    const room = findRoomResult.value;
    let result: Result<Room>;

    switch (activityType) {
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
          code: FailureCode.INVALID_BOOKING_TYPE_FOR_REMOVAL,
          details: {
            validValues: [BookingType.CLEANING, BookingType.MAINTENANCE],
          },
        });
      default:
        return failure({
          code: FailureCode.INVALID_ACTIVITY_TYPE,
          details: {
            validValues: ["MAINTENANCE", "CLEANING"],
          },
        });
    }

    if (result.invalid) return failure(result.failures);

    const booking = result.value
      .getAllBookings()
      .find(
        (b) =>
          b.startTime.getTime() === startIn.getTime() &&
          b.endTime.getTime() ===
            new Date(startIn.getTime() + duration + 60 * 1000).getTime(),
      );

    const savedRoom = await this.repository.addBooking(roomId, booking);

    return success(savedRoom);
  }

  /**
   * Remove uma atividade agendada de uma sala.
   *
   * @param roomId Identificador único da sala
   * @param bookingUID Identificador único do agendamento
   * @returns Result contendo a sala atualizada ou falhas de validação
   */
  private async removeScheduledActivity(
    roomId: number,
    bookingUID: string,
  ): Promise<Result<null>> {
    if (!roomId || !bookingUID)
      return failure({
        code: FailureCode.MISSING_REQUIRED_DATA,
        details: {
          fields: ["roomID", "bookingUID"],
        },
      });

    const findRoomResult = await this.findById(roomId);
    if (findRoomResult.invalid) return failure(findRoomResult.failures);

    const booking = findRoomResult.value.findBookingDataByUID(bookingUID);

    if (!booking)
      return failure({
        code: FailureCode.BOOKING_NOT_FOUND_IN_FUTURE_SCHEDULE,
        details: {
          bookingUID: bookingUID,
        },
      });

    const now = new Date();
    if (booking.startTime <= now)
      return failure({
        code: FailureCode.BOOKING_ALREADY_STARTED,
        details: {
          bookingDate: booking.startTime.toISOString(),
          currentDate: now.toISOString(),
        },
      });

    if (
      booking.type !== BookingType.MAINTENANCE &&
      booking.type !== BookingType.CLEANING
    )
      return failure({
        code: FailureCode.INVALID_BOOKING_TYPE_FOR_REMOVAL,
        details: {
          bookingType: booking.type,
          allowedTypes: [BookingType.CLEANING, BookingType.MAINTENANCE],
        },
      });

    if (booking.type === BookingType.CLEANING && booking.screeningUID)
      return failure({
        code: FailureCode.CLEANING_ASSOCIATED_WITH_SCREENING,
        details: {
          bookingUID: bookingUID,
          screeningUID: booking.screeningUID,
        },
      });

    const updatedRoom = await this.repository.deleteBooking(roomId, bookingUID);
    return success(updatedRoom);
  }
}
