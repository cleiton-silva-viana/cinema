import { FailureCode } from "../failure/failure.codes.enum";
import { SimpleFailure } from "../failure/simple.failure.type";
import { DateValidator } from "./date.validator";
import { Flow } from "../assert/assert";

describe("DateValidator", () => {
  const startDate = new Date("2023-01-01");
  const endDate = new Date("2023-03-01");
  const ONE_DAY = 24 * 60 * 60 * 1000;

  // Datas comuns para testes
  const dataBefore = new Date(startDate.getTime() - ONE_DAY);
  const dataMiddle = new Date(startDate.getTime() + ONE_DAY);
  const dataAfter = new Date(endDate.getTime() + ONE_DAY);

  // Detalhes comuns para testes
  const commonDetails = { message: "Mensagem de erro personalizada" };

  describe("Construtor e inicialização", () => {
    it("deve criar uma instância válida com uma data", () => {
      // Arrange & Act
      const validator = new DateValidator(new Date());

      // Assert
      expect(validator).toBeInstanceOf(DateValidator);
    });

    it("deve lidar com valores null", () => {
      // Arrange & Act & Assert
      expect(() => new DateValidator(null as any)).not.toThrow();
    });

    it("deve lidar com valores undefined", () => {
      // Arrange & Act & Assert
      expect(() => new DateValidator(undefined as any)).not.toThrow();
    });

    it("deve lidar com valores que não são datas", () => {
      // Arrange & Act & Assert
      expect(() => new DateValidator("2023-01-01" as any)).not.toThrow();
      expect(() => new DateValidator(123 as any)).not.toThrow();
      expect(() => new DateValidator({} as any)).not.toThrow();
    });
  });

  describe("isAfter", () => {
    it("não deve adicionar falha quando a data for posterior à data limite", () => {
      // Arrange
      const failures: SimpleFailure[] = [];

      // Act
      new DateValidator(dataMiddle).failures(failures).isAfter(startDate);

      // Assert
      expect(failures.length).toBe(0);
    });

    it("deve adicionar falha quando a data não for posterior à data limite", () => {
      // Arrange
      const failures: SimpleFailure[] = [];

      // Act
      new DateValidator(startDate).failures(failures).isAfter(endDate);

      // Assert
      expect(failures.length).toBe(1);
      expect(failures[0].code).toBe(FailureCode.DATE_NOT_AFTER_LIMIT);
      expect(failures[0].details.value).toBe(startDate.toISOString());
      expect(failures[0].details.limitDate).toBe(endDate.toISOString());
    });

    it("deve usar o código de erro personalizado", () => {
      // Arrange
      const failures: SimpleFailure[] = [];
      const code = FailureCode.CONTENT_INVALID_TYPE;

      // Act
      new DateValidator(startDate).failures(failures).isAfter(endDate, code);

      // Assert
      expect(failures.length).toBe(1);
      expect(failures[0].code).toBe(code);
    });

    it("deve incluir detalhes adicionais na falha", () => {
      // Arrange
      const failures: SimpleFailure[] = [];

      // Act
      new DateValidator(startDate)
        .failures(failures)
        .isAfter(endDate, FailureCode.DATE_NOT_AFTER_LIMIT, commonDetails);

      // Assert
      expect(failures.length).toBe(1);
      expect(failures[0].details.message).toBe(commonDetails.message);
      expect(failures[0].details.value).toBe(startDate.toISOString());
      expect(failures[0].details.limitDate).toBe(endDate.toISOString());
    });

    it("deve lidar com limit date inválido", () => {
      // Arrange
      const invalidDate: any[] = [null, undefined];

      // Act & Assert
      for (const date of invalidDate) {
        expect(() => {
          new DateValidator(startDate).isAfter(date);
        }).toThrow();
      }
    });

    it("deve adicionar falha quando a data for um valor nulo ou undefined", () => {
      // Arrange
      const invalidValues: any[] = [null, undefined];

      for (const value of invalidValues) {
        // Arrange
        const failures: SimpleFailure[] = [];

        // Act
        new DateValidator(value).failures(failures).isAfter(endDate);

        // Assert
        expect(failures.length).toBe(1);
        expect(failures[0].code).toBe(FailureCode.DATE_NOT_AFTER_LIMIT);
      }
    });
  });

  describe("isBefore", () => {
    it("não deve adicionar falha quando a data for anterior à data limite", () => {
      // Arrange
      const failures: SimpleFailure[] = [];

      // Act
      new DateValidator(startDate).failures(failures).isBefore(endDate);

      // Assert
      expect(failures.length).toBe(0);
    });

    it("deve adicionar falha quando a data não for anterior à data limite", () => {
      // Arrange
      const failures: SimpleFailure[] = [];

      // Act
      new DateValidator(endDate).failures(failures).isBefore(startDate);

      // Assert
      expect(failures.length).toBe(1);
      expect(failures[0].code).toBe(FailureCode.DATE_NOT_BEFORE_LIMIT);
      expect(failures[0].details.value).toBe(endDate.toISOString());
      expect(failures[0].details.limitDate).toBe(startDate.toISOString());
    });

    it("deve adicionar falha quando a data for um valor nulo ou undefined", () => {
      // Arrange
      const invalidDates: any[] = [null, undefined];

      for (const date of invalidDates) {
        const failures: SimpleFailure[] = [];

        // Act
        new DateValidator(date).failures(failures).isBefore(endDate);

        // Assert
        expect(failures.length).toBe(1);
        expect(failures[0].code).toBe(FailureCode.DATE_NOT_BEFORE_LIMIT);
      }
    });

    it("deve usar o código de erro personalizado", () => {
      // Arrange
      const failures: SimpleFailure[] = [];
      const code = FailureCode.CONTENT_INVALID_TYPE;

      // Act
      new DateValidator(endDate).failures(failures).isBefore(startDate, code);

      // Assert
      expect(failures.length).toBe(1);
      expect(failures[0].code).toBe(code);
    });

    it("deve incluir detalhes adicionais na falha", () => {
      // Arrange
      const failures: SimpleFailure[] = [];

      // Act
      new DateValidator(endDate)
        .failures(failures)
        .isBefore(startDate, FailureCode.DATE_NOT_BEFORE_LIMIT, commonDetails);

      // Assert
      expect(failures.length).toBe(1);
      expect(failures[0].details.message).toBe(commonDetails.message);
      expect(failures[0].details.value).toBe(endDate.toISOString());
      expect(failures[0].details.limitDate).toBe(startDate.toISOString());
    });

    it("deve lidar com limitDate inválido", () => {
      // Arrange
      const invalidLimits: any[] = [null, undefined, new Date("Invalid Date")];

      for (const date of invalidLimits) {
        // Assert
        expect(() => {
          new DateValidator(startDate).isBefore(date);
        }).toThrow();
      }
    });
  });

  describe("isBetween", () => {
    describe("cenários onde não deve ocorrer falha", () => {
      const successCases = [
        {
          scenario:
            "não deve adicionar falha quando a data estiver dentro do intervalo",
          date: dataMiddle,
        },
        {
          scenario:
            "não deve adicionar falha quando a data for igual à data de início",
          date: new Date(startDate),
        },
        {
          scenario:
            "não deve adicionar falha quando a data for igual à data de fim",
          date: new Date(endDate),
        },
      ];

      successCases.forEach(({ scenario, date }) => {
        it(scenario, () => {
          // Arrange
          const failures: SimpleFailure[] = [];

          // Act
          new DateValidator(date)
            .failures(failures)
            .isBetween(startDate, endDate);

          // Assert
          expect(failures.length).toBe(0);
        });
      });
    });

    describe("cenários onde deve ocorrer uma falha", () => {
      const failureCases = [
        {
          scenario:
            "deve adicionar falha quando a data for anterior à data de início",
          date: dataBefore,
        },
        {
          scenario:
            "deve adicionar falha quando a data for posterior à data de fim",
          date: dataAfter,
        },
      ];

      failureCases.forEach(({ scenario, date }) => {
        // Arrange
        it(scenario, () => {
          const failures: SimpleFailure[] = [];

          // Act
          new DateValidator(date)
            .failures(failures)
            .isBetween(startDate, endDate);

          // Assert
          expect(failures.length).toBe(1);
          expect(failures[0].code).toBe(FailureCode.DATE_OUT_OF_RANGE);
          expect(failures[0].details.value).toBe(date.toISOString());
          expect(failures[0].details.startDate).toBe(startDate.toISOString());
          expect(failures[0].details.endDate).toBe(endDate.toISOString());
        });
      });
    });

    it("deve usar o código de erro personalizado", () => {
      // Arrange
      const failures: SimpleFailure[] = [];
      const code = FailureCode.CONTENT_INVALID_TYPE;

      // Act
      new DateValidator(dataAfter)
        .failures(failures)
        .isBetween(startDate, endDate, code);

      // Assert
      expect(failures.length).toBe(1);
      expect(failures[0].code).toBe(code);
    });

    it("deve incluir detalhes adicionais na falha", () => {
      // Arrange
      const failures: SimpleFailure[] = [];

      // Act
      new DateValidator(dataAfter)
        .failures(failures)
        .isBetween(
          startDate,
          endDate,
          FailureCode.DATE_OUT_OF_RANGE,
          commonDetails,
        );

      // Assert
      expect(failures.length).toBe(1);
      expect(failures[0].details.message).toBe(commonDetails.message);
      expect(failures[0].details.value).toBe(dataAfter.toISOString());
      expect(failures[0].details.startDate).toBe(startDate.toISOString());
      expect(failures[0].details.endDate).toBe(endDate.toISOString());
    });

    it("deve lidar com startDate inválido", () => {
      // Arrange
      const invalidDates: any[] = [null, undefined];

      for (const date of invalidDates) {
        const failures: SimpleFailure[] = [];

        // Act & Assert
        expect(() => {
          new DateValidator(dataMiddle)
            .failures(failures)
            .isBetween(date, endDate);
        }).toThrow();
      }
    });

    it("deve lidar com endDate inválido", () => {
      // Arrange
      const invalidDates: any[] = [null, undefined];

      for (const date of invalidDates) {
        const failures: SimpleFailure[] = [];

        // Act & Assert
        expect(() => {
          new DateValidator(dataMiddle)
            .failures(failures)
            .isBetween(startDate, date);
        }).toThrow();
      }
    });

    it("deve lidar com startDate e endDate invertidos", () => {
      // Arrange
      const failures: SimpleFailure[] = [];

      // Act
      new DateValidator(dataMiddle)
        .failures(failures)
        .isBetween(endDate, startDate);

      // Assert
      expect(failures.length).toBe(1);
      expect(failures[0].code).toBe(FailureCode.DATE_WITH_INVALID_SEQUENCE);
    });
  });

  describe("Validações encadeadas", () => {
    it("deve parar a validação após a primeira falha", () => {
      // Arrange
      const failures: SimpleFailure[] = [];

      // Act
      new DateValidator(dataAfter)
        .failures(failures)
        .isBefore(startDate) // Falha aqui
        .isAfter(endDate); // Não deve ser executado

      // Assert
      expect(failures.length).toBe(1);
      expect(failures[0].code).toBe(FailureCode.DATE_NOT_BEFORE_LIMIT);
    });

    it("deve continuar a validação quando continue for chamado", () => {
      // Arrange
      const failures: SimpleFailure[] = [];

      // Act
      new DateValidator(dataAfter)
        .failures(failures)
        .isBefore(startDate) // Falha aqui
        .continue()
        .isAfter(startDate); // Deve ser executado

      // Assert
      expect(failures.length).toBe(1);
      expect(failures[0].code).toBe(FailureCode.DATE_NOT_BEFORE_LIMIT);
    });

    it("deve acumular múltiplas falhas quando continue for chamado", () => {
      // Arrange
      const failures: SimpleFailure[] = [];
      const value = dataMiddle;
      const beforeDate = new Date(value.getTime() - ONE_DAY);
      const afterDate = new Date(value.getTime() + ONE_DAY);

      // Act
      new DateValidator(value)
        .failures(failures)
        .isBefore(beforeDate) // Falha aqui
        .continue()
        .isAfter(afterDate); // Falha aqui também

      // Assert
      expect(failures.length).toBe(2);
      expect(failures[0].code).toBe(FailureCode.DATE_NOT_BEFORE_LIMIT);
      expect(failures[1].code).toBe(FailureCode.DATE_NOT_AFTER_LIMIT);
    });

    it("deve executar validações condicionais com if", () => {
      // Arrange
      const failures: SimpleFailure[] = [];
      const value = dataMiddle;

      // Act
      new DateValidator(value)
        .failures(failures)
        .if(value.getMonth() === startDate.getMonth()) // Janeiro (true)
        .isBefore(endDate) // Não falha
        .if(value.getFullYear() !== startDate.getFullYear()) // Falso
        .isAfter(endDate); // Não deve ser executado

      // Assert
      expect(failures.length).toBe(0);
    });
  });

  describe("Casos extremos", () => {
    it("deve lidar com datas muito antigas", () => {
      // Arrange
      const failures: SimpleFailure[] = [];
      const value = new Date("1900-01-01");

      // Act
      new DateValidator(value).failures(failures).isAfter(startDate);

      // Assert
      expect(failures.length).toBe(1);
      expect(failures[0].code).toBe(FailureCode.DATE_NOT_AFTER_LIMIT);
    });

    it("deve lidar com datas muito futuras", () => {
      // Arrange
      const failures: SimpleFailure[] = [];
      const value = new Date("2100-01-01");

      // Act
      new DateValidator(value).failures(failures).isBefore(startDate);

      // Assert
      expect(failures.length).toBe(1);
      expect(failures[0].code).toBe(FailureCode.DATE_NOT_BEFORE_LIMIT);
    });

    it("deve lidar com datas inválidas", () => {
      // Arrange
      const failures: SimpleFailure[] = [];
      const value = new Date("Invalid Date");

      // Act & Assert
      expect(() => {
        new DateValidator(value).failures(failures).isAfter(startDate);
      }).not.toThrow();
    });
  });
});
