import { SeatReservation } from '@modules/screening/aggregate/value-object/seat.reservation'
import { CustomerUID } from '@modules/customer/entity/value-object/customer.uid'

export function CreateTestSeatReservation(expiresAt: Date, customerUID?: CustomerUID): SeatReservation {
  const customer = customerUID ?? CustomerUID.create()
  const result = SeatReservation.create(customer, expiresAt)
  return result.fold(
    (s) => s,
    (f) => {
      throw new Error('Falha ao criar objeto Seat Reservation:\n' + f)
    }
  )
}
