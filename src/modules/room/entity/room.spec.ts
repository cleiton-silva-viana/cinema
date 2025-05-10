import {
  Room,
  RoomStatus,
  ISeatRowConfiguration,
  ICreateScreenInput,
  ICreateRoomInput,
  IHydrateRoomInput,
} from "./room";
import { Screen, ScreenType } from "./value-object/screen";
import { Seat } from "./value-object/seat";
import { FailureCode } from "../../../shared/failure/failure.codes.enum";
import { RoomUID } from "./value-object/room.uid";
import { TechnicalError } from "../../../shared/error/technical.error";

describe("Room", () => {
  const createValidSeatConfig = (): ISeatRowConfiguration[] => [
    {
      rowId: 1,
      columns: "ABCD",
      preferentialSeats: ["A1", "B1"],
    },
    {
      rowId: 2,
      columns: "ABCDE",
      preferentialSeats: ["C2"],
    },
    {
      rowId: 3,
      columns: "ABCDEF",
    },
  ];

  const createValidScreenInput = (): ICreateScreenInput => ({
    size: 20,
    type: "2D",
  });

  const createValidScreen = (): Screen => {
    return Screen.hydrate(20, ScreenType["2D"]);
  };

  describe("Métodos Estáticos", () => {
    describe("create", () => {
      const PARAMS: ICreateRoomInput = {
        id: 1,
        seatConfig: createValidSeatConfig(),
        screen: createValidScreenInput(),
        status: RoomStatus.AVAILABLE,
      };

      it("deve criar uma sala válida com valores mínimos", () => {
        // Act
        const result = Room.create(PARAMS);

        // Assert
        expect(result.invalid).toBe(false);
        expect(result.value.id).toBe(PARAMS.id);
        expect(result.value.rows).toBe(PARAMS.seatConfig.length);
        expect(result.value.capacity).toBe(15);
        expect(result.value.status).toBe(RoomStatus.AVAILABLE);
        expect(result.value.preferentialSeats).toContain("A1");
        expect(result.value.preferentialSeats).toContain("B1");
        expect(result.value.preferentialSeats).toContain("C2");
      });

      describe("deve falhar quando os dados de entrada são inválidos", () => {
        const testCases = [
          {
            scenario: "ID for inválido",
            input: { id: -1 },
            field: "id",
          },
          {
            scenario: "ID é exatamente o valor máximo permitido + 1",
            input: { id: 101 },
            field: "id",
          },
          {
            scenario: "ID é um número decimal",
            input: { id: 1.5 },
            field: "id",
          },
          {
            scenario: "configuração de assentos for vazia",
            input: { seatConfig: [] as ISeatRowConfiguration[] },
            field: "seatsConfig",
          },
          {
            scenario: "status for inválido",
            input: { status: "INVALID_STATUS" },
            field: "status",
          },
          {
            scenario: "configuração de tela for inválida",
            input: { screen: { size: -10, type: "2d" } },
            field: "size",
          },
          {
            scenario: "configuração de assentos tem fileiras com zero colunas",
            input: {
              seatConfig: [
                {
                  rowId: 1,
                  columns: "",
                },
              ],
            },
            field: "row",
          },
        ];

        testCases.forEach(({ scenario, input, field }) => {
          it(scenario, () => {
            // Arrange
            const params: ICreateRoomInput = { ...PARAMS, ...input };

            // Act
            const result = Room.create(params);

            // Assert
            expect(result.invalid).toBe(true);
            expect(result.failures.length).toBe(1);
            expect(result.failures[0].details.field).toBe(field);
          });
        });
      });
    });

    describe("hydrate", () => {
      const PARAMS: IHydrateRoomInput = {
        roomUID: RoomUID.create().value,
        id: 1,
        rows: 3,
        columns: ["ABC", "ABCD", "ABCDE"],
        preferentialSeats: ["A1", "B1", "C2"],
        capacity: 12,
        screen: createValidScreen(),
        status: RoomStatus.AVAILABLE,
      };

      it("deve criar uma sala válida a partir de dados primitivos", () => {
        // Act
        const room = Room.hydrate(PARAMS);

        // Assert
        expect(room).toBeInstanceOf(Room);
        expect(room.id).toBe(PARAMS.id);
        expect(room.rows).toBe(PARAMS.rows);
        expect(room.status).toBe(PARAMS.status);
        expect(room.capacity).toBe(PARAMS.capacity);
        expect(room.columns).toEqual(PARAMS.columns);
        expect(room.screen).toEqual(PARAMS.screen);
        expect(room.preferentialSeats).toEqual(PARAMS.preferentialSeats);
      });

      it("deve lançar erro técnico quando o parâmeto `params` é um objeto nulo", () => {
        expect(() => Room.hydrate(null)).toThrow(TechnicalError);
      });

      describe("deve lançar erro técnico quando dados obrigatórios estiverem ausentes", () => {
        const failureCases = [
          {
            scenario: "id é nulo",
            params: { id: null as unknown as number },
          },
          {
            scenario: "room uid é nulo",
            params: { roomUID: null as unknown as string },
          },
          {
            scenario: "rows é nulo",
            params: { rows: null as unknown as number },
          },
          {
            scenario: "columns é nulo",
            params: { columns: null as Array<any> },
          },
          {
            scenario: "preferential seats é nulo",
            params: { preferentialSeats: null as unknown as Array<any> },
          },
          {
            scenario: "capacity é nulo",
            params: { capacity: null as unknown as number },
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
            const input: IHydrateRoomInput = { ...PARAMS, ...params };

            // Act & Assert
            expect(() => Room.hydrate(input)).toThrow();
          });
        });
      });
    });
  });

  describe("Métodos de Instância", () => {
    let ROOM: Room;
    const PARAMS: IHydrateRoomInput = {
      roomUID: RoomUID.create().value,
      id: 1,
      rows: 3,
      columns: ["ABC", "ABCD", "ABCDE"],
      preferentialSeats: ["A1", "B1", "C2"],
      capacity: 12,
      screen: createValidScreen(),
      status: RoomStatus.AVAILABLE,
    };

    beforeEach(() => {
      ROOM = Room.hydrate(PARAMS);
    });

    describe("getSeat", () => {
      describe("casos de sucesso", () => {
        const successCases = [
          {
            scenario:
              "deve retornar um assento válido quando coluna e fileira existem",
            column: "A",
            row: 1,
            expectedColumn: "A",
            expectedRow: 1,
            expectedPreferential: true,
          },
          {
            scenario: "deve normalizar a coluna para maiúscula",
            column: "b",
            row: 2,
            expectedColumn: "B",
            expectedRow: 2,
            expectedPreferential: false,
          },
          {
            scenario: "deve remover espaços em brancos da coluna",
            column: "  b  ",
            row: 2,
            expectedColumn: "B",
            expectedRow: 2,
            expectedPreferential: false,
          },
          {
            scenario: "deve obter assento na primeira fileira",
            column: "A",
            row: 1,
            expectedColumn: "A",
            expectedRow: 1,
            expectedPreferential: true,
          },
          {
            scenario: "deve obter assento na última fileira",
            column: "A",
            row: 3,
            expectedColumn: "A",
            expectedRow: 3,
            expectedPreferential: false,
          },
          {
            scenario: "deve obter assento na primeira coluna da fileira",
            column: "A",
            row: 2,
            expectedColumn: "A",
            expectedRow: 2,
            expectedPreferential: false,
          },
          {
            scenario: "deve obter assento na última coluna da fileira",
            column: "E",
            row: 3,
            expectedColumn: "E",
            expectedRow: 3,
            expectedPreferential: false,
          },
        ];
        successCases.forEach(
          ({
            scenario,
            column,
            row,
            expectedColumn,
            expectedRow,
            expectedPreferential,
          }) => {
            it(scenario, () => {
              // Act
              const result = ROOM.getSeat(column, row);

              // Assert
              expect(result.invalid).toBe(false);
              expect(result.value).toBeInstanceOf(Seat);
              expect(result.value.column).toBe(expectedColumn);
              expect(result.value.row).toBe(expectedRow);
              expect(result.value.preferential).toBe(expectedPreferential);
            });
          },
        );
      });

      describe("casos de falha", () => {
        const failureCases = [
          {
            scenario: "deve falhar quando a fileira não existe",
            column: "A",
            row: 10,
            expectedCode: FailureCode.INVALID_SEAT_ROW,
          },
          {
            scenario: "deve falhar quando a coluna não existe na fileira",
            column: "Z",
            row: 1,
            expectedCode: FailureCode.INVALID_SEAT_COLUMN,
          },
          {
            scenario: "deve falhar quando a fileira é zero",
            column: "A",
            row: 0,
            expectedCode: FailureCode.INVALID_SEAT_ROW,
          },
          {
            scenario: "deve falhar quando a fileira é negativa",
            column: "A",
            row: -1,
            expectedCode: FailureCode.INVALID_SEAT_ROW,
          },
          {
            scenario:
              "deve falhar quando a fileira é exatamente uma a mais que o máximo",
            column: "A",
            row: 4, // Uma fileira além do máximo (3)
            expectedCode: FailureCode.INVALID_SEAT_ROW,
          },
          {
            scenario:
              "deve falhar quando a coluna está além do limite da fileira",
            column: "D",
            row: 1, // Fileira 1 só tem colunas ABC
            expectedCode: FailureCode.INVALID_SEAT_COLUMN,
          },
          {
            scenario: "deve falhar quando a coluna é vazia",
            column: "",
            row: 1,
            expectedCode: FailureCode.INVALID_SEAT_COLUMN,
          },
          {
            scenario: "deve falhar quando a coluna contém apenas espaços",
            column: "   ",
            row: 1,
            expectedCode: FailureCode.INVALID_SEAT_COLUMN,
          },
          {
            scenario: "deve falhar quando a coluna contém caracteres especiais",
            column: "@",
            row: 1,
            expectedCode: FailureCode.INVALID_SEAT_COLUMN,
          },
        ];
        failureCases.forEach(({ scenario, column, row, expectedCode }) => {
          it(scenario, () => {
            // Act
            const result = ROOM.getSeat(column, row);

            // Assert
            expect(result.invalid).toBe(true);
            expect(result.failures[0].code).toBe(expectedCode);
          });
        });
      });
    });

    describe("getAllSeats", () => {
      it("deve retornar uma matriz com todos os assentos da sala", () => {
        // Act
        const allSeats = ROOM.getAllSeats();

        // Assert
        expect(allSeats.length).toBe(ROOM.rows);
        expect(allSeats[0].length).toBe(3); // Primeira fileira tem 3 colunas (ABC)
        expect(allSeats[1].length).toBe(4); // Segunda fileira tem 4 colunas (ABCD)
        expect(allSeats[2].length).toBe(5); // Terceira fileira tem 5 colunas (ABCDE)

        // Verificar se os assentos preferenciais estão corretos
        expect(allSeats[0][0].preferential).toBe(true); // A1
        expect(allSeats[0][1].preferential).toBe(true); // B1
        expect(allSeats[1][2].preferential).toBe(true); // C2
      });
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
            const input: IHydrateRoomInput = {
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
            expectedErrorCode: "",
          },
          {
            scenario: "deve falhar quando novo status for um valor indefinido",
            status: undefined as any,
            expectedErrorCode: "",
          },
        ];
        nullCases.forEach(({ scenario, status }) => {
          it(scenario, () => {
            // Act
            const result = ROOM.changeStatus(status);

            // Assert
            expect(result.invalid).toBe(true);
            expect(result.failures.length).toBe(1);
            expect(result.failures[0].code).toBe(
              FailureCode.MISSING_REQUIRED_DATA,
            );
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

    describe("isPreferentialSeat", () => {
      const cases = [
        {
          scenario: "deve identificar corretamente um assento preferencial",
          column: "A",
          row: 1,
          expected: true,
        },
        {
          scenario: "deve identificar corretamente outro assento preferencial",
          column: "B",
          row: 1,
          expected: true,
        },
        {
          scenario:
            "deve identificar corretamente um terceiro assento preferencial",
          column: "C",
          row: 2,
          expected: true,
        },
        {
          scenario: "deve identificar corretamente um assento não preferencial",
          column: "C",
          row: 1,
          expected: false,
        },
        {
          scenario:
            "deve identificar corretamente outro assento não preferencial",
          column: "A",
          row: 3,
          expected: false,
        },
        {
          scenario: "deve normalizar a coluna para maiúscula",
          column: "a",
          row: 1,
          expected: true,
        },
        {
          scenario: "deve remover espaços em branco da coluna",
          column: " B ",
          row: 1,
          expected: true,
        },
      ];

      cases.forEach(({ scenario, column, row, expected }) => {
        it(scenario, () => {
          // Act & Assert
          expect(ROOM.isPreferentialSeat(column, row)).toBe(expected);
        });
      });
    });
  });
});
