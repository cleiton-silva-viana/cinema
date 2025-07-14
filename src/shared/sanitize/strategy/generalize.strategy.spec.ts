import { GeneralizeStrategy } from '@/shared/sanitize/strategy/generalize.strategy'
import { IGeneralizeNumberOptions } from '@/shared/sanitize/interface/generalize.number.options.interface'

describe('GeneralizeStrategy', () => {
  const handler = new GeneralizeStrategy()
  const options: IGeneralizeNumberOptions = {
    ranges: [
      { min: 1, max: 5, label: '1-5' },
      { min: 6, max: 9, label: '6-9' },
    ],
  }

  it('quando valor fo igual ao mínimo', () => {
    // Arrange
    const value = 1

    // Act
    const result = handler.run(value, options)

    // Assert
    expect(result).toBe(options.ranges[0].label)
  })

  it('quando valor for igual ao máximo', () => {
    // Arrange
    const value = 5

    // Act
    const result = handler.run(value, options)

    // Assert
    expect(result).toBe(options.ranges[0].label)
  })

  it('deve retornar o próprio valor quando valor estiver fora do range', () => {
    // Arrange
    const value = 10

    // Act
    const result = handler.run(value, options)

    // Assert
    expect(result).toBe(value)
  })

  it('deve retornar undefined quando valor for um falsy', () => {
    // Act
    const result = handler.run(undefined, options)

    // Assert
    expect(result).toBeUndefined()
  })
})
