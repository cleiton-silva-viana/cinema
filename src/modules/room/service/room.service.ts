import { IRoomRepository } from "../repository/room.repository.interface";
import {
  ICreateScreenInput,
  ISeatRowConfiguration,
  Room,
  RoomStatus,
} from "../entity/room";
import { Inject, Injectable } from "@nestjs/common";
import { ROOM_REPOSITORY } from "../constant/room.constant";
import { FailureCode } from "../../../shared/failure/failure.codes.enum";
import { failure, Result, success } from "../../../shared/result/result";
import { isNull } from "../../../shared/validator/validator";

/**
 * Serviço responsável por gerenciar operações relacionadas às salas de cinema.
 *
 * Este serviço implementa a lógica de negócio para criação, atualização,
 * busca e exclusão de salas, além de operações específicas como fechamento.
 */
@Injectable()
export class RoomService {
  constructor(
    @Inject(ROOM_REPOSITORY)
    private readonly repository: IRoomRepository,
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
    status?: RoomStatus,
  ): Promise<Result<Room>> {
    const roomExists = await this.repository.findById(id);
    if (roomExists)
      return failure({
        code: FailureCode.RESOURCE_ALREADY_EXISTS,
        details: {
          id,
        },
      });

    const roomResult = Room.create(id, seatConfig, screen, status);
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

    const changeStatusResult = room.changeStatus(RoomStatus.CLOSED);
    if (changeStatusResult.invalid) return failure(changeStatusResult.failures);

    const updatedRoom = await this.repository.update(id, room);
    return success(updatedRoom);
  }
}
