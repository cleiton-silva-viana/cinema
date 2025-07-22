import {
  ICreateScreeningInput,
  IHydrateScreeningInput,
  Screening,
  ScreeningAdministrativeStatus,
  ScreeningTimeStatus,
} from "./screening";
import { ScreeningUID } from "./value-object/screening.uid";
import { MovieUID } from "../../movie/entity/value-object/movie.uid";
import { RoomUID } from "../../room/entity/value-object/room.uid";
import { DisplayPeriod } from "../../movie/entity/value-object/display.period";
import { SeatLayout } from "../../room/entity/value-object/seat.layout";
import { SeatRow } from "../../room/entity/value-object/seat.row";
import { TicketUID } from "../../ticket/aggregate/value-object/ticket.uid";
import { FailureCode } from "../../../shared/failure/failure.codes.enum";
import { TechnicalError } from "../../../shared/error/technical.error";
import { v4 } from "uuid";

function createDate(
  dayOffset: number,
  hour: number,
  minutes: number = 0,
): Date {
  const date = new Date();
  date.setDate(date.getDate() + dayOffset);
  date.setHours(hour, minutes, 0, 0);
  return date;
}

function createValidSeatLayout(): SeatLayout {
  const seatRows = new Map<number, SeatRow>();
  seatRows.set(1, SeatRow.hydrate("F", ["A"]));
  seatRows.set(2, SeatRow.hydrate("F"));
  seatRows.set(3, SeatRow.hydrate("F"));
  seatRows.set(4, SeatRow.hydrate("F"));
  return SeatLayout.hydrate(seatRows);
}

function createValidDisplayPeriod(
  startDayOffset: number = 1,
  endDayOffset: number = 15,
): DisplayPeriod {
  const startDate = createDate(startDayOffset, 10);
  const endDate = createDate(endDayOffset, 22);
  return DisplayPeriod.create(startDate, endDate).value;
}

function createDefaultSeatLayoutData(): Array<{
  rowNumber: number;
  lastLetterColumn: string;
  preferentialSeats: string[];
}> {
  return [
    { rowNumber: 1, lastLetterColumn: "F", preferentialSeats: ["A"] },
    { rowNumber: 2, lastLetterColumn: "F", preferentialSeats: [] },
    { rowNumber: 3, lastLetterColumn: "D", preferentialSeats: ["B", "C"] },
  ];
}

function createValidInstance(
  options: Partial<IHydrateScreeningInput> = {},
): Screening {
  const defaultDisplayPeriod = createValidDisplayPeriod();

  const defaults: IHydrateScreeningInput = {
    uid: v4(),
    movieUID: MovieUID.create().value,
    roomUID: RoomUID.create().value,
    administrativeStatus: ScreeningAdministrativeStatus.SCHEDULED,
    bookedSeatsObj: {},
    layout: createDefaultSeatLayoutData(),
    startsIn: defaultDisplayPeriod.startDate,
    endsIn: defaultDisplayPeriod.endDate,
  };

  // Mescla os padrões com as opções fornecidas
  const params: IHydrateScreeningInput = {
    ...defaults,
    ...options,
  };

  return Screening.hydrate(params);
}

