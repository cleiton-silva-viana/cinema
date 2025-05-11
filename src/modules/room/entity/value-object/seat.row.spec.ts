import { SeatRow } from "./seat.row";
import { ISeatRowConfiguration } from "../room";
import { FailureCode } from "../../../../shared/failure/failure.codes.enum";

describe("SeatRow", () => {
  describe("Métodos Estáticos", () => {
    describe("create", () => {
      describe("Cenários de sucesso", () => {
        const successCases = [
          {
            columns: "D",
            preferentialSeats: ["A", "B"],
            scenario: "com colunas mínimas e assentos preferenciais",
          },
          {
            columns: "T",
            preferentialSeats: ["A", "B", "C", "D"],
            scenario: "com colunas válidas e máximo de assentos preferenciais",
          },
          {
            columns: "G",
            preferentialSeats: [],
            scenario: "com colunas válidas e sem assentos preferenciais",
          },
          {
            columns: "Z",
            scenario: "com colunas máximas permitidas",
          },
        ];

        successCases.forEach(({ columns, preferentialSeats, scenario }) => {
          it(`deve criar uma fileira válida ${scenario}`, () => {
            // Arrange
            const rowConfig: ISeatRowConfiguration = {
              rowId: 1,
              columns,
              preferentialSeats: preferentialSeats ?? [],
            };

            // Act
            const result = SeatRow.create(rowConfig);

            // Assert
            expect(result.invalid).toBe(false);
            expect(result.value.lastColumn).toBe(columns);
            expect(result.value.preferentialSeats).toEqual(
              rowConfig.preferentialSeats,
            );
          });
        });
      });

      describe("Cenários de falha", () => {
        describe("Validação das colunas", () => {
          const failureCases = [
            {
              columns: "2",
              scenario: "quando a coluna final é inválida",
              code: FailureCode.INVALID_SEAT_COLUMN,
            },
            {
              columns: "AA",
              scenario: "quando a coluna final tem mais de um caractere",
              code: FailureCode.INVALID_SEAT_COLUMN,
            },
            {
              columns: "C",
              scenario: "quando a quantidade de colunas é menor que o mínimo",
              code: FailureCode.SEAT_COLUMN_OUT_OF_RANGE,
            },
          ];

          failureCases.forEach(({ scenario, columns, code }) => {
            it(`deve falhar ${scenario}`, () => {
              // Arrange
              const rowConfig: ISeatRowConfiguration = { rowId: 1, columns };

              // Act
              const result = SeatRow.create(rowConfig);

              // Assert
              expect(result.invalid).toBe(true);
              expect(result.failures[0].code).toBe(code);
            });
          });
        });

        describe("Validação dos assentos preferenciais", () => {
          const ROW_DEFAULT_CONFIG: ISeatRowConfiguration = {
            rowId: 1,
            columns: "F",
            preferentialSeats: [],
          };

          it("deve falhar quando há mais assentos preferenciais que o permitido", () => {
            // Arrange
            const rowConfig = ROW_DEFAULT_CONFIG;
            rowConfig.preferentialSeats = ["A", "B", "C", "D", "E"];

            // Act
            const result = SeatRow.create(rowConfig);

            // Assert
            expect(result.invalid).toBe(true);
            expect(result.failures[0].code).toBe(
              FailureCode.PREFERENTIAL_SEATS_LIMIT_EXCEEDED,
            );
            expect(result.failures[0].details.maxPreferentialSeatsPerRow).toBe(
              4,
            );
          });

          it("deve falhar quando um assento preferencial não existe na fileira", () => {
            // Arrange
            const rowConfig = ROW_DEFAULT_CONFIG;
            rowConfig.preferentialSeats = ["G"];

            // Act
            const result = SeatRow.create(rowConfig);

            // Assert
            expect(result.invalid).toBe(true);
            expect(result.failures[0].code).toBe(
              FailureCode.PREFERENTIAL_SEAT_NOT_IN_ROW,
            );
          });

          it("deve falhar quando um assento preferencial é duplicado", () => {
            // Arrange
            const rowConfig = ROW_DEFAULT_CONFIG;
            rowConfig.preferentialSeats = ["A", "B", "A"];

            // Act
            const result = SeatRow.create(rowConfig);

            // Assert
            expect(result.invalid).toBe(true);
            expect(result.failures[0].code).toBe(
              FailureCode.DUPLICATE_PREFERENTIAL_SEAT,
            );
          });
        });
      });
    });
  });

  describe("Métodos de Instância", () => {
    describe("capacity", () => {
      it("deve retornar a capacidade correta da fileira", () => {
        // Arrange
        const rowConfig: ISeatRowConfiguration = {
          rowId: 1,
          columns: "E",
        };
        const seatRow = SeatRow.create(rowConfig).value;

        // Act
        const capacity = seatRow.capacity;

        // Assert
        expect(capacity).toBe(5); // A até E = 5 assentos
      });
    });

    describe("isPreferentialSeat", () => {
      it("deve retornar true para um assento preferencial", () => {
        // Arrange
        const rowConfig: ISeatRowConfiguration = {
          rowId: 1,
          columns: "F",
          preferentialSeats: ["B", "D"],
        };
        const seatRow = SeatRow.create(rowConfig).value;

        // Act & Assert
        expect(seatRow.isPreferentialSeat("B")).toBe(true);
        expect(seatRow.isPreferentialSeat("b")).toBe(true); // Deve ser case-insensitive
      });

      it("deve retornar false para um assento não preferencial", () => {
        // Arrange
        const rowConfig: ISeatRowConfiguration = {
          rowId: 1,
          columns: "F",
          preferentialSeats: ["B", "D"],
        };
        const seatRow = SeatRow.create(rowConfig).value;

        // Act & Assert
        expect(seatRow.isPreferentialSeat("A")).toBe(false);
        expect(seatRow.isPreferentialSeat("C")).toBe(false);
      });
    });

    describe("hasSeat", () => {
      it("deve retornar true para um assento que existe na fileira", () => {
        // Arrange
        const rowConfig: ISeatRowConfiguration = {
          rowId: 1,
          columns: "E",
        };
        const seatRow = SeatRow.create(rowConfig).value;

        // Act & Assert
        expect(seatRow.hasSeat("A")).toBe(true);
        expect(seatRow.hasSeat("C")).toBe(true);
        expect(seatRow.hasSeat("E")).toBe(true);
        expect(seatRow.hasSeat("e")).toBe(true); // Deve ser case-insensitive
      });

      it("deve retornar false para um assento que não existe na fileira", () => {
        // Arrange
        const rowConfig: ISeatRowConfiguration = {
          rowId: 1,
          columns: "E",
        };
        const seatRow = SeatRow.create(rowConfig).value;

        // Act & Assert
        expect(seatRow.hasSeat("F")).toBe(false);
        expect(seatRow.hasSeat("Z")).toBe(false);
      });
    });
  });
});
