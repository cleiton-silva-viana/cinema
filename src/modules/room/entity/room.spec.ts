import {
  ICreateRoomInput,
  ICreateScreenInput,
  IHydrateRoomInput,
  ISeatRowConfiguration,
  Room,
  RoomAdministrativeStatus,
} from "./room";
import { FailureCode } from "../../../shared/failure/failure.codes.enum";
import { TechnicalError } from "../../../shared/error/technical.error";
import { ScreeningUID } from "../../screening/aggregate/value-object/screening.uid";
import { BookingType } from "./value-object/booking.slot";
import { v4 } from "uuid";

function createDate(day: number, hour: number, minutes: number = 0): Date {
  const date = new Date();
  date.setDate(date.getDate() + day);
  date.setHours(hour);
  date.setMinutes(minutes);
  return date;
}

describe("Room", () => {
  const createValidSeatConfig = (): ISeatRowConfiguration[] => [
    {
      rowNumber: 1,
      lastColumnLetter: "E", // 5 assentos (A-E)
      preferentialSeatLetters: ["A", "B"],
    },
    {
      rowNumber: 2,
      lastColumnLetter: "F", // 6 assentos (A-F)
      preferentialSeatLetters: ["C"],
    },
    {
      rowNumber: 3,
      lastColumnLetter: "G", // 7 assentos (A-G)
    },
    {
      rowNumber: 4,
      lastColumnLetter: "H", // 8 assentos (A-H)
    },
  ];

  const createValidScreenInput = (): ICreateScreenInput => ({
    size: 20,
    type: "2D",
  });

  describe("Métodos Estáticos", () => {
    describe("create", () => {
      const PARAMS: ICreateRoomInput = {
        identifier: 1,
        seatConfig: createValidSeatConfig(),
        screen: createValidScreenInput(),
        status: RoomAdministrativeStatus.AVAILABLE,
      };

      it("deve criar uma sala válida com valores mínimos", () => {
        // Act
        const result = Room.create(PARAMS);

        // Assert
        expect(result.invalid).toBe(false);

        const room = result.value;
        expect(room.identifier.value).toBe(PARAMS.identifier);
        expect(room.status).toBe(RoomAdministrativeStatus.AVAILABLE);
        expect(room.seatLayoutInfo.totalSeats).toBe(26); // 5+6+7+8 = 26
      });

      describe("deve falhar quando os dados de entrada são inválidos", () => {
        const testCases = [
          {
            scenario: "configuração de assentos for vazia",
            input: { seatConfig: [] as ISeatRowConfiguration[] },
            errorCode: FailureCode.OBJECT_IS_EMPTY,
          },
          {
            scenario: "identificador for inválido",
            input: { identifier: -1 },
            errorCode: FailureCode.VALUE_OUT_OF_RANGE,
          },
          {
            scenario: "status for inválido",
            input: { status: "INVALID_STATUS" },
            errorCode: FailureCode.INVALID_ENUM_VALUE,
          },
          {
            scenario: "configuração de tela for inválida",
            input: { screen: { size: -10, type: "2d" } },
            errorCode: FailureCode.VALUE_OUT_OF_RANGE,
          },
          {
            scenario: "configuração de assentos tem fileiras com zero colunas",
            input: {
              seatConfig: [
                {
                  rowNumber: 1,
                  lastColumnLetter: "",
                },
              ],
            },
            errorCode: FailureCode.LENGTH_OUT_OF_RANGE,
          },
        ];

        testCases.forEach(({ scenario, input, errorCode }) => {
          it(scenario, () => {
            // Arrange
            const params: ICreateRoomInput = { ...PARAMS, ...input };

            // Act
            const result = Room.create(params);

            // Assert
            expect(result.invalid).toBe(true);
            expect(result.failures[0].code).toBe(errorCode);
            //  expect(result.failures.some(failure => failure.code === errorCode)).toBe(true); // <<<
          });
        });
      });
    });

    describe("hydrate", () => {
      const PARAMS: IHydrateRoomInput = {
        roomUID: "room-123",
        identifier: 1,
        layout: {
          seatRows: [
            {
              rowNumber: 1,
              lastColumnLetter: "E", // 5
              preferentialSeatLetters: [],
            },
            {
              rowNumber: 2,
              lastColumnLetter: "F", // 6
              preferentialSeatLetters: [],
            },
            {
              rowNumber: 3,
              lastColumnLetter: "G", // 7
              preferentialSeatLetters: [],
            },
          ],
        },
        schedule: [],
        screen: {
          size: 20,
          type: "2D",
        },
        status: RoomAdministrativeStatus.AVAILABLE,
      };

      it("deve criar uma sala válida a partir de dados primitivos", () => {
        // Arrange
        const prefRow1 = ["A", "B"];
        const prefRow2 = ["C", "D"];
        const p = { ...PARAMS };
        p.layout.seatRows[0].preferentialSeatLetters = prefRow1;
        p.layout.seatRows[1].preferentialSeatLetters = prefRow2;

        // Act
        const room = Room.hydrate(p);

        // Assert
        expect(room.identifier.value).toBe(p.identifier);
        expect(room.status).toBe(p.status);
        expect(room.seatLayoutInfo.rows).toBe(PARAMS.layout.seatRows.length);
        expect(room.seatLayoutInfo.totalSeats).toBe(5 + 6 + 7);
        expect(room.preferentialSeatsCount).toBe(4);
      });

      it("deve lançar erro técnico quando o parâmeto `params` é um objeto nulo", () => {
        expect(() => Room.hydrate(null as any)).toThrow(TechnicalError);
      });

      describe("deve lançar erro técnico quando dados obrigatórios estiverem ausentes", () => {
        const failureCases = [
          {
            scenario: "identifier é nulo",
            params: { identifier: null as unknown as number },
          },
          {
            scenario: "room uid é nulo",
            params: { roomUID: null as unknown as string },
          },
          {
            scenario: "layout é nulo",
            params: { layout: null as any },
          },
          {
            scenario: "screen é nulo",
            params: { screen: null as any },
          },
          {
            scenario: "status é nulo",
            params: { status: null as unknown as string },
          },
        ];

        failureCases.forEach(({ scenario, params }) => {
          // Arrange
          it(scenario, () => {
            const input = { ...PARAMS, ...params };

            // Act & Assert
            expect(() => Room.hydrate(input as any)).toThrow();
          });
        });
      });
    });
  });

  describe("Métodos de Instância", () => {
    let room: Room;
    let screeningUID: ScreeningUID;
    const SCREENING_UID_1 = ScreeningUID.create();
    const BOOKING_UID_FOR_SCREENING_1 = v4();
    const BOOKING_UID_FOR_CLEANING = v4();

    const PARAMS_WITH_SCHEDULE: IHydrateRoomInput = {
      roomUID: "room-123",
      identifier: 1,
      layout: {
        seatRows: [
          {
            rowNumber: 1,
            lastColumnLetter: "E",
            preferentialSeatLetters: ["A", "B"],
          },
          {
            rowNumber: 2,
            lastColumnLetter: "F",
            preferentialSeatLetters: ["C"],
          },
          {
            rowNumber: 3,
            lastColumnLetter: "G",
            preferentialSeatLetters: [],
          },
        ],
      },
      schedule: [
        {
          screeningUID: SCREENING_UID_1.value,
          type: BookingType.SCREENING,
          bookingUID: BOOKING_UID_FOR_SCREENING_1,
          startTime: createDate(10, 10),
          endTime: createDate(10, 12),
        },
        {
          screeningUID: SCREENING_UID_1.value,
          type: BookingType.CLEANING,
          bookingUID: BOOKING_UID_FOR_CLEANING,
          startTime: createDate(10, 12),
          endTime: createDate(10, 12, 30),
        },
      ],
      screen: {
        size: 20,
        type: "2D",
      },
      status: RoomAdministrativeStatus.AVAILABLE,
    };
    const PARAMS_WITHOUT_SCHEDULE: IHydrateRoomInput = {
      roomUID: "room-123",
      identifier: 1,
      layout: {
        seatRows: [
          {
            rowNumber: 1,
            lastColumnLetter: "E",
            preferentialSeatLetters: ["A", "B"],
          },
          {
            rowNumber: 2,
            lastColumnLetter: "F",
            preferentialSeatLetters: ["C"],
          },
          {
            rowNumber: 3,
            lastColumnLetter: "G",
            preferentialSeatLetters: [],
          },
        ],
      },
      schedule: [],
      screen: {
        size: 20,
        type: "2D",
      },
      status: RoomAdministrativeStatus.AVAILABLE,
    };

    beforeEach(() => {
      room = Room.hydrate(PARAMS_WITH_SCHEDULE);
      screeningUID = ScreeningUID.create();
    });

    describe("changeStatus", () => {
      describe("casos de sucesso", () => {
        const successCases = [
          {
            scenario: "deve alterar o status da sala de AVAILABLE para CLOSE",
            initialStatus: RoomAdministrativeStatus.AVAILABLE,
            newStatus: RoomAdministrativeStatus.CLOSED,
          },
          {
            scenario: "deve alterar o status da sala de CLOSE para AVAILABLE",
            initialStatus: RoomAdministrativeStatus.CLOSED,
            newStatus: RoomAdministrativeStatus.AVAILABLE,
          },
        ];

        successCases.forEach(({ scenario, initialStatus, newStatus }) => {
          it(scenario, () => {
            // Arrange
            const p = { ...PARAMS_WITHOUT_SCHEDULE };
            p.status = initialStatus;
            const instance = Room.hydrate(p);

            // Act
            const result = instance.changeStatus(newStatus);

            // Assert
            expect(result.invalid).toBe(false);
            expect(result.value.status).toBe(newStatus);
          });
        });
      });

      describe("casos de falha", () => {
        const nullCases = [
          {
            scenario: "deve falhar quando novo status for um valor nulo",
            status: null as any,
            expectedErrorCode: FailureCode.MISSING_REQUIRED_DATA,
          },
          {
            scenario: "deve falhar quando novo status for um valor indefinido",
            status: undefined as any,
            expectedErrorCode: FailureCode.MISSING_REQUIRED_DATA,
          },
          {
            scenario: "deve falhar ao tentar alterar para um status inválido",
            status: "INVALID_STATUS",
            expectedErrorCode: FailureCode.INVALID_ENUM_VALUE,
          },
        ];
        nullCases.forEach(({ scenario, status, expectedErrorCode }) => {
          it(scenario, () => {
            // Act
            const result = room.changeStatus(status);

            // Assert
            expect(result.invalid).toBe(true);
            expect(result.failures.length).toBe(1);
            expect(result.failures[0].code).toBe(expectedErrorCode);
          });
        });

        it("deve falhar ao tentar fechar uma sala com bookings ativos", () => {
          // Arrange
          const instance = Room.hydrate(PARAMS_WITH_SCHEDULE);

          // Act
          const result = instance.changeStatus(RoomAdministrativeStatus.CLOSED);

          // Assert
          expect(result.invalid).toBe(true);
          expect(result.failures.length).toBe(1);
          expect(result.failures[0].code).toBe(
            FailureCode.ROOM_HAS_FUTURE_BOOKINGS,
          );
        });
      });
    });

    describe("getSeatLayoutInfo", () => {
      it("deve retornar informações detalhadas do layout", () => {
        // Act
        const info = room.seatLayoutInfo;

        // Assert
        expect(info.rows).toBe(3);
        expect(info.totalSeats).toBe(18); // 5 + 6 + 7
        expect(info.preferentialSeats).toBe(3); // 2 na primeira fileira + 1 na segunda

        expect(info.rowsInfo).toHaveLength(3);
        expect(info.rowsInfo[0]).toEqual({
          rowNumber: 1,
          seats: 5,
          preferentialSeats: ["A", "B"],
        });
        expect(info.rowsInfo[1]).toEqual({
          rowNumber: 2,
          seats: 6,
          preferentialSeats: ["C"],
        });
        expect(info.rowsInfo[2]).toEqual({
          rowNumber: 3,
          seats: 7,
          preferentialSeats: [],
        });
      });
    });

    describe("addScreening", () => {
      it("deve adicionar uma exibição com período de entrada, saída e higienização", () => {
        // Arrange
        const instance = Room.hydrate(PARAMS_WITHOUT_SCHEDULE);
        const screeningUID = ScreeningUID.create();
        const startTime = createDate(11, 13); // Dia 11, 13:00
        const duration = 140; // dia 11, 15:20

        // Act
        const result = instance.addScreening(screeningUID, startTime, duration);

        // Assert
        expect(result.invalid).toBe(false);
        const bookings = result.value.getAllBookings();
        expect(bookings.length).toBe(4); // (entrada + exibição + saída + higienização)
        expect(
          bookings.some(
            (b) =>
              b.type === BookingType.SCREENING &&
              b.screeningUID === screeningUID.value,
          ),
        ).toBe(true);
        expect(
          bookings.some(
            (b) =>
              b.type === BookingType.CLEANING &&
              b.screeningUID === screeningUID.value,
          ),
        ).toBe(true);
        expect(
          bookings.some(
            (b) =>
              b.type === BookingType.ENTRY_TIME &&
              b.screeningUID === screeningUID.value,
          ),
        ).toBe(true);
        expect(
          bookings.some(
            (b) =>
              b.type === BookingType.EXIT_TIME &&
              b.screeningUID === screeningUID.value,
          ),
        ).toBe(true);
      });

      it("deve falhar ao tentar agendar quando houver conflitos de horários", () => {
        // Arrange
        const startTime1 = createDate(10, 11); // 11:00 (conflito com agendamento existente)
        const duration = 120; //  13:00

        // Act
        const result = room.addScreening(
          ScreeningUID.create(),
          startTime1,
          duration,
        );

        // Assert
        expect(result.invalid).toBe(true);
        expect(result.failures[0].code).toBe(
          FailureCode.ROOM_NOT_AVAILABLE_FOR_PERIOD,
        );
      });

      describe("deve falhar ao tentar agendar com parâmetros inválidos", () => {
        const invalidCases = [
          {
            scenario: "screeningUID nulo",
            params: {
              screeningUID: null as any,
            },
            code: FailureCode.MISSING_REQUIRED_DATA,
          },
          {
            scenario: "screeningUID indefinido",
            params: {
              screeningUID: undefined as any,
            },
            code: FailureCode.MISSING_REQUIRED_DATA,
          },
          {
            scenario: "data de início nula",
            params: {
              startIn: null as any,
            },
            code: FailureCode.MISSING_REQUIRED_DATA,
          },
          {
            scenario: "duração nula",
            params: {
              duration: null as any,
            },
            code: FailureCode.MISSING_REQUIRED_DATA,
          },
          {
            scenario: "duração é um número negativo",
            params: {
              duration: -1,
            },
            code: FailureCode.DATE_WITH_INVALID_SEQUENCE,
          },
        ];

        invalidCases.forEach(({ scenario, params, code }) => {
          it(scenario, () => {
            // Arrange
            const input = {
              screeningUID: screeningUID,
              startIn: createDate(11, 16),
              duration: 180,
              ...params,
            };

            // Act
            const result = room.addScreening(
              input.screeningUID,
              input.startIn,
              input.duration,
            );

            // Assert
            expect(result.invalid).toBe(true);
            expect(result.failures[0].code).toBe(code);
          });
        });
      });
    });

    describe("scheduleMaintenance", () => {
      it("deve agendar manutenção em período disponível", () => {
        // Arrange
        const startTime = createDate(11, 15, 30); // Dia 10, 15:30
        const duration = 30;

        // Act
        const result = room.scheduleMaintenance(startTime, duration);

        // Assert
        expect(result.invalid).toBe(false);

        // Verificar se o novo agendamento foi adicionado
        const bookings = result.value.getAllBookings();
        const maintenance = bookings.find(
          (b) =>
            b.type === BookingType.MAINTENANCE &&
            b.startTime.getTime() === startTime.getTime(),
        );

        expect(maintenance).toBeDefined();
        expect(maintenance.type).toBe(BookingType.MAINTENANCE);
      });

      it("deve falhar ao tentar agendar manutenção em período indisponível", () => {
        // Arrange
        const startTime = createDate(10, 11); // Conflito com agendamento existente
        const duration = 60;

        // Act
        const result = room.scheduleMaintenance(startTime, duration);

        // Assert
        expect(result.invalid).toBe(true);
        expect(result.failures[0].code).toBe(
          FailureCode.ROOM_NOT_AVAILABLE_FOR_PERIOD,
        );
      });

      describe("deve falhar ao tentar agendar manutenção com parâmetros inválidos", () => {
        const invalidCases = [
          {
            scenario: "data de início nula",
            startTime: null as any,
            endTime: createDate(11, 16),
            expectedCode: FailureCode.MISSING_REQUIRED_DATA,
          },
          {
            scenario: "data de término nula",
            startTime: createDate(11, 13),
            endTime: null as any,
            expectedCode: FailureCode.MISSING_REQUIRED_DATA,
          },
          {
            scenario: "data de início posterior à data de término",
            startTime: createDate(11, 16),
            endTime: createDate(11, 13),
            expectedCode: FailureCode.DATE_WITH_INVALID_SEQUENCE,
          },
        ];

        invalidCases.forEach(
          ({ scenario, startTime, endTime, expectedCode }) => {
            it(scenario, () => {
              // Act
              const result = room.scheduleMaintenance(startTime, endTime);

              // Assert
              expect(result.invalid).toBe(true);
              expect(result.failures[0].code).toBe(expectedCode);
            });
          },
        );
      });
    });

    describe("scheduleCleaning", () => {
      it("agendamento com sucesso", () => {
        // Arrange
        const startTime = createDate(11, 13, 30); // Dia 11, 13:30
        const durationInMinutes = 30; // 30 minutos de limpeza

        // Act
        const result = room.scheduleCleaning(startTime, durationInMinutes);

        // Assert
        expect(result.invalid).toBe(false);
        const bookings = result.value.getAllBookings();
        const cleaning = bookings.find(
          (b) =>
            b.type === BookingType.CLEANING &&
            b.startTime.getTime() === startTime.getTime(),
        );
        expect(cleaning).toBeDefined();
        expect(cleaning.type).toBe(BookingType.CLEANING);
      });

      it("deve falhar ao tentar agendar limpeza em período indisponível", () => {
        // Arrange
        const startTime = createDate(10, 11); // Conflito com agendamento existente
        const durationInMinutes = 30; // 30 minutos de limpeza

        // Act
        const result = room.scheduleCleaning(startTime, durationInMinutes);

        // Assert
        expect(result.invalid).toBe(true);
        expect(result.failures[0].code).toBe(
          FailureCode.ROOM_NOT_AVAILABLE_FOR_PERIOD,
        );
      });

      describe("deve falhar ao tentar agendar limpeza com parâmetros inválidos", () => {
        const invalidCases = [
          {
            scenario: "data de início nula",
            startTime: null as any,
            durationInMinutes: 30,
            expectedCode: FailureCode.MISSING_REQUIRED_DATA,
          },
          {
            scenario: "duração nula",
            startTime: createDate(11, 13),
            durationInMinutes: null as any,
            expectedCode: FailureCode.MISSING_REQUIRED_DATA,
          },
          {
            scenario: "duração negativa",
            startTime: createDate(11, 13),
            durationInMinutes: -30,
            expectedCode: FailureCode.DATE_WITH_INVALID_SEQUENCE,
          },
        ];

        invalidCases.forEach(
          ({ scenario, startTime, durationInMinutes, expectedCode }) => {
            it(scenario, () => {
              // Act
              const result = room.scheduleCleaning(
                startTime,
                durationInMinutes,
              );

              // Assert
              expect(result.invalid).toBe(true);
              expect(result.failures[0].code).toBe(expectedCode);
            });
          },
        );
      });
    });

    describe("removeScreening", () => {
      it("deve remover exibição e sua higienização", () => {
        // Act
        const result = room.removeScreening(SCREENING_UID_1);

        // Assert
        expect(result.invalid).toBe(false);
        const newRoom = result.value;
        expect(newRoom.findBookingDataByUID(BOOKING_UID_FOR_SCREENING_1)).toBe(
          undefined,
        );
        expect(newRoom.getAllBookings().length).toBe(0);
      });

      describe("cenários de falha", () => {
        const failureCases = [
          {
            scenario: "deve falhar quando o screeningUID for nulo",
            value: null as any,
            expectedCode: FailureCode.MISSING_REQUIRED_DATA,
          },
          {
            scenario: "deve falhar quando o screeningUID for undefined",
            value: undefined as any,
            expectedCode: FailureCode.MISSING_REQUIRED_DATA,
          },
          {
            scenario: "deve falhar quando a exibição não existir",
            value: ScreeningUID.create(),
            expectedCode: FailureCode.BOOKING_NOT_FOUND_FOR_SCREENING,
          },
        ];
        failureCases.forEach(({ scenario, value, expectedCode }) => {
          it(scenario, () => {
            // Act
            const result = room.removeScreening(value);

            // Assert
            expect(result.invalid).toBe(true);
            expect(result.failures[0].code).toBe(expectedCode);
          });
        });
      });
    });

    describe("removeBookingByUID", () => {
      it("deve remover um booking pelo UID", () => {
        // Act
        const result = room.removeBookingByUID(BOOKING_UID_FOR_SCREENING_1);

        // Assert
        expect(result.invalid).toBe(false);
        const newRoom = result.value;
        expect(
          newRoom.findBookingDataByUID(BOOKING_UID_FOR_SCREENING_1),
        ).toBeUndefined();

        // Verificar se apenas o booking específico foi removido
        const bookings = newRoom.getAllBookings();
        expect(bookings.length).toBe(1); // Deve restar apenas o booking de limpeza
        expect(bookings[0].bookingUID).toBe(BOOKING_UID_FOR_CLEANING);
      });

      describe("deve falhar quando o bookingUID for inválido", () => {
        // Arrange
        const invalidCases = [
          {
            scenario: "bookingUID nulo",
            bookingUID: null as any,
            expectedCode: FailureCode.MISSING_REQUIRED_DATA,
          },
          {
            scenario: "bookingUID indefinido",
            bookingUID: undefined as any,
            expectedCode: FailureCode.MISSING_REQUIRED_DATA,
          },
          {
            scenario: "bookingUID inexistente",
            bookingUID: "booking-inexistente",
            expectedCode: FailureCode.BOOKING_NOT_FOUND,
          },
        ];

        // Act & Assert
        invalidCases.forEach(({ scenario, bookingUID, expectedCode }) => {
          it(scenario, () => {
            // Act
            const result = room.removeBookingByUID(bookingUID);

            // Assert
            expect(result.invalid).toBe(true);
            expect(result.failures[0].code).toBe(expectedCode);
          });
        });
      });
    });
  });
});
