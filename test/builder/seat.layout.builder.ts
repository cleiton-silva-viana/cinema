import { ISeatRowConfiguration } from '@modules/room/entity/room'
import { SeatLayout } from '@modules/room/entity/value-object/seat.layout'
import { CreateTestRowInLayout } from '@test/builder/seat.row.builder'

export function CreateTestSeatLayout(override?: ISeatRowConfiguration[]): SeatLayout {
  const seatRows = new Map()

  if (override) {
    for (let i = 0; i < override.length; i++) {
      seatRows.set(
        override[i].rowNumber,
        CreateTestRowInLayout(override[i].lastColumnLetter, override[i].preferentialSeatLetters)
      )
    }
    return SeatLayout.hydrate(seatRows)
  }

  const row1 = CreateTestRowInLayout('E', ['A', 'B']) // Fileira 1: A-E, com A e B preferenciais
  const row2 = CreateTestRowInLayout('F', ['C']) // Fileira 2: A-F, com C preferencial
  const row3 = CreateTestRowInLayout('G', []) // Fileira 3: A-G, sem preferenciais

  seatRows.set(1, row1)
  seatRows.set(2, row2)
  seatRows.set(3, row3)

  return SeatLayout.hydrate(seatRows)
}
