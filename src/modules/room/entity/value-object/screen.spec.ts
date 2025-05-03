import { Screen, ScreenType } from "./screen";
import { FailureCode } from "../../../../shared/failure/failure.codes.enum";

describe("Screen", () => {
  const VALID_SIZE = 20;
  const _2D: ScreenType = "2D";
  const _3D: ScreenType = "3D";
  const _2D_3D: ScreenType = "2D_3D";

  describe("Métodos Estáticos", () => {
    describe("create", () => {
      describe("telas válidas", () => {
        const successCases = [
          {
            size: 10,
            type: _2D,
            scenario: "com tamanho mínimo exato",
          },
          {
            size: 50,
            type: _2D,
            scenario: "com tamanho máximo exato",
          },
          {
            size: VALID_SIZE,
            type: _2D,
            scenario: "com tipo 2D",
          },
          {
            size: VALID_SIZE,
            type: _3D,
            scenario: "com tipo 3D",
          },
          {
            size: VALID_SIZE,
            type: _2D_3D,
            scenario: "com tipo 2D_3D",
          },
        ];

        successCases.forEach(({ size, type, scenario }) => {
          it(`deve criar uma tela ${scenario}`, () => {
            // Act
            const result = Screen.create(size, type);

            // Assert
            expect(result.invalid).toBe(false);
            expect(result.value.size).toBe(size);
            expect(result.value.type).toBe(type);
          });
        });
      });

      describe("deve retornar um erro quando a tela é inválida", () => {
        const failureCases = [
          {
            size: null,
            type: _2D,
            scenario: "com tamanho nulo",
            errorCode: FailureCode.MISSING_REQUIRED_DATA,
            field: "size",
          },
          {
            size: "20" as any,
            type: _2D,
            scenario: "com tamanho não numérico",
            errorCode: FailureCode.CONTENT_INVALID_TYPE,
            field: "size",
          },
          {
            size: 5,
            type: _2D,
            scenario: "com tamanho menor que o mínimo",
            errorCode: FailureCode.INVALID_FIELD_SIZE,
            field: "size",
          },
          {
            size: 60,
            type: _2D,
            scenario: "com tamanho maior que o máximo",
            errorCode: FailureCode.INVALID_FIELD_SIZE,
            field: "size",
          },
          {
            size: VALID_SIZE,
            type: null,
            scenario: "com tipo nulo",
            errorCode: FailureCode.MISSING_REQUIRED_DATA,
            field: "screenType",
          },
          {
            size: VALID_SIZE,
            type: "4D",
            scenario: "com tipo inválido",
            errorCode: FailureCode.INVALID_ENUM_VALUE,
            field: "screenType",
          },
        ];

        failureCases.forEach(({ size, type, scenario, errorCode, field }) => {
          it(`deve rejeitar uma tela ${scenario}`, () => {
            // Act
            const result = Screen.create(size, type);

            // Assert
            expect(result.invalid).toBe(true);
            expect(result.failures[0].code).toBe(errorCode);
            expect(result.failures[0].details.field).toBe(field);
          });
        });
      });
    });

    describe("hydrate", () => {
      it("deve hidratar uma tela corretamente", () => {
        // Act
        const hydrated = Screen.hydrate(VALID_SIZE, _2D);

        // Assert
        expect(hydrated.size).toBe(VALID_SIZE);
        expect(hydrated.type).toBe(_2D);
      });

      it.each([
        [null, _2D, "size"],
        [VALID_SIZE, null, "type"],
      ])(
        "deve lançar TechnicalError quando %p é nulo",
        (size, type, expectedField) => {
          // Act & Assert
          expect(() => Screen.hydrate(size, type)).toThrow();
        },
      );
    });
  });

  describe("Métodos de Instância", () => {
    describe("equals", () => {
      it("deve retornar true para telas com mesmo tamanho e tipo", () => {
        // Arrange
        const screen1 = Screen.hydrate(VALID_SIZE, _2D);
        const screen2 = Screen.hydrate(VALID_SIZE, _2D);

        // Act
        const result = screen1.equals(screen2);

        // Assert
        expect(result).toBe(true);
      });

      it("deve retornar false para telas com tamanhos diferentes", () => {
        // Arrange
        const screen1 = Screen.hydrate(VALID_SIZE, _2D);
        const screen2 = Screen.hydrate(VALID_SIZE + 5, _2D);

        // Act
        const result = screen1.equals(screen2);

        // Assert
        expect(result).toBe(false);
      });

      it("deve retornar false para telas com tipos diferentes", () => {
        // Arrange
        const screen1 = Screen.hydrate(VALID_SIZE, _2D);
        const screen2 = Screen.hydrate(VALID_SIZE, _3D);

        // Act
        const result = screen1.equals(screen2);

        // Assert
        expect(result).toBe(false);
      });

      it("deve retornar false quando comparado com null", () => {
        // Arrange
        const screen = Screen.hydrate(VALID_SIZE, _2D);

        // Act
        const result = screen.equals(null);

        // Assert
        expect(result).toBe(false);
      });

      it("deve retornar false quando comparado com undefined", () => {
        // Arrange
        const screen = Screen.hydrate(VALID_SIZE, _2D);

        // Act
        const result = screen.equals(undefined);

        // Assert
        expect(result).toBe(false);
      });
    });
  });
});
