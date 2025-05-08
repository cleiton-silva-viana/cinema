import { Room } from "../entity/room";

export interface IRoomRepository {
  findById(roomID: number): Promise<Room>;
  create(room: Room): Promise<Room>;
  update(roomID: number, room: Partial<Room>): Promise<Room>;
  delete(roomID: number): Promise<null>;
}
