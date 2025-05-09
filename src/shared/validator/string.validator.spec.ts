import { SimpleFailure } from "../failure/simple.failure.type";
import { FailureCode } from "../failure/failure.codes.enum";
import { StringValidator } from "./string.validator";
import { faker } from "@faker-js/faker";
import { v4, v7 } from "uuid";

describe("StringValidator", () => {
  const FIELD = "field";
  const PERSONAL_CODE = FailureCode.CONTENT_INVALID_FORMAT;
  const PERSONAL_DETAILS = { message: "mensagem personalizada..." };

  describe("isNotEmpty", () => {
    it("não deve adicionar falha quando a string não estiver vazia", () => {
      // Arrange
      const failures: SimpleFailure[] = [];
      const value = "teste";

      // Act
      new StringValidator(value).failures(failures).field("test").isNotEmpty();

      // Assert
      expect(failures.length).toBe(0);
    });

    it("deve adicionar falha quando a string estiver vazia", () => {
      // Arrange
      const failures: SimpleFailure[] = [];
      const value = "";

      // Act
      new StringValidator(value).failures(failures).field("test").isNotEmpty();

      // Assert
      expect(failures.length).toBe(1);
      expect(failures[0].code).toBe(FailureCode.STRING_CANNOT_BE_EMPTY);
    });

    it("deve lidar com strings que contêm apenas espaços em branco", () => {
      // Arrange
      const failures: SimpleFailure[] = [];
      const value = "   ";

      // Act
      new StringValidator(value).failures(failures).field("test").isNotEmpty();

      // Assert
      expect(failures.length).toBe(1);
      expect(failures[0].code).toBe(FailureCode.STRING_CANNOT_BE_EMPTY);
    });

    it("deve lidar com strings que contêm apenas caracteres de nova linha ou tabulação", () => {
      // Arrange
      const failures: SimpleFailure[] = [];
      const value = "\n\t\r";

      // Act
      new StringValidator(value).failures(failures).field("test").isNotEmpty();

      // Assert
      expect(failures.length).toBe(1);
      expect(failures[0].code).toBe(FailureCode.STRING_CANNOT_BE_EMPTY);
    });
  });

  describe("hasContent", () => {
    it("não deve adicionar falha quando a string tiver conteúdo", () => {
      // Arrange
      const failures: SimpleFailure[] = [];
      const value = "teste";

      // Act
      new StringValidator(value).failures(failures).field("test").hasContent();

      // Assert
      expect(failures.length).toBe(0);
    });

    it("não deve adicionar falha quando a string contém caracteres especiais", () => {
      // Arrange
      const failures: SimpleFailure[] = [];
      const value = "!@#$%^&*()_+{}|:<>?~`-=[]\\;',./";

      // Act
      new StringValidator(value).failures(failures).field("test").hasContent();

      // Assert
      expect(failures.length).toBe(0);
    });

    it("deve adicionar falha quando a string estiver em branco", () => {
      // Arrange
      const failures: SimpleFailure[] = [];
      const value = "   ";

      // Act
      new StringValidator(value).failures(failures).field("test").hasContent();

      // Assert
      expect(failures.length).toBe(1);
      expect(failures[0].code).toBe(FailureCode.STRING_CANNOT_BE_BLANK);
    });

    it("deve usar o código de erro personalizado", () => {
      // Arrange
      const failures: SimpleFailure[] = [];
      const value = "   ";
      const code = FailureCode.CONTENT_INVALID_TYPE;

      // Act
      new StringValidator(value)
        .failures(failures)
        .field("test")
        .hasContent(code);

      // Assert
      expect(failures.length).toBe(1);
      expect(failures[0].code).toBe(code);
    });

    it("deve incluir detalhes na falha", () => {
      // Arrange
      const failures: SimpleFailure[] = [];
      const value = "   ";
      const details = { message: "Campo não pode estar em branco" };

      // Act
      new StringValidator(value)
        .failures(failures)
        .field("test")
        .hasContent(FailureCode.STRING_CANNOT_BE_BLANK, details);

      // Assert
      expect(failures.length).toBe(1);
      expect(failures[0].details).toMatchObject(details);
    });
  });

  describe("matchesPattern", () => {
    it("não deve adicionar falha quando a string corresponder ao padrão", () => {
      // Arrange
      const failures: SimpleFailure[] = [];
      const value = "abc123";
      const pattern = /^[a-z0-9]+$/;

      // Act
      new StringValidator(value).failures(failures).matchesPattern(pattern);

      // Assert
      expect(failures.length).toBe(0);
    });

    it("deve adicionar falha quando a string não corresponder ao padrão", () => {
      // Arrange
      const failures: SimpleFailure[] = [];
      const value = "abc@123";
      const pattern = /^[a-z0-9]+$/;

      // Act
      new StringValidator(value).failures(failures).matchesPattern(pattern);

      // Assert
      expect(failures.length).toBe(1);
      expect(failures[0].code).toBe(FailureCode.STRING_INVALID_FORMAT);
    });

    it("deve usar o código de erro personalizado", () => {
      // Arrange
      const failures: SimpleFailure[] = [];
      const value = "abc@123";
      const pattern = /^[a-z0-9]+$/;
      const code = FailureCode.CONTENT_INVALID_TYPE;

      // Act
      new StringValidator(value)
        .failures(failures)
        .matchesPattern(pattern, code);

      // Assert
      expect(failures.length).toBe(1);
      expect(failures[0].code).toBe(code);
    });

    it("deve incluir detalhes na falha", () => {
      // Arrange
      const failures: SimpleFailure[] = [];
      const value = "abc@123";
      const pattern = /^[a-z0-9]+$/;
      const details = { message: "Formato inválido" };

      // Act
      new StringValidator(value)
        .failures(failures)
        .matchesPattern(pattern, FailureCode.INVALID_VALUE_FORMAT, details);

      // Assert
      expect(failures.length).toBe(1);
      expect(failures[0].details).toMatchObject(details);
    });
  });

  describe("isValidEmail", () => {
    it("não deve adicionar falha quando o email for válido", () => {
      // Arrange
      const failures: SimpleFailure[] = [];
      const value = faker.internet.email();

      // Act
      new StringValidator(value).failures(failures).isValidEmail();

      // Assert
      expect(failures.length).toBe(0);
    });

    it("deve adicionar falha quando o email for inválido", () => {
      // Arrange
      const failures: SimpleFailure[] = [];
      const value = "teste@example";

      // Act
      new StringValidator(value)
        .failures(failures)
        .field("email")
        .isValidEmail();

      // Assert
      expect(failures.length).toBe(1);
      expect(failures[0].code).toBe(FailureCode.EMAIL_IS_INVALID);
    });

    it("deve usar o código de erro personalizado", () => {
      // Arrange
      const failures: SimpleFailure[] = [];
      const value = "teste@example";
      const code = FailureCode.CONTENT_INVALID_TYPE;

      // Act
      new StringValidator(value)
        .failures(failures)
        .field("email")
        .isValidEmail(code);

      // Assert
      expect(failures.length).toBe(1);
      expect(failures[0].code).toBe(code);
    });

    it("deve incluir detalhes na falha", () => {
      // Arrange
      const failures: SimpleFailure[] = [];
      const value = "teste@example";
      const details = { message: "Email inválido" };

      // Act
      new StringValidator(value)
        .failures(failures)
        .field("email")
        .isValidEmail(FailureCode.EMAIL_IS_INVALID, details);

      // Assert
      expect(failures.length).toBe(1);
      expect(failures[0].details).toMatchObject(details);
    });
  });

  describe("isValidUUIDv4", () => {
    it("não deve adicionar falha quando o UUID v4 for válido", () => {
      // Arrange
      const failures: SimpleFailure[] = [];
      const value = v4();

      // Act
      new StringValidator(value).failures(failures).isValidUUIDv4();

      // Assert
      expect(failures.length).toBe(0);
    });

    it("deve adicionar falha quando o UUID v4 for inválido", () => {
      // Arrange
      const failures: SimpleFailure[] = [];
      const value = v7();

      // Act
      new StringValidator(value).failures(failures).isValidUUIDv4();

      // Assert
      expect(failures.length).toBe(1);
      expect(failures[0].code).toBe(FailureCode.INVALID_UUID_V4);
    });

    it("deve usar o código de erro personalizado", () => {
      // Arrange
      const failures: SimpleFailure[] = [];
      const value = "123e4567-e89b-12d3-a456";
      const code = FailureCode.CONTENT_INVALID_TYPE;

      // Act
      new StringValidator(value).failures(failures).isValidUUIDv4(code);

      // Assert
      expect(failures.length).toBe(1);
      expect(failures[0].code).toBe(code);
    });

    it("deve incluir detalhes na falha", () => {
      // Arrange
      const failures: SimpleFailure[] = [];
      const value = "123e4567-e89b-12d3-a456";
      const details = { message: "UUID v4 inválido" };

      // Act
      new StringValidator(value)
        .failures(failures)
        .isValidUUIDv4(FailureCode.INVALID_UUID_V4, details);

      // Assert
      expect(failures.length).toBe(1);
      expect(failures[0].details).toMatchObject(details);
    });
  });

  describe("isValidUUIDv7", () => {
    it("não deve adicionar falha quando o UUID v7 for válido", () => {
      // Arrange
      const failures: SimpleFailure[] = [];
      const value = v7();

      // Act
      new StringValidator(value).failures(failures).isValidUUIDv7();

      // Assert
      expect(failures.length).toBe(0);
    });

    it("deve adicionar falha quando o UUID v7 for inválido", () => {
      // Arrange
      const failures: SimpleFailure[] = [];
      const value = v4();

      // Act
      new StringValidator(value).failures(failures).isValidUUIDv7();

      // Assert
      expect(failures.length).toBe(1);
      expect(failures[0].code).toBe(FailureCode.INVALID_UUID_V7);
    });

    it("deve usar o código de erro personalizado", () => {
      // Arrange
      const failures: SimpleFailure[] = [];
      const value = "123e4567-e89b-12d3-a456";
      const code = FailureCode.CONTENT_INVALID_TYPE;

      // Act
      new StringValidator(value)
        .failures(failures)
        .field("id")
        .isValidUUIDv7(code);

      // Assert
      expect(failures.length).toBe(1);
      expect(failures[0].code).toBe(code);
    });

    it("deve incluir detalhes na falha", () => {
      // Arrange
      const failures: SimpleFailure[] = [];
      const value = "123e4567-e89b-12d3-a456";
      const details = { message: "UUID v7 inválido" };

      // Act
      new StringValidator(value)
        .failures(failures)
        .field("id")
        .isValidUUIDv7(FailureCode.INVALID_UUID_V7, details);

      // Assert
      expect(failures.length).toBe(1);
      expect(failures[0].details).toMatchObject(details);
    });
  });

  describe("hasLengthBetween", () => {
    it("não deve adicionar falha quando o comprimento estiver dentro do intervalo", () => {
      // Arrange
      const failures: SimpleFailure[] = [];
      const value = "teste";
      const min = 3;
      const max = 10;

      // Act
      new StringValidator(value).failures(failures).hasLengthBetween(min, max);

      // Assert
      expect(failures.length).toBe(0);
    });

    it("deve adicionar falha quando o comprimento for menor que o mínimo", () => {
      // Arrange
      const failures: SimpleFailure[] = [];
      const value = "ab";
      const min = 3;
      const max = 10;

      // Act
      new StringValidator(value)
        .failures(failures)
        .field("nome")
        .hasLengthBetween(min, max);

      // Assert
      expect(failures.length).toBe(1);
      expect(failures[0].code).toBe(FailureCode.STRING_LENGTH_OUT_OF_RANGE);
      expect(failures[0].details.minLength).toBe(min);
      expect(failures[0].details.maxLength).toBe(max);
      expect(failures[0].details.actualLength).toBe(value.length);
    });

    it("deve adicionar falha quando o comprimento for maior que o máximo", () => {
      // Arrange
      const failures: SimpleFailure[] = [];
      const value = "abcdefghijklmno";
      const min = 3;
      const max = 10;

      // Act
      new StringValidator(value).failures(failures).hasLengthBetween(min, max);

      // Assert
      expect(failures.length).toBe(1);
      expect(failures[0].code).toBe(FailureCode.STRING_LENGTH_OUT_OF_RANGE);
      expect(failures[0].details.minLength).toBe(min);
      expect(failures[0].details.maxLength).toBe(max);
      expect(failures[0].details.actualLength).toBe(value.length);
    });

    it("deve usar o código de erro personalizado", () => {
      // Arrange
      const failures: SimpleFailure[] = [];
      const value = "ab";
      const min = 3;
      const max = 10;
      const code = FailureCode.CONTENT_INVALID_TYPE;

      // Act
      new StringValidator(value)
        .failures(failures)
        .field("nome")
        .hasLengthBetween(min, max, code);

      // Assert
      expect(failures.length).toBe(1);
      expect(failures[0].code).toBe(code);
    });

    it("deve incluir detalhes adicionais na falha", () => {
      // Arrange
      const failures: SimpleFailure[] = [];
      const value = "ab";
      const min = 3;
      const max = 10;
      const details = { message: "Tamanho inválido" };

      // Act
      new StringValidator(value)
        .failures(failures)
        .field("nome")
        .hasLengthBetween(min, max, FailureCode.LENGTH_OUT_OF_RANGE, details);

      // Assert
      expect(failures.length).toBe(1);
      expect(failures[0].details.message).toBe(details.message);
      expect(failures[0].details.minLength).toBe(min);
      expect(failures[0].details.maxLength).toBe(max);
      expect(failures[0].details.actualLength).toBe(value.length);
    });
  });

  describe("isInEnum", () => {
    it("não deve adicionar falha quando o valor estiver no enum", () => {
      // Arrange
      const failures: SimpleFailure[] = [];
      const enumType = { A: "a", B: "b", C: "c" };
      const value = "b";

      // Act
      new StringValidator(value).failures(failures).isInEnum(enumType);

      // Assert
      expect(failures.length).toBe(0);
    });

    it("deve adicionar falha quando o valor não estiver no enum", () => {
      // Arrange
      const failures: SimpleFailure[] = [];
      const enumType = { A: "a", B: "b", C: "c" };
      const value = "d";

      // Act
      new StringValidator(value)
        .failures(failures)
        .field("tipo")
        .isInEnum(enumType);

      // Assert
      expect(failures.length).toBe(1);
      expect(failures[0].code).toBe(FailureCode.INVALID_ENUM_VALUE);
      expect(failures[0].details.providedValue).toBe(value);
      expect(failures[0].details.allowedValues).toEqual(
        Object.values(enumType),
      );
    });

    it("deve usar o código de erro personalizado", () => {
      // Arrange
      const failures: SimpleFailure[] = [];
      const enumType = { A: "a", B: "b", C: "c" };
      const value = "d";
      const code = FailureCode.CONTENT_INVALID_TYPE;

      // Act
      new StringValidator(value)
        .failures(failures)
        .field("tipo")
        .isInEnum(enumType, code);

      // Assert
      expect(failures.length).toBe(1);
      expect(failures[0].code).toBe(code);
    });

    it("deve incluir detalhes adicionais na falha", () => {
      // Arrange
      const failures: SimpleFailure[] = [];
      const enumType = { A: "a", B: "b", C: "c" };
      const value = "d";
      const details = { message: "Valor não permitido" };

      // Act
      new StringValidator(value)
        .failures(failures)
        .field("tipo")
        .isInEnum(enumType, FailureCode.INVALID_ENUM_VALUE, details);

      // Assert
      expect(failures.length).toBe(1);
      expect(failures[0].details.message).toBe(details.message);
      expect(failures[0].details.providedValue).toBe(value);
      expect(failures[0].details.allowedValues).toEqual(
        Object.values(enumType),
      );
    });
  });

  describe("encadeamento de validações", () => {
    it("deve acumular falhas quando múltiplas validações falham", () => {
      // Arrange
      const failures: SimpleFailure[] = [];
      const value = "";

      // Act
      new StringValidator(value)
        .failures(failures)
        .field("test")
        .isNotEmpty()
        .continue()
        .hasContent()
        .continue()
        .hasLengthBetween(5, 10);

      // Assert
      expect(failures.length).toBe(3);
      expect(failures[0].code).toBe(FailureCode.STRING_CANNOT_BE_EMPTY);
      expect(failures[1].code).toBe(FailureCode.STRING_CANNOT_BE_BLANK);
      expect(failures[2].code).toBe(FailureCode.STRING_LENGTH_OUT_OF_RANGE);
    });

    it("deve parar de validar após o primeiro erro quando stopOnFirstFailure é usado", () => {
      // Arrange
      const failures: SimpleFailure[] = [];
      const value = "";

      // Act
      new StringValidator(value)
        .failures(failures)
        .field("test")
        .isNotEmpty()
        .hasContent()
        .hasLengthBetween(5, 10);

      // Assert
      expect(failures.length).toBe(1);
      expect(failures[0].code).toBe(FailureCode.STRING_CANNOT_BE_EMPTY);
    });

    it("não deve lançar um erro quando um valor nulo é passado para um fluxo de validação", () => {
      // Arrange
      const failures: SimpleFailure[] = [];
      const enumForTest = { A: "a", B: "b", C: "c" };

      // Act
      new StringValidator(null)
        .failures(failures)
        .field("test")
        .isNotEmpty()
        .hasContent()
        .isInEnum(enumForTest)
        .isValidEmail()
        .isValidUUIDv4()
        .isValidUUIDv7()
        .matchesPattern(/a-z/)
        .hasLengthBetween(5, 10);

      // Assert
      expect(failures.length).toBe(1);
      expect(failures[0].code).toBe(FailureCode.STRING_CANNOT_BE_EMPTY);
    });
  });

  describe("startsWith", () => {
    const PREFIX = "APT";
    const VALUE_WITH_PREFIX = "APTout";
    const VALUE_WITHOUT_PREFIX = "out";

    it("não deve adicionar falha quando a string começa com o prefixo especificado", () => {
      // Arrange
      const failures: SimpleFailure[] = [];

      // Act
      new StringValidator(VALUE_WITH_PREFIX)
        .failures(failures)
        .startsWith(PREFIX);

      // Assert
      expect(failures.length).toBe(0);
    });

    it("deve adicionar falha quando a string não começa com o prefixo especificado", () => {
      // Arrange
      const failures: SimpleFailure[] = [];

      // Act
      new StringValidator(VALUE_WITHOUT_PREFIX)
        .failures(failures)
        .field(FIELD)
        .startsWith(PREFIX);

      // Assert
      expect(failures.length).toBe(1);
      expect(failures[0].code).toBe(FailureCode.STRING_INVALID_FORMAT);
      expect(failures[0].details.field).toBe(FIELD);
      expect(failures[0].details.expectedPrefix).toBe(PREFIX);
    });

    it("deve usar o código de erro personalizado", () => {
      // Arrange
      const failures: SimpleFailure[] = [];

      // Act
      new StringValidator(VALUE_WITHOUT_PREFIX)
        .failures(failures)
        .field(FIELD)
        .startsWith(PREFIX, PERSONAL_CODE);

      // Assert
      expect(failures.length).toBe(1);
      expect(failures[0].code).toBe(PERSONAL_CODE);
      expect(failures[0].details.field).toBe(FIELD);
      expect(failures[0].details.expectedPrefix).toBe(PREFIX);
    });

    it("deve incluir detalhes adicionais na falha", () => {
      // Arrange
      const failures: SimpleFailure[] = [];

      // Act
      new StringValidator(VALUE_WITHOUT_PREFIX)
        .failures(failures)
        .field(FIELD)
        .startsWith(
          PREFIX,
          FailureCode.STRING_INVALID_FORMAT,
          PERSONAL_DETAILS,
        );

      // Assert
      expect(failures.length).toBe(1);
      expect(failures[0].details.message).toBe(PERSONAL_DETAILS.message);
      expect(failures[0].details.field).toBe(FIELD);
      expect(failures[0].details.expectedPrefix).toBe(PREFIX);
    });
  });
});
