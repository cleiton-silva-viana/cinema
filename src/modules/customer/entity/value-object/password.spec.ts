import { Password } from "./password";
import { FailureCode } from "../../../../shared/failure/failure.codes.enum";
import { validateAndCollect } from "../../../../shared/validator/common.validators";
import { SimpleFailure } from "../../../../shared/failure/simple.failure.type";
import { TechnicalError } from "../../../../shared/error/technical.error";

describe("Password", () => {
  describe("create", () => {
    let failures: SimpleFailure[];

    beforeEach(() => {
      failures = [];
    });

    describe("deve criar uma senha válida", () => {
      const successCases = [
        { password: "123ABf@#", scenario: "com tamanho mínimo permitido" },
        {
          password: "ValidP@ss1",
          scenario: "com todos os critérios atendidos",
        },
        { password: "AnotherV@lid1", scenario: "com outra senha válida" },
        { password: "12@#36EWFEew633", scenario: "com senha complexa usada" },
      ];

      successCases.forEach(({ password, scenario }) => {
        it(`objeto Password ${scenario}`, async () => {
          // Act
          const result = validateAndCollect(
            await Password.create(password),
            failures,
          );

          // Assert
          expect(result).toBeDefined();
          expect(result.value).toBeDefined(); // O valor é o hash
          expect(failures.length).toBe(0);
        });
      });
    });

    describe("deve falhar ao criar uma senha inválida", () => {
      const failureCases = [
        {
          password: "short",
          scenario: "quando a senha é muito curta",
          errorCodeExpected: FailureCode.PASSWORD_LENGTH_OUT_OF_RANGE,
        },
        {
          password:
            "thispasswordiswaytoolongandshouldfailthispasswordiswaytoolongandshouldfail",
          scenario: "quando a senha é muito longa",
          errorCodeExpected: FailureCode.PASSWORD_LENGTH_OUT_OF_RANGE,
        },
        {
          password: "nouppercase1@",
          scenario: "quando falta letra maiúscula",
          errorCodeExpected: FailureCode.PASSWORD_MISSING_UPPERCASE,
        },
        {
          password: "NOLOWERCASE1@",
          scenario: "quando falta letra minúscula",
          errorCodeExpected: FailureCode.PASSWORD_MISSING_LOWERCASE,
        },
        {
          password: "NoDigit@",
          scenario: "quando falta dígito",
          errorCodeExpected: FailureCode.PASSWORD_MISSING_DIGIT,
        },
        {
          password: "NoSpecial1",
          scenario: "quando falta caractere especial",
          errorCodeExpected: FailureCode.PASSWORD_MISSING_SPECIAL_CHARACTER,
        },
        {
          password: null as unknown as string,
          scenario: "quando a senha é nula",
          errorCodeExpected: FailureCode.MISSING_REQUIRED_DATA,
        },
        {
          password: undefined as unknown as string,
          scenario: "quando a senha é indefinida",
          errorCodeExpected: FailureCode.MISSING_REQUIRED_DATA,
        },
        {
          password: "",
          scenario: "quando a senha está vazia",
          errorCodeExpected: FailureCode.PASSWORD_LENGTH_OUT_OF_RANGE,
        },
      ];

      failureCases.forEach(({ password, scenario, errorCodeExpected }) => {
        it(`objeto Password ${scenario}`, async () => {
          // Act
          const result = validateAndCollect(
            await Password.create(password),
            failures,
          );

          // Assert
          expect(result).toBeNull();
          expect(failures.length).toBe(1);
          expect(failures[0].code).toBe(errorCodeExpected);
        });
      });
    });
  });

  describe("hydrate", () => {
    it("deve criar um objeto Password sem validação com hash válido", () => {
      // Arrange
      const hashedPassword =
        "$argon2id$v=19$m=65536,t=3,p=4$c29tZXNhbHQ$R0p4cmcvN3p2SVdSc0hGZQ";

      // Act
      const result = Password.hydrate(hashedPassword);

      // Assert
      expect(result).toBeDefined();
      expect(result.value).toBe(hashedPassword);
    });

    it("deve falhar ao tentar hidratar com valor nulo", () => {
      expect(() => Password.hydrate(null as unknown as string)).toThrow(
        TechnicalError,
      );
    });

    it("deve falhar ao tentar hidratar com valor indefinido", () => {
      expect(() => Password.hydrate(undefined as unknown as string)).toThrow(
        TechnicalError,
      );
    });
  });

  describe("Compare", () => {
    const plainPassword = "ValidP@ss1";
    let hashedPassword: string;
    const credentialPassword = "12@#36EWFEew633";
    let credentialHashedPassword: string;

    beforeAll(async () => {
      const passwordResult = await Password.create(plainPassword);
      if (passwordResult.isValid()) {
        hashedPassword = passwordResult.value.value;
      }
      const credentialPasswordResult =
        await Password.create(credentialPassword);
      if (credentialPasswordResult.isValid()) {
        credentialHashedPassword = credentialPasswordResult.value.value;
      }
    });

    it("deve retornar verdadeiro quando a senha corresponde ao hash", async () => {
      // Act
      const result = await Password.Compare(hashedPassword, plainPassword);

      // Assert
      expect(result).toBe(true);
    });

    it("deve retornar verdadeiro quando corresponde ao hash", async () => {
      // Act
      const result = await Password.Compare(
        credentialHashedPassword,
        credentialPassword,
      );

      // Assert
      expect(result).toBe(true);
    });

    it("deve retornar falso quando a senha não corresponde ao hash", async () => {
      // Act
      const result = await Password.Compare(hashedPassword, "WrongP@ss0");

      // Assert
      expect(result).toBe(false);
    });

    it("deve retornar falso para um hash inválido ou malformado", async () => {
      // Act
      const result = await Password.Compare("invalidhash", plainPassword);

      // Assert
      expect(result).toBe(false);
    });
  });
});
