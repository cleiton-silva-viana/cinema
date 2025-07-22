import { Sanitize } from './sanitize'
import { SanitizationStrategyEnum } from './enum/sanitization.strategy.enum'
import { ISanitizationConfig } from './interface/sanitization.config.interface'
import { RedactStrategy } from './strategy/redact.strategy'
import { MaskEmailStrategy } from './strategy/mask.email.strategy'
import { MaskPhoneStrategy } from './strategy/mask.phone.strategy'
import { GeneralizeStrategy } from './strategy/generalize.strategy'
import { TruncateStrategy } from './strategy/truncate.strategy'
import { RemoveStrategy } from './strategy/remove.strategy'
import { IMaskEmailOptions } from '@shared/sanitize/interface/mask.email.options.interface'
import { ITruncateOptions } from '@shared/sanitize/interface/truncate.options.interface'

describe('Sanitize', () => {
  let service: Sanitize
  let redactStrategy: jest.Mocked<RedactStrategy>
  let maskEmailStrategy: jest.Mocked<MaskEmailStrategy>
  let maskPhoneStrategy: jest.Mocked<MaskPhoneStrategy>
  let generalizeStrategy: jest.Mocked<GeneralizeStrategy>
  let truncateStrategy: jest.Mocked<TruncateStrategy>
  let removeStrategy: jest.Mocked<RemoveStrategy>

  beforeEach(() => {
    redactStrategy = {
      run: jest.fn(),
    } as jest.Mocked<RedactStrategy>

    maskEmailStrategy = {
      run: jest.fn(),
    } as unknown as jest.Mocked<MaskEmailStrategy>

    maskPhoneStrategy = {
      run: jest.fn(),
    } as unknown as jest.Mocked<MaskPhoneStrategy>

    generalizeStrategy = {
      run: jest.fn(),
    } as unknown as jest.Mocked<GeneralizeStrategy>

    truncateStrategy = {
      run: jest.fn(),
    } as unknown as jest.Mocked<TruncateStrategy>

    removeStrategy = {
      run: jest.fn(),
    } as unknown as jest.Mocked<RemoveStrategy>

    // Instanciação do serviço com os mocks
    service = new Sanitize(
      redactStrategy,
      maskEmailStrategy,
      maskPhoneStrategy,
      generalizeStrategy,
      truncateStrategy,
      removeStrategy
    )
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('run', () => {
    it('deve retornar dados nulos/undefined sem processamento', () => {
      // Arrange
      const config: ISanitizationConfig = { rules: {} }

      // Act & Assert
      expect(service.run(null, config)).toBeNull()
      expect(service.run(undefined, config)).toBeUndefined()
      expect(service.run('', config)).toBe('')
    })

    it('deve processar valores primitivos sem alteração quando não há regras', () => {
      // Arrange
      const config: ISanitizationConfig = { rules: {} }

      // Act & Assert
      expect(service.run('texto', config)).toBe('texto')
      expect(service.run(123, config)).toBe(123)
      expect(service.run(true, config)).toBe(true)
    })

    it('deve processar objetos aplicando regras de sanitização', () => {
      // Arrange
      const data = {
        email: 'user@example.com',
        password: 'secret123',
        name: 'João Silva',
      }

      const config: ISanitizationConfig = {
        rules: {
          email: { strategy: SanitizationStrategyEnum.MASK_EMAIL },
          password: { strategy: SanitizationStrategyEnum.REDACT },
        },
      }

      maskEmailStrategy.run.mockReturnValue('u***@example.com')
      redactStrategy.run.mockReturnValue('[REDACTED]')

      // Act
      const result = service.run(data, config)

      // Assert
      expect(maskEmailStrategy.run).toHaveBeenCalledWith('user@example.com', undefined)
      expect(redactStrategy.run).toHaveBeenCalledWith('secret123', undefined)
      expect(result).toEqual({
        email: 'u***@example.com',
        password: '[REDACTED]',
        name: 'João Silva',
      })
    })

    it('deve processar arrays recursivamente', () => {
      // Arrange
      const data = [{ email: 'user1@example.com' }, { email: 'user2@example.com' }]

      const config: ISanitizationConfig = {
        rules: {
          email: { strategy: SanitizationStrategyEnum.MASK_EMAIL },
        },
      }

      maskEmailStrategy.run.mockReturnValue('u***@example.com')

      // Act
      const result = service.run(data, config)

      // Assert
      expect(maskEmailStrategy.run).toHaveBeenCalledTimes(2)
      expect(result).toEqual([{ email: 'u***@example.com' }, { email: 'u***@example.com' }])
    })

    it('deve processar objetos aninhados quando recursive=true', () => {
      // Arrange
      const data = {
        user: {
          email: 'user@example.com',
          profile: {
            phone: '11999999999',
          },
        },
      }

      const config: ISanitizationConfig = {
        rules: {
          email: { strategy: SanitizationStrategyEnum.MASK_EMAIL },
          phone: { strategy: SanitizationStrategyEnum.MASK_PHONE },
        },
        recursive: true,
      }

      maskEmailStrategy.run.mockReturnValue('u***@example.com')
      maskPhoneStrategy.run.mockReturnValue('119****9999')

      // Act
      const result = service.run(data, config)

      // Assert
      expect(result.user.email).toBe('u***@example.com')
      expect(result.user.profile.phone).toBe('119****9999')
    })

    it('não deve processar objetos aninhados quando recursive=false', () => {
      // Arrange
      const data = {
        user: {
          email: 'user@example.com',
        },
      }

      const config: ISanitizationConfig = {
        rules: {
          email: { strategy: SanitizationStrategyEnum.MASK_EMAIL },
        },
        recursive: false,
      }

      // Act
      const result = service.run(data, config)

      // Assert
      expect(maskEmailStrategy.run).not.toHaveBeenCalled()
      expect(result.user.email).toBe('user@example.com')
    })

    it('deve remover campos quando strategy=REMOVE e valor=undefined', () => {
      // Arrange
      const data = {
        email: 'user@example.com',
        password: 'secret123',
      }

      const config: ISanitizationConfig = {
        rules: {
          password: { strategy: SanitizationStrategyEnum.REMOVE },
        },
      }

      removeStrategy.run.mockReturnValue(undefined)

      // Act
      const result = service.run(data, config)

      // Assert
      expect(result).toEqual({ email: 'user@example.com' })
      expect(result).not.toHaveProperty('password')
    })

    it('não deve preservar campos desconhecidos quando preserveUnknownFields=false', () => {
      // Arrange
      const data = {
        email: 'user@example.com',
        unknownField: 'value',
      }

      const config: ISanitizationConfig = {
        rules: {
          email: { strategy: SanitizationStrategyEnum.MASK_EMAIL },
        },
        preserveUnknownFields: false,
      }

      maskEmailStrategy.run.mockReturnValue('u***@example.com')

      // Act
      const result = service.run(data, config)

      // Assert
      expect(result).toEqual({ email: 'u***@example.com' })
      expect(result).not.toHaveProperty('unknownField')
    })

    it('deve lançar erro para estratégia não encontrada', () => {
      // Arrange
      const data = { field: 'value' }
      const config: ISanitizationConfig = {
        rules: {
          field: { strategy: 'INVALID_STRATEGY' as any },
        },
      }

      // Act & Assert
      expect(() => service.run(data, config)).toThrow('Estratégia de sanitização não encontrada: INVALID_STRATEGY')
    })

    it('deve aplicar opções específicas para cada estratégia', () => {
      // Arrange
      const data = {
        email: 'user@example.com',
        text: 'texto muito longo para ser truncado',
      }

      const config: ISanitizationConfig = {
        rules: {
          email: {
            strategy: SanitizationStrategyEnum.MASK_EMAIL,
            options: { maskChar: '#', localRevealStart: 2 } as IMaskEmailOptions,
          },
          text: {
            strategy: SanitizationStrategyEnum.TRUNCATE,
            options: { maxLength: 10, ellipsis: '...' } as ITruncateOptions,
          },
        },
      }

      maskEmailStrategy.run.mockReturnValue('us###@example.com')
      truncateStrategy.run.mockReturnValue('texto m...')

      // Act
      service.run(data, config)

      // Assert
      expect(maskEmailStrategy.run).toHaveBeenCalledWith('user@example.com', { maskChar: '#', localRevealStart: 2 })
      expect(truncateStrategy.run).toHaveBeenCalledWith('texto muito longo para ser truncado', {
        maxLength: 10,
        ellipsis: '...',
      })
    })
  })

  describe('Configurações padrão', () => {
    it('deve usar recursive=true por padrão', () => {
      // Arrange
      const data = {
        nested: {
          email: 'user@example.com',
        },
      }

      const config: ISanitizationConfig = {
        rules: {
          email: { strategy: SanitizationStrategyEnum.MASK_EMAIL },
        },
      }

      maskEmailStrategy.run.mockReturnValue('u***@example.com')

      // Act
      const result = service.run(data, config)

      // Assert
      expect(result.nested.email).toBe('u***@example.com')
    })

    it('deve usar preserveUnknownFields=true por padrão', () => {
      // Arrange
      const data = {
        email: 'user@example.com',
        unknownField: 'value',
      }

      const config: ISanitizationConfig = {
        rules: {
          email: { strategy: SanitizationStrategyEnum.MASK_EMAIL },
        },
      }

      maskEmailStrategy.run.mockReturnValue('u***@example.com')

      // Act
      const result = service.run(data, config)

      // Assert
      expect(result).toEqual({
        email: 'u***@example.com',
        unknownField: 'value',
      })
    })
  })
})
