import { Result } from "../../../shared/result/result";
import {
  ICreateScreenInput,
  ISeatRowConfiguration,
  Room,
  RoomStatus,
} from "../entity/room";

export interface IRoomService {
  findById(id: number): Promise<Result<Room>>;

  create(
    id: number,
    seatConfig: ISeatRowConfiguration[],
    screen: ICreateScreenInput,
    status?: RoomStatus,
  ): Promise<Result<Room>>;

  delete(id: number): Promise<Result<null>>;

  closeRoom(id: number): Promise<Result<Room>>;
}
