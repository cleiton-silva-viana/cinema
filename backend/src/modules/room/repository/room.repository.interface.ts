import { Room } from '../entity/room'
import { BookingSlot } from '../entity/value-object/booking.slot'

export interface IRoomRepository {
  roomExists(roomID: number): Promise<boolean>

  findById(roomID: number): Promise<Room| null>

  create(room: Room): Promise<Room>

  update(roomID: number, room: Partial<Room>): Promise<Room>

  delete(roomID: number): Promise<null>

  addBooking(roomID: number, booking: BookingSlot): Promise<Room>

  deleteBooking(roomID: number, bookingUID: string): Promise<null>
}
