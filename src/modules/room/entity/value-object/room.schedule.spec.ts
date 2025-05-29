import { v4 } from 'uuid'
import { BookingType } from './booking.slot'
import { IRoomBookingData, RoomSchedule } from './room.schedule'
import { ScreeningUID } from '../../../screening/aggregate/value-object/screening.uid'
import { FailureCode } from '@shared/failure/failure.codes.enum'
import { TechnicalError } from '@shared/error/technical.error'
import { SimpleFailure } from '@shared/failure/simple.failure.type'
import { validateAndCollect } from '@shared/validator/common.validators'

describe('RoomSchedule', () => {
  const createFutureDate = (minutes: number, hours: number, days: number = 10): Date => {
    const date = new Date()
    date.setDate(date.getDate() + days)
    date.setHours(hours, minutes, 0, 0)
    return date
  }

  describe('Static Methods', () => {
    describe('create', () => {
      it('deve criar uma instância de RoomSchedule vazia', () => {
        // Act
        const schedule = RoomSchedule.create()

        // Assert
        expect(schedule).toBeInstanceOf(RoomSchedule)
        expect(schedule.getAllBookingsData()).toEqual([])
      })
    })

    describe('hydrate', () => {
      it('deve hidratar RoomSchedule com dados válidos', () => {
        // Arrange
        const screeningUID1 = ScreeningUID.create().value
        const screeningUID2 = ScreeningUID.create().value
        const bookingData: IRoomBookingData[] = [
          {
            bookingUID: v4(),
            screeningUID: screeningUID1,
            startTime: createFutureDate(0, 14),
            endTime: createFutureDate(0, 16),
            type: BookingType.SCREENING,
          },
          {
            bookingUID: v4(),
            screeningUID: screeningUID2,
            startTime: createFutureDate(0, 17),
            endTime: createFutureDate(0, 19),
            type: BookingType.SCREENING,
          },
        ]

        // Act
        const schedule = RoomSchedule.hydrate(bookingData)
        const allBookings = schedule.getAllBookingsData()

        // Assert
        expect(schedule).toBeInstanceOf(RoomSchedule)
        expect(allBookings).toHaveLength(2)
        expect(allBookings[0].screeningUID?.value).toBe(screeningUID1)
        expect(allBookings[1].screeningUID?.value).toBe(screeningUID2)
        expect(allBookings[0].startTime.getTime()).toBeLessThan(allBookings[1].startTime.getTime())
      })

      it('deve lançar TechnicalError se bookingDataArray for nulo', () => {
        // Act & Assert
        expect(() => RoomSchedule.hydrate(null as any)).toThrow(TechnicalError)
      })

      it('deve lançar TechnicalError se o tipo de booking for nulo', () => {
        // Arrange
        const screeningUID = ScreeningUID.create().value
        const bookingData: any[] = [
          {
            screeningUID: screeningUID,
            startTime: createFutureDate(0, 14),
            endTime: createFutureDate(0, 16),
            type: null,
          },
        ]

        // Act & Assert
        expect(() => RoomSchedule.hydrate(bookingData)).toThrow(TechnicalError)
      })

      it('deve hidratar RoomSchedule com array de bookings vazio', () => {
        // Arrange
        const bookingData: IRoomBookingData[] = []

        // Act
        const schedule = RoomSchedule.hydrate(bookingData)

        // Assert
        expect(schedule).toBeInstanceOf(RoomSchedule)
        expect(schedule.getAllBookingsData()).toEqual([])
      })
    })
  })

  describe('Instance Methods', () => {
    let instance: RoomSchedule
    let failures: SimpleFailure[]
    const SCREENING_UID_1 = ScreeningUID.create()
    const START_TIME_1 = createFutureDate(0, 10) // 10:00
    const END_TIME_1 = createFutureDate(0, 12) // 12:00

    const SCREENING_UID_2 = ScreeningUID.create()
    const START_TIME_2 = createFutureDate(0, 13) // 13:00
    const END_TIME_2 = createFutureDate(0, 15) // 15:00

    beforeEach(() => {
      failures = []

      instance = RoomSchedule.hydrate([
        {
          bookingUID: v4(),
          screeningUID: SCREENING_UID_1.value,
          startTime: START_TIME_1,
          endTime: END_TIME_1,
          type: BookingType.SCREENING,
        },
        {
          bookingUID: v4(),
          screeningUID: SCREENING_UID_2.value,
          startTime: START_TIME_2,
          endTime: END_TIME_2,
          type: BookingType.SCREENING,
        },
      ])
    })

    const emptySchedule = RoomSchedule.create()

    describe('isAvailable', () => {
      describe('Testes de Disponibilidade Válida', () => {
        const successCases = [
          {
            scenario: 'deve retornar verdadeiro para um período disponível',
            startTime: createFutureDate(0, 15), // 15:00
            endTime: createFutureDate(0, 18), // 18:00
          },
          {
            scenario: 'deve retornar verdadeiro se o período for adjacente a uma reserva existente (antes)',
            startTime: createFutureDate(5, 12), // 12:05
            endTime: createFutureDate(0, 13), // 13:00
          },
          {
            scenario: 'deve retornar verdadeiro se o período for adjacente a uma reserva existente (depois)',
            startTime: createFutureDate(0, 15), // 15:00
            endTime: createFutureDate(0, 18), // 18:00
          },
        ]
        successCases.forEach(({ scenario, startTime, endTime }) => {
          it(scenario, () => {
            // Arrange
            const failures: SimpleFailure[] = []

            // Act
            const available = instance.isAvailable(startTime, endTime, failures)

            // Assert
            expect(available).toBe(true)
            expect(failures).toHaveLength(0)
          })
        })
      })

      describe('Testes de Disponibilidade Inválida', () => {
        const invalidCases = [
          {
            scenario: 'horário final for menor ou igual ao inicial',
            startTime: createFutureDate(0, 11),
            endTime: createFutureDate(0, 10),
            expectedFailure: FailureCode.DATE_WITH_INVALID_SEQUENCE,
          },
          {
            scenario: 'horário inicial for antes do horário de funcionamento',
            startTime: createFutureDate(0, 9),
            endTime: createFutureDate(0, 11),
            expectedFailure: FailureCode.ROOM_OPERATING_HOURS_VIOLATION,
          },
          {
            scenario: 'horário inicial for igual ou depois do horário de término de funcionamento',
            startTime: createFutureDate(0, 22),
            endTime: createFutureDate(0, 23),
            expectedFailure: FailureCode.ROOM_OPERATING_HOURS_VIOLATION,
          },
          {
            scenario: 'o minuto do horário inicial não for múltiplo de 5',
            startTime: createFutureDate(9, 11),
            endTime: createFutureDate(0, 14),
            expectedFailure: FailureCode.BOOKING_WITH_INVAlID_TIME_INTERVAL,
          },
          {
            scenario: 'houver sobreposição com uma reserva existente (início durante)',
            startTime: START_TIME_1,
            endTime: createFutureDate(0, 13),
            expectedFailure: FailureCode.ROOM_NOT_AVAILABLE_FOR_PERIOD,
          },
          {
            scenario: 'houver sobreposição com uma reserva existente (fim durante)',
            startTime: createFutureDate(30, 12),
            endTime: createFutureDate(0, 15),
            expectedFailure: FailureCode.ROOM_NOT_AVAILABLE_FOR_PERIOD,
          },
          {
            scenario: 'houver sobreposição com uma reserva existente (envolve completamente)',
            startTime: createFutureDate(30, 12),
            endTime: createFutureDate(10, 15),
            expectedFailure: FailureCode.ROOM_NOT_AVAILABLE_FOR_PERIOD,
          },
          {
            scenario: 'houver sobreposição com uma reserva existente (contido completamente)',
            startTime: createFutureDate(30, 13),
            endTime: createFutureDate(0, 15),
            expectedFailure: FailureCode.ROOM_NOT_AVAILABLE_FOR_PERIOD,
          },
        ]

        invalidCases.forEach(({ scenario, startTime, endTime, expectedFailure }) => {
          it(`deve retornar falso e adicionar falha se ${scenario}`, () => {
            // Arrange
            const failures: SimpleFailure[] = []

            // Act
            const available = instance.isAvailable(startTime, endTime, failures)

            // Assert
            expect(available).toBe(false)
            expect(failures).toHaveLength(1)
            expect(failures[0].code).toBe(expectedFailure)
          })
        })
      })
    })

    describe('addBooking', () => {
      describe('cenários válidos', () => {
        it('deve adicionar um booking a um schedule vazio', () => {
          // Arrange
          const emptyBookings = RoomSchedule.create()

          // Act
          const result = validateAndCollect(
            emptyBookings.addBooking(SCREENING_UID_1, START_TIME_1, END_TIME_1, BookingType.SCREENING),
            failures
          )

          // Assert
          expect(result).toBeDefined()
          expect(result.getAllBookingsData()).toHaveLength(1)
          expect(result.findScreeningData(SCREENING_UID_1)).toBeDefined()
        })

        it('deve adicionar múltiplos bookings e mantê-los ordenados', () => {
          // Arrange
          const screeningUID1 = ScreeningUID.create()
          const screeningUID2 = ScreeningUID.create()

          const startTime1 = createFutureDate(0, 14) // 14:00
          const endTime1 = createFutureDate(0, 16) // 16:00

          const startTime2 = createFutureDate(0, 10) // 10:00
          const endTime2 = createFutureDate(0, 12) // 12:00

          // Act
          let schedule = validateAndCollect(
            emptySchedule.addBooking(screeningUID1, startTime1, endTime1, BookingType.SCREENING),
            failures
          )
          schedule = validateAndCollect(
            schedule.addBooking(screeningUID2, startTime2, endTime2, BookingType.CLEANING),
            failures
          )
          const bookings = schedule.getAllBookingsData()

          // Assert
          expect(failures.length).toBe(0)
          expect(bookings).toHaveLength(2)
          expect(bookings[0].screeningUID?.value).toBe(screeningUID2.value)
          expect(bookings[0].startTime).toEqual(startTime2)
          expect(bookings[0].endTime).toEqual(endTime2)
          expect(bookings[0].type).toBe(BookingType.CLEANING)
          expect(bookings[1].screeningUID).toEqual(screeningUID1)
          expect(bookings[1].startTime).toEqual(startTime1)
          expect(bookings[1].endTime).toEqual(endTime1)
          expect(bookings[1].type).toBe(BookingType.SCREENING)
        })

        it('deve permitir adicionar booking do tipo CLEANING sem screeningUID', () => {
          // Arrange
          const validStartTime = createFutureDate(0, 16)
          const validEndTime = createFutureDate(0, 18)

          // Act
          const result = validateAndCollect(
            emptySchedule.addBooking(null, validStartTime, validEndTime, BookingType.CLEANING),
            failures
          )

          // Assert
          expect(result).toBeDefined()
          expect(result.getAllBookingsData()).toHaveLength(1)
          const booking = result.getAllBookingsData()[0]
          expect(booking.screeningUID).toBeNull()
          expect(booking.type).toBe(BookingType.CLEANING)
        })
      })

      describe('casos inválidos', () => {
        const failureCases = [
          {
            scenario: 'deve retornar falha inicio do período for no passado',
            input: {
              startTime: createFutureDate(0, 10, -1),
              endTime: createFutureDate(0, 13, -1),
            },
            code: FailureCode.DATE_CANNOT_BE_PAST,
          },
          {
            scenario: 'deve retornar falha se o período não estiver disponível',
            input: {
              startTime: createFutureDate(0, 13),
              endTime: createFutureDate(0, 15),
            },
            code: FailureCode.ROOM_NOT_AVAILABLE_FOR_PERIOD,
          },
          {
            scenario: 'deve retornar falha se screeningUID for nulo quando o tipo for SCREENING',
            input: {
              screeningUID: null as any,
            },
            code: FailureCode.MISSING_REQUIRED_DATA,
          },
          {
            scenario: 'deve retornar falha se startTime for nulo',
            input: {
              startTime: null as any,
            },
            code: FailureCode.MISSING_REQUIRED_DATA,
          },
          {
            scenario: 'deve retornar falha se endTime for nulo',
            input: {
              endTime: null as any,
            },
            code: FailureCode.MISSING_REQUIRED_DATA,
          },
          {
            scenario: 'deve retornar falha se o tipo de booking for nulo',
            input: {
              type: null as any,
            },
            code: FailureCode.MISSING_REQUIRED_DATA,
          },
        ]

        failureCases.forEach(({ scenario, input, code }) => {
          it(scenario, () => {
            // Arrange
            const params = {
              screeningUID: ScreeningUID.create().value,
              startTime: createFutureDate(0, 16),
              endTime: createFutureDate(0, 18),
              type: BookingType.SCREENING,
              ...input,
            }

            // Act
            const result = validateAndCollect(
              instance.addBooking(params.screeningUID, params.startTime, params.endTime, params.type),
              failures
            )

            // Assert
            expect(result).toBeNull()
            expect(failures[0].code).toBe(code)
          })
        })
      })
    })

    describe('removeScreening', () => {
      it('deve remover um booking existente', () => {
        // Act
        const result = validateAndCollect(instance.removeScreening(SCREENING_UID_1), failures)

        // Assert
        expect(result).toBeDefined()
        expect(result.getAllBookingsData()).toHaveLength(1)
        expect(result.findScreeningData(SCREENING_UID_1)).toBeUndefined()
        expect(result.findScreeningData(SCREENING_UID_2)).toBeDefined()
      })

      it('deve retornar falha ao tentar remover um booking inexistente', () => {
        // Arrange
        const nonExistentUID = ScreeningUID.create()

        // Act
        const result = validateAndCollect(instance.removeScreening(nonExistentUID), failures)

        // Assert
        expect(result).toBeNull()
        expect(failures[0].code).toBe(FailureCode.BOOKING_NOT_FOUND_FOR_SCREENING)
        expect(instance.getAllBookingsData()).toHaveLength(2) // Schedule remains unchanged
      })
    })

    describe('removeBookingByUID', () => {
      let bookingUID1: string
      let bookingUID2: string

      beforeEach(() => {
        const bookings = instance.getAllBookingsData()
        bookingUID1 = bookings[0].bookingUID
        bookingUID2 = bookings[1].bookingUID
      })

      describe('cenários válidos', () => {
        const successCases = [
          {
            scenario: 'deve remover o primeiro booking pelo UID',
            bookingUIDToRemove: () => bookingUID1,
            remainingBookingUID: () => bookingUID2,
          },
          {
            scenario: 'deve remover o segundo booking pelo UID',
            bookingUIDToRemove: () => bookingUID2,
            remainingBookingUID: () => bookingUID1,
          },
        ]

        successCases.forEach(({ scenario, bookingUIDToRemove, remainingBookingUID }) => {
          it(scenario, () => {
            // Arrange
            const initialLength = instance.getAllBookingsData().length

            // Act
            const result = validateAndCollect(instance.removeBookingByUID(bookingUIDToRemove()), failures)

            // Assert
            expect(result).toBeDefined()
            const newBookings = result.getAllBookingsData()
            expect(newBookings).toHaveLength(initialLength - 1)
            expect(newBookings[0].bookingUID).toBe(remainingBookingUID())
            expect(newBookings[0].bookingUID).not.toBe(bookingUIDToRemove())
          })
        })
      })

      it('deve falhar ao tentar remover UID inexistente', () => {
        // Arrange
        const nonExistentUID = v4()
        const initialLength = instance.getAllBookingsData().length

        // Act
        const result = validateAndCollect(instance.removeBookingByUID(nonExistentUID), failures)

        // Assert
        expect(result).toBeNull()
        expect(failures).toHaveLength(1)
        expect(failures[0].code).toBe(FailureCode.BOOKING_NOT_FOUND_IN_ROOM)
        expect(instance.getAllBookingsData()).toHaveLength(initialLength)
      })
    })

    describe('findBookingDataByUID', () => {
      let bookingUID1: string
      let bookingUID2: string

      beforeEach(() => {
        const bookings = instance.getAllBookingsData()
        bookingUID1 = bookings[0].bookingUID
        bookingUID2 = bookings[1].bookingUID
      })

      describe('cenários válidos', () => {
        const successCases = [
          {
            scenario: 'deve encontrar dados do primeiro booking pelo UID',
            bookingUIDToFind: () => bookingUID1,
            expectedIndex: 0,
          },
          {
            scenario: 'deve encontrar dados do segundo booking pelo UID',
            bookingUIDToFind: () => bookingUID2,
            expectedIndex: 1,
          },
        ]

        successCases.forEach(({ scenario, bookingUIDToFind, expectedIndex }) => {
          it(scenario, () => {
            // Arrange
            const allBookings = instance.getAllBookingsData()
            const expectedData = allBookings[expectedIndex]

            // Act
            const result = instance.findBookingDataByUID(bookingUIDToFind())

            // Assert
            expect(result).toBeDefined()
            expect(result).toEqual(expectedData)
          })
        })
      })

      it('deve retornar undefined para UID inexistente', () => {
        // Arrange
        const nonExistentUID = v4()

        // Act
        const result = instance.findBookingDataByUID(nonExistentUID)

        // Assert
        expect(result).toBeUndefined()
      })
    })

    describe('findScreeningData', () => {
      it('deve encontrar e retornar dados de um booking existente', () => {
        // Act
        const foundData = instance.findScreeningData(SCREENING_UID_1)

        // Assert
        expect(foundData).toBeDefined()
        expect(foundData?.screeningUID?.value).toBe(SCREENING_UID_1.value)
        expect(foundData?.startTime).toEqual(START_TIME_1)
        expect(foundData?.endTime).toEqual(END_TIME_1)
        expect(foundData?.type).toBe(BookingType.SCREENING)
      })

      it('deve retornar undefined para um booking inexistente', () => {
        // Arrange
        const nonExistentUID = ScreeningUID.create()

        // Act
        const foundData = instance.findScreeningData(nonExistentUID)

        // Assert
        expect(foundData).toBeUndefined()
      })
    })

    describe('getAllBookingsData', () => {
      it('deve retornar um array vazio para um schedule sem bookings', () => {
        // Act
        const bookingsData = emptySchedule.getAllBookingsData()

        // Assert
        expect(bookingsData).toEqual([])
      })

      it('deve retornar dados de todos os bookings', () => {
        // Act
        const bookingsData = instance.getAllBookingsData()

        // Assert
        expect(bookingsData).toHaveLength(2)
        expect(bookingsData[0].screeningUID).toEqual(SCREENING_UID_1)
        expect(bookingsData[0].startTime).toEqual(START_TIME_1)
        expect(bookingsData[0].endTime).toEqual(END_TIME_1)
        expect(bookingsData[0].type).toBe(BookingType.SCREENING)
        expect(bookingsData[1].screeningUID).toEqual(SCREENING_UID_2)
        expect(bookingsData[1].startTime).toEqual(START_TIME_2)
        expect(bookingsData[1].endTime).toEqual(END_TIME_2)
        expect(bookingsData[1].type).toBe(BookingType.SCREENING)
      })
    })

    describe('getFreeSlotsForDate', () => {
      const minDuration = 60 // 1 hora
      const today = createFutureDate(0, 0)

      let emptySchedule: RoomSchedule
      let scheduleWithOneBooking: RoomSchedule
      let scheduleWithMultipleBookings: RoomSchedule
      let scheduleWithFullDay: RoomSchedule

      beforeEach(() => {
        emptySchedule = RoomSchedule.create()

        scheduleWithOneBooking = RoomSchedule.hydrate([
          {
            bookingUID: v4(),
            screeningUID: SCREENING_UID_1.value,
            startTime: START_TIME_1,
            endTime: END_TIME_1,
            type: BookingType.SCREENING,
          },
        ])

        scheduleWithMultipleBookings = RoomSchedule.hydrate([
          {
            bookingUID: v4(),
            screeningUID: SCREENING_UID_1.value,
            startTime: START_TIME_1,
            endTime: END_TIME_1,
            type: BookingType.SCREENING,
          }, // 10:00 > 12:00
          {
            bookingUID: v4(),
            screeningUID: SCREENING_UID_2.value,
            startTime: START_TIME_2,
            endTime: END_TIME_2,
            type: BookingType.SCREENING,
          }, // 13:00 > 15:00
          {
            bookingUID: v4(),
            screeningUID: ScreeningUID.create().value,
            startTime: createFutureDate(0, 16),
            endTime: createFutureDate(0, 18),
            type: BookingType.SCREENING,
          },
        ])

        scheduleWithFullDay = RoomSchedule.hydrate([
          {
            bookingUID: v4(),
            screeningUID: ScreeningUID.create().value,
            startTime: createFutureDate(0, 10),
            endTime: createFutureDate(0, 13),
            type: BookingType.SCREENING,
          },
          {
            bookingUID: v4(),
            screeningUID: ScreeningUID.create().value,
            startTime: createFutureDate(0, 14),
            endTime: createFutureDate(0, 18),
            type: BookingType.SCREENING,
          },
          {
            bookingUID: v4(),
            screeningUID: ScreeningUID.create().value,
            startTime: createFutureDate(0, 19),
            endTime: createFutureDate(0, 22),
            type: BookingType.SCREENING,
          },
        ])
      })

      it('deve retornar um único slot grande se não houver bookings', () => {
        // Arrange
        const operatingStart = new Date(today)
        operatingStart.setHours(10, 0, 0, 0)
        const operatingEnd = new Date(today)
        operatingEnd.setHours(22, 0, 0, 0)

        // Act
        const freeSlots = emptySchedule.getFreeSlotsForDate(today, minDuration)

        // Assert
        expect(freeSlots).toHaveLength(1)
        expect(freeSlots[0].startTime).toEqual(operatingStart)
        expect(freeSlots[0].endTime).toEqual(operatingEnd)
      })

      it('deve retornar slots livres corretamente com um booking no meio do dia', () => {
        // Arrange
        const expectedSlotStart = createFutureDate(0, 12)
        const expectedSlotEnd = createFutureDate(0, 22)

        // Act
        const freeSlots = scheduleWithOneBooking.getFreeSlotsForDate(today, minDuration)

        // Assert
        expect(freeSlots).toHaveLength(1)
        expect(freeSlots[0].startTime.toISOString()).toEqual(expectedSlotStart.toISOString())
        expect(freeSlots[0].endTime.toISOString()).toEqual(expectedSlotEnd.toISOString())
      })

      it('deve retornar slots livres com múltiplos bookings', () => {
        // Arrange
        const expectedSlot1Start = createFutureDate(0, 12)
        const expectedSlot1End = createFutureDate(0, 13)
        const expectedSlot2Start = createFutureDate(0, 15)
        const expectedSlot2End = createFutureDate(0, 16)
        const expectedSlot3Start = createFutureDate(0, 18)
        const expectedSlot3End = createFutureDate(0, 22)

        // Act
        const freeSlots = scheduleWithMultipleBookings.getFreeSlotsForDate(today, minDuration)

        // Assert
        expect(freeSlots).toHaveLength(3)
        expect(freeSlots[0].startTime).toEqual(expectedSlot1Start)
        expect(freeSlots[0].endTime).toEqual(expectedSlot1End)
        expect(freeSlots[1].startTime).toEqual(expectedSlot2Start)
        expect(freeSlots[1].endTime).toEqual(expectedSlot2End)
        expect(freeSlots[2].startTime).toEqual(expectedSlot3Start)
        expect(freeSlots[2].endTime).toEqual(expectedSlot3End)
      })

      it('deve retornar vazio se nenhum slot livre atender à duração mínima', () => {
        // Arrange
        const duration = 240

        // Act
        const freeSlots = scheduleWithFullDay.getFreeSlotsForDate(today, duration)

        // Assert
        expect(freeSlots).toHaveLength(0)
      })

      it('deve lidar com bookings que começam no início do horário de funcionamento', () => {
        // Arrange
        const scheduleWithStartBooking = RoomSchedule.hydrate([
          {
            bookingUID: v4(),
            screeningUID: ScreeningUID.create().value,
            startTime: createFutureDate(0, 10),
            endTime: createFutureDate(0, 12),
            type: BookingType.SCREENING,
          },
        ])
        const expectedSlotStart = createFutureDate(0, 12)
        const expectedSlotEnd = createFutureDate(0, 22)

        // Act
        const freeSlots = scheduleWithStartBooking.getFreeSlotsForDate(today, minDuration)

        // Assert
        expect(freeSlots).toHaveLength(1)
        expect(freeSlots[0].startTime).toEqual(expectedSlotStart)
        expect(freeSlots[0].endTime).toEqual(expectedSlotEnd)
      })

      it('deve lidar com bookings que terminam no fim do horário de funcionamento', () => {
        // Arrange
        const scheduleWithEndBooking = RoomSchedule.hydrate([
          {
            bookingUID: v4(),
            screeningUID: ScreeningUID.create().value,
            startTime: createFutureDate(0, 20),
            endTime: createFutureDate(0, 22),
            type: BookingType.SCREENING,
          },
        ])
        const expectedSlotStart = createFutureDate(0, 10)
        const expectedSlotEnd = createFutureDate(0, 20)

        // Act
        const freeSlots = scheduleWithEndBooking.getFreeSlotsForDate(today, minDuration)

        // Assert
        expect(freeSlots).toHaveLength(1)
        expect(freeSlots[0].startTime).toEqual(expectedSlotStart)
        expect(freeSlots[0].endTime).toEqual(expectedSlotEnd)
      })

      it('deve retornar um slot que atenda exatamente a duração mínima', () => {
        // Arrange
        const scheduleWithExactSlot = RoomSchedule.hydrate([
          {
            bookingUID: v4(),
            screeningUID: ScreeningUID.create().value,
            startTime: createFutureDate(0, 10),
            endTime: createFutureDate(0, 12),
            type: BookingType.SCREENING,
          },
          {
            bookingUID: v4(),
            screeningUID: ScreeningUID.create().value,
            startTime: createFutureDate(0, 13),
            endTime: createFutureDate(0, 22),
            type: BookingType.SCREENING,
          },
        ])
        const expectedSlotStart = createFutureDate(0, 12)
        const expectedSlotEnd = createFutureDate(0, 13)

        // Act
        const freeSlots = scheduleWithExactSlot.getFreeSlotsForDate(today, minDuration)

        // Assert
        expect(freeSlots).toHaveLength(1)
        expect(freeSlots[0].startTime).toEqual(expectedSlotStart)
        expect(freeSlots[0].endTime).toEqual(expectedSlotEnd)
      })

      it('deve funcionar corretamente para um dia diferente do dia atual do mock', () => {
        // Arrange
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        tomorrow.setHours(10, 0, 0, 0)

        const operatingStartTomorrow = new Date(tomorrow)
        operatingStartTomorrow.setHours(10, 0, 0, 0)
        const operatingEndTomorrow = new Date(tomorrow)
        operatingEndTomorrow.setHours(22, 0, 0, 0)

        const scheduleForTomorrow = RoomSchedule.hydrate([
          {
            bookingUID: v4(),
            screeningUID: ScreeningUID.create().value,
            startTime: createFutureDate(0, 14, 1),
            endTime: createFutureDate(0, 16, 1),
            type: BookingType.SCREENING,
          },
        ])

        const expectedSlot1Start = new Date(operatingStartTomorrow)
        const expectedSlot1End = new Date(createFutureDate(0, 14, 1))
        const expectedSlot2Start = new Date(createFutureDate(0, 16, 1))
        const expectedSlot2End = new Date(operatingEndTomorrow)

        // Act
        const freeSlots = scheduleForTomorrow.getFreeSlotsForDate(tomorrow, minDuration)

        // Assert
        expect(freeSlots).toHaveLength(2)
        expect(freeSlots[0].startTime.toISOString()).toEqual(expectedSlot1Start.toISOString())
        expect(freeSlots[0].endTime.toISOString()).toEqual(expectedSlot1End.toISOString())
        expect(freeSlots[1].startTime.toISOString()).toEqual(expectedSlot2Start.toISOString())
        expect(freeSlots[1].endTime.toISOString()).toEqual(expectedSlot2End.toISOString())
      })

      it('deve retornar slots diferentes com base na duração mínima', () => {
        // Arrange
        const shortDuration = 30 // 30 minutos
        const longDuration = 120 // 2 horas

        // Act
        const shortSlots = scheduleWithMultipleBookings.getFreeSlotsForDate(today, shortDuration)
        const longSlots = scheduleWithMultipleBookings.getFreeSlotsForDate(today, longDuration)

        // Assert
        expect(shortSlots.length).toBeGreaterThanOrEqual(longSlots.length)
        expect(
          longSlots.every((slot) => {
            const durationMinutes = (slot.endTime.getTime() - slot.startTime.getTime()) / 60000
            return durationMinutes >= longDuration
          })
        ).toBe(true)
      })

      it('deve retornar array vazio se a data for nula', () => {
        // Act
        const freeSlots = emptySchedule.getFreeSlotsForDate(null as any, minDuration)

        // Assert
        expect(freeSlots).toEqual([])
      })

      it('deve retornar array vazio se a duração mínima for 0, negativa ou nula', () => {
        // Act
        const freeSlots1 = emptySchedule.getFreeSlotsForDate(today, -30)
        const freeSlots2 = emptySchedule.getFreeSlotsForDate(today, 0)
        const freeSlots3 = emptySchedule.getFreeSlotsForDate(today, null as any)

        // Assert
        expect(freeSlots1).toEqual([])
        expect(freeSlots2).toEqual([])
        expect(freeSlots3).toEqual([])
      })

      it('deve lidar com bookings de diferentes tipos', () => {
        // Arrange
        const mixedSchedule = RoomSchedule.hydrate([
          {
            bookingUID: v4(),
            screeningUID: SCREENING_UID_1.value,
            startTime: START_TIME_1,
            endTime: END_TIME_1,
            type: BookingType.SCREENING,
          },
          {
            bookingUID: v4(),
            screeningUID: null,
            startTime: createFutureDate(0, 16),
            endTime: createFutureDate(0, 17),
            type: BookingType.CLEANING,
          },
        ])

        // Act
        const freeSlots = mixedSchedule.getFreeSlotsForDate(today, minDuration)

        // Assert
        expect(freeSlots.length).toBeGreaterThan(0)
        // Verifica se os slots não se sobrepõem com os bookings
        for (const slot of freeSlots) {
          const bookings = mixedSchedule.getAllBookingsData()
          for (const booking of bookings) {
            const hasOverlap = slot.startTime < booking.endTime && slot.endTime > booking.startTime
            expect(hasOverlap).toBe(false)
          }
        }
      })
    })
  })
})
