import { RemoveStrategy, RequiredRemoveOptions } from '@/shared/sanitize/strategy/remove.strategy'
import { IRemoveOptions } from '../interface/remove.options.interface'

describe('RemoveStrategy', () => {
  const handler = new RemoveStrategy()
  let consoleSpy: jest.SpyInstance

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
  })

  afterEach(() => {
    consoleSpy.mockRestore()
  })

  describe('Remoção básica de chaves', () => {
    const data = {
      username: 'john_doe',
      password: 'secret123',
      email: 'john@example.com',
      creditCard: '1234-5678-9012-3456',
    }

    it('Deve remover chaves especificadas completamente', () => {
      // Arrange
      const options: RequiredRemoveOptions = {
        removeKey: true,
        keysToRemove: new Set(['password', 'creditCard']),
        preserveStructure: false,
      }

      // Act
      const result = handler.run(data, options)

      // Assert
      expect(result).toEqual({
        username: 'john_doe',
        email: 'john@example.com',
      })
      expect(result).not.toHaveProperty('password')
      expect(result).not.toHaveProperty('creditCard')
    })

    it('Deve substituir chaves por placeholder quando removeKey é false', () => {
      // Arrange
      const options: RequiredRemoveOptions = {
        removeKey: false,
        placeholder: '[REDACTED]',
        keysToRemove: new Set(['password', 'creditCard']),
        preserveStructure: false,
      }

      // Act
      const result = handler.run(data, options)

      // Assert
      expect(result).toEqual({
        username: 'john_doe',
        password: '[REDACTED]',
        email: 'john@example.com',
        creditCard: '[REDACTED]',
      })
    })

    it('Deve preservar estrutura com undefined quando preserveStructure é true', () => {
      // Arrange
      const options: RequiredRemoveOptions = {
        removeKey: true,
        placeholder: '[REMOVED]',
        keysToRemove: new Set(['password', 'creditCard']),
        preserveStructure: true,
      }

      // Act
      const result = handler.run(data, options)

      // Assert
      expect(result).toEqual({
        username: 'john_doe',
        email: 'john@example.com',
        password: undefined,
        creditCard: undefined,
      })
      expect(result).toHaveProperty('password')
      expect(result.password).toBeUndefined()
      expect(result).toHaveProperty('creditCard')
      expect(result.creditCard).toBeUndefined()
    })
  })

  describe('Processamento recursivo', () => {
    it('Deve remover chaves em objetos aninhados quando recursive é true', () => {
      // Arrange
      const data = {
        user: {
          name: 'John',
          password: 'secret123',
          profile: {
            email: 'john@example.com',
            apiKey: 'abc123',
          },
        },
        settings: {
          theme: 'dark',
          token: 'xyz789',
        },
      }

      const options: RequiredRemoveOptions = {
        removeKey: true,
        placeholder: '[REMOVED]',
        recursive: true,
        keysToRemove: new Set(['password', 'apiKey', 'token']),
        preserveStructure: false,
      }

      // Act
      const result = handler.run(data, options)

      // Assert
      expect(result).toEqual({
        user: {
          name: 'John',
          profile: {
            email: 'john@example.com',
          },
        },
        settings: {
          theme: 'dark',
        },
      })
    })

    it('Deve manter chaves sensíveis quando recursive é false', () => {
      // Arrange
      const data = {
        user: {
          name: 'John',
          password: 'secret123',
        },
        password: 'main_secret',
      }

      const options: RequiredRemoveOptions = {
        removeKey: true,
        placeholder: '[REMOVED]',
        recursive: false,
        keysToRemove: new Set(['password']),
        preserveStructure: false,
      }

      // Act
      const result = handler.run(data, options)

      // Assert
      expect(result).toEqual({
        user: {
          name: 'John',
          password: 'secret123', // Mantido porque recursive é false
        },
      })
    })
  })

  describe('Processamento de arrays', () => {
    it('Deve processar objetos dentro de arrays', () => {
      // Arrange
      const data = {
        users: [
          { name: 'John', password: 'secret1' },
          { name: 'Jane', password: 'secret2' },
          { name: 'Bob', password: 'secret3' },
        ],
      }

      const options: RequiredRemoveOptions = {
        removeKey: true,
        placeholder: '[REMOVED]',
        recursive: true,
        keysToRemove: new Set(['password']),
        preserveStructure: false,
      }

      // Act
      const result = handler.run(data, options)

      // Assert
      expect(result).toEqual({
        users: [{ name: 'John' }, { name: 'Jane' }, { name: 'Bob' }],
      })
    })

    it('Deve processar arrays aninhados', () => {
      // Arrange
      const data = {
        groups: [
          {
            name: 'Admin',
            users: [
              { name: 'John', apiKey: 'key1' },
              { name: 'Jane', apiKey: 'key2' },
            ],
          },
        ],
      }

      const options: RequiredRemoveOptions = {
        removeKey: false,
        placeholder: '[HIDDEN]',
        recursive: true,
        keysToRemove: new Set(['apiKey']),
        preserveStructure: false,
      }

      // Act
      const result = handler.run(data, options)

      // Assert
      expect(result).toEqual({
        groups: [
          {
            name: 'Admin',
            users: [
              { name: 'John', apiKey: '[HIDDEN]' },
              { name: 'Jane', apiKey: '[HIDDEN]' },
            ],
          },
        ],
      })
    })

    it('Deve manter valores primitivos em arrays', () => {
      // Arrange
      const data = {
        tags: ['public', 'private', 'secret'],
        numbers: [1, 2, 3],
      }

      const options: RequiredRemoveOptions = {
        removeKey: true,
        placeholder: '[REMOVED]',
        recursive: true,
        keysToRemove: new Set(['nonexistent']),
        preserveStructure: false,
      }

      // Act
      const result = handler.run(data, options)

      // Assert
      expect(result).toEqual({
        tags: ['public', 'private', 'secret'],
        numbers: [1, 2, 3],
      })
    })
  })

  describe('Casos especiais de entrada', () => {
    it('Deve retornar undefined para valores falsy', () => {
      // Arrange
      const options: RequiredRemoveOptions = {
        removeKey: true,
        keysToRemove: new Set(['unknow']),
        recursive: true,
        preserveStructure: true,
        placeholder: '[REMOVE]',
      }

      // Act & Assert
      expect(handler.run(null as any, options)).toBeNull()
      expect(handler.run(undefined as any, options)).toBeUndefined()
      expect(handler.run('' as any, options)).toBe('')
      expect(handler.run(0 as any, options)).toBe(0)
      expect(handler.run(false as any, options)).toBe(false)
    })

    it('Deve processar array como entrada principal', () => {
      // Arrange
      const data = [
        { name: 'John', password: 'secret1' },
        { name: 'Jane', password: 'secret2' },
      ]

      const options: RequiredRemoveOptions = {
        removeKey: true,
        placeholder: '[REMOVED]',
        recursive: true,
        keysToRemove: new Set(['password']),
        preserveStructure: false,
      }

      // Act
      const result = handler.run(data, options)

      // Assert
      expect(result).toEqual([{ name: 'John' }, { name: 'Jane' }])
    })

    it('Deve processar valores primitivos como entrada principal', () => {
      // Arrange
      const options: RequiredRemoveOptions = {
        removeKey: true,
        placeholder: '[REMOVED]',
        recursive: true,
        keysToRemove: new Set(['password']),
        preserveStructure: false,
      }

      // Act & Assert
      expect(handler.run('string', options)).toBe('string')
      expect(handler.run(123, options)).toBe(123)
      expect(handler.run(true, options)).toBe(true)
    })
  })

  describe('Casos extremos', () => {
    it('Deve lidar com objetos vazios', () => {
      // Arrange
      const data = {}
      const options: RequiredRemoveOptions = {
        removeKey: true,
        placeholder: '[REMOVED]',
        recursive: true,
        keysToRemove: new Set(['password']),
        preserveStructure: false,
      }

      // Act
      const result = handler.run(data, options)

      // Assert
      expect(result).toEqual({})
    })

    it('Deve lidar com arrays vazios', () => {
      // Arrange
      const data: any[] = []
      const options: RequiredRemoveOptions = {
        removeKey: true,
        placeholder: '[REMOVED]',
        recursive: true,
        keysToRemove: new Set(['password']),
        preserveStructure: false,
      }

      // Act
      const result = handler.run(data, options)

      // Assert
      expect(result).toEqual([])
    })

    it('Deve lidar com keysToRemove vazio', () => {
      // Arrange
      const data = { name: 'John', password: 'secret' }
      const options: RequiredRemoveOptions = {
        removeKey: true,
        placeholder: '[REMOVED]',
        recursive: true,
        keysToRemove: new Set(),
        preserveStructure: false,
      }

      // Act
      const result = handler.run(data, options)

      // Assert
      expect(result).toEqual({ name: 'John', password: 'secret' })
    })

    it('Deve lidar com objetos com valores null', () => {
      // Arrange
      const data = {
        name: 'John',
        password: null,
        profile: null,
      }

      const options: RequiredRemoveOptions = {
        removeKey: true,
        placeholder: '[REMOVED]',
        recursive: true,
        keysToRemove: new Set(['password']),
        preserveStructure: false,
      }

      // Act
      const result = handler.run(data, options)

      // Assert
      expect(result).toEqual({
        name: 'John',
        profile: null,
      })
    })

    it('Deve lidar com referências circulares evitando recursão infinita', () => {
      // Arrange
      const data: any = { name: 'John', password: 'secret' }
      data.self = data // Referência circular

      const options: RequiredRemoveOptions = {
        removeKey: true,
        placeholder: '[REMOVED]',
        recursive: false, // Evitar recursão para este teste
        keysToRemove: new Set(['password']),
        preserveStructure: false,
      }

      // Act
      const result = handler.run(data, options)

      // Assert
      expect(result.name).toBe('John')
      expect(result).not.toHaveProperty('password')
      expect(result.self).toBe(data) // Referência mantida
    })
  })

  describe('Proteção contra recursão', () => {
    it('Deve respeitar limite de profundidade máxima', () => {
      // Arrange
      const deepData = {
        level1: {
          level2: {
            level3: {
              level4: {
                level5: {
                  level6: {
                    password: 'secret',
                    data: 'value',
                  },
                },
              },
            },
          },
        },
      }

      const options: IRemoveOptions = {
        removeKey: false,
        placeholder: '[DEPTH_LIMIT]',
        recursive: true,
        keysToRemove: new Set(['password']),
        preserveStructure: false,
        maxDepth: 3,
      }

      // Act
      const result = handler.run(deepData, options)

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Máxima profundidade (3) atingida'))
      // Verifica se a recursão parou no nível correto
      expect(result.level1.level2.level3).toEqual({ level4: '[DEPTH_LIMIT]' })
    })

    it('Deve detectar e tratar referências circulares', () => {
      // Arrange
      const data: any = {
        name: 'John',
        password: 'secret',
      }
      data.circular = data // Referência circular

      const options: RequiredRemoveOptions = {
        removeKey: false,
        placeholder: '[CIRCULAR]',
        recursive: true,
        keysToRemove: new Set(['password']),
        preserveStructure: false,
      }

      // Act
      const result = handler.run(data, options)

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith('RemoveStrategy: Referência circular detectada')
      expect(result.name).toBe('John')
      expect(result.password).toBe('[CIRCULAR]')
      expect(result.circular).toBe('[CIRCULAR]')
    })

    it('Deve usar configurações padrão quando opções não são fornecidas', () => {
      // Arrange
      const data = { password: 'secret', name: 'John' }
      const options: RequiredRemoveOptions = {
        keysToRemove: new Set(['password']),
      }

      // Act
      const result = handler.run(data, options)

      // Assert
      expect(result).toEqual({
        name: 'John',
        password: '[REMOVED]',
      })
    })
  })

  describe('Validação de configurações', () => {
    it('Deve aplicar configurações padrão corretamente', () => {
      // Arrange
      const data = { sensitive: 'data', normal: 'value' }
      const options: RequiredRemoveOptions = {
        keysToRemove: new Set(['sensitive']),
      }

      // Act
      const result = handler.run(data, options)

      // Assert
      expect(result.sensitive).toBe('[REMOVED]')
      expect(result.normal).toBe('value')
    })

    it('Deve sobrescrever configurações padrão com opções fornecidas', () => {
      // Arrange
      const data = { sensitive: 'data', normal: 'value' }
      const options: RequiredRemoveOptions = {
        keysToRemove: new Set(['sensitive']),
        removeKey: true,
        preserveStructure: false,
        placeholder: '[CUSTOM]',
      }

      // Act
      const result = handler.run(data, options)

      // Assert
      expect(result).not.toHaveProperty('sensitive')
      expect(result.normal).toBe('value')
    })
  })
})
