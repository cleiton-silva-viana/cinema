import { IRoomBookingData, RoomSchedule } from '@modules/room/entity/value-object/room.schedule'
import { v4 } from 'uuid'
import { BookingType } from '@modules/room/entity/value-object/booking.slot'

/// Devemos construir este helper de modo que: possamos indicar os dados do partial,
// ou podemos criar exibições avulsas com base em um objeto de configuração indicado quantos agendamentos, tipo e horário de maneira opcional
export function CreateTestRoomSchedule(schedules: Partial<IRoomBookingData>[] = [], schedulesCount: number = 2) {
  const datas: IRoomBookingData[] = []

  let flagDate = new Date(Date.now() + 24 * 60 * 60 * 1000)

  for (let i = 0; i < schedulesCount; ++i) {
    const bookingUID = schedules[i]?.bookingUID || v4()
    const screeningUID = schedules[i]?.screeningUID || v4()
    const type = schedules[i]?.type || BookingType.SCREENING
    const startTime = schedules[i]?.startTime || flagDate // 1 dia no futuro
    const endTime = schedules[i]?.endTime || new Date(flagDate.getTime() + 2 * 60 * 60 * 1000) // 2 horas após startTime

    datas.push({ bookingUID, screeningUID, startTime, endTime, type })

    flagDate = new Date(flagDate.getTime() + 24 * 60 * 60 * 1000) // + 24 horas
  }

  return RoomSchedule.hydrate(datas)
}
