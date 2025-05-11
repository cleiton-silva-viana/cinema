import {
  Room,
  RoomStatus,
  ISeatRowConfiguration,
  ICreateScreenInput,
  ICreateRoomInput,
  IHydrateRoomInput,
} from "./room";
import { FailureCode } from "../../../shared/failure/failure.codes.enum";
import { TechnicalError } from "../../../shared/error/technical.error";

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
        status: RoomStatus.AVAILABLE,
      };

      it("deve criar uma sala válida com valores mínimos", () => {
        // Act
        const result = Room.create(PARAMS);

        // Assert
        expect(result.invalid).toBe(false);
        expect(result.value.identifier.value).toBe(PARAMS.identifier);
        expect(result.value.layout.seatRows.size).toBe(
          PARAMS.seatConfig.length,
        );
        expect(result.value.layout.totalCapacity).toBe(26); // 5+6+7+8 = 26
        expect(result.value.status).toBe(RoomStatus.AVAILABLE);
        expect(result.value.layout.preferentialSeatsByRow.get(1)).toContain(
          "A",
        );
        expect(result.value.layout.preferentialSeatsByRow.get(1)).toContain(
          "B",
        );
        expect(result.value.layout.preferentialSeatsByRow.get(2)).toContain(
          "C",
        );
      });

      describe("deve falhar quando os dados de entrada são inválidos", () => {
        const testCases = [
          {
            scenario: "configuração de assentos for vazia",
            input: { seatConfig: [] as ISeatRowConfiguration[] },
            errorCode: FailureCode.OBJECT_IS_EMPTY,
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
        screen: {
          size: 20,
          type: "2D",
        },
        status: RoomStatus.AVAILABLE,
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
        expect(room).toBeInstanceOf(Room);
        expect(room.identifier.value).toBe(p.identifier);
        expect(room.layout.seatRows.size).toBe(p.layout.seatRows.length);
        expect(room.status).toBe(p.status);
        expect(room.layout.totalCapacity).toBe(5 + 6 + 7);
        expect(room.layout.preferentialSeatsByRow.get(1)).toEqual(prefRow1);
        expect(room.layout.preferentialSeatsByRow.get(2)).toEqual(prefRow2);
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
    let ROOM: Room;
    const PARAMS: IHydrateRoomInput = {
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
      screen: {
        size: 20,
        type: "2D",
      },
      status: RoomStatus.AVAILABLE,
    };

    beforeEach(() => {
      ROOM = Room.hydrate(PARAMS);
    });

    describe("changeStatus", () => {
      describe("casos de sucesso", () => {
        const successCases = [
          {
            scenario: "deve alterar o status da sala para MAINTENANCE",
            initialStatus: RoomStatus.AVAILABLE,
            newStatus: RoomStatus.MAINTENANCE,
          },
          {
            scenario: "deve alterar o status da sala para CLEANING",
            initialStatus: RoomStatus.AVAILABLE,
            newStatus: RoomStatus.CLEANING,
          },
          {
            scenario:
              "deve alterar o status da sala para AVAILABLE após limpeza",
            initialStatus: RoomStatus.CLEANING,
            newStatus: RoomStatus.AVAILABLE,
          },
        ];

        successCases.forEach(({ scenario, initialStatus, newStatus }) => {
          it(scenario, () => {
            // Arrange
            const input = {
              ...PARAMS,
              status: initialStatus,
            };
            const testRoom = Room.hydrate(input);

            // Act
            const result = testRoom.changeStatus(newStatus);

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
        ];
        nullCases.forEach(({ scenario, status, expectedErrorCode }) => {
          it(scenario, () => {
            // Act
            const result = ROOM.changeStatus(status);

            // Assert
            expect(result.invalid).toBe(true);
            expect(result.failures.length).toBe(1);
            expect(result.failures[0].code).toBe(expectedErrorCode);
          });
        });

        it("deve falhar ao tentar alterar para um status inválido", () => {
          // Act
          const result = ROOM.changeStatus("INVALID_STATUS");

          // Assert
          expect(result.invalid).toBe(true);
          expect(result.failures.length).toBe(1);
          expect(result.failures[0].code).toBe(FailureCode.INVALID_ENUM_VALUE);
        });
      });
    });

    describe("hasSeat", () => {
      it("deve retornar true quando o assento existe", () => {
        // Act & Assert
        expect(ROOM.layout.hasSeat(1, "A")).toBe(true);
        expect(ROOM.layout.hasSeat(1, "E")).toBe(true);
        expect(ROOM.layout.hasSeat(2, "F")).toBe(true);
        expect(ROOM.layout.hasSeat(3, "G")).toBe(true);
      });

      it("deve retornar false quando o assento não existe", () => {
        // Act & Assert
        expect(ROOM.layout.hasSeat(1, "F")).toBe(false);
        expect(ROOM.layout.hasSeat(2, "G")).toBe(false);
        expect(ROOM.layout.hasSeat(4, "A")).toBe(false);
        expect(ROOM.layout.hasSeat(1, "Z")).toBe(false);
      });
    });

    describe("isPreferentialSeat", () => {
      it("deve retornar true quando o assento é preferencial", () => {
        // Act & Assert
        expect(ROOM.layout.isPreferentialSeat(1, "A")).toBe(true);
        expect(ROOM.layout.isPreferentialSeat(1, "B")).toBe(true);
        expect(ROOM.layout.isPreferentialSeat(2, "C")).toBe(true);
      });

      it("deve retornar false quando o assento não é preferencial", () => {
        // Act & Assert
        expect(ROOM.layout.isPreferentialSeat(1, "C")).toBe(false);
        expect(ROOM.layout.isPreferentialSeat(2, "A")).toBe(false);
        expect(ROOM.layout.isPreferentialSeat(3, "A")).toBe(false);
        expect(ROOM.layout.isPreferentialSeat(4, "A")).toBe(false);
      });
    });
  });
});
