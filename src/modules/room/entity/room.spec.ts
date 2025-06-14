import { v4 } from 'uuid'
import { ICreateRoomInput, IHydrateRoomInput, ISeatRowConfiguration, Room, RoomAdministrativeStatus } from './room'
import { BookingType } from './value-object/booking.slot'
import { ScreeningUID } from '../../screening/aggregate/value-object/screening.uid'
import { FailureCode } from '@shared/failure/failure.codes.enum'
import { TechnicalError } from '@shared/error/technical.error'
import { CreateTestRoom } from '@test/builder/room.builder'

function createDate(day: number, hour: number, minutes: number = 0): Date {
  const date = new Date()
  date.setDate(date.getDate() + day)
  date.setHours(hour)
  date.setMinutes(minutes)
  return date
}

describe('Room', () => {
  const layout = [
    { rowNumber: 1, lastColumnLetter: 'E', preferentialSeatLetters: ['A', 'B'] }, // 5
    { rowNumber: 2, lastColumnLetter: 'F', preferentialSeatLetters: ['C', 'D'] }, // 6
    { rowNumber: 3, lastColumnLetter: 'G', preferentialSeatLetters: [] }, // 7
    { rowNumber: 4, lastColumnLetter: 'H', preferentialSeatLetters: [] }, // 8
  ]

  const screen = {
    size: 20,
    type: '2D',
  }

  describe('Métodos Estáticos', () => {
    describe('create', () => {
      const params: ICreateRoomInput = {
        identifier: 1,
        seatConfig: layout,
        screen: screen,
        status: RoomAdministrativeStatus.AVAILABLE,
      }

      it('deve criar uma sala válida com valores mínimos', () => {
        // Act
        const result = Room.create(params)

        // Assert
        expect(result).toBeValidResultMatching<Room>((room) => {
          expect(room.identifier.value).toBe(params.identifier)
          expect(room.status).toBe(RoomAdministrativeStatus.AVAILABLE)
          expect(room.seatLayoutInfo.totalSeats).toBe(26) // 5+6+7+8 = 26
        })
      })

      describe('deve falhar quando os dados de entrada são inválidos', () => {
        const testCases = [
          {
            scenario: 'configuração de assentos for vazia',
            overrides: { seatConfig: [] as ISeatRowConfiguration[] },
            code: FailureCode.MISSING_REQUIRED_DATA,
          },
          {
            scenario: 'identificador for inválido',
            overrides: { identifier: -1 },
            code: FailureCode.VALUE_OUT_OF_RANGE,
          },
          {
            scenario: 'status for inválido',
            overrides: { status: 'INVALID_STATUS' },
            code: FailureCode.INVALID_ENUM_VALUE,
          },
          {
            scenario: 'configuração de tela for inválida',
            overrides: { screen: { size: -10, type: '2d' } },
            code: FailureCode.VALUE_OUT_OF_RANGE,
          },
          {
            scenario: 'configuração de assentos tem fileiras com zero colunas',
            overrides: {
              seatConfig: [
                {
                  rowNumber: 1,
                  lastColumnLetter: '',
                },
              ],
            },
            code: FailureCode.ARRAY_LENGTH_IS_OUT_OF_RANGE,
          },
        ]

        testCases.forEach(({ scenario, overrides, code }) => {
          it(scenario, () => {
            // Arrange
            const input: ICreateRoomInput = { ...params, ...overrides }

            // Act
            const result = Room.create(input)

            // Assert
            expect(result).toBeInvalidResultWithSingleFailure(code)
          })
        })
      })
    })

    describe('hydrate', () => {
      const params: IHydrateRoomInput = {
        roomUID: v4(),
        identifier: 1,
        layout: layout,
        schedule: [],
        screen: screen,
        status: RoomAdministrativeStatus.AVAILABLE,
      }

      it('deve criar uma sala válida a partir de dados primitivos', () => {
        // Act
        const room = Room.hydrate(params)

        // Assert
        expect(room.identifier.value).toBe(params.identifier)
        expect(room.status).toBe(params.status)
        expect(room.seatLayoutInfo.rows).toBe(params.layout.length)
        expect(room.seatLayoutInfo.totalSeats).toBe(26)
        expect(room.preferentialSeatsCount).toBe(4)
      })

      it('deve lançar erro técnico quando o parâmetro `params` é um objeto nulo', () => {
        expect(() => Room.hydrate(null as any)).toThrow(TechnicalError)
      })

      describe('deve lançar erro técnico quando dados obrigatórios estiverem ausentes', () => {
        const failureCases = [
          {
            scenario: 'identifier é nulo',
            overrides: { identifier: null as unknown as number },
          },
          {
            scenario: 'room uid é nulo',
            overrides: { roomUID: null as unknown as string },
          },
          {
            scenario: 'layout é nulo',
            overrides: { layout: null as any },
          },
          {
            scenario: 'screen é nulo',
            overrides: { screen: null as any },
          },
          {
            scenario: 'status é nulo',
            overrides: { status: null as unknown as string },
          },
        ]

        failureCases.forEach(({ scenario, overrides }) => {
          // Arrange
          it(scenario, () => {
            const input = { ...overrides, ...overrides }

            // Act & Assert
            expect(() => Room.hydrate(input as any)).toThrow()
          })
        })
      })
    })
  })

  describe('Métodos de Instância', () => {
    let room: Room

    const schedule = [
      {
        screeningUID: ScreeningUID.create().value,
        type: BookingType.SCREENING,
        bookingUID: v4(),
        startTime: createDate(10, 10),
        endTime: createDate(10, 12),
      },
      {
        screeningUID: null,
        type: BookingType.CLEANING,
        bookingUID: v4(),
        startTime: createDate(10, 12),
        endTime: createDate(10, 12, 30),
      },
    ]

    beforeEach(() => (room = CreateTestRoom({ schedule })))

    describe('changeStatus', () => {
      describe('casos de sucesso', () => {
        const successCases = [
          {
            scenario: 'deve alterar o status da sala de AVAILABLE para CLOSE',
            initialStatus: RoomAdministrativeStatus.AVAILABLE,
            newStatus: RoomAdministrativeStatus.CLOSED,
          },
          {
            scenario: 'deve alterar o status da sala de CLOSE para AVAILABLE',
            initialStatus: RoomAdministrativeStatus.CLOSED,
            newStatus: RoomAdministrativeStatus.AVAILABLE,
          },
        ]

        successCases.forEach(({ scenario, initialStatus, newStatus }) => {
          it(scenario, () => {
            // Arrange - Usando CreateTestRoom com status específico
            const instance = CreateTestRoom({ status: initialStatus })

            // Act
            const result = instance.changeStatus(newStatus)

            // Assert
            expect(result).toBeValidResultMatching<Room>((updatedRoom) => {
              expect(updatedRoom.status).toBe(newStatus)
            })
          })
        })
      })

      describe('casos de falha', () => {
        describe('deve falhar quando algum dado obrigatório for nulo ou indefinido', () => {
          const nullCases = [
            {
              scenario: 'deve falhar quando novo status for um valor nulo',
              status: null as any,
              code: FailureCode.INVALID_ENUM_VALUE,
            },
            {
              scenario: 'deve falhar quando novo status for um valor indefinido',
              status: undefined as any,
              code: FailureCode.INVALID_ENUM_VALUE,
            },
            {
              scenario: 'deve falhar ao tentar alterar para um status inválido',
              status: 'INVALID_STATUS',
              code: FailureCode.INVALID_ENUM_VALUE,
            },
          ]

          nullCases.forEach(({ scenario, status, code }) => {
            it(scenario, () => {
              // Act
              const result = room.changeStatus(status)

              // Assert
              expect(result).toBeInvalidResultWithSingleFailure(code)
            })
          })
        })

        it('deve falhar ao tentar fechar uma sala com bookings ativos', () => {
          // Arrange
          const instance = CreateTestRoom({ schedule })

          // Act
          const result = instance.changeStatus(RoomAdministrativeStatus.CLOSED)

          // Assert
          expect(result).toBeInvalidResultWithSingleFailure(FailureCode.ROOM_HAS_FUTURE_BOOKINGS)
        })
      })
    })

    describe('getSeatLayoutInfo', () => {
      it('deve retornar informações detalhadas do layout', () => {
        // Act
        const info = room.seatLayoutInfo

        // Assert
        expect(info.rows).toBe(3)
        expect(info.totalSeats).toBe(18) // 5 + 6 + 7 + 8
        expect(info.preferentialSeats).toBe(3) // 1 em cada fileira
      })
    })

    describe('addScreening', () => {
      it('deve adicionar uma exibição com período de entrada, saída e higienização', () => {
        // Arrange -
        const screeningUID = ScreeningUID.create()
        const startTime = createDate(11, 13) // daqui a 11 dias, as 13 horas
        const duration = 140 // daqui a 11 dias, as 15:20

        // Act
        const result = room.addScreening(screeningUID, startTime, duration)

        // Assert
        expect(result).toBeValidResultMatching<Room>((updatedRoom) => {
          const bookings = updatedRoom.getAllBookings()
          expect(bookings).toHaveLength(6) // já há dois agendamentos por padrão, + (entrada + exibição + saída + higienização) deste novo agendamento
          expect(
            bookings.some((b) => b.type === BookingType.SCREENING && b.screeningUID?.value === screeningUID.value)
          ).toBe(true)
          expect(
            bookings.some((b) => b.type === BookingType.CLEANING && b.screeningUID?.value === screeningUID.value)
          ).toBe(true)
          expect(
            bookings.some((b) => b.type === BookingType.ENTRY_TIME && b.screeningUID?.value === screeningUID.value)
          ).toBe(true)
          expect(
            bookings.some((b) => b.type === BookingType.EXIT_TIME && b.screeningUID?.value === screeningUID.value)
          ).toBe(true)
        })
      })

      it('deve falhar ao tentar agendar quando houver conflitos de horários', () => {
        // Arrange
        const startTime1 = createDate(10, 11) // 11:00 (conflito com agendamento existente)
        const duration = 120 //  13:00

        // Act
        const result = room.addScreening(ScreeningUID.create(), startTime1, duration)

        // Assert
        expect(result).toBeInvalidResultWithSingleFailure(FailureCode.ROOM_NOT_AVAILABLE_FOR_PERIOD)
      })

      describe('deve falhar ao tentar agendar com parâmetros inválidos', () => {
        const invalidCases = [
          {
            scenario: 'screeningUID nulo',
            overrides: {
              screeningUID: null as any,
            },
            code: FailureCode.MISSING_REQUIRED_DATA,
          },
          {
            scenario: 'screeningUID indefinido',
            overrides: {
              screeningUID: undefined as any,
            },
            code: FailureCode.MISSING_REQUIRED_DATA,
          },
          {
            scenario: 'data de início nula',
            overrides: {
              startIn: null as any,
            },
            code: FailureCode.MISSING_REQUIRED_DATA,
          },
          {
            scenario: 'duração nula',
            overrides: {
              duration: null as any,
            },
            code: FailureCode.MISSING_REQUIRED_DATA,
          },
          {
            scenario: 'duração é um número negativo',
            overrides: {
              duration: -1,
            },
            code: FailureCode.DATE_WITH_INVALID_SEQUENCE,
          },
        ]

        invalidCases.forEach(({ scenario, overrides, code }) => {
          it(scenario, () => {
            // Arrange
            const input = {
              screeningUID: ScreeningUID.create(),
              startIn: createDate(11, 16),
              duration: 180,
              ...overrides,
            }

            // Act
            const result = room.addScreening(input.screeningUID, input.startIn, input.duration)

            // Assert
            expect(result).toBeInvalidResultWithSingleFailure(code)
          })
        })
      })
    })

    describe('scheduleMaintenance', () => {
      it('deve agendar manutenção em período disponível', () => {
        // Arrange
        const startTime = createDate(11, 15, 30) // Dia 10, 15:30
        const duration = 30

        // Act
        const result = room.scheduleMaintenance(startTime, duration)

        // Assert
        expect(result).toBeValidResultMatching<Room>((updatedRoom) => {
          const bookings = updatedRoom.getAllBookings()
          const maintenance = bookings.find(
            (b) => b.type === BookingType.MAINTENANCE && b.startTime.getTime() === startTime.getTime()
          )
          expect(maintenance).toBeDefined()
          expect(maintenance?.type).toBe(BookingType.MAINTENANCE)
        })
      })

      it('deve falhar ao tentar agendar manutenção em período indisponível', () => {
        // Arrange
        const startTime = createDate(10, 11) // Conflito com agendamento existente
        const duration = 60

        // Act
        const result = room.scheduleMaintenance(startTime, duration)

        // Assert
        expect(result).toBeInvalidResultWithSingleFailure(FailureCode.ROOM_NOT_AVAILABLE_FOR_PERIOD)
      })

      describe('deve falhar ao tentar agendar manutenção com parâmetros inválidos', () => {
        const invalidCases = [
          {
            scenario: 'data de início nula',
            startTime: null as any,
            duration: 140,
            code: FailureCode.MISSING_REQUIRED_DATA,
          },
          {
            scenario: 'duração nula',
            startTime: createDate(11, 13),
            duration: null as any,
            code: FailureCode.MISSING_REQUIRED_DATA,
          },
          {
            scenario: 'duração igual a zero',
            startTime: createDate(11, 16),
            duration: 0,
            code: FailureCode.DATE_WITH_INVALID_SEQUENCE,
          },
        ]

        invalidCases.forEach(({ scenario, startTime, duration, code }) => {
          it(scenario, () => {
            // Act
            const result = room.scheduleMaintenance(startTime, duration)

            // Assert
            expect(result).toBeInvalidResultWithSingleFailure(code)
          })
        })
      })
    })

    describe('scheduleCleaning', () => {
      it('agendamento com sucesso', () => {
        // Arrange
        const startTime = createDate(11, 13, 30) // Dia 11, 13:30
        const durationInMinutes = 30 // 30 minutos de limpeza

        // Act
        const result = room.scheduleCleaning(startTime, durationInMinutes)

        // Assert
        expect(result).toBeValidResultMatching<Room>((updatedRoom) => {
          const bookings = updatedRoom.getAllBookings()
          const cleaning = bookings.find(
            (b) => b.type === BookingType.CLEANING && b.startTime.getTime() === startTime.getTime()
          )
          expect(cleaning).toBeDefined()
          expect(cleaning?.type).toBe(BookingType.CLEANING)
        })
      })

      it('deve falhar ao tentar agendar limpeza em período indisponível', () => {
        // Arrange
        const startTime = createDate(10, 11) // Conflito com agendamento existente
        const durationInMinutes = 30 // 30 minutos de limpeza

        // Act
        const result = room.scheduleCleaning(startTime, durationInMinutes)

        // Assert
        expect(result).toBeInvalidResultWithSingleFailure(FailureCode.ROOM_NOT_AVAILABLE_FOR_PERIOD)
      })

      describe('deve falhar ao tentar agendar limpeza com parâmetros inválidos', () => {
        const invalidCases = [
          {
            scenario: 'data de início nula',
            startTime: null as any,
            durationInMinutes: 30,
            expectedCode: FailureCode.MISSING_REQUIRED_DATA,
          },
          {
            scenario: 'duração nula',
            startTime: createDate(11, 13),
            durationInMinutes: null as any,
            expectedCode: FailureCode.MISSING_REQUIRED_DATA,
          },
          {
            scenario: 'duração negativa',
            startTime: createDate(11, 13),
            durationInMinutes: -30,
            expectedCode: FailureCode.DATE_WITH_INVALID_SEQUENCE,
          },
        ]

        invalidCases.forEach(({ scenario, startTime, durationInMinutes, expectedCode }) => {
          it(scenario, () => {
            // Act
            const result = room.scheduleCleaning(startTime, durationInMinutes)

            // Assert
            expect(result).toBeInvalidResultWithSingleFailure(expectedCode)
          })
        })
      })
    })

    describe('removeScreening', () => {
      it('deve remover exibição e sua higienização', () => {
        // Act
        const result = room.removeScreening(ScreeningUID.hydrate(schedule[0].screeningUID!))

        // Assert
        expect(result).toBeValidResultMatching<Room>((r) => {
          expect(r.findBookingDataByUID(schedule[0].bookingUID)).toBeUndefined()
          expect(r.getAllBookings()).toHaveLength(1)
        })
      })

      describe('cenários de falha', () => {
        const failureCases = [
          {
            scenario: 'deve falhar quando o screeningUID for nulo',
            value: null as any,
            expectedCode: FailureCode.MISSING_REQUIRED_DATA,
          },
          {
            scenario: 'deve falhar quando o screeningUID for undefined',
            value: undefined as any,
            expectedCode: FailureCode.MISSING_REQUIRED_DATA,
          },
          {
            scenario: 'deve falhar quando a exibição não existir',
            value: ScreeningUID.create(),
            expectedCode: FailureCode.BOOKING_NOT_FOUND_FOR_SCREENING,
          },
        ]

        failureCases.forEach(({ scenario, value, expectedCode }) => {
          it(scenario, () => {
            // Act
            const result = room.removeScreening(value)

            // Assert
            expect(result).toBeInvalidResultWithSingleFailure(expectedCode)
          })
        })
      })
    })

    describe('removeBookingByUID', () => {
      it('deve remover um booking pelo UID', () => {
        // Act
        const result = room.removeBookingByUID(schedule[0].bookingUID)

        // Assert
        expect(result).toBeValidResultMatching<Room>((updatedRoom) => {
          expect(updatedRoom.findBookingDataByUID(schedule[0].bookingUID)).toBeUndefined()
          const bookings = updatedRoom.getAllBookings()
          expect(bookings).toHaveLength(1)
          expect(bookings[0].bookingUID).toBe(schedule[1].bookingUID)
        })
      })

      describe('deve falhar quando o bookingUID for inválido', () => {
        const invalidCases = [
          {
            scenario: 'bookingUID nulo',
            bookingUID: null as any,
            expectedCode: FailureCode.MISSING_REQUIRED_DATA,
          },
          {
            scenario: 'bookingUID indefinido',
            bookingUID: undefined as any,
            expectedCode: FailureCode.MISSING_REQUIRED_DATA,
          },
          {
            scenario: 'bookingUID inexistente',
            bookingUID: 'booking-inexistente',
            expectedCode: FailureCode.BOOKING_NOT_FOUND_IN_ROOM,
          },
        ]

        invalidCases.forEach(({ scenario, bookingUID, expectedCode }) => {
          it(scenario, () => {
            // Act
            const result = room.removeBookingByUID(bookingUID)

            // Assert
            expect(result).toBeInvalidResultWithSingleFailure(expectedCode)
          })
        })
      })
    })
  })
})
