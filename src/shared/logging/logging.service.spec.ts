import { Logger } from '@nestjs/common'
import { LoggerService } from './logging.service'
import { ResourceTypes } from '@shared/constant/resource.types'

jest.mock('@nestjs/common', () => ({
  Logger: jest.fn().mockImplementation(() => ({
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  })),
}))

describe('LoggerService', () => {
  let loggerService: LoggerService
  let nestLogger: jest.Mocked<Logger>

  beforeEach(() => {
    jest.clearAllMocks()
    LoggerService['instances'].clear()
  })

  describe('Padrão Singleton', () => {
    it('deve criar apenas uma instância por recurso', () => {
      // Arrange
      const instance1 = LoggerService.getInstance(ResourceTypes.MOVIE)
      const instance2 = LoggerService.getInstance(ResourceTypes.MOVIE)

      // Assert
      expect(instance1).toBe(instance2)
    })

    it('deve criar instâncias diferentes para recursos diferentes', () => {
      // Arrange
      const movieLogger = LoggerService.getInstance(ResourceTypes.MOVIE)
      const personLogger = LoggerService.getInstance(ResourceTypes.PERSON)

      // Assert
      expect(movieLogger).not.toBe(personLogger)
    })
  })

  describe('Formatação de Mensagens', () => {
    beforeEach(() => {
      loggerService = LoggerService.getInstance(ResourceTypes.MOVIE)
      // @ts-ignore - Acessando logger interno para teste
      nestLogger = loggerService['logger']
    })

    it('deve manter a mensagem original quando não houver contexto', () => {
      // Arrange
      const message = 'Teste de log'

      // Act
      loggerService.info(message)

      // Assert
      expect(nestLogger.log).toHaveBeenCalledWith(message, ResourceTypes.MOVIE)
    })

    it('deve substituir placeholders simples no template', () => {
      // Arrange
      const template = 'Filme {id} foi atualizado por {user}'
      const context = { id: '123', user: 'admin' }

      // Act
      loggerService.info(template, context)

      // Assert
      expect(nestLogger.log).toHaveBeenCalledWith('Filme 123 foi atualizado por admin', ResourceTypes.MOVIE)
    })

    it('deve substituir múltiplas ocorrências do mesmo placeholder', () => {
      // Arrange
      const template = 'Valor {x} + {x} = {result}'
      const context = { x: '5', result: '10' }

      // Act
      loggerService.info(template, context)

      // Assert
      expect(nestLogger.log).toHaveBeenCalledWith('Valor 5 + 5 = 10', ResourceTypes.MOVIE)
    })

    it('deve ignorar placeholders não encontrados no contexto', () => {
      // Arrange
      const template = 'Usuário {user} acessou {resource}'
      const context = { user: 'admin' }

      // Act
      loggerService.info(template, context)

      // Assert
      expect(nestLogger.log).toHaveBeenCalledWith('Usuário admin acessou {resource}', ResourceTypes.MOVIE)
    })
  })

  describe('Níveis de Log', () => {
    beforeEach(() => {
      loggerService = LoggerService.getInstance(ResourceTypes.MOVIE)
      // @ts-ignore - Acessando logger interno para teste
      nestLogger = loggerService['logger']
    })

    it('deve registrar mensagem de info com contexto correto', () => {
      // Arrange
      const message = 'Operação concluída'

      // Act
      loggerService.info(message)

      // Assert
      expect(nestLogger.log).toHaveBeenCalledWith(message, ResourceTypes.MOVIE)
      expect(nestLogger.warn).not.toHaveBeenCalled()
      expect(nestLogger.error).not.toHaveBeenCalled()
    })

    it('deve registrar mensagem de warn com contexto correto', () => {
      // Arrange
      const message = 'Operação demorada'

      // Act
      loggerService.warn(message)

      // Assert
      expect(nestLogger.warn).toHaveBeenCalledWith(message, ResourceTypes.MOVIE)
      expect(nestLogger.log).not.toHaveBeenCalled()
      expect(nestLogger.error).not.toHaveBeenCalled()
    })

    it('deve registrar mensagem de error com contexto correto', () => {
      // Arrange
      const message = 'Falha na operação'

      // Act
      loggerService.error(message)

      // Assert
      expect(nestLogger.error).toHaveBeenCalledWith(message, ResourceTypes.MOVIE)
      expect(nestLogger.log).not.toHaveBeenCalled()
      expect(nestLogger.warn).not.toHaveBeenCalled()
    })
  })

  describe('Tratamento de Valores Especiais', () => {
    beforeEach(() => {
      loggerService = LoggerService.getInstance(ResourceTypes.MOVIE)
      // @ts-ignore - Acessando logger interno para teste
      nestLogger = loggerService['logger']
    })

    it('deve converter valores não-string no contexto para string', () => {
      // Arrange
      const template = 'Valores: {number}, {boolean}, {object}, {array}, {null}, {undefined}'
      const context = {
        number: 42,
        boolean: true,
        object: { key: 'value' },
        array: [1, 2, 3],
        null: null,
        undefined: undefined,
      }

      // Act
      loggerService.info(template, context)

      // Assert
      expect(nestLogger.log).toHaveBeenCalledWith(
        'Valores: 42, true, [object Object], 1,2,3, null, undefined',
        ResourceTypes.MOVIE
      )
    })
  })

  describe('Validações de Entrada', () => {
    beforeEach(() => {
      loggerService = LoggerService.getInstance(ResourceTypes.MOVIE)
      // @ts-ignore - Acessando logger interno para teste
      nestLogger = loggerService['logger']
    })

    it('deve lidar com template undefined', () => {
      // Arrange
      loggerService.info(undefined as unknown as string)

      // Act
      expect(nestLogger.log).toHaveBeenCalledWith(undefined, ResourceTypes.MOVIE)
    })

    it('deve lidar com template null', () => {
      // Arrange
      loggerService.info(null as unknown as string)

      // Act
      expect(nestLogger.log).toHaveBeenCalledWith(null, ResourceTypes.MOVIE)
    })

    it('deve lidar com contexto undefined', () => {
      // Arrange
      loggerService.info('mensagem', undefined)

      // Act
      expect(nestLogger.log).toHaveBeenCalledWith('mensagem', ResourceTypes.MOVIE)
    })

    it('deve lidar com contexto null', () => {
      // Arrange
      loggerService.info('mensagem', null as unknown as Record<string, unknown>)

      // Act
      expect(nestLogger.log).toHaveBeenCalledWith('mensagem', ResourceTypes.MOVIE)
    })
  })
})
