import { MaskEmailStrategy } from './mask.email.strategy'
import { IMaskEmailOptions } from '../interface/mask.email.options.interface'

describe('MaskEmailStrategy', () => {
  const handler = new MaskEmailStrategy()
  const email = 'faker.email@hotmail.com.br'

  describe('Funcionalidade Básica', () => {
    it('deve retornar valor original quando valor for falsy', () => {
      expect(handler.run('')).toBe('')
      expect(handler.run(null as any)).toBeNull()
      expect(handler.run(undefined as any)).toBeUndefined()
    })

    it('deve retornar valor original quando não for um email válido (sem @)', () => {
      // Arrange
      const invalidEmail = 'fakemail.hotmail.com'

      // Act
      const result = handler.run(invalidEmail)

      // Assert
      expect(result).toBe(invalidEmail)
    })

    it('deve usar configurações padrão quando nenhuma opção for fornecida', () => {
      // Act
      const result = handler.run(email)

      // Assert
      expect(result).toBe('fa*********@h*********m.br')
    })
  })

  describe('Mascaramento da Parte Local', () => {
    it('deve mascarar corretamente com localRevealStart e localRevealEnd', () => {
      // Arrange
      const options: Partial<IMaskEmailOptions> = {
        localRevealStart: 3,
        localRevealEnd: 2,
        domainStrategy: 'preserve',
      }

      // Act
      const result = handler.run(email, options)

      // Assert
      expect(result).toBe('fak******il@hotmail.com.br')
    })

    it('deve revelar apenas o início da parte local', () => {
      // Arrange
      const options: Partial<IMaskEmailOptions> = {
        localRevealStart: 4,
        localRevealEnd: 0,
        domainStrategy: 'preserve',
      }

      // Act
      const result = handler.run(email, options)

      // Assert
      expect(result).toBe('fake*******@hotmail.com.br')
    })

    it('deve revelar apenas o final da parte local', () => {
      // Arrange
      const options: Partial<IMaskEmailOptions> = {
        localRevealStart: 0,
        localRevealEnd: 3,
        domainStrategy: 'preserve',
      }

      // Act
      const result = handler.run(email, options)

      // Assert
      expect(result).toBe('********ail@hotmail.com.br')
    })

    it('deve não mascarar parte local muito curta', () => {
      // Arrange
      const shortEmail = 'abc@test.com'
      const options: Partial<IMaskEmailOptions> = {
        localMinLength: 4,
        domainStrategy: 'preserve',
      }

      // Act
      const result = handler.run(shortEmail, options)

      // Assert
      expect(result).toBe('abc@test.com')
    })

    it('deve usar caractere de máscara personalizado', () => {
      // Arrange
      const options: Partial<IMaskEmailOptions> = {
        maskChar: '#',
        localRevealStart: 2,
        localRevealEnd: 0,
        domainStrategy: 'preserve',
      }

      // Act
      const result = handler.run(email, options)

      // Assert
      expect(result).toBe('fa#########@hotmail.com.br')
    })
  })

  describe('Estratégias de Mascaramento do Domínio', () => {
    it('deve preservar domínio completamente com strategy preserve', () => {
      // Arrange
      const options: Partial<IMaskEmailOptions> = {
        domainStrategy: 'preserve',
      }

      // Act
      const result = handler.run(email, options)

      // Assert
      expect(result).toMatch(/^fa\*+@hotmail\.com\.br$/)
    })

    it('deve revelar domínio completamente com strategy reveal', () => {
      // Arrange
      const options: Partial<IMaskEmailOptions> = {
        domainStrategy: 'reveal',
      }

      // Act
      const result = handler.run(email, options)

      // Assert
      expect(result).toMatch(/^fa\*+@hotmail\.com\.br$/)
    })

    it('deve mascarar domínio completamente com strategy full', () => {
      // Arrange
      const options: Partial<IMaskEmailOptions> = {
        domainStrategy: 'full',
      }

      // Act
      const result = handler.run(email, options)

      // Assert
      expect(result).toMatch(/^fa\*+@\*+$/)
    })

    it('deve aplicar mascaramento parcial no domínio', () => {
      // Arrange
      const options: Partial<IMaskEmailOptions> = {
        domainStrategy: 'partial',
        domainRevealStart: 1,
        domainRevealEnd: 4,
        preserveTLD: true,
      }

      // Act
      const result = handler.run(email, options)

      // Assert
      expect(result).toBe('fa*********@h*********m.br')
    })
  })

  describe('Preservação de TLD', () => {
    it('deve preservar TLD quando preserveTLD for true', () => {
      // Arrange
      const options: Partial<IMaskEmailOptions> = {
        domainStrategy: 'partial',
        preserveTLD: true,
        domainRevealStart: 1,
        domainRevealEnd: 0,
      }

      // Act
      const result = handler.run('user@example.com', options)

      // Assert
      expect(result).toMatch(/^us\*+@e\*+\.com$/)
    })

    it('deve não preservar TLD quando preserveTLD for false', () => {
      // Arrange
      const options: Partial<IMaskEmailOptions> = {
        domainStrategy: 'partial',
        preserveTLD: false,
        domainRevealStart: 1,
        domainRevealEnd: 1,
      }

      // Act
      const result = handler.run('user@example.com', options)

      // Assert
      expect(result).toMatch(/^us\*+@e\*+m$/)
    })
  })

  describe('Domínios Preservados', () => {
    it('deve preservar domínios da lista preservedDomains', () => {
      // Arrange
      const options: Partial<IMaskEmailOptions> = {
        preservedDomains: ['gmail.com', 'hotmail.com.br'],
      }

      // Act
      const result = handler.run(email, options)

      // Assert
      expect(result).toMatch(/^fa\*+@hotmail\.com\.br$/)
    })

    it('deve mascarar domínios não incluídos na lista preservedDomains', () => {
      // Arrange
      const options: Partial<IMaskEmailOptions> = {
        preservedDomains: ['gmail.com'],
        domainStrategy: 'partial',
      }

      // Act
      const result = handler.run(email, options)
      // Assert
      expect(result).toMatch('fa*********@h*********m.br')
    })
  })

  describe('Casos Extremos', () => {
    it('deve lidar com emails com múltiplos pontos no domínio', () => {
      // Arrange
      const complexEmail = 'user@mail.example.co.uk'
      const options: Partial<IMaskEmailOptions> = {
        domainStrategy: 'partial',
        preserveTLD: true,
      }

      // Act
      const result = handler.run(complexEmail, options)

      // Assert
      expect(result).toBe('us**@m*************o.uk')
    })

    it('deve lidar com emails muito longos', () => {
      // Arrange
      const longEmail = 'very.long.email.address@very.long.domain.example.com'

      // Act
      const result = handler.run(longEmail)

      // Assert
      expect(result).toMatch(/^ve\*+@v\*+\.com$/)
    })

    it('deve lidar com emails com caracteres especiais', () => {
      // Arrange
      const specialEmail = 'user+tag@example-domain.com'

      // Act
      const result = handler.run(specialEmail)

      // Assert
      expect(result).toMatch(/^us\*+@e\*+\.com$/)
    })

    it('deve manter consistência com diferentes configurações', () => {
      // Arrange
      const options1: Partial<IMaskEmailOptions> = {
        localRevealStart: 2,
        domainStrategy: 'preserve',
      }

      const options2: Partial<IMaskEmailOptions> = {
        localRevealStart: 3,
        domainStrategy: 'preserve',
      }

      // Act
      const result1 = handler.run(email, options1)
      const result2 = handler.run(email, options2)

      // Assert
      expect(result1).not.toBe(result2)
      expect(result1).toMatch(/^fa\*+@hotmail\.com\.br$/)
      expect(result2).toMatch(/^fak\*+@hotmail\.com\.br$/)
    })
  })
})
