import { FailureMapper } from './failure.mapper'
import { IFailureMessageProvider } from './failure.message.provider.interface'
import { SimpleFailure } from './simple.failure.type'
import { SupportedLanguage } from '@shared/value-object/multilingual-content'
import { FailureCode } from '@shared/failure/failure.codes.enum'

describe('FailureMapper', () => {
  let mockMessageProvider: IFailureMessageProvider

  beforeEach(() => {
    FailureMapper.reset()

    mockMessageProvider = {
      getMessageConfig: jest.fn().mockImplementation((code, language) => ({
        title: `Título para ${code}`,
        message: 'Mensagem padrão',
        status: 400,
      })),
    }

    FailureMapper.setMessageProvider(mockMessageProvider)
  })

  describe('Métodos do Singleton', () => {
    it('deve retornar a mesma instância ao chamar getInstance múltiplas vezes', () => {
      // Act
      const instance1 = FailureMapper.getInstance()
      const instance2 = FailureMapper.getInstance()

      // Assert
      expect(instance1).toBe(instance2)
    })

    it('deve criar uma nova instância após resetar', () => {
      // Act
      const instance1 = FailureMapper.getInstance()
      FailureMapper.reset()
      const instance2 = FailureMapper.getInstance()

      // Assert
      expect(instance1).not.toBe(instance2)
    })

    it('deve utilizar o provedor de mensagens personalizado', () => {
      // Arrange
      const customProvider: IFailureMessageProvider = {
        getMessageConfig: jest.fn().mockReturnValue({
          title: 'Título Customizado',
          message: 'Mensagem Customizada',
          status: 500,
        }),
      }
      FailureMapper.setMessageProvider(customProvider)
      const mapper = FailureMapper.getInstance()
      const failure: SimpleFailure = { code: FailureCode.STRING_INVALID_FORMAT }
      mapper.toRichFailure(failure, SupportedLanguage.PT)

      // Act & Assert
      expect(customProvider.getMessageConfig).toHaveBeenCalledWith(
        FailureCode.STRING_INVALID_FORMAT,
        SupportedLanguage.PT
      )
    })
  })

  describe('toRichFailure', () => {
    it('deve converter SimpleFailure para RichFailure corretamente', () => {
      // Arrange
      const mockMessageConfig = {
        title: 'Título do Erro',
        message: 'Mensagem de erro',
        status: 400,
      }

      mockMessageProvider.getMessageConfig = jest.fn().mockReturnValue(mockMessageConfig)

      const mapper = FailureMapper.getInstance()
      const failure: SimpleFailure = { code: FailureCode.UID_WITH_INVALID_FORMAT }

      // Act
      const result = mapper.toRichFailure(failure, SupportedLanguage.PT)

      // Assert
      expect(result).toEqual({
        code: FailureCode.UID_WITH_INVALID_FORMAT,
        title: 'Título do Erro',
        message: 'Mensagem de erro',
        status: 400,
      })
      expect(mockMessageProvider.getMessageConfig).toHaveBeenCalledWith(
        FailureCode.UID_WITH_INVALID_FORMAT,
        SupportedLanguage.PT
      )
    })

    it('deve processar detalhes da falha no template', () => {
      const mockMessageConfig = {
        title: 'Título do Erro',
        message: 'Erro no campo {campo}',
        status: 400,
      }

      mockMessageProvider.getMessageConfig = jest.fn().mockReturnValue(mockMessageConfig)

      const mapper = FailureMapper.getInstance()
      const failure: SimpleFailure = {
        code: FailureCode.STRING_LENGTH_OUT_OF_RANGE,
        details: { campo: 'email' },
      }

      const result = mapper.toRichFailure(failure, SupportedLanguage.EN)

      expect(result.message).toBe('Erro no campo email')
    })
  })

  describe('toRichFailures', () => {
    it('deve converter um array de SimpleFailure para RichFailure', () => {
      const mockMessages = [
        { title: 'Erro 1', message: 'Mensagem 1', status: 400 },
        { title: 'Erro 2', message: 'Mensagem 2', status: 401 },
      ]

      mockMessageProvider.getMessageConfig = jest
        .fn()
        .mockReturnValueOnce(mockMessages[0])
        .mockReturnValueOnce(mockMessages[1])

      const mapper = FailureMapper.getInstance()
      const failures: SimpleFailure[] = [
        { code: FailureCode.DATE_CANNOT_BE_PAST },
        { code: FailureCode.MISSING_REQUIRED_DATA },
      ]

      const results = mapper.toRichFailures(failures, SupportedLanguage.PT)

      expect(results).toHaveLength(2)
      expect(results[0].code).toBe(FailureCode.DATE_CANNOT_BE_PAST)
      expect(results[0].title).toBe('Erro 1')
      expect(results[1].code).toBe(FailureCode.MISSING_REQUIRED_DATA)
      expect(results[1].title).toBe('Erro 2')
    })
  })

  describe('formatMessageWithTemplate', () => {
    // Para testar o método privado, vamos criar um método de teste que o expõe
    const testFormatMessageWithTemplate = (template: string, details: Record<string, any>) => {
      const mapper = FailureMapper.getInstance()
      mockMessageProvider.getMessageConfig = jest.fn().mockReturnValue({
        title: 'Teste',
        message: template,
        status: 400,
      })

      const failure: SimpleFailure = { code: FailureCode.DATE_WITH_INVALID_SEQUENCE, details }
      const result = mapper.toRichFailure(failure, SupportedLanguage.EN)
      return result.message
    }

    it('deve retornar a mensagem sem alterações quando não há variáveis', () => {
      const result = testFormatMessageWithTemplate('Mensagem sem variáveis', {})
      expect(result).toBe('Mensagem sem variáveis')
    })

    it('deve substituir variáveis não tipadas corretamente', () => {
      const result = testFormatMessageWithTemplate('O valor {campo} deve ser {valor}', {
        campo: 'email',
        valor: 'válido',
      })
      expect(result).toBe('O valor email deve ser válido')
    })

    it('deve substituir variáveis tipadas como strings', () => {
      // Nota: O método atual não processa a parte de tipagem, apenas o nome da variável
      const result = testFormatMessageWithTemplate('O valor {campo:string} deve ser {valor:string}', {
        campo: 'email',
        valor: 'válido',
      })

      // O comportamento esperado para o método atual (que não processa tipagem)
      expect(result).toBe('O valor email deve ser válido')
    })

    it('deve substituir múltiplas variáveis corretamente', () => {
      const result = testFormatMessageWithTemplate('Campo {campo} com valor {valor} é inválido para {contexto}', {
        campo: 'email',
        valor: 'teste@',
        contexto: 'autenticação',
      })
      expect(result).toBe('Campo email com valor teste@ é inválido para autenticação')
    })

    it('deve manter o placeholder quando o detalhe não é fornecido', () => {
      const result = testFormatMessageWithTemplate('Campo {campo} com valor {valor} é inválido', { campo: 'email' })
      expect(result).toBe('Campo email com valor {valor} é inválido')
    })

    it('deve converter valores não string para string ao substituir', () => {
      const result = testFormatMessageWithTemplate('Valor numérico: {numero}, Booleano: {ativo}, Objeto: {objeto}', {
        numero: 42,
        ativo: true,
        objeto: { chave: 'valor' },
      })
      expect(result).toBe('Valor numérico: 42, Booleano: true, Objeto: [object Object]')
    })

    it('deve substituir variáveis tipadas corretamente', () => {
      const result = testFormatMessageWithTemplate('O valor {campo:string} deve ser {valor:number}', {
        campo: 'email',
        valor: 42,
      })
      expect(result).toBe('O valor email deve ser 42')
    })

    it('deve substituir variáveis com tipos complexos', () => {
      const result = testFormatMessageWithTemplate('Valor {numero:number}, Data {data:Date}, Array {lista:array}', {
        numero: 123,
        data: new Date('2023-01-01'),
        lista: [1, 2, 3],
      })
      expect(result).toContain('Valor 123')
      expect(result).toContain('Array 1,2,3')
      // O formato exato da data pode variar dependendo da configuração local
      expect(result).toMatch(/Data .* /)
    })
  })
})
