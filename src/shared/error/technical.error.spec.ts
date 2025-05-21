import { TechnicalError } from "./technical.error";
import { FailureCode } from "../failure/failure.codes.enum";
import { FailureMapper } from "../failure/failure.mapper";
import { RichFailure } from "../failure/rich.failure.type";

jest.mock("../failure/failure.mapper");

const mockToRichFailure = jest.fn();
FailureMapper.getInstance = jest.fn().mockReturnValue({
  toRichFailure: mockToRichFailure,
});

describe("TechnicalError", () => {
  beforeEach(() => {
    mockToRichFailure.mockClear();
    (FailureMapper.getInstance as jest.Mock).mockClear();

    mockToRichFailure.mockReturnValue({
      code: FailureCode.UNCATALOGUED_ERROR,
      status: 500,
      title: "Erro Não Catalogado",
      message: "Ocorreu um erro não catalogado.",
    } as RichFailure);
  });

  describe("if", () => {
    it("deve lançar TechnicalError quando a condição for verdadeira", () => {
      // Act & Assert
      expect(() =>
        TechnicalError.if(true, FailureCode.UNCATALOGUED_ERROR),
      ).toThrow(TechnicalError);
    });

    it("não deve lançar erro quando a condição for falsa", () => {
      // Act & Assert
      expect(() =>
        TechnicalError.if(false, FailureCode.UNCATALOGUED_ERROR),
      ).not.toThrow();
    });

    it("deve lançar TechnicalError com código de falha e detalhes corretos", () => {
      // Arrange
      const testCode = FailureCode.UNCATALOGUED_ERROR;
      const testDetails = { id: "123", type: "User" };

      // Act & Assert
      try {
        TechnicalError.if(true, testCode, testDetails);
      } catch (error) {
        const techError = error as TechnicalError;
        expect(techError.richFailure.code).toBe(testCode);
        expect(techError.details).toEqual(testDetails);
      }
    });

    it("deve usar FailureMapper para obter o rich failure e defini-lo na instância do erro", () => {
      // Arrange
      const testCode = FailureCode.EMAIL_WITH_INVALID_FORMAT;
      const testDetails = { email: "invalid-email" };
      const mockRichFailure: RichFailure = {
        code: testCode,
        status: 400,
        title: "Formato de Email Inválido",
        message: "O email 'invalid-email' está em formato inválido.",
      };
      mockToRichFailure.mockReturnValue(mockRichFailure);

      // Act & Assert
      try {
        TechnicalError.if(true, testCode, testDetails);
      } catch (error) {
        const techError = error as TechnicalError;
        expect(FailureMapper.getInstance).toHaveBeenCalled();
        expect(mockToRichFailure).toHaveBeenCalledWith(
          { code: testCode, details: testDetails },
          "pt",
        );
        expect(techError.richFailure).toEqual(mockRichFailure);
      }
    });

    it("deve formatar a mensagem de erro corretamente com detalhes", () => {
      // Arrange
      const testCode = FailureCode.UID_WITH_INVALID_FORMAT;
      const testDetails = { value: "not-a-uuid" };
      const mockRichFailure: RichFailure = {
        code: testCode,
        status: 400,
        title: "UUID Inválido",
        message: "O valor 'not-a-uuid' não é um UUID válido.",
      };
      mockToRichFailure.mockReturnValue(mockRichFailure);

      // Act & Assert
      try {
        TechnicalError.if(true, testCode, testDetails);
      } catch (error) {
        const techError = error as TechnicalError;
        const expectedMessage =
          `TechnicalError: ${testCode}\n` +
          `[${mockRichFailure.title}]\n` +
          `[${mockRichFailure.message}]\n` +
          `[DETAILS]\n${JSON.stringify(testDetails, null, 2)}`;
        expect(techError.message).toBe(expectedMessage);
      }
    });

    it("deve formatar a mensagem de erro corretamente sem detalhes", () => {
      // Arrange
      const testCode = FailureCode.MISSING_REQUIRED_DATA;
      const mockRichFailure: RichFailure = {
        code: testCode,
        status: 400,
        title: "Dados Obrigatórios Ausentes",
        message: "Alguns dados obrigatórios não foram fornecidos.",
      };
      mockToRichFailure.mockReturnValue(mockRichFailure);

      // Act & Assert
      try {
        TechnicalError.if(true, testCode);
      } catch (error) {
        const techError = error as TechnicalError;
        const expectedMessage =
          `TechnicalError: ${testCode}\n` +
          `[${mockRichFailure.title}]\n` +
          `[${mockRichFailure.message}]\n` +
          `[DETAILS]`;
        expect(techError.message).toBe(expectedMessage);
      }
    });
  });
});
