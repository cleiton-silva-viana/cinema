import { ArrayValidator } from './array.validator'
import { FailureCode } from '../failure/failure.codes.enum'
import { SimpleFailure } from '../failure/simple.failure.type'
import { FailureFactory } from '@shared/failure/failure.factory'

describe('ArrayValidator', () => {
  let failures: SimpleFailure[]
  const FAILURE = FailureFactory.MISSING_REQUIRED_DATA('data')

  beforeEach(() => (failures = []))

  describe('isNotEmpty', () => {
    it('não deve adicionar falha quando o array não estiver vazio', () => {
      // Arrange
      const value = [1, 2, 3]

      // Act
      new ArrayValidator({ itens: value }, failures).isNotEmpty()

      // Assert
      expect(failures).toHaveLength(0)
    })

    it('deve adicionar falha quando o array estiver vazio', () => {
      // Arrange
      const value: number[] = []

      // Act
      new ArrayValidator({ itens: value }, failures).isNotEmpty()

      // Assert
      expect(failures).toHaveLength(1)
      expect(failures[0].code).toBe(FailureCode.MISSING_REQUIRED_DATA)
    })

    it('deve usar o a falha personalizado', () => {
      // Arrange
      const value: number[] = []

      // Act
      new ArrayValidator({ itens: value }, failures).isNotEmpty(() => FAILURE)

      // Assert
      expect(failures).toHaveLength(1)
      expect(failures[0]).toBe(FAILURE)
    })
  })

  describe('hasLengthBetween', () => {
    const MIN = 2
    const MAX = 5

    it('não deve adicionar falha quando o tamanho estiver dentro do intervalo', () => {
      // Arrange
      const value = [1, 2, 3, 4]
      const min = 2
      const max = 5

      // Act
      new ArrayValidator({ itens: value }, failures).hasLengthBetween(min, max)

      // Assert
      expect(failures).toHaveLength(0)
    })

    it('deve adicionar falha quando o tamanho for menor que o mínimo', () => {
      // Arrange
      const value = [1]

      // Act
      new ArrayValidator({ itens: value }, failures).hasLengthBetween(MIN, MAX)

      // Assert
      expect(failures).toHaveLength(1)
      expect(failures[0].code).toBe(FailureCode.ARRAY_LENGTH_IS_OUT_OF_RANGE)
    })

    it('deve adicionar falha quando o tamanho for maior que o máximo', () => {
      // Arrange
      const value = [1, 2, 3, 4, 5, 6]

      // Act
      new ArrayValidator({ itens: value }, failures).hasLengthBetween(MIN, MAX)

      // Assert
      expect(failures).toHaveLength(1)
      expect(failures[0].code).toBe(FailureCode.ARRAY_LENGTH_IS_OUT_OF_RANGE)
    })

    it('deve usar uma falha personalizado', () => {
      // Arrange
      const value = [1]

      // Act
      new ArrayValidator({ itens: value }, failures).hasLengthBetween(MIN, MAX, () => FAILURE)

      // Assert
      expect(failures).toHaveLength(1)
      expect(failures[0]).toEqual(FAILURE)
    })
  })

  describe('contains', () => {
    const ITEMS = [1, 2, 3]

    it('não deve adicionar falha quando o array contém o item', () => {
      // Arrange
      const item = 2

      // Act
      new ArrayValidator({ ITEMS }, failures).contains(item)

      // Assert
      expect(failures).toHaveLength(0)
    })

    it('deve adicionar falha quando o array não contém o item', () => {
      // Arrange
      const item = 5

      // Act
      new ArrayValidator({ ITEMS }, failures).contains(item)

      // Assert
      expect(failures).toHaveLength(1)
      expect(failures[0].code).toBe(FailureCode.MISSING_REQUIRED_DATA)
    })

    it('deve usar o código de erro personalizado', () => {
      // Arrange
      const item = 5

      // Act
      new ArrayValidator({ ITEMS }, failures).contains(item, () => FAILURE)

      // Assert
      expect(failures).toHaveLength(1)
      expect(failures[0]).toEqual(FAILURE)
    })
  })

  describe('every', () => {
    const ITEMS = [2, 4, 6, 8]
    it('não deve adicionar falha quando todos os itens satisfazem a condição', () => {
      // Arrange
      const predicate = (item: number) => item % 2 === 0

      // Act
      new ArrayValidator({ ITEMS }, failures).every(predicate)

      // Assert
      expect(failures).toHaveLength(0)
    })

    it('deve adicionar falha quando algum item não satisfaz a condição', () => {
      // Arrange
      const testItems = [...ITEMS, 5]
      const predicate = (item: number) => item % 2 === 0

      // Act
      new ArrayValidator({ testItems }, failures).every(predicate)

      // Assert
      expect(failures).toHaveLength(1)
      expect(failures[0].code).toBe(FailureCode.CONTENT_WITH_INVALID_ITEMS)
    })

    it('deve usar a falha personalizada', () => {
      // Arrange
      const testItems = [...ITEMS, 5]
      const predicate = (item: number) => item % 2 === 0

      // Act
      new ArrayValidator({ testItems }, failures).every(predicate, () => FAILURE)

      // Assert
      expect(failures).toHaveLength(1)
      expect(failures[0]).toEqual(FAILURE)
    })
  })

  describe('some', () => {
    it('não deve adicionar falha quando pelo menos um item satisfaz a condição', () => {
      // Arrange
      const value = [1, 3, 5, 8]
      const predicate = (item: number) => item % 2 === 0

      // Act
      new ArrayValidator({ itens: value }, failures).some(predicate)

      // Assert
      expect(failures).toHaveLength(0)
    })

    const ITEMS = [3, 5, 7]

    it('deve adicionar falha quando nenhum item satisfaz a condição', () => {
      // Arrange
      const predicate = (item: number) => item % 2 === 0

      // Act
      new ArrayValidator({ ITEMS }, failures).some(predicate)

      // Assert
      expect(failures).toHaveLength(1)
      expect(failures[0].code).toBe(FailureCode.MISSING_VALID_ITEM)
    })

    it('deve usar o código de erro personalizado', () => {
      // Arrange
      const predicate = (item: number) => item % 2 === 0

      // Act
      new ArrayValidator({ ITEMS }, failures).some(predicate, () => FAILURE)

      // Assert
      expect(failures).toHaveLength(1)
      expect(failures[0]).toEqual(FAILURE)
    })
  })
})
