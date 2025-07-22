import { faker } from '@faker-js/faker'
import { IHydrateRoomInput, ISeatRowConfiguration, Room, RoomAdministrativeStatus } from '@modules/room/entity/room'
import { RoomUID } from '@modules/room/entity/value-object/room.uid'
import { ScreenType } from '@modules/room/entity/value-object/screen'
import { IRoomBookingData } from '@modules/room/entity/value-object/room.schedule'

/**
 * Cria uma instância de Room para testes com configurações padrão robustas.
 * Permite override de qualquer propriedade através do parâmetro partial.
 *
 * @param override - Propriedades específicas para sobrescrever os valores padrão
 * @returns Instância de Room configurada para testes
 */
export function CreateTestRoom(override?: Partial<IHydrateRoomInput>): Room {
  return Room.hydrate({
    roomUID: RoomUID.create().value,
    identifier: faker.number.int({ min: 1, max: 999 }),
    layout: [
      { rowNumber: 1, lastColumnLetter: 'F', preferentialSeatLetters: ['A'] },
      { rowNumber: 2, lastColumnLetter: 'F', preferentialSeatLetters: ['A'] },
      { rowNumber: 3, lastColumnLetter: 'F', preferentialSeatLetters: ['A'] },
    ],
    screen: { size: 30, type: ScreenType['2D'] },
    schedule: [],
    status: RoomAdministrativeStatus.AVAILABLE,
    ...override,
  })
}

/**
 * Clona uma instância de Room existente aplicando overrides específicos.
 * Útil para testes que precisam de variações de uma sala base.
 *
 * @param room - Instância base de Room para clonagem
 * @param override - Propriedades para sobrescrever na nova instância
 * @returns Nova instância de Room com as modificações aplicadas
 */
export function CloneTestRoomWithOverrides(room: Room, override: Partial<Omit<IHydrateRoomInput, 'roomUID'>>): Room {
  const currentLayout: ISeatRowConfiguration[] = []

  const currentSchedule: IRoomBookingData[] = []

  override.layout?.forEach((row) => {
    currentLayout.push({
      rowNumber: row.rowNumber,
      lastColumnLetter: row.lastColumnLetter,
      preferentialSeatLetters: row.preferentialSeatLetters,
    })
  })

  override.schedule?.forEach((schedule) => {
    currentSchedule.push({
      bookingUID: schedule.bookingUID,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      type: schedule.type,
      screeningUID: schedule.screeningUID,
    })
  })

  const cloneConfig: IHydrateRoomInput = {
    roomUID: room.uid.value,
    identifier: override?.identifier ?? room.identifier.value,
    layout: override?.layout ?? currentLayout,
    screen: override?.screen ?? {
      size: room.screenSize,
      type: room.screenType,
    },
    schedule: override?.schedule ?? currentSchedule,
    status: override?.status ?? room.status,
  }

  return Room.hydrate(cloneConfig)
}
