import { BookingSlot } from "./booking.slot";
import { ScreeningUID } from "../../../screening/aggregate/value-object/screening.uid";
import { TechnicalError } from "../../../../shared/error/technical.error";
import { FailureCode } from "../../../../shared/failure/failure.codes.enum";

describe("BookingSlot", () => {
  let originalDateNow: () => number;
  const mockScreeningUID = ScreeningUID.create();
  const mockScreeningUIDString = mockScreeningUID.value;

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
    ); // 2 horas depois do startTime

    describe("deve criar um objeto BookingSlot válido", () => {
      it("com todos os parâmetros válidos", () => {
        // Act
        const result = BookingSlot.create(
          mockScreeningUID,
          VALID_START_TIME,
          VALID_END_TIME,
        );

        // Assert
        expect(result.invalid).toBe(false);
        expect(result.value).toBeInstanceOf(BookingSlot);
        expect(result.value.screeningUID).toBe(mockScreeningUID);
        expect(result.value.startTime).toEqual(VALID_START_TIME);
        expect(result.value.endTime).toEqual(VALID_END_TIME);
      });
    });

    describe("deve falhar ao criar um objeto BookingSlot inválido", () => {
      const pastTime = new Date(NOW.getTime() - 1000 * 60 * 60); // 1 hora no passado

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
          scenario: "quando startTime está no passado",
          props: { startTime: pastTime },
          expectedCode: FailureCode.DATE_NOT_AFTER_LIMIT,
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
            ...props,
          };

          // Act
          const result = BookingSlot.create(
            input.screeningUID,
            input.startTime,
            input.endTime,
          );

          // Assert
          expect(result.invalid).toBe(true);
          expect(result.failures.length).toBeGreaterThanOrEqual(1);
          expect(result.failures[0].code).toBe(expectedCode);
          expect(result.failures[0].details.field).toBe(field);
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
      );

      // Assert
      expect(result).toBeInstanceOf(BookingSlot);
      expect(result.screeningUID.value).toBe(mockScreeningUIDString);
      expect(result.startTime).toEqual(VALID_START_TIME);
      expect(result.endTime).toEqual(VALID_END_TIME);
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
      ];

      invalidHydrateCases.forEach(({ scenario, props }) => {
        it(scenario, () => {
          // Arrange
          const datas = {
            screeningUID: mockScreeningUID,
            startTime: VALID_START_TIME,
            endTime: VALID_END_TIME,
            ...props,
          };

          // Act & Assert
          expect(() =>
            BookingSlot.hydrate(
              datas.screeningUID,
              datas.startTime,
              datas.endTime,
            ),
          ).toThrow(TechnicalError);
        });
      });
    });
  });
});
