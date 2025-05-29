import { TechnicalError } from './technical.error'
import { FailureCode } from '../failure/failure.codes.enum'
import { FailureMapper } from '../failure/failure.mapper'
import { RichFailure } from '../failure/rich.failure.type'
import { SupportedLanguage } from '@shared/value-object/multilingual-content'

jest.mock('../failure/failure.mapper')

const mockToRichFailure = jest.fn()
FailureMapper.getInstance = jest.fn().mockReturnValue({
  toRichFailure: mockToRichFailure,
})

describe('TechnicalError', () => {
  beforeEach(() => {
    mockToRichFailure.mockClear()
    ;(FailureMapper.getInstance as jest.Mock).mockClear()

    const UNCATALOGUED_ERROR = {
      code: FailureCode.UNCATALOGUED_ERROR,
      status: 500,
      title: 'Erro Não Catalogado',
      message: 'Ocorreu um erro não catalogado.',
    } as RichFailure

    const MISSING_REQUIRED_DATA = {
      code: FailureCode.MISSING_REQUIRED_DATA,
      status: 500,
      title: 'Erro Não Catalogado',
      message: 'Ocorreu um erro não catalogado.',
    } as RichFailure

    mockToRichFailure.mockReturnValue(
      // UNCATALOGUED_ERROR,
      MISSING_REQUIRED_DATA
    )
  })

  describe('if', () => {
    it('deve lançar TechnicalError quando a condição for verdadeira', () => {
      // Act & Assert
      expect(() => TechnicalError.if(true, FailureCode.UNCATALOGUED_ERROR)).toThrow(TechnicalError)
    })

    it('não deve lançar erro quando a condição for falsa', () => {
      // Act & Assert
      expect(() => TechnicalError.if(false, FailureCode.UNCATALOGUED_ERROR)).not.toThrow()
    })

    it('deve lançar TechnicalError com código de falha e detalhes corretos', () => {
      // Arrange
      const testCode = FailureCode.MISSING_REQUIRED_DATA
      const testDetails = { id: '123', type: 'User' }

      // Act & Assert
      try {
        TechnicalError.if(true, testCode, testDetails)
      } catch (error) {
        const techError = error as TechnicalError
        expect(techError.message).toContain(testCode)
        expect(techError.message).toContain(testDetails.id)
        expect(techError.message).toContain(testDetails.type)
      }
    })

    it('deve usar FailureMapper para obter o rich failure e defini-lo na instância do erro', () => {
      // Arrange
      const testCode = FailureCode.EMAIL_WITH_INVALID_FORMAT
      const testDetails = { email: 'invalid-email' }
      const mockRichFailure: RichFailure = {
        code: testCode,
        status: 400,
        title: 'Formato de Email Inválido',
        message: "O email 'invalid-email' está em formato inválido.",
      }
      mockToRichFailure.mockReturnValue(mockRichFailure)

      // Act & Assert
      try {
        TechnicalError.if(true, testCode, testDetails)
      } catch (error) {
        const techError = error as TechnicalError
        expect(FailureMapper.getInstance).toHaveBeenCalled()
        expect(mockToRichFailure).toHaveBeenCalledWith({ code: testCode, details: testDetails }, SupportedLanguage.PT)
        expect(techError.message).toContain(mockRichFailure.code)
        expect(techError.message).toContain(mockRichFailure.message)
        expect(techError.message).toContain(mockRichFailure.title)
      }
    })

    it('deve formatar a mensagem de erro corretamente com detalhes', () => {
      // Arrange
      const testCode = FailureCode.UID_WITH_INVALID_FORMAT
      const testDetails = { value: 'not-a-uuid' }
      const mockRichFailure: RichFailure = {
        code: testCode,
        status: 400,
        title: 'UUID Inválido',
        message: "O valor 'not-a-uuid' não é um UUID válido.",
      }
      mockToRichFailure.mockReturnValue(mockRichFailure)

      // Act & Assert
      try {
        TechnicalError.if(true, testCode, testDetails)
      } catch (error) {
        const techError = error as TechnicalError
        const expectedMessage =
          `TechnicalError: ${testCode}\n` +
          `[${mockRichFailure.title}]\n` +
          `[${mockRichFailure.message}]\n` +
          `[DETAILS]\n${JSON.stringify(testDetails, null, 2)}`
        expect(techError.message).toBe(expectedMessage)
      }
    })

    it('deve formatar a mensagem de erro corretamente sem detalhes', () => {
      // Arrange
      const testCode = FailureCode.MISSING_REQUIRED_DATA
      const mockRichFailure: RichFailure = {
        code: testCode,
        status: 400,
        title: 'Dados Obrigatórios Ausentes',
        message: 'Alguns dados obrigatórios não foram fornecidos.',
      }
      mockToRichFailure.mockReturnValue(mockRichFailure)

      // Act & Assert
      try {
        TechnicalError.if(true, testCode)
      } catch (error) {
        const techError = error as TechnicalError
        const expectedMessage =
          `TechnicalError: ${testCode}\n` +
          `[${mockRichFailure.title}]\n` +
          `[${mockRichFailure.message}]\n` +
          `[DETAILS]`
        expect(techError.message).toBe(expectedMessage)
      }
    })
  })

  describe('validateRequiredFields', () => {
    it('deve lançar TechnicalError quando um campo for nulo', () => {
      // Arrange
      const fields = {
        name: 'Test',
        age: null as any,
        email: 'test@example.com',
      }

      // Act & Assert
      expect(() => TechnicalError.validateRequiredFields(fields)).toThrow(TechnicalError)
    })

    it('deve lançar TechnicalError quando um campo for undefined', () => {
      // Arrange
      const fields = {
        name: 'Test',
        age: undefined as any,
        email: 'test@example.com',
      }

      // Act & Assert
      expect(() => TechnicalError.validateRequiredFields(fields)).toThrow(TechnicalError)
    })

    it('não deve lançar erro quando todos os campos estiverem preenchidos', () => {
      // Arrange
      const fields = {
        name: 'Test',
        age: 30,
        email: 'test@example.com',
      }

      // Act & Assert
      expect(() => TechnicalError.validateRequiredFields(fields)).not.toThrow()
    })

    it('deve incluir os nomes dos campos nulos na mensagem de erro', () => {
      // Arrange
      const fields = {
        name: 'Test',
        age: null as any,
        email: undefined as any,
      }

      // Act & Assert
      try {
        TechnicalError.validateRequiredFields(fields)
        fail('Deveria ter lançado um erro')
      } catch (error) {
        const techError = error as TechnicalError
        expect(techError.message).toContain('age')
        expect(techError.message).not.toContain('email')
        expect(techError.message).not.toContain('name')
      }
    })

    it('deve usar o código de falha padrão quando não especificado', () => {
      // Arrange
      const fields = {
        name: 'Test',
        age: null as any,
      }

      // Act & Assert
      try {
        TechnicalError.validateRequiredFields(fields)
        fail('Deveria ter lançado um erro')
      } catch (error) {
        const techError = error as TechnicalError
        expect(techError.message).toContain(FailureCode.MISSING_REQUIRED_DATA)
      }
    })

    it('deve usar o código de falha personalizado quando especificado', () => {
      // Arrange
      const fields = {
        name: 'Test',
        age: null as any,
      }
      const customCode = FailureCode.INVALID_ENUM_VALUE
      const mockRichFailure: RichFailure = {
        code: customCode,
        status: 400,
        title: 'Valor de Enumeração Inválido',
        message: 'O valor fornecido não é válido para esta enumeração.',
      }
      mockToRichFailure.mockReturnValue(mockRichFailure)

      // Act & Assert
      try {
        TechnicalError.validateRequiredFields(fields, customCode)
        fail('Deveria ter lançado um erro')
      } catch (error) {
        const techError = error as TechnicalError
        expect(techError.message).toContain(customCode)
      }
    })

    it('deve incluir detalhes adicionais na mensagem de erro quando fornecidos', () => {
      // Arrange
      const fields = {
        name: 'Test',
        age: null as any,
      }
      const additionalDetails = {
        context: 'UserRegistration',
        severity: 'high',
      }

      // Act & Assert
      try {
        TechnicalError.validateRequiredFields(fields, FailureCode.MISSING_REQUIRED_DATA, additionalDetails)
        fail('Deveria ter lançado um erro')
      } catch (error) {
        const techError = error as TechnicalError
        expect(techError.message).toContain('age')
        expect(techError.message).toContain('UserRegistration')
        expect(techError.message).toContain('high')
      }
    })

    it('deve lidar corretamente com objetos aninhados', () => {
      // Arrange
      const sizes = {
        small: 'small.jpg',
        normal: null as any,
        large: 'large.jpg',
      }

      const fields = {
        sizes,
        small: sizes.small,
        normal: sizes.normal,
        large: sizes.large,
      }

      // Act & Assert
      try {
        TechnicalError.validateRequiredFields(fields)
        fail('Deveria ter lançado um erro')
      } catch (error) {
        const techError = error as TechnicalError
        expect(techError.message).toContain('normal')
        expect(techError.message).not.toContain('small')
        expect(techError.message).not.toContain('large')
      }
    })
  })
})
