import { BookingSlot, BookingType } from "./booking.slot";
import { ScreeningUID } from "../../../screening/aggregate/value-object/screening.uid";
import { TechnicalError } from "../../../../shared/error/technical.error";
import { FailureCode } from "../../../../shared/failure/failure.codes.enum";

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
    const NOW = new Date(Date.now());
    const VALID_START_TIME = new Date(NOW.getTime() + 1000 * 60 * 60); // 1 hora no futuro
    const VALID_END_TIME = new Date(
      VALID_START_TIME.getTime() + 1000 * 60 * 120,
    ); // 2 horas depois do startTime (duração de 120 minutos)

    describe("deve criar um objeto BookingSlot válido", () => {
      it("com todos os parâmetros válidos", () => {
        // Act
        const result = BookingSlot.create(
          mockScreeningUID,
          VALID_START_TIME,
          VALID_END_TIME,
          VALID_TYPE,
        );

        // Assert
        expect(result.invalid).toBe(false);
        expect(result.value).toBeInstanceOf(BookingSlot);
        expect(result.value.screeningUID).toBe(mockScreeningUID);
        expect(result.value.startTime).toEqual(VALID_START_TIME);
        expect(result.value.endTime).toEqual(VALID_END_TIME);
        expect(result.value.type).toEqual(VALID_TYPE);
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

      describe("falhas com campo específico", () => {
        const failureCases = [
          {
            scenario: "quando screeningUID é nulo",
            props: { screeningUID: null as any },
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
            expectedCode: FailureCode.INVALID_BOOKING_TYPE,
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
            const result = BookingSlot.create(
              input.screeningUID,
              input.startTime,
              input.endTime,
              input.type,
            );

            // Assert
            expect(result.invalid).toBe(true);
            expect(result.failures.length).toBe(1);
            expect(result.failures[0].code).toBe(expectedCode);
            expect(result.failures[0].details.field).toBe(field);
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
            expectedCode: FailureCode.INVALID_SCREENING_DURATION,
          },
          {
            scenario:
              "quando a duração para SCREENING é muito longa (> 360 min)",
            props: {
              endTime: longDurationScreeningEndTime,
              type: BookingType.SCREENING,
            },
            expectedCode: FailureCode.INVALID_SCREENING_DURATION,
          },
          {
            scenario:
              "quando a duração para CLEANING é muito longa (> 120 min)",
            props: {
              endTime: longDurationCleaningEndTime,
              type: BookingType.CLEANING,
            },
            expectedCode: FailureCode.INVALID_CLEANING_DURATION,
          },
          {
            scenario:
              "quando a duração para MAINTENANCE é muito longa (> 3 dias)",
            props: {
              endTime: longDurationMaintenanceEndTime,
              type: BookingType.MAINTENANCE,
            },
            expectedCode: FailureCode.INVALID_MAINTENANCE_DURATION,
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
            const result = BookingSlot.create(
              input.screeningUID,
              input.startTime,
              input.endTime,
              input.type,
            );

            // Assert
            expect(result.invalid).toBe(true);
            expect(result.failures.length).toBe(1);
            expect(result.failures[0].code).toBe(expectedCode);
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

    describe("deve lançar TechnicalError quando dados de hidratação são inválidos", () => {
      const invalidHydrateCases = [
        {
          scenario: "screeningUID é nulo",
          props: { screeningUID: null as any },
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
        {
          scenario: "type é inválido",
          props: { type: "INVALID_TYPE" as any },
        },
      ];

      invalidHydrateCases.forEach(({ scenario, props }) => {
        it(scenario, () => {
          // Arrange
          const datas = {
            screeningUID: mockScreeningUIDString, // hydrate espera string para screeningUID
            startTime: VALID_START_TIME,
            endTime: VALID_END_TIME,
            type: VALID_TYPE,
            ...props,
          };

          // Act & Assert
          expect(() =>
            BookingSlot.hydrate(
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
});
