import { StudentCard } from "./student-card";
import { FailureCode } from "../../../../shared/failure/failure.codes.enum";
import { validateAndCollect } from "../../../../shared/validator/common.validators";
import { SimpleFailure } from "../../../../shared/failure/simple.failure.type";
import { TechnicalError } from "../../../../shared/error/technical.error";

describe("StudentCard", () => {
  let failures: SimpleFailure[];

  const MIN_ID_LENGTH = 6;
  const MAX_ID_LENGTH = 24;
  const MAX_VALIDITY_DAY_IN_FUTURE = 360 * 2;

  beforeEach(() => {
    failures = [];
  });

  const getFutureDate = (days: number): Date => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
  };

  const getPastDate = (days: number): Date => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date;
  };

  describe("create", () => {
    describe("deve criar um StudentCard válido", () => {
      const successCases = [
        {
          id: "VALID123",
          validity: getFutureDate(30),
          scenario: "com ID e validade válidos",
        },
        {
          id: "A".repeat(MIN_ID_LENGTH),
          validity: getFutureDate(10),
          scenario: "com ID de comprimento mínimo",
        },
        {
          id: "B".repeat(MAX_ID_LENGTH),
          validity: getFutureDate(MAX_VALIDITY_DAY_IN_FUTURE - 1),
          scenario: "com ID de comprimento máximo",
        },
        {
          id: "NEARFUT",
          validity: getFutureDate(1), // Amanhã
          scenario: "com data de validade mínima no futuro",
        },
        {
          id: "FARFUT",
          validity: getFutureDate(MAX_VALIDITY_DAY_IN_FUTURE - 1), // Um pouco antes do limite máximo
          scenario: "com data de validade próxima ao limite máximo no futuro",
        },
      ];

      successCases.forEach(({ id, validity, scenario }) => {
        it(`objeto StudentCard ${scenario}`, () => {
          // Act
          const result = validateAndCollect(
            StudentCard.create(id, validity),
            failures,
          );

          // Assert
          expect(result).toBeDefined();
          expect(result?.id).toBe(id);
          expect(result?.validity.toISOString()).toBe(validity.toISOString());
          expect(failures.length).toBe(0);
        });
      });
    });

    describe("deve falhar ao criar um StudentCard inválido", () => {
      const now = new Date();
      const maxFutureDate = new Date(
        now.getTime() + MAX_VALIDITY_DAY_IN_FUTURE * 24 * 60 * 60 * 1000,
      );

      const failureCases = [
        {
          id: null as any,
          validity: getFutureDate(30),
          scenario: "quando o ID é nulo",
          errorCodeExpected: FailureCode.MISSING_REQUIRED_DATA,
        },
        {
          id: "VALID123",
          validity: null as any,
          scenario: "quando a validade é nula",
          errorCodeExpected: FailureCode.MISSING_REQUIRED_DATA,
        },
        {
          id: "A".repeat(MIN_ID_LENGTH - 1),
          validity: getFutureDate(30),
          scenario: "quando o ID é muito curto",
          errorCodeExpected: FailureCode.STUDENT_CARD_ID_INVALID_FORMAT,
          params: { min: MIN_ID_LENGTH, max: MAX_ID_LENGTH },
        },
        {
          id: "B".repeat(MAX_ID_LENGTH + 1),
          validity: getFutureDate(30),
          scenario: "quando o ID é muito longo",
          errorCodeExpected: FailureCode.STUDENT_CARD_ID_INVALID_FORMAT,
          params: { min: MIN_ID_LENGTH, max: MAX_ID_LENGTH },
        },
        {
          id: "PASTDATE",
          validity: getPastDate(1),
          scenario: "quando a data de validade é no passado",
          errorCodeExpected: FailureCode.DATE_CANNOT_BE_PAST,
          params: { now: new Date().toISOString().split("T")[0] },
        },
        {
          id: "TODAYVAL",
          validity: new Date(), // Hoje
          scenario: "quando a data de validade é hoje",
          errorCodeExpected: FailureCode.DATE_CANNOT_BE_PAST,
          params: { now: new Date().toISOString().split("T")[0] },
        },
        {
          id: "TOOFAR",
          validity: getFutureDate(MAX_VALIDITY_DAY_IN_FUTURE + 10),
          scenario: "quando a data de validade é muito distante no futuro",
          errorCodeExpected: FailureCode.DATE_NOT_AFTER_LIMIT,
          params: { limit: maxFutureDate.toISOString().split("T")[0] },
        },
      ];

      failureCases.forEach(
        ({ id, validity, scenario, errorCodeExpected, params }) => {
          it(`falha ${scenario}`, () => {
            // Act
            const result = validateAndCollect(
              StudentCard.create(id, validity),
              failures,
            );

            // Assert
            expect(result).toBeNull();
            expect(failures.length).toBe(1);
            expect(failures[0].code).toBe(errorCodeExpected);
          });
        },
      );
    });
  });

  describe("hydrate", () => {
    it("deve hidratar um StudentCard com dados válidos", () => {
      // Arrange
      const id = "HYDRATE1";
      const validity = getFutureDate(60);

      // Act
      const studentCard = StudentCard.hydrate(id, validity);

      // Assert
      expect(studentCard).toBeInstanceOf(StudentCard);
      expect(studentCard.id).toBe(id);
      expect(studentCard.validity.toISOString().split("T")[0]).toBe(
        validity.toISOString().split("T")[0],
      );
    });

    it("deve lançar TechnicalError se o ID for nulo", () => {
      expect(() => StudentCard.hydrate(null as any, getFutureDate(10))).toThrow(
        TechnicalError,
      );
    });

    it("deve lançar TechnicalError se a validade for nula", () => {
      expect(() => StudentCard.hydrate("IDVALID", null as any)).toThrow(
        TechnicalError,
      );
    });
  });

  describe("isValid", () => {
    it("deve retornar true para uma carteirinha com validade futura", () => {
      // Arrange
      const studentCard = StudentCard.hydrate("VALIDC", getFutureDate(5));

      // Act & Assert
      expect(studentCard.isValid).toBe(true);
    });

    it("deve retornar false para uma carteirinha com validade passada", () => {
      // Arrange
      const pastDate = getPastDate(5);
      const studentCard = new (StudentCard as any)("EXPIRED", pastDate);

      // Act & Assert
      expect(studentCard.isValid).toBe(false);
    });

    it("deve retornar true para uma carteirinha com validade hoje", () => {
      // Arrange
      const today = new Date();
      const studentCard = StudentCard.hydrate("CARDID", today);

      // Act & Assert
      expect(studentCard.isValid).toBe(true);
    });
  });

  describe("equals", () => {
    const id1 = "EQUALID1";
    const validity1 = getFutureDate(90);
    const card1 = StudentCard.hydrate(id1, validity1);
    const card1Again = StudentCard.hydrate(id1, validity1);

    const id2 = "DIFFID2";
    const validity2 = getFutureDate(100);
    const card2 = StudentCard.hydrate(id2, validity2);

    it("deve retornar true para duas instâncias de StudentCard com mesmo ID e validade", () => {
      expect(card1.equals(card1Again)).toBe(true);
    });

    it("deve retornar false para StudentCards com IDs diferentes", () => {
      const cardDiffId = StudentCard.hydrate(id2, validity1);
      expect(card1.equals(cardDiffId)).toBe(false);
    });

    it("deve retornar false para StudentCards com datas de validade diferentes", () => {
      const cardDiffValidity = StudentCard.hydrate(id1, validity2);
      expect(card1.equals(cardDiffValidity)).toBe(false);
    });

    it("deve retornar false ao comparar com null", () => {
      expect(card1.equals(null as any)).toBe(false);
    });

    it("deve retornar false ao comparar com undefined", () => {
      expect(card1.equals(undefined as any)).toBe(false);
    });

    it("deve retornar false ao comparar com um objeto de tipo diferente", () => {
      expect(card1.equals({ id: id1, validity: validity1 } as any)).toBe(false);
    });
  });
});
