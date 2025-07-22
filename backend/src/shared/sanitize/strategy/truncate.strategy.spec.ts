import { TruncateStrategy } from '@/shared/sanitize/strategy/truncate.strategy'
import { ITruncateOptions } from '@/shared/sanitize/interface/truncate.options.interface'

describe('truncate', () => {
  const handler = new TruncateStrategy()
  const text = 'chupa, chupa, chupa que é de uva, chupa, chupa, chupa, chupa, chupa que é de uva'
  const options: ITruncateOptions = {
    ellipsis: '[...]', // testar nesse cenário
    minLength: 5,
    maxLength: 20,
    position: 'start',
    preserveWords: true, // testar neste cenário
  }

  it('Deve realizar truncamento no início preservando palavras', () => {
    // Act
    const result = handler.run(text, options)

    // Assert
    expect(result).toBe('[...]que é de uva')
  })

  it('Deve realizar truncamento no final preservando palavras', () => {
    // Arrange
    const op: ITruncateOptions = { ...options, position: 'end' }

    // Act
    const result = handler.run(text, op)

    // Assert
    expect(result).toBe('chupa, chupa,[...]')
  })

  it('Deve realizar truncamento no meio preservando palavras', () => {
    // Arrange
    const op: ITruncateOptions = { ...options, position: 'middle' }

    // Act
    const result = handler.run(text, op)

    // Assert
    expect(result).toBe('chupa,[...]de uva')
  })

  it('Deve usar ellipsis personalizado', () => {
    // Arrange
    const op: ITruncateOptions = {
      ...options,
      ellipsis: ' [TRUNCATED]',
    }

    // Act
    const result = handler.run(text, op)

    // Assert
    expect(result).toBe(' [TRUNCATED]de uva')
  })

  it('Deve usar ellipsis vazio', () => {
    // Arrange
    const op: ITruncateOptions = {
      maxLength: 15,
      position: 'end',
      ellipsis: '',
      preserveWords: false,
      minLength: 0,
    }

    // Act
    const result = handler.run(text, op)

    // Assert
    expect(result).toBe('chupa, chupa, c')
  })

  it('Deve retornar texto original quando menor que maxLength', () => {
    // Arrange
    const op: ITruncateOptions = {
      maxLength: text.length + 1,
      position: 'end',
      ellipsis: '...',
      preserveWords: false,
      minLength: 0,
    }

    // Act
    const result = handler.run(text, op)

    // Assert
    expect(result).toBe(text)
  })

  it('Deve retornar texto original quando igual ao maxLength', () => {
    // Arrange
    const op: ITruncateOptions = {
      maxLength: text.length,
      position: 'end',
      ellipsis: '...',
      preserveWords: false,
      minLength: 0,
    }

    // Act
    const result = handler.run(text, op)

    // Assert
    expect(result).toBe(text)
  })

  it('Deve retornar de imediato quando valor for um falsy', () => {
    // Act
    const result = handler.run(undefined as any, options)

    // Assert
    expect(result).toBeUndefined()
  })

  it('Deve retornar de imediato quando valor NÃO for uma string', () => {
    // Arrange
    const value = { a: 'b', c: 'd', e: 'f' } as any

    // Act
    const result = handler.run(value, options)

    // Assert
    expect(result).toBe(value)
  })
})
