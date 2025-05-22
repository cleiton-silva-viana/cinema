import { Result } from "../../../shared/result/result";
import {
  ICreateScreenInput,
  ISeatRowConfiguration,
  Room,
  RoomAdministrativeStatus,
} from "../entity/room";

export interface IRoomDomainService {
  findById(id: number): Promise<Result<Room>>;
  create(id: number, seatConfig: ISeatRowConfiguration[], screen: ICreateScreenInput, status?: RoomAdministrativeStatus): Promise<Result<Room>>;
  scheduleActivity(roomId: number, activityType: string, startIn: Date, duration: number): Promise<Result<Room>>;
  removeScheduledActivity(id: number, bookingUID: string): Promise<Result<boolean>>;
}
