import { AnonymizeStrategy } from './anonymize.strategy'
import { IAnonymizeOptions } from '../interface/anonymize.options.interface'

class SuperAnonymize extends AnonymizeStrategy {
  /**
   * Limpa o mapa de anonimização (útil para testes)
   */
  public static clearAnonymizationMap(): void {
    AnonymizeStrategy.anonymizationMap.clear()
  }

  /**
   * Obtém o tamanho atual do mapa de anonimização (útil para testes)
   */
  public static getAnonymizationMapSize(): number {
    return AnonymizeStrategy.anonymizationMap.size
  }
}

describe('AnonymizeStrategy', () => {
  const strategy: AnonymizeStrategy = new SuperAnonymize()

  beforeEach(() => {
    SuperAnonymize.clearAnonymizationMap()
  })

  describe('Funcionalidade Básica', () => {
    it('deve retornar valor original quando valor for falsy', () => {
      expect(strategy.run('')).toBe('')
      expect(strategy.run(null as any)).toBeNull()
      expect(strategy.run(undefined as any)).toBeUndefined()
      expect(strategy.run(0)).toBe(0)
    })

    it('deve usar opções padrão quando nenhuma opção for fornecida', () => {
      // Act
      const result = strategy.run('test')

      // Assert
      expect(typeof result).toBe('string')
      expect(result).toMatch(/^ANON_[a-f0-9]{8}$/)
    })

    it('deve processar números convertendo para string', () => {
      // Act
      const result = strategy.run(12345)

      // Assert
      expect(typeof result).toBe('string')
      expect(result).toMatch(/^ANON_[a-f0-9]{8}$/)
    })
  })

  describe('Tipo de Anonimização: Random', () => {
    const options: Partial<IAnonymizeOptions> = { type: 'random' }

    it('deve gerar valor anonimizado com tipo random', () => {
      // Act
      const result = strategy.run('sensitive-data', options)

      // Assert
      expect(result).toMatch(/^ANON_[a-f0-9]{8}$/)
    })

    it('deve gerar valores diferentes para entradas diferentes quando consistent=false', () => {
      // Act
      const op: Partial<IAnonymizeOptions> = { type: 'random', consistent: false }

      // Assert
      const result1 = strategy.run('test', op)
      const result2 = strategy.run('test', op)

      expect(result1).not.toBe(result2)
    })
  })

  describe('Tipo de Anonimização: Hash', () => {
    const options: Partial<IAnonymizeOptions> = { type: 'hash' }

    it('deve gerar hash determinístico para o mesmo valor', () => {
      // Act
      const result1 = strategy.run('test', options)
      const result2 = strategy.run('test', options)

      // Assert
      expect(result1).toBe(result2)
      expect(result1).toMatch(/^ANON_[a-f0-9]{8}$/)
    })

    it('deve gerar hashes diferentes para valores diferentes', () => {
      // Act
      const result1 = strategy.run('test1', options)
      const result2 = strategy.run('test2', options)

      // Assert
      expect(result1).not.toBe(result2)
    })

    it('deve respeitar o comprimento do hash personalizado', () => {
      // Act
      const customOptions: Partial<IAnonymizeOptions> = { type: 'hash', hashLength: 12 }
      const result = strategy.run('test', customOptions)

      // Assert
      expect(result).toMatch(/^ANON_[a-f0-9]{12}$/)
    })

    it('deve lidar com hashLength muito pequeno', () => {
      // Act
      const customOptions: Partial<IAnonymizeOptions> = { type: 'hash', hashLength: 1 }
      const result = strategy.run('test', customOptions)

      // Assert
      expect(result).toMatch(/^ANON_[a-f0-9]{1}$/)
    })

    it('deve lidar com hashLength muito grande', () => {
      // Act
      const customOptions: Partial<IAnonymizeOptions> = { type: 'hash', hashLength: 64 }
      const result = strategy.run('test', customOptions)

      // Assert
      expect(result).toMatch(/^ANON_[a-f0-9]{64}$/)
    })
  })

  describe('Tipo de Anonimização: UUID', () => {
    const options: Partial<IAnonymizeOptions> = { type: 'uuid' }

    it('deve gerar UUID válido', () => {
      // Act
      const result = strategy.run('test', options)

      // Assert
      expect(result).toMatch(/^ANON_[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
    })

    it('deve gerar UUIDs diferentes mesmo para o mesmo valor quando consistent=false', () => {
      // Arrange
      const customOptions: Partial<IAnonymizeOptions> = { type: 'uuid', consistent: false }

      // Act
      const result1 = strategy.run('test', customOptions)
      const result2 = strategy.run('test', customOptions)

      // Assert
      expect(result1).not.toBe(result2)
    })
  })

  describe('Consistência de Mapeamento', () => {
    it('deve manter consistência por padrão', () => {
      // Act
      const result1 = strategy.run('test')
      const result2 = strategy.run('test')

      // Assert
      expect(result1).toBe(result2)
      expect(SuperAnonymize.getAnonymizationMapSize()).toBe(1)
    })

    it('deve não manter consistência quando consistent=false', () => {
      // Arrange
      const options: Partial<IAnonymizeOptions> = { consistent: false }

      // Act
      const result1 = strategy.run('test', options)
      const result2 = strategy.run('test', options)

      // Assert
      expect(result1).not.toBe(result2)
      expect(SuperAnonymize.getAnonymizationMapSize()).toBe(0)
    })

    it('deve manter mapeamentos separados para diferentes configurações', () => {
      // Arrange
      const options1: Partial<IAnonymizeOptions> = { type: 'hash', prefix: 'HASH_' }
      const options2: Partial<IAnonymizeOptions> = { type: 'random', prefix: 'RAND_' }

      // Act
      const result1 = strategy.run('test', options1)
      const result2 = strategy.run('test', options2)

      // Assert
      expect(result1).not.toBe(result2)
      expect(result1).toMatch(/^HASH_/)
      expect(result2).toMatch(/^RAND_/)
      expect(SuperAnonymize.getAnonymizationMapSize()).toBe(2)
    })
  })

  describe('Prefixo Personalizado', () => {
    it('deve usar prefixo personalizado', () => {
      // Arrange
      const options: Partial<IAnonymizeOptions> = { prefix: 'CUSTOM' }

      // Act
      const result = strategy.run('test', options)

      // Assert
      expect(result).toMatch(/^CUSTOM_[a-f0-9]{8}$/)
    })

    it('deve funcionar com prefixo vazio', () => {
      // Arrange
      const options: Partial<IAnonymizeOptions> = { prefix: '' }

      // Act
      const result = strategy.run('test', options)

      // Assert
      expect(result).toMatch(/^_[a-f0-9]{8}$/)
    })

    it('deve usar separador personalizado', () => {
      // Arrange
      const options: Partial<IAnonymizeOptions> = { prefix: 'CUSTOM', separator: '-' }

      // Act
      const result = strategy.run('test', options)

      // Assert
      expect(result).toMatch(/^CUSTOM-[a-f0-9]{8}$/)
    })

    it('deve funcionar sem separador', () => {
      // Arrange
      const options: Partial<IAnonymizeOptions> = { prefix: 'CUSTOM', separator: '' }

      // Act
      const result = strategy.run('test', options)

      // Assert
      expect(result).toMatch(/^CUSTOM[a-f0-9]{8}$/)
    })
  })

  describe('Casos Extremos', () => {
    it('deve processar strings muito longas', () => {
      // Arrange
      const longString = 'a'.repeat(10000)

      // Act
      const result = strategy.run(longString)

      // Assert
      expect(result).toMatch(/^ANON_[a-f0-9]{8}$/)
    })

    it('deve processar números muito grandes', () => {
      // Arrange
      const bigNumber = Number.MAX_SAFE_INTEGER

      // Act
      const result = strategy.run(bigNumber)

      // Assert
      expect(result).toMatch(/^ANON_[a-f0-9]{8}$/)
    })

    it('deve processar caracteres especiais e Unicode', () => {
      // Arrange
      const specialChars = "!@#$%^&*()_+{}|:<>?[]\\;',./~`"
      const unicode = '🚀🌟💫⭐️🎯🔥💎🎨🎭🎪'

      // Act
      const result1 = strategy.run(specialChars)
      const result2 = strategy.run(unicode)

      // Assert
      expect(result1).toMatch(/^ANON_[a-f0-9]{8}$/)
      expect(result2).toMatch(/^ANON_[a-f0-9]{8}$/)
    })

    it('deve manter consistência com diferentes tipos de entrada para o mesmo valor', () => {
      // Arrange
      const stringValue = '123'
      const numberValue = 123

      // Act
      const result1 = strategy.run(stringValue)
      const result2 = strategy.run(numberValue)

      // Assert
      expect(result1).toBe(result2)
    })
  })
})
