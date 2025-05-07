import {
  Room,
  RoomStatus,
  ISeatRowConfiguration,
  ICreateScreenInput,
} from "./room";
import { Screen, ScreenType } from "./value-object/screen";
import { Seat } from "./value-object/seat";
import { FailureCode } from "../../../shared/failure/failure.codes.enum";

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
      it("deve criar uma sala válida com valores mínimos", () => {
        // Arrange
        const id = 1;
        const seatConfig = createValidSeatConfig();
        const screenInput = createValidScreenInput();

        // Act
        const result = Room.create(id, seatConfig, screenInput);

        // Assert
        expect(result.invalid).toBe(false);
        expect(result.value.id).toBe(id);
        expect(result.value.rows).toBe(seatConfig.length);
        expect(result.value.capacity).toBe(15);
        expect(result.value.status).toBe(RoomStatus.AVAILABLE);
        expect(result.value.preferentialSeats).toContain("A1");
        expect(result.value.preferentialSeats).toContain("B1");
        expect(result.value.preferentialSeats).toContain("C2");
      });

      it("deve criar uma sala com status personalizado", () => {
        // Arrange
        const id = 2;
        const seatConfig = createValidSeatConfig();
        const screenInput = createValidScreenInput();
        const status = RoomStatus.MAINTENANCE;

        // Act
        const result = Room.create(id, seatConfig, screenInput, status);

        // Assert
        expect(result.invalid).toBe(false);
        expect(result.value.status).toBe(status);
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
            input: { screenInput: { size: -10, type: "2d" } },
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
            // Act
            const testInput = {
              id: 1,
              seatConfig: createValidSeatConfig(),
              screenInput: createValidScreenInput(),
              ...input,
            };
            const result = Room.create(
              testInput.id,
              testInput.seatConfig,
              testInput.screenInput,
              testInput.status,
            );

            // Assert
            expect(result.invalid).toBe(true);
            expect(result.failures.length).toBe(1);
            expect(result.failures[0].details.field).toBe(field);
          });
        });
      });
    });

    describe("hydrate", () => {
      it("deve criar uma sala válida a partir de dados primitivos", () => {
        // Arrange
        const id = 1;
        const rows = 3;
        const columns = ["ABC", "ABCD", "ABCDE"];
        const preferentialSeats = ["A1", "B1", "C2"];
        const capacity = 12;
        const screen = createValidScreen();
        const status = RoomStatus.AVAILABLE;

        // Act
        const room = Room.hydrate(
          id,
          rows,
          columns,
          preferentialSeats,
          capacity,
          screen,
          status,
        );

        // Assert
        expect(room).toBeInstanceOf(Room);
        expect(room.id).toBe(id);
        expect(room.rows).toBe(rows);
        expect(room.columns).toEqual(columns);
        expect(room.preferentialSeats).toEqual(preferentialSeats);
        expect(room.capacity).toBe(capacity);
        expect(room.screen).toBe(screen);
        expect(room.status).toBe(status);
      });

      it("deve lançar erro técnico quando dados obrigatórios estiverem ausentes", () => {
        // Arrange
        const id = 1;
        const rows = 3;
        const columns = ["ABC", "ABCD", "ABCDE"];
        const preferentialSeats = ["A1", "B1", "C2"];
        const capacity = 12;
        const screen = createValidScreen();

        // Act & Assert
        expect(() => {
          Room.hydrate(
            null as any,
            rows,
            columns,
            preferentialSeats,
            capacity,
            screen,
          );
        }).toThrow();

        expect(() => {
          Room.hydrate(
            id,
            null as any,
            columns,
            preferentialSeats,
            capacity,
            screen,
          );
        }).toThrow();

        expect(() => {
          Room.hydrate(
            id,
            rows,
            null as any,
            preferentialSeats,
            capacity,
            screen,
          );
        }).toThrow();

        expect(() => {
          Room.hydrate(id, rows, columns, null as any, capacity, screen);
        }).toThrow();

        expect(() => {
          Room.hydrate(
            id,
            rows,
            columns,
            preferentialSeats,
            null as any,
            screen,
          );
        }).toThrow();

        expect(() => {
          Room.hydrate(
            id,
            rows,
            columns,
            preferentialSeats,
            capacity,
            null as any,
          );
        }).toThrow();
      });
    });
  });

  describe("Métodos de Instância", () => {
    let room: Room;

    beforeEach(() => {
      const screen = createValidScreen();
      room = Room.hydrate(
        1,
        3,
        ["ABC", "ABCD", "ABCDE"],
        ["A1", "B1", "C2"],
        12,
        screen,
        RoomStatus.AVAILABLE,
      );
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
              const result = room.getSeat(column, row);

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
            const result = room.getSeat(column, row);

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
        const allSeats = room.getAllSeats();

        // Assert
        expect(allSeats.length).toBe(room.rows);
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
            const screen = createValidScreen();
            const testRoom = Room.hydrate(
              1,
              3,
              ["ABC", "ABCD", "ABCDE"],
              ["A1", "B1", "C2"],
              12,
              screen,
              initialStatus,
            );

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
            const result = room.changeStatus(status);

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
          const result = room.changeStatus("INVALID_STATUS");

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
          expect(room.isPreferentialSeat(column, row)).toBe(expected);
        });
      });
    });
  });
});
