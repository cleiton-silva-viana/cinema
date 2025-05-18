import { Result } from "../../../shared/result/result";
import {
  ICreateScreenInput,
  ISeatRowConfiguration,
  Room,
  RoomAdministrativeStatus,
} from "../entity/room";

export interface IRoomService {
  findById(id: number): Promise<Result<Room>>;

  create(
    id: number,
    seatConfig: ISeatRowConfiguration[],
    screen: ICreateScreenInput,
    status?: RoomAdministrativeStatus,
  ): Promise<Result<Room>>;

  delete(id: number): Promise<Result<null>>;

  closeRoom(id: number): Promise<Result<Room>>;

  scheduleCleaning(
    id: number,
    startIn: Date,
    duration: number,
  ): Promise<Result<Room>>;

  removeCleaningScheduled(
    id: number,
    bookingUID: string,
  ): Promise<Result<null>>;

  scheduleMaintenance(
    id: number,
    startIn: Date,
    duration: number,
  ): Promise<Result<Room>>;

  removeMaintenanceScheduled(
    id: number,
    bookingUID: string,
  ): Promise<Result<null>>;
}
