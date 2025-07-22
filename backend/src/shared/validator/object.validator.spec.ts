import { FailureCode } from '../failure/failure.codes.enum'
import { SimpleFailure } from '../failure/simple.failure.type'
import { ObjectValidator } from './object.validator'
import { FailureFactory } from '@shared/failure/failure.factory'

describe('ObjectValidator', () => {
  const PERSON = { name: 'test', age: 25 }
  const NON_EXISTENT_ATTRIBUTE = 'birthDate'
  const FAILURE = FailureFactory.VALUE_MUST_BE_NEGATIVE('', -1)

  let failures: SimpleFailure[]

  beforeEach(() => (failures = []))

  describe('hasProperty', () => {
    it('não deve adicionar falha quando o objeto tem a propriedade', () => {
      // Act
      new ObjectValidator({ PERSON }, failures).hasProperty('age')

      // Assert
      expect(failures).toHaveLength(0)
    })

    it('deve adicionar falha quando o objeto não tem a propriedade', () => {
      // Act
      new ObjectValidator({ PERSON }, failures).hasProperty(NON_EXISTENT_ATTRIBUTE as keyof typeof PERSON)

      // Assert
      expect(failures).toHaveLength(1)
      expect(failures[0].code).toBe(FailureCode.MISSING_REQUIRED_DATA)
    })

    it('deve usar falha personalizada', () => {
      // Act
      new ObjectValidator({ PERSON }, failures).hasProperty(
        NON_EXISTENT_ATTRIBUTE as keyof typeof PERSON,
        () => FAILURE
      )

      // Assert
      expect(failures).toHaveLength(1)
      expect(failures[0]).toEqual(FAILURE)
    })
  })

  describe('isNotEmpty', () => {
    it('não deve adicionar falha quando o objeto não está vazio', () => {
      // Act
      new ObjectValidator({ PERSON }, failures).isNotEmpty()

      // Assert
      expect(failures).toHaveLength(0)
    })

    it('deve adicionar falha quando o objeto está vazio', () => {
      // Arrange
      const obj = {}

      // Act
      new ObjectValidator({ obj }, failures).isNotEmpty()

      // Assert
      expect(failures).toHaveLength(1)
      expect(failures[0].code).toBe(FailureCode.MISSING_REQUIRED_DATA)
    })

    it('deve usar falha personalizada', () => {
      // Arrange
      const obj = {}

      // Act
      new ObjectValidator({ obj }, failures).isNotEmpty(() => FAILURE)

      // Assert
      expect(failures).toHaveLength(1)
      expect(failures[0]).toEqual(FAILURE)
    })
  })

  describe('optionalProperty', () => {
    it('não deve executar o validador quando a propriedade não existir', () => {
      // Arrange
      let wasExecuted = false

      // Act
      new ObjectValidator({ PERSON }, failures).optionalProperty(NON_EXISTENT_ATTRIBUTE, () => {
        wasExecuted = true
      })

      // Assert
      expect(wasExecuted).toBe(false)
      expect(failures).toHaveLength(0)
    })

    it('deve executar o validador quando a propriedade existir', () => {
      // Arrange
      let wasExecuted = false

      // Act
      new ObjectValidator({ PERSON }, failures).optionalProperty('age', () => {
        wasExecuted = true
      })

      // Assert
      expect(wasExecuted).toBe(true)
    })

    it('deve permitir encadeamento de validações', () => {
      // Arrange
      let executionsCounter = 0

      // Act
      new ObjectValidator({ PERSON }, failures)
        .optionalProperty('name', () => {
          executionsCounter++
        })
        .optionalProperty('age', () => {
          executionsCounter++
        })

      // Assert
      expect(executionsCounter).toBe(2)
    })
  })

  describe('property', () => {
    it('não deve executar o validador e deve adicionar falha quando a propriedade não existir', () => {
      // Arrange
      let wasExecuted = false

      // Act
      new ObjectValidator({ PERSON }, failures).property(NON_EXISTENT_ATTRIBUTE, () => {
        wasExecuted = true
      })

      // Assert
      expect(wasExecuted).toBe(false)
      expect(failures).toHaveLength(1)
      expect(failures[0].code).toBe(FailureCode.MISSING_REQUIRED_DATA)
    })

    it('deve executar o validador quando a propriedade existir', () => {
      // Arrange
      let wasExecuted = false

      // Act
      new ObjectValidator({ PERSON }, failures).property('age', () => {
        wasExecuted = true
      })

      // Assert
      expect(wasExecuted).toBe(true)
    })

    it('deve permitir encadeamento de validações', () => {
      // Arrange
      let executionsCounter = 0

      // Act
      new ObjectValidator({ PERSON }, failures)
        .property('name', () => {
          executionsCounter++
        })
        .property('age', () => {
          executionsCounter++
        })

      // Assert
      expect(executionsCounter).toBe(2)
    })

    it('deve adicionar falha quando o objeto for nulo ou indefinido', () => {
      // Act
      new ObjectValidator({ PERSON }, failures).property(NON_EXISTENT_ATTRIBUTE, () => {})

      // Assert
      expect(failures).toHaveLength(1)
      expect(failures[0].code).toBe(FailureCode.MISSING_REQUIRED_DATA)
    })
  })
})
