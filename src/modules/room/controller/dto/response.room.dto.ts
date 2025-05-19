import { Room } from "../../entity/room";
import { ResourceTypes } from "../../../../shared/constant/resource.types";

export class ResponseRoomDTO {
  /**
   * Construtor privado para garantir imutabilidade
   * @param id Identificador único da sala
   * @param type Tipo do recurso
   * @param attributes Atributos da sala
   * @param links Links relacionados à sala
   */
  private constructor(
    public readonly id: string,
    public readonly type: string,
    public readonly attributes: {
      readonly number: number;
      readonly status: string;
      readonly capacity: number;
      readonly screen: {
        type: string;
        size: number;
      };
    },
    public readonly links: {
      readonly self: string;
    },
  ) {}

  /**
   * Cria um DTO de resposta a partir de uma entidade Room
   * @param room Entidade Room
   * @returns DTO formatado no padrão JSON:API
   */
  public static fromEntity(room: Room): ResponseRoomDTO {
    return new ResponseRoomDTO(
      room.roomUID.value,
      ResourceTypes.ROOM,
      {
        number: room.identifier.value,
        capacity: room.totalSeatsCapacity,
        status: room.status,
        screen: {
          type: room.screenType,
          size: room.screenSize,
        },
      },
      {
        self: `/customers/${room.roomUID.value}`,
      },
    );
  }
}
