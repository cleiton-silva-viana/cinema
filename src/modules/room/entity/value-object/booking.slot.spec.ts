import { BookingSlot, BookingType } from "./booking.slot";
import { ScreeningUID } from "../../../screening/aggregate/value-object/screening.uid";
import { TechnicalError } from "../../../../shared/error/technical.error";
import { FailureCode } from "../../../../shared/failure/failure.codes.enum";
import { SimpleFailure } from "../../../../shared/failure/simple.failure.type";
import { validateAndCollect } from "../../../../shared/validator/common.validators";
import { v4 } from "uuid";

describe("BookingSlot", () => {
  let originalDateNow: () => number;
  const mockScreeningUID = ScreeningUID.create();
  const mockScreeningUIDString = mockScreeningUID.value;
  const VALID_TYPE = BookingType.SCREENING;

  beforeAll(() => {
    originalDateNow = Date.now;
    global.Date.now = jest.fn(() => new Date(2023, 0, 1, 10, 0, 0).getTime());
  });

  afterAll(() => {
    global.Date.now = originalDateNow;
  });

  describe("create", () => {
    let failures: SimpleFailure[];

    beforeEach(() => {
      failures = [];
    });

    const NOW = new Date(Date.now());
    const VALID_SCREENING_UID = ScreeningUID.create();
    const VALID_START_TIME = new Date(NOW.getTime() + 1000 * 60 * 60); // 1 hora no futuro
    const VALID_END_TIME = new Date(
      VALID_START_TIME.getTime() + 1000 * 60 * 120,
    ); // 2 horas depois do startTime (duração de 120 minutos)

    describe("create", () => {
      describe("Cenários de sucesso", () => {
        it("Deve criar um BookingSlot do tipo SCREENING com sucesso", () => {
          // Arrange
          const minutes = Math.abs(
            (VALID_START_TIME.getTime() - VALID_END_TIME.getTime()) / 60000,
          );

          // Act
          const result = validateAndCollect(
            BookingSlot.create(
              VALID_SCREENING_UID,
              VALID_START_TIME,
              VALID_END_TIME,
              BookingType.SCREENING,
            ),
            failures,
          );

          // Assert
          expect(result).toBeDefined();
          expect(result.screeningUID).toBe(VALID_SCREENING_UID);
          expect(result.startTime).toBe(VALID_START_TIME);
          expect(result.endTime).toBe(VALID_END_TIME);
          expect(result.type).toBe(BookingType.SCREENING);
          expect(result.durationInMinutes).toBe(minutes);
        });

        it("Deve criar um BookingSlot do tipo CLEANING com sucesso", () => {
          // Arrange
          const minutes = 30;
          const startTime = new Date(VALID_START_TIME);
          const endTime = new Date(startTime.getTime() + minutes * 60 * 1000);

          // Act
          const result = validateAndCollect(
            BookingSlot.create(null, startTime, endTime, BookingType.CLEANING),
            failures,
          );

          // Assert
          expect(result).toBeDefined();
          expect(result.type).toBe(BookingType.CLEANING);
          expect(result.screeningUID).toBeNull();
          expect(result.bookingUID).toBeDefined();
          expect(result.durationInMinutes).toBe(minutes);
        });

        it("Deve criar um BookingSlot do tipo CLEANING associado à um screen uid com sucesso", () => {
          // Arrange
          const minutes = 30;
          const startTime = new Date(VALID_START_TIME);
          const endTime = new Date(startTime.getTime() + minutes * 60 * 1000);

          // Act
          const result = validateAndCollect(
            BookingSlot.create(
              VALID_SCREENING_UID,
              startTime,
              endTime,
              BookingType.CLEANING,
            ),
            failures,
          );

          // Assert
          expect(result).toBeDefined();
          expect(result.type).toBe(BookingType.CLEANING);
          expect(result.screeningUID).toBe(VALID_SCREENING_UID);
          expect(result.bookingUID).toBeDefined();
          expect(result.durationInMinutes).toBe(minutes);
        });

        it("Deve criar um BookingSlot do tipo MAINTENANCE com sucesso", () => {
          // Arrange
          const minutes = 8 * 60; // 8 horas
          const startTime = new Date(VALID_END_TIME);
          const endTime = new Date(startTime.getTime() + minutes * 60 * 1000); // 8 horas

          // Act
          const result = validateAndCollect(
            BookingSlot.create(
              null,
              startTime,
              endTime,
              BookingType.MAINTENANCE,
            ),
            failures,
          );

          // Assert
          expect(result).toBeDefined();
          expect(result.type).toBe(BookingType.MAINTENANCE);
          expect(result.screeningUID).toBeNull();
          expect(result.durationInMinutes).toBe(minutes);
          expect(result.startTime).toEqual(startTime);
          expect(result.endTime).toEqual(endTime);
        });

        it("Deve criar um BookingSlot do tipo EXIT_TIME com sucesso", () => {
          // Arrange
          const minutes = 15; // Agora o mínimo é 15 minutos
          const startTime = new Date(VALID_END_TIME);
          const endTime = new Date(startTime.getTime() + minutes * 60 * 1000);

          // Act
          const result = validateAndCollect(
            BookingSlot.create(
              VALID_SCREENING_UID,
              startTime,
              endTime,
              BookingType.EXIT_TIME,
            ),
            failures,
          );

          // Assert
          expect(result).toBeDefined();
          expect(result.type).toBe(BookingType.EXIT_TIME);
          expect(result.bookingUID).toBeDefined();
          expect(result.screeningUID).toBe(VALID_SCREENING_UID);
          expect(result.durationInMinutes).toBe(minutes);
          expect(result.startTime).toEqual(startTime);
          expect(result.endTime).toEqual(endTime);
        });

        it("Deve criar um BookingSlot do tipo ENTRY_TIME com sucesso", () => {
          // Arrange
          const minutes = 15; // Mínimo para ENTRY_TIME
          const startTime = new Date(VALID_START_TIME);
          startTime.setMinutes(startTime.getMinutes() - minutes);
          const endTime = new Date(VALID_START_TIME);

          // Act
          const result = validateAndCollect(
            BookingSlot.create(
              VALID_SCREENING_UID,
              startTime,
              endTime,
              BookingType.ENTRY_TIME,
            ),
            failures,
          );

          // Assert
          expect(result).toBeDefined();
          expect(result.type).toBe(BookingType.ENTRY_TIME);
          expect(result.bookingUID).toBeDefined();
          expect(result.screeningUID).toBe(VALID_SCREENING_UID);
          expect(result.durationInMinutes).toBe(minutes);
          expect(result.startTime).toEqual(startTime);
          expect(result.endTime).toEqual(endTime);
        });
      });

      describe("deve falhar ao criar um objeto BookingSlot inválido", () => {
        const pastTime = new Date(NOW.getTime() - 1000 * 60 * 60); // 1 hora no passado
        const shortDurationEndTime = new Date(
          VALID_START_TIME.getTime() + 1000 * 60 * 29,
        ); // 29 minutos de duração
        const longDurationScreeningEndTime = new Date(
          VALID_START_TIME.getTime() + 1000 * 60 * 361,
        ); // 361 minutos de duração
        const longDurationCleaningEndTime = new Date(
          VALID_START_TIME.getTime() + 1000 * 60 * 121,
        ); // 121 minutos de duração
        const longDurationMaintenanceEndTime = new Date(
          VALID_START_TIME.getTime() + 1000 * 60 * (3 * 24 * 60 + 1),
        ); // 3 dias + 1 minuto de duração
        const shortDurationExitTimeEndTime = new Date(
          VALID_START_TIME.getTime() + 1000 * 60 * 14,
        ); // 14 minutos de duração (mínimo é 15)
        const longDurationExitTimeEndTime = new Date(
          VALID_START_TIME.getTime() + 1000 * 60 * 31,
        ); // 31 minutos de duração (máximo é 30)
        const shortDurationEntryTimeEndTime = new Date(
          VALID_START_TIME.getTime() + 1000 * 60 * 14,
        ); // 14 minutos de duração (mínimo é 15)
        const longDurationEntryTimeEndTime = new Date(
          VALID_START_TIME.getTime() + 1000 * 60 * 21,
        ); // 21 minutos de duração (máximo é 20)

        describe("falhas com campo específico", () => {
          const failureCases = [
            {
              scenario: "quando screeningUID é nulo e type é igual a screening",
              props: { screeningUID: null as any, type: BookingType.SCREENING },
              expectedCode: FailureCode.MISSING_REQUIRED_DATA,
              field: "screeningUID",
            },
            {
              scenario: "quando screeningUID é nulo e type é igual a EXIT_TIME",
              props: { screeningUID: null as any, type: BookingType.EXIT_TIME },
              expectedCode: FailureCode.MISSING_REQUIRED_DATA,
              field: "screeningUID",
            },
            {
              scenario:
                "quando screeningUID é nulo e type é igual a ENTRY_TIME",
              props: {
                screeningUID: null as any,
                type: BookingType.ENTRY_TIME,
              },
              expectedCode: FailureCode.MISSING_REQUIRED_DATA,
              field: "screeningUID",
            },
            {
              scenario: "quando startTime é nulo",
              props: { startTime: null as any },
              expectedCode: FailureCode.MISSING_REQUIRED_DATA,
              field: "startTime",
            },
            {
              scenario: "quando endTime é nulo",
              props: { endTime: null as any },
              expectedCode: FailureCode.MISSING_REQUIRED_DATA,
              field: "endTime",
            },
            {
              scenario: "quando type é nulo",
              props: { type: null as any },
              expectedCode: FailureCode.MISSING_REQUIRED_DATA,
              field: "type",
            },
            {
              scenario: "quando type é inválido",
              props: { type: "INVALID_TYPE" as any },
              expectedCode: FailureCode.INVALID_ENUM_VALUE,
              field: "type",
            },
            {
              scenario: "quando startTime está no passado",
              props: { startTime: pastTime },
              expectedCode: FailureCode.DATE_CANNOT_BE_PAST,
              field: "startTime",
            },
            {
              scenario: "quando endTime é anterior a startTime",
              props: { startTime: VALID_END_TIME, endTime: VALID_START_TIME },
              expectedCode: FailureCode.DATE_WITH_INVALID_SEQUENCE,
              field: "endTime",
            },
          ];

          failureCases.forEach(({ scenario, props, expectedCode, field }) => {
            it(scenario, () => {
              // Arrange
              const input = {
                screeningUID: mockScreeningUID,
                startTime: VALID_START_TIME,
                endTime: VALID_END_TIME,
                type: VALID_TYPE,
                ...props,
              };

              // Act
              const result = validateAndCollect(
                BookingSlot.create(
                  input.screeningUID,
                  input.startTime,
                  input.endTime,
                  input.type,
                ),
                failures,
              );

              // Assert
              expect(result).toBeNull();
              expect(failures.length).toBe(1);
              expect(failures[0].code).toBe(expectedCode);
              expect(failures[0].details.field).toBe(field);
            });
          });
        });

        describe("falhas de duração sem campo específico", () => {
          const durationFailureCases = [
            {
              scenario:
                "quando a duração para SCREENING é muito curta (< 30 min)",
              props: {
                endTime: shortDurationEndTime,
                type: BookingType.SCREENING,
              },
              expectedCode: FailureCode.INVALID_OPERATION_DURATION,
            },
            {
              scenario:
                "quando a duração para SCREENING é muito longa (> 360 min)",
              props: {
                endTime: longDurationScreeningEndTime,
                type: BookingType.SCREENING,
              },
              expectedCode: FailureCode.INVALID_OPERATION_DURATION,
            },
            {
              scenario:
                "quando a duração para CLEANING é muito longa (> 120 min)",
              props: {
                endTime: longDurationCleaningEndTime,
                type: BookingType.CLEANING,
              },
              expectedCode: FailureCode.INVALID_OPERATION_DURATION,
            },
            {
              scenario:
                "quando a duração para MAINTENANCE é muito longa (> 3 dias)",
              props: {
                endTime: longDurationMaintenanceEndTime,
                type: BookingType.MAINTENANCE,
              },
              expectedCode: FailureCode.INVALID_OPERATION_DURATION,
            },
            {
              scenario:
                "quando a duração para EXIT_TIME é muito curta (< 15 min)",
              props: {
                endTime: shortDurationExitTimeEndTime,
                type: BookingType.EXIT_TIME,
              },
              expectedCode: FailureCode.INVALID_OPERATION_DURATION,
            },
            {
              scenario:
                "quando a duração para EXIT_TIME é muito longa (> 30 min)",
              props: {
                endTime: longDurationExitTimeEndTime,
                type: BookingType.EXIT_TIME,
              },
              expectedCode: FailureCode.INVALID_OPERATION_DURATION,
            },
            {
              scenario:
                "quando a duração para ENTRY_TIME é muito curta (< 15 min)",
              props: {
                endTime: shortDurationEntryTimeEndTime,
                type: BookingType.ENTRY_TIME,
              },
              expectedCode: FailureCode.INVALID_OPERATION_DURATION,
            },
            {
              scenario:
                "quando a duração para ENTRY_TIME é muito longa (> 20 min)",
              props: {
                endTime: longDurationEntryTimeEndTime,
                type: BookingType.ENTRY_TIME,
              },
              expectedCode: FailureCode.INVALID_OPERATION_DURATION,
            },
            {
              scenario: "Deve falhar quando startTime for no passado",
              props: {
                startTime: new Date(Date.now() - 24 * 60 * 60 * 1000), // Ontem
              },
              expectedCode: FailureCode.DATE_CANNOT_BE_PAST,
            },
            {
              scenario: "Deve falhar quando endTime for anterior a startTime",
              props: {
                startTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Amanhã
                endTime: new Date(
                  Date.now() + 24 * 60 * 60 * 1000 - 60 * 60 * 1000,
                ), // 1 hora antes
              },
              expectedCode: FailureCode.DATE_WITH_INVALID_SEQUENCE,
            },
            {
              scenario:
                "Deve falhar quando screeningUID for null para tipo SCREENING",
              props: {
                screeningUID: null as any,
              },
              expectedCode: FailureCode.MISSING_REQUIRED_DATA,
            },
            {
              scenario: "Deve falhar quando o tipo for inválido",
              props: {
                type: "INVALID_TYPE" as any,
              },
              expectedCode: FailureCode.INVALID_ENUM_VALUE,
            },
          ];

          durationFailureCases.forEach(({ scenario, props, expectedCode }) => {
            it(scenario, () => {
              // Arrange
              const input = {
                screeningUID: mockScreeningUID,
                startTime: VALID_START_TIME,
                endTime: VALID_END_TIME,
                type: VALID_TYPE,
                ...props,
              };

              // Act
              const result = validateAndCollect(
                BookingSlot.create(
                  input.screeningUID,
                  input.startTime,
                  input.endTime,
                  input.type,
                ),
                failures,
              );

              // Assert
              expect(result).toBeNull();
              expect(failures.length).toBe(1);
              expect(failures[0].code).toBe(expectedCode);
            });
          });
        });
      });
    });

    describe("hydrate", () => {
      const VALID_START_TIME = new Date(2023, 0, 1, 12, 0, 0);
      const VALID_END_TIME = new Date(2023, 0, 1, 14, 0, 0);

      it("deve criar um objeto BookingSlot sem validação", () => {
        // Act
        const result = BookingSlot.hydrate(
          "uid",
          mockScreeningUIDString,
          VALID_START_TIME,
          VALID_END_TIME,
          VALID_TYPE,
        );

        // Assert
        expect(result).toBeInstanceOf(BookingSlot);
        expect(result.screeningUID.value).toBe(mockScreeningUIDString);
        expect(result.startTime).toEqual(VALID_START_TIME);
        expect(result.endTime).toEqual(VALID_END_TIME);
        expect(result.type).toEqual(VALID_TYPE);
      });

      it("deve criar um objeto BookingSlot do tipo ENTRY_TIME sem validação", () => {
        // Act
        const result = BookingSlot.hydrate(
          "uid",
          mockScreeningUIDString,
          VALID_START_TIME,
          VALID_END_TIME,
          BookingType.ENTRY_TIME,
        );

        // Assert
        expect(result).toBeInstanceOf(BookingSlot);
        expect(result.screeningUID.value).toBe(mockScreeningUIDString);
        expect(result.startTime).toEqual(VALID_START_TIME);
        expect(result.endTime).toEqual(VALID_END_TIME);
        expect(result.type).toEqual(BookingType.ENTRY_TIME);
      });

      describe("deve lançar TechnicalError quando dados de hidratação são inválidos", () => {
        const invalidHydrateCases = [
          {
            scenario: "booking uid é nulo",
            props: { bookingUID: null as any },
          },
          {
            scenario: "startTime é nulo",
            props: { startTime: null as any },
          },
          {
            scenario: "endTime é nulo",
            props: { endTime: null as any },
          },
          {
            scenario: "type é nulo",
            props: { type: null as any },
          },
        ];

        invalidHydrateCases.forEach(({ scenario, props }) => {
          it(scenario, () => {
            // Arrange
            const datas = {
              bookingUID: "uid",
              screeningUID: mockScreeningUIDString, // hydrate espera string para screeningUID
              startTime: VALID_START_TIME,
              endTime: VALID_END_TIME,
              type: VALID_TYPE,
              ...props,
            };

            // Act & Assert
            expect(() =>
              BookingSlot.hydrate(
                datas.bookingUID,
                datas.screeningUID,
                datas.startTime,
                datas.endTime,
                datas.type,
              ),
            ).toThrow(TechnicalError);
          });
        });
      });
    });

    describe("durationInMinutes", () => {
      it("Deve calcular a duração corretamente", () => {
        // Arrange
        const startTime = new Date(VALID_END_TIME);
        const durationInMinutes = 120; // 2 horas
        const endTime = new Date(
          startTime.getTime() + durationInMinutes * 60 * 1000,
        );
        const bookingSlot = BookingSlot.hydrate(
          v4(),
          VALID_SCREENING_UID.value,
          startTime,
          endTime,
          BookingType.SCREENING,
        );

        // Act
        const calculatedDuration = bookingSlot.durationInMinutes;

        // Assert
        expect(calculatedDuration).toBe(durationInMinutes);
      });

      it("Deve calcular a duração corretamente para intervalos curtos", () => {
        // Arrange
        const startTime = new Date(VALID_END_TIME);
        const durationInMinutes = 15; // 15 minutos (mínimo para EXIT_TIME)
        const endTime = new Date(
          startTime.getTime() + durationInMinutes * 60 * 1000,
        );
        const bookingSlot = BookingSlot.hydrate(
          v4(),
          VALID_SCREENING_UID.value,
          startTime,
          endTime,
          BookingType.EXIT_TIME,
        );

        // Act
        const calculatedDuration = bookingSlot.durationInMinutes;

        // Assert
        expect(calculatedDuration).toBe(durationInMinutes);
      });
    });

    describe("equals", () => {
      const validUID = "test-uid";
      const NOW = new Date();

      it("deve retornar true se ambos tiverem mesmo uid", () => {
        // Arrange
        const instance1 = BookingSlot.hydrate(
          validUID,
          null,
          NOW,
          new Date(NOW.getTime() + 1000 * 60 * 60),
          BookingType.CLEANING,
        );
        const instance2 = BookingSlot.hydrate(
          validUID,
          null,
          NOW,
          new Date(NOW.getTime() + 1000 * 60 * 60),
          BookingType.CLEANING,
        );

        // Act
        const result = instance1.equals(instance2);

        // Assert
        expect(result).toBe(true);
      });

      describe("deve retornar false", () => {
        const falsyCases = [
          {
            scenario: "quando other não é uma instância de BookingSlot",
            other: "não é um BookingSlot",
          },
          {
            scenario: "quando uids são diferentes",
            other: BookingSlot.hydrate(
              "outro-uid",
              null,
              NOW,
              new Date(NOW.getTime() + 1000 * 60 * 60),
              BookingType.CLEANING,
            ),
          },
          {
            scenario: "quando other é null",
            other: null,
          },
          {
            scenario: "quando other é undefined",
            other: undefined,
          },
        ];

        falsyCases.forEach(({ scenario, other }) => {
          it(scenario, () => {
            // Arrange
            const instance = BookingSlot.hydrate(
              validUID,
              null,
              NOW,
              new Date(NOW.getTime() + 1000 * 60 * 60),
              BookingType.CLEANING,
            );

            // Act
            const result = instance.equals(other as BookingSlot);

            // Assert
            expect(result).toBe(false);
          });
        });
      });
    });
  });
});
