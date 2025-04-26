import {
  DisplayPeriod,
  DisplayPeriodCodes,
  ScreeningStatus,
} from "./display.period";

describe("DisplayPeriod", () => {
  // Datas para testes
  const ONE_DAY = 1000 * 60 * 60 * 24;
  const now = new Date();
  const futureDate = new Date(Date.now() + 10 * ONE_DAY); // 10 dias no futuro
  const farFutureDate = new Date(Date.now() + 20 * ONE_DAY); // 20 dias no futuro
  const pastDate = new Date(Date.now() - 10 * ONE_DAY); // 10 dias no passado

  let originalDateNow: () => number;

  beforeEach(() => {
    originalDateNow = Date.now;
  });

  afterEach(() => {
    Date.now = originalDateNow;
  });

  describe("Métodos Estáticos", () => {
    describe("create", () => {
      describe("períodos válidos", () => {
        const minEndDate = new Date(futureDate.getTime() + 14 * ONE_DAY); // 14 dias exatos
        const midEndDate = new Date(futureDate.getTime() + 20 * ONE_DAY); // 20 dias (intermediário)
        const maxEndDate = new Date(futureDate.getTime() + 30 * ONE_DAY); // 30 dias exatos

        const successCases = [
          {
            startDate: futureDate,
            endDate: minEndDate,
            scenario: "com diferença mínima exata de 14 dias",
          },
          {
            startDate: futureDate,
            endDate: midEndDate,
            scenario: "com diferença intermediária de 20 dias",
          },
          {
            startDate: futureDate,
            endDate: maxEndDate,
            scenario: "com diferença máxima exata de 30 dias",
          },
        ];

        successCases.forEach(({ startDate, endDate, scenario }) => {
          it(`deve criar um período de exibição ${scenario}`, () => {
            // Act
            const result = DisplayPeriod.create(startDate, endDate);

            // Assert
            expect(result.invalid).toBe(false);
            expect(result.value).toBeInstanceOf(DisplayPeriod);
            expect(result.value.startDate).toBe(startDate);
            expect(result.value.endDate).toBe(endDate);
          });
        });
      });

      describe("deve retornar um erro quando o período é inválido", () => {
        const failureCases = [
          {
            startDate: pastDate,
            endDate: farFutureDate,
            scenario: "com data de início no passado",
            errorCode: DisplayPeriodCodes.PAST_START_DATE,
          },
          {
            startDate: null,
            endDate: farFutureDate,
            scenario: "com data de início nula",
            errorCode: DisplayPeriodCodes.DATE_IS_NOT_PROVIDED,
          },
          {
            startDate: futureDate,
            endDate: null,
            scenario: "com data de término nula",
            errorCode: DisplayPeriodCodes.DATE_IS_NOT_PROVIDED,
          },
          {
            startDate: futureDate,
            endDate: futureDate,
            scenario: "com data de término igual à data de início",
            errorCode: DisplayPeriodCodes.INVALID_DATE_RANGE,
          },
          {
            startDate: now,
            endDate: futureDate,
            scenario: "com data de término anterior ao mínimo (14 dias)",
            errorCode: DisplayPeriodCodes.INVALID_DATE_RANGE,
          },
          {
            startDate: futureDate,
            endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 60), // 60 dias no futuro
            scenario: "com data de término muito distante",
            errorCode: DisplayPeriodCodes.LONG_TERM_FOR_END_DATE,
          },
        ];

        failureCases.forEach(({ startDate, endDate, scenario, errorCode }) => {
          it(`deve rejeitar um período ${scenario}`, () => {
            // Act
            const result = DisplayPeriod.create(startDate, endDate);

            // Assert
            expect(result.invalid).toBe(true);
            expect(result.failures[0].code).toBe(errorCode);
          });
        });
      });
    });

    describe("hydrate", () => {
      it("deve hidratar um período corretamente", () => {
        // Act
        const hydrated = DisplayPeriod.hydrate(futureDate, farFutureDate);

        // Assert
        expect(hydrated.startDate).toBe(futureDate);
        expect(hydrated.endDate).toBe(farFutureDate);
      });

      it.each([
        {
          scenario: "startDate inválido",
          startDate: null,
          endDate: farFutureDate,
        },
        {
          scenario: "endDate inválido",
          startDate: futureDate,
          endDate: undefined,
        },
        {
          scenario: "ambas as datas inválidas",
          startDate: undefined,
          endDate: null,
        },
      ])("deve lançar erro técnico se $scenario", ({ startDate, endDate }) => {
        // Assert
        expect(() => DisplayPeriod.hydrate(startDate, endDate)).toThrow();
      });
    });
  });

  describe("Métodos de Instância", () => {
    describe("getScreeningStatus", () => {
      const testCases = [
        {
          scenario:
            "deve retornar PRESALE quando a data atual é anterior à data de início",
          startDate: futureDate,
          endDate: farFutureDate,
          expectedStatus: ScreeningStatus.PRESALE,
        },
        {
          scenario:
            "deve retornar SHOWING quando a data atual está entre as datas de início e fim",
          startDate: new Date(Date.now() - ONE_DAY), // 1 dia atrás
          endDate: new Date(Date.now() + ONE_DAY), // 1 dia à frente
          expectedStatus: ScreeningStatus.SHOWING,
        },
        {
          scenario:
            "deve retornar ENDED quando a data atual é posterior à data de término",
          startDate: new Date(Date.now() - 2 * ONE_DAY), // 2 dias atrás
          endDate: new Date(Date.now() - ONE_DAY), // 1 dia atrás
          expectedStatus: ScreeningStatus.ENDED,
        },
      ];

      testCases.forEach(({ scenario, startDate, endDate, expectedStatus }) => {
        it(scenario, () => {
          const displayPeriod = DisplayPeriod.hydrate(startDate, endDate);

          // Act
          const result = displayPeriod.getScreeningStatus();

          // Assert
          expect(result).toBe(expectedStatus);
        });
      });
    });

    describe("isActive", () => {
      it("deve retornar true quando o período está ativo", () => {
        // Arrange
        const startDate = new Date(Date.now() - ONE_DAY); // 1 dia atrás
        const endDate = new Date(Date.now() + ONE_DAY); // // 1 dia à frente
        const displayPeriod = DisplayPeriod.hydrate(startDate, endDate);

        // Act
        const result = displayPeriod.isActive();

        // Assert
        expect(result).toBe(true);
      });

      const testCases = [
        {
          scenario: "deve retornar false quando o período ainda não começou",
          startDate: futureDate,
          endDate: farFutureDate,
        },
        {
          scenario: "deve retornar false quando o período já terminou",
          startDate: new Date(Date.now() - 2 * ONE_DAY), // 2 dias atrás
          endDate: new Date(Date.now() - ONE_DAY), // 1 dia atrás
        },
      ];

      testCases.forEach(({ scenario, startDate, endDate }) => {
        it(scenario, () => {
          const displayPeriod = DisplayPeriod.hydrate(startDate, endDate);

          // Act
          const result = displayPeriod.isActive();

          // Assert
          expect(result).toBe(false);
        });
      });
    });

    describe("hasEnded", () => {
      const testCases = [
        {
          scenario: "deve retornar true quando o período já terminou",
          startDate: new Date(Date.now() - 2 * ONE_DAY), // 2 dias atrás
          endDate: new Date(Date.now() - ONE_DAY), // 1 dia atrás
          expected: true,
        },
        {
          scenario: "deve retornar false quando o período ainda não terminou",
          startDate: new Date(Date.now() - ONE_DAY), // 1 dia atrás
          endDate: new Date(Date.now() + ONE_DAY), // 1 dia à frente
          expected: false,
        },
      ];

      testCases.forEach(({ scenario, startDate, endDate, expected }) => {
        it(scenario, () => {
          const displayPeriod = DisplayPeriod.hydrate(startDate, endDate);

          // Act
          const result = displayPeriod.hasEnded();

          // Assert
          expect(result).toBe(expected);
        });
      });
    });

    describe("hasNotStarted", () => {
      const testCases = [
        {
          scenario: "deve retornar true quando o período ainda não começou",
          startDate: futureDate,
          endDate: farFutureDate,
          expected: true,
        },
        {
          scenario: "deve retornar false quando o período já começou",
          startDate: new Date(Date.now() - ONE_DAY), // 1 dia atrás
          endDate: new Date(Date.now() + ONE_DAY), // 1 dia à frente
          expected: false,
        },
      ];

      testCases.forEach(({ scenario, startDate, endDate, expected }) => {
        it(scenario, () => {
          const displayPeriod = DisplayPeriod.hydrate(startDate, endDate);

          // Act
          const result = displayPeriod.hasNotStarted();

          // Assert
          expect(result).toBe(expected);
        });
      });
    });

    describe("isAvailableInRange", () => {
      describe("períodos válidos", () => {
        const successCases = [
          {
            scenario:
              "quando o período solicitado se sobrepõe ao início do período de exibição",
            rangeStart: new Date(futureDate.getTime() - ONE_DAY),
            rangeEnd: new Date(futureDate.getTime() + ONE_DAY),
          },
          {
            scenario:
              "quando o período solicitado se sobrepõe ao fim do período de exibição",
            rangeStart: new Date(farFutureDate.getTime() - ONE_DAY),
            rangeEnd: new Date(farFutureDate.getTime() + ONE_DAY),
          },
          {
            scenario:
              "quando o período solicitado está totalmente contido no período de exibição",
            rangeStart: new Date(futureDate.getTime() + ONE_DAY),
            rangeEnd: new Date(farFutureDate.getTime() - ONE_DAY),
          },
          {
            scenario:
              "quando o período de exibição está totalmente contido no período solicitado",
            rangeStart: new Date(futureDate.getTime() - ONE_DAY),
            rangeEnd: new Date(farFutureDate.getTime() + ONE_DAY),
          },
          {
            scenario:
              "quando os períodos têm exatamente as mesmas datas de início e fim",
            rangeStart: futureDate,
            rangeEnd: farFutureDate,
          },
        ];

        successCases.forEach(({ scenario, rangeStart, rangeEnd }) => {
          it(`deve retornar true ${scenario}`, () => {
            // Arrange
            const displayPeriod = DisplayPeriod.hydrate(
              futureDate,
              farFutureDate,
            );

            // Act
            const result = displayPeriod.isAvailableInRange(
              rangeStart,
              rangeEnd,
            );

            // Assert
            expect(result).toBe(true);
          });
        });
      });
      describe("períodos inválidos", () => {
        const failureCases = [
          {
            scenario:
              "quando o período solicitado é anterior ao período de exibição",
            rangeStart: pastDate,
            rangeEnd: new Date(pastDate.getTime() + ONE_DAY),
          },
          {
            scenario:
              "quando o período solicitado é posterior período de exibição",
            rangeStart: new Date(farFutureDate.getTime() + ONE_DAY),
            rangeEnd: new Date(farFutureDate.getTime() + 2 * ONE_DAY),
          },
          {
            scenario: "quando a data inicial é inválida",
            rangeStart: null,
            rangeEnd: farFutureDate,
          },
          {
            scenario: "quando a data final é inválida",
            rangeStart: futureDate,
            rangeEnd: undefined,
          },
        ];

        failureCases.forEach(({ scenario, rangeStart, rangeEnd }) => {
          it(`deve retornar false ${scenario}`, () => {
            // Arrange
            const displayPeriod = DisplayPeriod.hydrate(
              futureDate,
              farFutureDate,
            );

            // Act
            const result = displayPeriod.isAvailableInRange(
              rangeStart,
              rangeEnd,
            );

            // Assert
            expect(result).toBe(false);
          });
        });
      });
    });
  });
});
