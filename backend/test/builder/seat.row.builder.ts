import { SeatRow } from '@modules/room/entity/value-object/seat.row'

export function CreateTestRowInLayout(lastColumnLetter: string = 'F', preferentialLetters: string[] = []) {
  return SeatRow.hydrate(lastColumnLetter, preferentialLetters)
}
