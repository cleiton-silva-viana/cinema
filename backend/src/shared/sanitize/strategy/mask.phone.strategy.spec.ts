import { MaskPhoneStrategy } from '@/shared/sanitize/strategy/mask.phone.strategy'
import { IMaskPhoneOptions } from '@/shared/sanitize/interface/mask.phone.options.interface'

describe('MaskPhoneStrategy', () => {
  const handler = new MaskPhoneStrategy()
  const phone = '11987654321'
  const options: IMaskPhoneOptions = {
    maskChar: '*',
    revealStart: 2,
    revealEnd: 4,
  }

  it('deve aplicar corretamente as opções definidas acima', () => {
    // Arrange
    const maskedPhone = '11*****4321'

    // Act
    const result = handler.run(phone, options)

    // Assert
    expect(result).toBe(maskedPhone)
  })

  it('deve retornar apenas as partes iniciais mascaradas', () => {
    // Arrange
    const op = { ...options, revealStart: 0 }

    // Act
    const result = handler.run(phone, op)

    // Assert
    expect(result).toBe('*******4321')
  })

  it('deve retornar telefone com partes finais mascaradas', () => {
    // Arrange
    const op = { ...options, revealEnd: 0 }

    // Act
    const result = handler.run(phone, op)

    // Assert
    expect(result).toBe('11*********')
  })

  it('deve usar as opções padrão quando não fornecidas', () => {
    // Arrange
    const phoneNumber = '11987654321'
    const expectedMasked = '*******4321' // revealStart: 0, revealEnd: 4

    // Act
    const result = handler.run(phoneNumber)

    // Assert
    expect(result).toBe(expectedMasked)
  })

  it('deve processar telefone com formatação (parênteses, hífens, espaços)', () => {
    // Arrange
    const formattedPhone = '(11) 98765-4321'
    const op = { ...options, revealStart: 2, revealEnd: 4 }

    // Act
    const result = handler.run(formattedPhone, op)

    // Assert
    expect(result).toBe('11*****4321')
  })

  it('deve processar telefone internacional com código do país', () => {
    // Arrange
    const internationalPhone = '+55 11 98765-4321'
    const op = { ...options, revealStart: 3, revealEnd: 4 }

    // Act
    const result = handler.run(internationalPhone, op)

    // Assert
    expect(result).toBe('551******4321')
  })

  it('deve usar caractere de máscara personalizado', () => {
    // Arrange
    const op = { ...options, maskChar: '#' }

    // Act
    const result = handler.run(phone, op)

    // Assert
    expect(result).toBe('11#####4321')
  })

  it('deve retornar de imediato quando valor for um falsy', () => {
    // Act
    const result = handler.run(undefined as any, options)

    // Assert
    expect(result).toBeUndefined()
  })

  it('deve retornar de imediato quando valor for null', () => {
    // Act
    const result = handler.run(null as any, options)

    // Assert
    expect(result).toBeNull()
  })

  it('deve retornar de imediato quando valor for string vazia', () => {
    // Act
    const result = handler.run('', options)

    // Assert
    expect(result).toBe('')
  })

  it('deve retornar valor original quando não contém dígitos', () => {
    // Arrange
    const noDigits = 'abc-def-ghij'

    // Act
    const result = handler.run(noDigits, options)

    // Assert
    expect(result).toBe(noDigits)
  })

  it('deve lidar com revealStart maior que o comprimento do telefone', () => {
    // Arrange
    const shortPhone = '123'
    const op = { ...options, revealStart: 10, revealEnd: 1 }

    // Act
    const result = handler.run(shortPhone, op)

    // Assert
    expect(result).toBe('123')
  })

  it('deve lidar com revealEnd maior que o comprimento do telefone', () => {
    // Arrange
    const shortPhone = '123'
    const op = { ...options, revealStart: 1, revealEnd: 10 }

    // Act
    const result = handler.run(shortPhone, op)

    // Assert
    expect(result).toBe('123')
  })

  it('deve mascarar completamente quando revealStart e revealEnd são 0', () => {
    // Arrange
    const op = { ...options, revealStart: 0, revealEnd: 0 }

    // Act
    const result = handler.run(phone, op)

    // Assert
    expect(result).toBe('***********')
  })

  it('deve revelar completamente quando revealStart + revealEnd >= comprimento', () => {
    // Arrange
    const shortPhone = '12345'
    const op = { ...options, revealStart: 3, revealEnd: 3 }

    // Act
    const result = handler.run(shortPhone, op)

    // Assert
    expect(result).toBe('12345')
  })

  it('deve processar telefone com caracteres especiais misturados', () => {
    // Arrange
    const mixedPhone = '+55 (11) 9.8765-4321 ext. 123'
    const op = { ...options, revealStart: 4, revealEnd: 3 }

    // Act
    const result = handler.run(mixedPhone, op)

    // Assert
    expect(result).toBe('5511*********123')
  })
})