describe("Screening", () => {
  let movieUID: MovieUID;
  let roomUID: RoomUID;
  let displayPeriod: DisplayPeriod;
  let layout: SeatLayout;
  let ticketUID: TicketUID;

  beforeEach(() => {
    movieUID = MovieUID.create();
    roomUID = RoomUID.create();
    displayPeriod = createValidDisplayPeriod();
    layout = createValidSeatLayout();
    ticketUID = TicketUID.create();
  });

  describe("Static Methods", () => {
    describe("create", () => {
      it("deve criar uma exibição (Screening) válida com valores mínimos", () => {
        // Act
        const result = Screening.create({
          movieUID,
          roomUID,
          displayPeriod,
          layout,
        });

        // Assert
        expect(result.invalid).toBe(false);
        const screening = result.value;
        expect(screening).toBeInstanceOf(Screening);
        expect(screening.uid).toBeInstanceOf(ScreeningUID);
        expect(screening.movieUID).toBe(movieUID);
        expect(screening.roomUID).toBe(roomUID);
        expect(screening.administrativeStatus).toBe(
          ScreeningAdministrativeStatus.SCHEDULED,
        );
        expect(screening.startDate).toEqual(displayPeriod.startDate);
        expect(screening.endDate).toEqual(displayPeriod.endDate);
        expect(screening.bookedSeats).toEqual([]);
        expect(screening.status).toBe(ScreeningTimeStatus.SCHEDULED); // Assumindo que displayPeriod.screeningStatus é PRESALE
      });

      describe("casos de falha", () => {
        const failureCases = [
          {
            scenario: "deve falhar se movieUID for nulo",
            input: { movieUID: null as any },
          },
          {
            scenario: "deve falhar se roomUID for nulo",
            input: { roomUID: null as any },
          },
          {
            scenario: "deve falhar se displayPeriod for nulo",
            input: { displayPeriod: null as any },
          },
          {
            scenario: "deve falhar se layout for nulo",
            input: { layout: null as any },
          },
        ];

        failureCases.forEach(({ scenario, input }) => {
          it(scenario, () => {
            // Arrange
            const params: ICreateScreeningInput = {
              movieUID: movieUID,
              roomUID: roomUID,
              displayPeriod: displayPeriod,
              layout: layout,
              ...input,
            };

            // Act
            const result = Screening.create(params);

            // Assert
            expect(result.invalid).toBe(true);
            expect(result.failures[0].code).toBe(
              FailureCode.MISSING_REQUIRED_DATA,
            );
          });
        });
      });
    });

    describe("hydrate", () => {
      const validHydrateParams = (): IHydrateScreeningInput => {
        return {
          uid: ScreeningUID.create().value,
          movieUID: MovieUID.create().value,
          roomUID: RoomUID.create().value,
          administrativeStatus: ScreeningAdministrativeStatus.SCHEDULED,
          bookedSeatsObj: { "1A": TicketUID.create().value },
          layout: [
            { rowNumber: 1, lastLetterColumn: "F", preferentialSeats: ["A"] },
            { rowNumber: 2, lastLetterColumn: "F", preferentialSeats: ["A"] },
            { rowNumber: 3, lastLetterColumn: "F", preferentialSeats: ["A"] },
            { rowNumber: 4, lastLetterColumn: "F", preferentialSeats: ["A"] },
          ],
          startsIn: createDate(1, 10),
          endsIn: createDate(15, 12),
        } as unknown as IHydrateScreeningInput;
      };

      it("deve hidratar uma exibição (Screening) corretamente", () => {
        // Arrange
        const params: IHydrateScreeningInput = validHydrateParams();

        // Act
        const screening = Screening.hydrate(params);

        // Assert
        expect(screening).toBeInstanceOf(Screening);
        expect(screening.uid.value).toBe(params.uid);
        expect(screening.movieUID.value).toBe(params.movieUID);
        expect(screening.roomUID.value).toBe(params.roomUID);
        expect(screening.administrativeStatus).toBe(
          params.administrativeStatus,
        );
        expect(screening.startDate).toEqual(params.startsIn);
        expect(screening.endDate).toEqual(params.endsIn);
        expect(screening.bookedSeats).toEqual(["1A"]);
        expect(screening.status).toBe(ScreeningTimeStatus.SCHEDULED);
      });

      describe("casos de falha", () => {
        const nullCases = [
          { scenario: "uid é nulo", input: { uid: null as any } },
          { scenario: "movie uid é nulo", input: { movieUID: null as any } },
          { scenario: "room uid é nulo", input: { roomUID: null as any } },
          {
            scenario: "administrative status é nulo",
            input: { administrativeStatus: null as any },
          },
          { scenario: "layout é nulo", input: { layout: null as any } },
          { scenario: "startsIn é nulo", input: { startsIn: null as any } },
          { scenario: "endsIn é nulo", input: { endsIn: null as any } },
          {
            scenario: "bookedSeatsObj é nulo",
            input: { bookedSeatsObj: null as any },
          },
        ];

        nullCases.forEach(({ scenario, input }) => {
          it(scenario, () => {
            // Arrange
            const params = { ...validHydrateParams(), ...input };

            // Act & Assert
            expect(() => Screening.hydrate(params)).toThrow(TechnicalError);

            expect(() => Screening.hydrate(params)).toThrow(
              FailureCode.MISSING_REQUIRED_DATA,
            );
          });
        });
      });
    });
  });

  describe("Instance Methods", () => {
    let screening: Screening;

    beforeEach(() => {
      screening = createValidInstance();
    });

    describe("status", () => {
      const scenarios = [
        {
          scenario: "deve retornar SCHEDULED se estiver agendado para o futuro",
          startsIn: createDate(1, 10),
          endsIn: createDate(1, 12),
          expectedStatus: ScreeningTimeStatus.SCHEDULED,
        },
        {
          scenario: "deve retornar FINALIZED se o período de exibição terminou",
          startsIn: createDate(-2, 10),
          endsIn: createDate(-2, 12),
          expectedStatus: ScreeningTimeStatus.FINALIZED,
        },
        {
          scenario:
            "deve retornar IN_PROGRESS se estiver dentro do período de exibição",
          startsIn: createDate(-1, 10),
          endsIn: createDate(1, 12),
          expectedStatus: ScreeningTimeStatus.IN_PROGRESS,
        },
      ];
      scenarios.forEach(({ scenario, startsIn, endsIn, expectedStatus }) => {
        it(scenario, () => {
          // Arrange
          const instance = createValidInstance({
            startsIn: startsIn,
            endsIn: endsIn,
          });

          // Act & Assert
          expect(instance.status).toBe(expectedStatus);
        });
      });

      it("deve retornar CANCELLED se _administrativeStatus for CANCELLED", () => {
        // Act
        const instance = createValidInstance({
          administrativeStatus: ScreeningAdministrativeStatus.CANCELLED,
        });

        // Act & Assert
        expect(instance.status).toBe(ScreeningAdministrativeStatus.CANCELLED);
      });
    });

    describe("cancel", () => {
      it("deve cancelar uma exibição agendada com sucesso", () => {
        // Act
        const result = screening.cancel();

        // Asset
        expect(result.invalid).toBe(false);
        expect(result.value.administrativeStatus).toBe(
          ScreeningAdministrativeStatus.CANCELLED,
        );
        expect(result.value.status).toBe(
          ScreeningAdministrativeStatus.CANCELLED,
        );
      });

      describe("casos de falha", () => {
        const failCases = [
          {
            scenario:
              "deve falhar ao tentar cancelar uma exibição já cancelada",
            input: {
              administrativeStatus: ScreeningAdministrativeStatus.CANCELLED,
            },
            expectedCode:
              FailureCode.SCREENING_CANNOT_CANCEL_ACTIVE_OR_FINALIZED,
          },
          {
            scenario:
              "deve falhar ao tentar cancelar uma exibição em progresso",
            input: {
              startsIn: createDate(0, -1),
              endsIn: createDate(0, 1),
            },
            expectedCode:
              FailureCode.SCREENING_CANNOT_CANCEL_ACTIVE_OR_FINALIZED,
          },
          {
            scenario:
              "deve falhar ao tentar cancelar uma exibição já concluida",
            input: {
              startsIn: createDate(-1, 10),
              endsIn: createDate(-1, 12),
              administrativeStatus: ScreeningAdministrativeStatus.SCHEDULED,
            },
            expectedCode:
              FailureCode.SCREENING_CANNOT_CANCEL_ACTIVE_OR_FINALIZED,
          },
        ];

        failCases.forEach(({ scenario, input, expectedCode }) => {
          it(scenario, () => {
            // Arrange
            const instance = createValidInstance({ ...input });

            // Act
            const result = instance.cancel();

            // Assert
            expect(result.invalid).toBe(true);
            expect(result.failures[0].code).toBe(expectedCode);
          });
        });
      });
    });

    describe("isSeatAvailable", () => {
      it("deve retornar true se o assento existir e estiver disponível", () => {
        // Act
        const result = screening.isSeatAvailable(1, "A");

        // Assert
        expect(result.invalid).toBe(false);
        expect(result.value).toBe(true);
      });

      it("deve retornar false se o assento existir mas estiver reservado", () => {
        // Arrange
        const instance = createValidInstance({
          bookedSeatsObj: { "1A": v4() },
        });

        // Act
        const result = instance.isSeatAvailable(1, "A");

        // Assert
        expect(result.invalid).toBe(false);
        expect(result.value).toBe(false);
      });

      describe("casos com valores inválidos", () => {
        const invalidCases = [
          {
            scenario: '"deve falhar se row for nulo',
            input: { row: null as any, letter: "A" },
            expectedCode: FailureCode.MISSING_REQUIRED_DATA,
          },
          {
            scenario: "deve falhar se letter for nulo",
            input: { row: 1, letter: null as any },
            expectedCode: FailureCode.MISSING_REQUIRED_DATA,
          },
          {
            scenario: "deve falhar se o assento não existir no layout",
            input: { row: 1, letter: "z" },
            expectedCode: FailureCode.SEAT_DOES_NOT_EXIST,
          },
        ];
        invalidCases.forEach(({ scenario, input, expectedCode }) => {
          it(scenario, () => {
            // Act
            const result = screening.isSeatAvailable(input.row, input.letter);

            // Assert
            expect(result.invalid).toBe(true);
            expect(result.failures[0].code).toBe(expectedCode);
          });
        });
      });
    });

    describe("bookSeat", () => {
      it("deve reservar um assento com sucesso", () => {
        const result = screening.bookSeat(1, "A", ticketUID);
        expect(result.invalid).toBe(false);
        const updatedScreening = result.value;
        expect(updatedScreening.bookedSeats).toContain("1A");
        expect(updatedScreening["_bookedSeats"].get("1A")).toBe(ticketUID);
      });

      describe("casos com entradas nulas", () => {
        const nullCases = [
          {
            scenario: "deve falhar se row for nulo",
            row: null as any,
            letter: "a",
            ticketUID: v4(),
          },
          {
            scenario: "deve falhar se letter for nulo",
            row: 1,
            letter: null as any,
            ticketUID: v4(),
          },
          {
            scenario: "deve falhar se ticketUID for nulo",
            row: 1,
            letter: "A",
            ticketUID: null as any,
          },
        ];

        nullCases.forEach(({ scenario, row, letter, ticketUID }) => {
          it(scenario, () => {
            // Arrange
            const instance = createValidInstance();

            // Act
            const result = instance.bookSeat(row, letter, ticketUID);

            // Assert
            expect(result.invalid).toBe(true);
            expect(result.failures[0].code).toBe(
              FailureCode.MISSING_REQUIRED_DATA,
            );
          });
        });
      });

      it("deve falhar se a exibição não estiver disponível para reserva (ex: CANCELLED)", () => {
        // Arrange
        const instance = createValidInstance({
          administrativeStatus: ScreeningAdministrativeStatus.CANCELLED,
        });

        // Act
        const result = instance.bookSeat(1, "A", ticketUID);

        // Assert
        expect(result.invalid).toBe(true);
        expect(result.failures[0].code).toBe(
          FailureCode.SCREENING_NOT_AVAILABLE_FOR_BOOKING,
        );
      });

      it("deve falhar se a exibição não estiver disponível para reserva (ex: IN_PROGRESS)", () => {
        // Arrange
        const instance = createValidInstance({
          startsIn: createDate(0, -1),
          endsIn: createDate(0, 1),
        });

        // Act
        const result = instance.bookSeat(1, "A", ticketUID);

        // Assert
        expect(result.invalid).toBe(true);
        expect(result.failures[0].code).toBe(
          FailureCode.SCREENING_NOT_AVAILABLE_FOR_BOOKING,
        );
      });

      it("deve falhar se o assento não existir", () => {
        // Act
        const result = screening.bookSeat(99, "Z", ticketUID);

        // Assert
        expect(result.invalid).toBe(true);
        expect(result.failures[0].code).toBe(FailureCode.SEAT_DOES_NOT_EXIST);
      });

      it("deve falhar se o assento já estiver reservado", () => {
        // Arrange
        const instance = createValidInstance({
          bookedSeatsObj: { "1A": v4() },
        });

        // Act
        const result = instance.bookSeat(1, "A", TicketUID.create());

        // Assert
        expect(result.invalid).toBe(true);
        expect(result.failures[0].code).toBe(FailureCode.SEAT_ALREADY_BOOKED);
      });
    });

    describe("cancelSeatBooking", () => {
      let bookedScreening: Screening;
      const seatRow = 1;
      const seatLetter = "A";

      beforeEach(() => {
        bookedScreening = screening.bookSeat(
          seatRow,
          seatLetter,
          ticketUID,
        ).value;
      });

      it("deve cancelar a reserva de um assento com sucesso", () => {
        // Arange
        const instance = createValidInstance({
          bookedSeatsObj: { "1A": v4() },
        });

        // Act
        const result = instance.cancelSeatBooking(1, "a");

        // Assert
        expect(result.invalid).toBe(false);
        expect(result.value.bookedSeats).not.toContain("1A");
      });

      describe("casos onde o input é um valor nulo", () => {
        const nullCases = [
          {
            scenario: "deve falhar se row for nulo",
            row: null as any,
            letter: "a",
          },
          {
            scenario: "deve falhar se letter for nulo",
            row: 1,
            letter: null as any,
          },
        ];

        nullCases.forEach(({ scenario, row, letter }) => {
          it(scenario, () => {
            // Act
            const result = bookedScreening.cancelSeatBooking(row, letter);

            // Assert
            expect(result.invalid).toBe(true);
            expect(result.failures[0].code).toBe(
              FailureCode.MISSING_REQUIRED_DATA,
            );
          });
        });
      });

      it("deve falhar se a exibição não estiver disponível para cancelamento de reserva (ex: FINALIZED)", () => {
        // Arrange
        const instance = createValidInstance({
          startsIn: createDate(-1, 10),
          endsIn: createDate(-1, 12),
        });

        // Act
        const result = instance.cancelSeatBooking(seatRow, seatLetter);

        // Assert
        expect(result.invalid).toBe(true);
        expect(result.failures[0].code).toBe(
          FailureCode.SCREENING_NOT_AVAILABLE_FOR_BOOKING_CANCELLATION,
        );
      });

      it("deve falhar se o assento não existir", () => {
        // Act
        const result = bookedScreening.cancelSeatBooking(99, "Z");

        // Assert
        expect(result.invalid).toBe(true);
        expect(result.failures[0].code).toBe(FailureCode.SEAT_DOES_NOT_EXIST);
      });

      it("deve falhar se o assento não estiver reservado", () => {
        // Act
        const result = screening.cancelSeatBooking(seatRow, "B"); // Assento 1B não está reservado

        // Assert
        expect(result.invalid).toBe(true);
        expect(result.failures[0].code).toBe(FailureCode.SEAT_NOT_BOOKED);
      });
    });
  });
});
