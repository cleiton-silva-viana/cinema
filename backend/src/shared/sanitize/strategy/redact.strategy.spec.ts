import { RedactStrategy } from '@/shared/sanitize/strategy/redact.strategy'
import { IRedactOptions } from '@/shared/sanitize/interface/redact.options.interface'

describe('RedactStrategy', () => {
  const handler = new RedactStrategy()

  describe('Redação básica', () => {
    it('Deve retornar texto padrão quando options não é fornecido', () => {
      // Act
      const result = handler.run('senha123')

      // Assert
      expect(result).toBe('[REDACTED]')
    })

    it('Deve retornar texto padrão quando options é vazio', () => {
      // Act
      const result = handler.run('senha123', {})

      // Assert
      expect(result).toBe('[REDACTED]')
    })

    it('Deve usar texto customizado de redação', () => {
      // Arrange
      const options: IRedactOptions = {
        text: '[CONFIDENTIAL]',
        preserveLength: false,
      }

      // Act
      const result = handler.run('senha123', options)

      // Assert
      expect(result).toBe('[CONFIDENTIAL]')
    })

    it('Deve usar texto customizado simples', () => {
      // Arrange
      const options: IRedactOptions = {
        text: 'HIDDEN',
        preserveLength: false,
      }

      // Act
      const result = handler.run('informação secreta', options)

      // Assert
      expect(result).toBe('HIDDEN')
    })
  })

  describe('Preservação de comprimento', () => {
    it('Deve preservar comprimento com diferentes caracteres únicos', () => {
      // Arrange
      const testCases = [
        { char: '#', input: 'abc', expected: '###' },
        { char: 'X', input: 'password', expected: 'XXXXXXXX' },
        { char: '-', input: '12345', expected: '-----' },
        { char: '•', input: 'secret', expected: '••••••' },
      ]

      testCases.forEach(({ char, input, expected }) => {
        const options: IRedactOptions = {
          text: char,
          preserveLength: true,
        }

        // Act
        const result = handler.run(input, options)

        // Assert
        expect(result).toBe(expected)
      })
    })

    it('Deve ignorar preserveLength quando text tem mais de um caractere', () => {
      // Arrange
      const options: IRedactOptions = {
        text: '***',
        preserveLength: true,
      }

      // Act
      const result = handler.run('senha123', options)

      // Assert
      expect(result).toBe('***')
      expect(result).not.toHaveLength(9)
    })

    it('Deve preservar comprimento de strings longas', () => {
      // Arrange
      const longString = 'Esta é uma string muito longa que precisa ser redigida completamente'
      const options: IRedactOptions = {
        text: '*',
        preserveLength: true,
      }

      // Act
      const result = handler.run(longString, options)

      // Assert
      expect(result).toBe('*'.repeat(longString.length))
      expect(result).toHaveLength(longString.length)
    })

    it('Deve preservar comprimento de string vazia', () => {
      // Arrange
      const options: IRedactOptions = {
        text: '*',
        preserveLength: true,
      }

      // Act
      const result = handler.run('', options)

      // Assert
      expect(result).toBe('')
    })
  })

  describe('Processamento de números', () => {
    it('Deve processar números como strings', () => {
      // Act
      const result = handler.run(123456)

      // Assert
      expect(result).toBe('[REDACTED]')
    })

    it('Deve preservar comprimento de números', () => {
      // Arrange
      const options: IRedactOptions = {
        text: '#',
        preserveLength: true,
      }

      // Act
      const result = handler.run(123456, options)

      // Assert
      expect(result).toBe('######')
      expect(result).toHaveLength(6)
    })

    it('Deve processar números decimais', () => {
      // Arrange
      const options: IRedactOptions = {
        text: '*',
        preserveLength: true,
      }

      // Act
      const result = handler.run(123.45, options)

      // Assert
      expect(result).toBe('******') // '123.45' tem 6 caracteres
    })

    it('Deve processar números negativos', () => {
      // Arrange
      const options: IRedactOptions = {
        text: 'X',
        preserveLength: true,
      }

      // Act
      const result = handler.run(-123, options)

      // Assert
      expect(result).toBe('XXXX') // '-123' tem 4 caracteres
    })

    it('Deve processar zero', () => {
      // Arrange
      const options: IRedactOptions = {
        text: '#',
        preserveLength: true,
      }

      // Act
      const result = handler.run(0, options)

      // Assert
      expect(result).toBe('#') // '0' tem 1 caractere
    })
  })

  describe('Casos especiais de entrada', () => {
    it('Deve lidar com valores undefined', () => {
      // Act
      const result = handler.run(undefined as any)

      // Assert
      expect(result).toBe('[REDACTED]')
    })

    it('Deve lidar com valores null', () => {
      // Act
      const result = handler.run(null as any)

      // Assert
      expect(result).toBe('[REDACTED]')
    })

    it('Deve lidar com objetos', () => {
      // Act
      const result = handler.run({} as any)

      // Assert
      expect(result).toBe('[REDACTED]')
    })

    it('Deve lidar com arrays', () => {
      // Act
      const result = handler.run([] as any)

      // Assert
      expect(result).toBe('[REDACTED]')
    })

    it('Deve lidar com boolean', () => {
      // Act
      const result = handler.run(true as any)

      // Assert
      expect(result).toBe('[REDACTED]')
    })
  })

  describe('Combinações de opções', () => {
    it('Deve priorizar preserveLength quando text é caractere único', () => {
      // Arrange
      const options: IRedactOptions = {
        text: '*',
        preserveLength: true,
      }

      // Act
      const result = handler.run('teste', options)

      // Assert
      expect(result).toBe('*****')
      expect(result).not.toBe('*')
    })

    it('Deve ignorar preserveLength quando text não é caractere único', () => {
      // Arrange
      const options: IRedactOptions = {
        text: 'MULTIPLE',
        preserveLength: true,
      }

      // Act
      const result = handler.run('teste', options)

      // Assert
      expect(result).toBe('MULTIPLE')
      expect(result).not.toHaveLength(5)
    })
  })

  describe('Opções parciais', () => {
    it('Deve usar valor padrão para text quando não fornecido', () => {
      // Arrange
      const options: Partial<IRedactOptions> = {
        preserveLength: false,
      }

      // Act
      const result = handler.run('senha', options)

      // Assert
      expect(result).toBe('[REDACTED]')
    })

    it('Deve usar valor padrão para preserveLength quando não fornecido', () => {
      // Arrange
      const options: Partial<IRedactOptions> = {
        text: 'HIDDEN',
      }

      // Act
      const result = handler.run('senha', options)

      // Assert
      expect(result).toBe('HIDDEN')
    })

    it('Deve funcionar com options vazio', () => {
      // Act
      const result = handler.run('senha', {})

      // Assert
      expect(result).toBe('[REDACTED]')
    })
  })

  describe('Casos extremos', () => {
    it('Deve lidar com strings muito longas', () => {
      // Arrange
      const veryLongString = 'a'.repeat(10000)
      const options: IRedactOptions = {
        text: '*',
        preserveLength: true,
      }

      // Act
      const result = handler.run(veryLongString, options)

      // Assert
      expect(result).toBe('*'.repeat(10000))
      expect(result).toHaveLength(10000)
    })

    it('Deve lidar com números muito grandes', () => {
      // Arrange
      const bigNumber = 999999999999999
      const options: IRedactOptions = {
        text: '#',
        preserveLength: true,
      }

      // Act
      const result = handler.run(bigNumber, options)

      // Assert
      expect(result).toBe('#'.repeat(bigNumber.toString().length))
    })

    it('Deve lidar com string contendo apenas espaços', () => {
      // Arrange
      const spacesOnly = '   '
      const options: IRedactOptions = {
        text: '*',
        preserveLength: true,
      }

      // Act
      const result = handler.run(spacesOnly, options)

      // Assert
      expect(result).toBe('***')
    })
  })
})
