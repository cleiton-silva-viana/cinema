import { TechnicalError } from './technical.error'
import { FailureCode } from '../failure/failure.codes.enum'
import { FailureMapper } from '../failure/failure.mapper'
import { RichFailure } from '../failure/rich.failure.type'
import { FailureFactory } from '@shared/failure/failure.factory'
import { SimpleFailure } from '../failure/simple.failure.type'

jest.mock('../failure/failure.mapper')

const mockToRichFailure = jest.fn()

FailureMapper.getInstance = jest.fn().mockReturnValue({
  toRichFailure: mockToRichFailure,
})

describe('TechnicalError', () => {
  beforeAll(() => {
    const MISSING_REQUIRED_DATA = {
      code: FailureCode.MISSING_REQUIRED_DATA,
      status: 500,
      title: 'Erro Não Catalogado',
      message: 'Ocorreu um erro não catalogado.',
    } as RichFailure

    mockToRichFailure.mockReturnValue(MISSING_REQUIRED_DATA)
  })

  describe('constructor', () => {
    it('deve criar TechnicalError com SimpleFailure', () => {
      // Arrange
      const simpleFailure: SimpleFailure = {
        code: FailureCode.UNCATALOGUED_ERROR,
        details: { test: 'value' },
      }

      // Act
      const error = new TechnicalError(simpleFailure)

      // Assert
      expect(error).toBeInstanceOf(TechnicalError)
      expect(error.message).toContain(simpleFailure.code)
    })
  })

  describe('if', () => {
    it('deve lançar TechnicalError quando a condição for verdadeira', () => {
      // Act & Assert
      expect(() => TechnicalError.if(true, () => FailureFactory.UNCATALOGUED_ERROR(''))).toThrowTechnicalError()
    })

    it('não deve lançar erro quando a condição for falsa', () => {
      // Act & Assert
      expect(() => TechnicalError.if(false, () => FailureFactory.UNCATALOGUED_ERROR(''))).not.toThrow()
    })

    it('deve lançar TechnicalError com código de falha e detalhes corretos', () => {
      // Arrange
      const testFailure = FailureFactory.MISSING_REQUIRED_DATA('test')

      // Act & Assert
      try {
        TechnicalError.if(true, () => testFailure)
      } catch (error) {
        const techError = error as TechnicalError
        expect(techError.message).toContain(testFailure.code)
      }
    })

    it('deve formatar a mensagem de erro corretamente com detalhes', () => {
      // Arrange
      const testCode = FailureCode.UID_WITH_INVALID_FORMAT
      const testDetails = { value: 'not-a-uuid' }
      const mockRichFailure: RichFailure = {
        code: testCode,
        status: 400,
        title: FailureCode.UID_WITH_INVALID_FORMAT,
        message: "O valor 'not-a-uuid' não é um UUID válido.",
      }
      mockToRichFailure.mockReturnValue(mockRichFailure)

      // Act & Assert
      try {
        TechnicalError.if(true, () => ({ code: testCode, details: testDetails }))
      } catch (error) {
        const techError = error as TechnicalError
        expect(techError.message).toContain(mockRichFailure.code)
        expect(techError.message).toContain(mockRichFailure.title)
        expect(techError.message).toContain(JSON.stringify(testDetails))
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
        TechnicalError.if(true, () => ({ code: testCode }))
      } catch (error) {
        const techError = error as TechnicalError
        expect(techError.message).toContain(mockRichFailure.code)
        expect(techError.message).toContain(mockRichFailure.title)
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
        expect(techError.message).not.toContain('name')
        expect(techError.message).toContain('age')
        expect(techError.message).toContain('email')
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
