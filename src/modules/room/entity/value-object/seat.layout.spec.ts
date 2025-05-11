import { SeatLayout } from "./seat.layout";
import { FailureCode } from "../../../../shared/failure/failure.codes.enum";
import { ISeatRowConfiguration } from "../room";
import { SeatRow } from "./seat.row";

describe("SeatLayout", () => {
  describe("Métodos Estáticos", () => {
    describe("create", () => {
      describe("Cenários de sucesso", () => {
        const createValidLayout = (): ISeatRowConfiguration[] => [
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
        it("deve criar um layout de assentos válido com valores mínimos", () => {
          // Arrange
          const layout = createValidLayout();

          // Act
          const result = SeatLayout.create(layout);

          // Assert
          expect(result.invalid).toBe(false);
          expect(result.value.seatRows.size).toBe(4);
          expect(result.value.totalCapacity).toBe(26); // 5+6+7+8 = 26
          expect(result.value.preferentialSeatsByRow.size).toBe(2);
          expect(result.value.preferentialSeatsByRow.get(1)).toEqual([
            "A",
            "B",
          ]);
          expect(result.value.preferentialSeatsByRow.get(2)).toEqual(["C"]);
          expect(result.value.preferentialSeatsByRow.has(3)).toBe(false);
          expect(result.value.preferentialSeatsByRow.has(4)).toBe(false);
        });

        it("deve criar um layout com o número máximo de fileiras", () => {
          // Arrange
          const maxRows = 20;
          const layout: ISeatRowConfiguration[] = [];

          for (let i = 1; i <= maxRows; i++) {
            layout.push({
              rowNumber: i,
              lastColumnLetter: "E", // 5 assentos por fileira (A-E)
              preferentialSeatLetters: i <= 5 ? ["A"] : [], // Adiciona assentos preferenciais nas primeiras 5 fileiras
            });
          }

          // Act
          const result = SeatLayout.create(layout);

          // Assert
          expect(result.invalid).toBe(false);
          expect(result.value.seatRows.size).toBe(maxRows);
          expect(result.value.totalCapacity).toBe(maxRows * 5); // 20 fileiras * 5 assentos = 100
        });

        // deve criar um com quantidade mínima de linhas
        // deve criar com quantidade máxima de linhas
        // deve criar com quantidade mínima de assentos preferenciais
        // deve criar com quantidade máxima de assentos preferenciais
      });

      describe("Cenários de falha", () => {
        describe("Validação do layout", () => {
          const failureCases = [
            {
              scenario: "layout nulo",
              layout: null as any,
              errorCode: FailureCode.OBJECT_IS_EMPTY,
              field: "rowConfigurations",
            },
            {
              scenario: "layout vazio",
              layout: [],
              errorCode: FailureCode.OBJECT_IS_EMPTY,
              field: "rowConfigurations",
            },
            {
              scenario: "layout com menos fileiras que o mínimo",
              layout: Array(3)
                .fill(0)
                .map((_, i) => ({
                  rowId: i + 1,
                  columns: "E",
                })),
              errorCode: FailureCode.LENGTH_OUT_OF_RANGE,
              field: "rowConfigurations",
            },
            {
              scenario: "layout com mais fileiras que o máximo",
              layout: Array(21)
                .fill(0)
                .map((_, i) => ({
                  rowId: i + 1,
                  columns: "E",
                })),
              errorCode: FailureCode.LENGTH_OUT_OF_RANGE,
              field: "rowConfigurations",
            },
          ];

          failureCases.forEach(({ scenario, layout, errorCode, field }) => {
            it(`deve falhar quando o ${scenario}`, () => {
              // Act
              const result = SeatLayout.create(layout);

              // Assert
              expect(result.invalid).toBe(true);
              expect(result.failures[0].code).toBe(errorCode);
              expect(result.failures[0].details.field).toBe(field);
            });
          });
        });

        describe("Validação da capacidade da sala", () => {
          it("deve falhar quando a capacidade total é menor que o mínimo permitido", () => {
            // Arrange - 4 fileiras com 4 assentos cada = 16 assentos (mínimo é 20)
            const layout: ISeatRowConfiguration[] = [
              { rowNumber: 1, lastColumnLetter: "D" }, // 4 assentos
              { rowNumber: 2, lastColumnLetter: "D" }, // 4 assentos
              { rowNumber: 3, lastColumnLetter: "D" }, // 4 assentos
              { rowNumber: 4, lastColumnLetter: "D" }, // 4 assentos
            ];

            // Act
            const result = SeatLayout.create(layout);

            // Assert
            expect(result.invalid).toBe(true);
            expect(result.failures[0].code).toBe(
              FailureCode.INVALID_ROOM_CAPACITY,
            );
            expect(result.failures[0].details.capacity.actual).toBe(16);
            expect(result.failures[0].details.capacity.min).toBe(20);
          });

          it("deve falhar quando a capacidade total é maior que o máximo permitido", () => {
            // Arrange - 20 fileiras com 15 assentos cada = 300 assentos (máximo é 250)
            const layout: ISeatRowConfiguration[] = Array(20)
              .fill(0)
              .map((_, i) => ({
                rowNumber: i + 1,
                lastColumnLetter: "O", // 15 assentos (A-O)
              }));

            // Act
            const result = SeatLayout.create(layout);

            // Assert
            expect(result.invalid).toBe(true);
            expect(result.failures[0].code).toBe(
              FailureCode.INVALID_ROOM_CAPACITY,
            );
            expect(result.failures[0].details.capacity.actual).toBe(300);
            expect(result.failures[0].details.capacity.max).toBe(250);
          });
        });

        describe("Validação de assentos preferenciais", () => {
          it("deve falhar quando a quantidade de assentos preferenciais é menor que o mínimo permitido", () => {
            // Arrange - 100 assentos totais, 0 preferenciais (mínimo seria 5%)
            const layout: ISeatRowConfiguration[] = Array(20)
              .fill(0)
              .map((_, i) => ({
                rowNumber: i + 1,
                lastColumnLetter: "E", // 5 assentos por fileira
                preferentialSeatLetters: [] as string[], // Sem assentos preferenciais
              }));

            // Act
            const result = SeatLayout.create(layout);

            // Assert
            expect(result.invalid).toBe(true);
            expect(result.failures[0].code).toBe(
              FailureCode.INVALID_NUMBER_OF_PREFERENTIAL_SEATS,
            );
            expect(result.failures[0].details.preferentialSeats.actual).toBe(0);
            expect(
              result.failures[0].details.preferentialSeats.minPercentage,
            ).toBe(5);
          });

          it("deve falhar quando a quantidade de assentos preferenciais é maior que o máximo permitido", () => {
            // Arrange - 100 assentos totais, 30 preferenciais (máximo seria 20% = 20 assentos)
            const layout: ISeatRowConfiguration[] = Array(10)
              .fill(0)
              .map((_, i) => ({
                rowNumber: i + 1,
                lastColumnLetter: "j", // 10 assentos por fileira
                preferentialSeatLetters: ["A", "B", "C"], // 30 assentos preferenciais (10 fileiras x 3 assentos)
              }));

            // Act
            const result = SeatLayout.create(layout);

            // Assert
            expect(result.invalid).toBe(true);
            expect(result.failures[0].code).toBe(
              FailureCode.INVALID_NUMBER_OF_PREFERENTIAL_SEATS,
            );
            expect(result.failures[0].details.preferentialSeats.actual).toBe(
              30,
            );
            expect(
              result.failures[0].details.preferentialSeats.maxPercentage,
            ).toBe(20);
          });
        });
      });
    });

    describe("hydrate", () => {
      it("deve recriar uma instância de SeatLayout a partir de dados existentes", () => {
        // Arrange
        const seatRows = new Map<number, SeatRow>();

        const row1 = SeatRow.hydrate("E", ["A", "B"]); // Fileira 1: A-E, com A e B preferenciais
        const row2 = SeatRow.hydrate("F", ["C"]); // Fileira 2: A-F, com C preferencial
        const row3 = SeatRow.hydrate("G", []); // Fileira 3: A-G, sem preferenciais

        seatRows.set(1, row1);
        seatRows.set(2, row2);
        seatRows.set(3, row3);

        // Act
        const result = SeatLayout.hydrate(seatRows);

        // Assert
        expect(result.seatRows).toBe(seatRows);
        expect(result.totalCapacity).toBe(18); // 5 + 6 + 7 = 18 assentos
        expect(result.preferentialSeatsByRow.size).toBe(2);
        expect(result.preferentialSeatsByRow.get(1)).toEqual(["A", "B"]);
        expect(result.preferentialSeatsByRow.get(2)).toEqual(["C"]);
        expect(result.preferentialSeatsByRow.has(3)).toBe(false);
      });

      it("deve calcular corretamente a capacidade total com base nas fileiras", () => {
        // Arrange
        const seatRows = new Map<number, SeatRow>();

        // Adicionar fileiras com diferentes capacidades
        seatRows.set(1, SeatRow.hydrate("D", [])); // 4 assentos
        seatRows.set(2, SeatRow.hydrate("F", [])); // 6 assentos
        seatRows.set(3, SeatRow.hydrate("J", [])); // 10 assentos

        // Act
        const result = SeatLayout.hydrate(seatRows);

        // Assert
        expect(result.totalCapacity).toBe(20); // 4 + 6 + 10 = 20 assentos
      });

      it("deve calcular corretamente os assentos preferenciais com base nas fileiras", () => {
        // Arrange
        const seatRows = new Map<number, SeatRow>();

        // Adicionar fileiras com diferentes configurações de assentos preferenciais
        seatRows.set(1, SeatRow.hydrate("E", ["A", "B", "C"]));
        seatRows.set(2, SeatRow.hydrate("F", ["D", "E"]));
        seatRows.set(3, SeatRow.hydrate("G", []));

        // Act
        const result = SeatLayout.hydrate(seatRows);

        // Assert
        expect(result.preferentialSeatsByRow.size).toBe(2);
        expect(result.preferentialSeatsByRow.get(1)).toEqual(["A", "B", "C"]);
        expect(result.preferentialSeatsByRow.get(2)).toEqual(["D", "E"]);
        expect(result.preferentialSeatsByRow.has(3)).toBe(false);
      });

      it("deve lançar erro técnico quando o mapa de fileiras for nulo", () => {
        // Act & Assert
        expect(() => SeatLayout.hydrate(null as any)).toThrow();
      });
    });
  });

  describe("Métodos de Instancia", () => {
    let instance: SeatLayout;
    let seatRows: Map<number, SeatRow>;

    beforeEach(() => {
      // Configurar dados de teste
      seatRows = new Map();

      // Adicionar fileiras de teste
      const row1 = SeatRow.hydrate("E", ["A", "B"]); // Fileira 1: A-E, com A e B preferenciais
      const row2 = SeatRow.hydrate("F", ["C"]); // Fileira 2: A-F, com C preferencial
      const row3 = SeatRow.hydrate("G", []); // Fileira 3: A-G, sem preferenciais

      seatRows.set(1, row1);
      seatRows.set(2, row2);
      seatRows.set(3, row3);

      // Criar instância para testes usando o novo método hydrate
      instance = SeatLayout.hydrate(seatRows);
    });

    describe("hasSeat", () => {
      it("deve retornar true quando há um assento correspondente", () => {
        // Act & Assert
        expect(instance.hasSeat(1, "A")).toBe(true);
        expect(instance.hasSeat(1, "E")).toBe(true);
        expect(instance.hasSeat(2, "F")).toBe(true);
        expect(instance.hasSeat(3, "G")).toBe(true);
      });

      it("deve retornar false quando não há um assento correspondente", () => {
        // Act & Assert
        expect(instance.hasSeat(1, "F")).toBe(false); // Coluna F não existe na fileira 1
        expect(instance.hasSeat(2, "G")).toBe(false); // Coluna G não existe na fileira 2
        expect(instance.hasSeat(4, "A")).toBe(false); // Fileira 4 não existe
        expect(instance.hasSeat(1, "Z")).toBe(false); // Coluna Z não existe em nenhuma fileira
      });
    });

    describe("isPreferentialSeat", () => {
      it("deve retornar true quando o assento é preferencial", () => {
        // Act & Assert
        expect(instance.isPreferentialSeat(1, "A")).toBe(true);
        expect(instance.isPreferentialSeat(1, "B")).toBe(true);
        expect(instance.isPreferentialSeat(2, "C")).toBe(true);
      });

      it("deve retornar false quando o assento não é preferencial", () => {
        // Act & Assert
        expect(instance.isPreferentialSeat(1, "C")).toBe(false); // Assento existe mas não é preferencial
        expect(instance.isPreferentialSeat(2, "A")).toBe(false); // Assento existe mas não é preferencial
        expect(instance.isPreferentialSeat(3, "A")).toBe(false); // Fileira sem assentos preferenciais
        expect(instance.isPreferentialSeat(4, "A")).toBe(false); // Fileira não existe
        expect(instance.isPreferentialSeat(1, "Z")).toBe(false); // Assento não existe
      });
    });
  });
});
