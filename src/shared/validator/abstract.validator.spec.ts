import { AbstractValidator } from './abstract.validator'
import { SimpleFailure } from '../failure/simple.failure.type'
import { FailureCode } from '../failure/failure.codes.enum'
import { FailureFactory } from '../failure/failure.factory'
import { FlowEnum } from './enum/flow.enum'

class TestValidator extends AbstractValidator<TestValidator> {
  constructor(value: Record<string, any>, failures: SimpleFailure[] = []) {
    super(value, failures)
  }

  getField(): string {
    return this._field
  }

  getFailures(): SimpleFailure[] {
    return this._failures
  }

  getFlowEnum(): FlowEnum {
    return this._flow
  }

  failures(failures: SimpleFailure[]): TestValidator {
    this._failures = failures
    return this
  }
}

describe('AbstractValidator', () => {
  const FIELD = { field: null }
  const FAILURE = FailureFactory.INVALID_FIELD_SIZE('field', 10, 20)
  let failures: SimpleFailure[]

  beforeEach(() => {
    failures = []
  })

  describe('constructor', () => {
    it('deve lançar TechnicalError se o número de chaves no objeto de dados for diferente de 1', () => {
      // Arrange
      const invalidData = { field1: 'value1', field2: 'value2' }

      // Act & Assert
      expect(() => new TestValidator(invalidData)).toHaveTechnicalErrorCode(
        FailureCode.VALIDATOR_WITH_INVALID_DATA_STRUCTURE
      )
    })

    it('não deve lançar TechnicalError se o número de chaves no objeto de dados for 1', () => {
      // Arrange
      const validData = { field1: 'value1' }

      // Act & Assert
      expect(() => new TestValidator(validData)).not.toThrowTechnicalError()
    })
  })

  describe('Métodos de configuração', () => {
    it('deve definir o nome do campo corretamente', () => {
      // Act
      const result = new TestValidator(FIELD)

      // Assert
      expect(result.getField()).toBe('field')
    })

    it('deve definir o array de falhas corretamente', () => {
      // Arrange
      const failures: SimpleFailure[] = []

      // Act
      const result = new TestValidator(FIELD).failures(failures)

      // Assert
      expect(result.getFailures()).toBe(failures)
    })

    it('deve definir o fluxo para parar quando a expressão for falsa', () => {
      // Arrange
      const validator = new TestValidator(FIELD)

      // Act
      const result = validator.if(false)

      // Assert
      expect(result.getFlowEnum()).toBe(FlowEnum.STOP)
    })

    it('deve definir o fluxo para continuar quando a expressão for verdadeira', () => {
      // Arrange
      const validator = new TestValidator(FIELD)

      // Act
      const result = validator.if(true)

      // Assert
      expect(result.getFlowEnum()).toBe(FlowEnum.STOP)
    })

    it('deve definir o fluxo para continuar mesmo após falhas', () => {
      // Arrange
      const validator = new TestValidator(FIELD)
      validator.if(false) // Define o fluxo para parar

      // Act
      const result = validator.continue()

      // Assert
      expect(result.getFlowEnum()).toBe(FlowEnum.CONTINUE)
    })
  })

  describe('then', () => {
    it('deve executar o validador quando não há falhas', () => {
      // Arrange
      let wasExecuted = false

      // Act
      new TestValidator(FIELD, failures).then(() => {
        wasExecuted = true
      })

      // Assert
      expect(wasExecuted).toBe(true)
    })

    it('não deve executar o validador quando há falhas', () => {
      // Arrange
      let wasExecuted = false

      // Act
      new TestValidator(FIELD, failures).isRequired().then(() => {
        wasExecuted = true
      })

      // Assert
      expect(wasExecuted).toBe(false)
      expect(failures).toHaveLength(1)
    })

    it('deve permitir encadeamento de validações', () => {
      // Arrange
      let executionsCounter = 0

      // Act
      new TestValidator(FIELD)
        .then(() => {
          executionsCounter++
        })
        .then(() => {
          executionsCounter++
        })

      // Assert
      expect(executionsCounter).toBe(2)
    })
  })

  describe('when', () => {
    it('deve executar o validador quando a condição for verdadeira', () => {
      // Arrange
      let wasExecuted = false

      // Act
      new TestValidator(FIELD).when(true, () => {
        wasExecuted = true
      })

      // Assert
      expect(wasExecuted).toBe(true)
    })

    it('não deve executar o validador quando a condição for falsa', () => {
      // Arrange
      let wasExecuted = false

      // Act
      new TestValidator(FIELD).when(false, () => {
        wasExecuted = true
      })

      // Assert
      expect(wasExecuted).toBe(false)
    })

    it('deve permitir encadeamento de validações', () => {
      // Arrange
      let executionsCounter = 0

      // Act
      new TestValidator(FIELD)
        .when(true, () => {
          executionsCounter++
        })
        .when(true, () => {
          executionsCounter++
        })

      // Assert
      expect(executionsCounter).toBe(2)
    })
  })

  describe('guard', () => {
    it('deve permitir validações subsequentes quando a expressão retornar true', () => {
      // Arrange
      let wasExecuted = false

      // Act
      new TestValidator(FIELD, failures)
        .guard(() => true)
        .then(() => {
          wasExecuted = true
        })

      // Assert
      expect(wasExecuted).toBe(true)
      expect(failures).toHaveLength(0)
    })

    it('deve impedir validações subsequentes quando a expressão retornar false', () => {
      // Arrange
      let wasExecuted = false

      // Act
      new TestValidator(FIELD, failures)
        .guard(() => false)
        .then(() => {
          wasExecuted = true
        })

      // Assert
      expect(wasExecuted).toBe(false)
      expect(failures).toHaveLength(0)
    })

    it('deve definir o fluxo para parar quando a expressão retornar false', () => {
      // Arrange
      const validator = new TestValidator(FIELD)

      // Act
      const result = validator.guard(() => false)

      // Assert
      expect(result.getFlowEnum()).toBe(FlowEnum.STOP)
    })

    it('deve marcar que há uma falha quando a expressão retornar false', () => {
      // Arrange
      const failures: SimpleFailure[] = []

      // Act
      new TestValidator(FIELD, failures).guard(() => false).isRequired() // Esta validação não deve ser executada

      // Assert
      expect(failures).toHaveLength(0) // Não deve adicionar falhas, apenas impedir validações subsequentes
    })

    it('deve permitir encadeamento de validações quando a expressão retornar true', () => {
      // Arrange
      let executionsCounter = 0

      // Act
      new TestValidator(FIELD)
        .guard(() => true)
        .then(() => executionsCounter++)
        .guard(() => true)
        .then(() => executionsCounter++)

      // Assert
      expect(executionsCounter).toBe(2)
    })
  })

  describe('isRequired', () => {
    it('não deve adicionar falha quando o valor não for nulo ou indefinido', () => {
      // Act
      new TestValidator(FIELD).isRequired()

      // Assert
      expect(failures).toHaveLength(0)
    })

    describe('casos com valores nulos', () => {
      const failureCases = [
        {
          scenario: 'quando o valor for nulo',
          value: { field: null },
        },
        {
          scenario: 'quando o valor for indefinido',
          value: { field: undefined },
        },
      ]

      failureCases.forEach(({ scenario, value }) => {
        it(`deve adicionar falha ${scenario}`, () => {
          // Act
          new TestValidator(value, failures).isRequired()

          // Assert
          expect(failures).toHaveLength(1)
          expect(failures[0].code).toBe(FailureCode.MISSING_REQUIRED_DATA)
        })
      })
    })

    describe('casos com valores falsy e códigos failures personalizadas', () => {
      const failureCases = [
        {
          scenario: 'quando o valor for nulo',
          value: { field: null },
        },
        {
          scenario: 'quando o valor for indefinido',
          value: { field: undefined },
        },
      ]

      failureCases.forEach(({ scenario, value }) => {
        it(`deve adicionar falha ${scenario}`, () => {
          // Act
          new TestValidator(value, failures).isRequired(() => FAILURE)

          // Assert
          expect(failures).toHaveLength(1)
          expect(failures[0]).toEqual(FAILURE)
        })
      })
    })
  })

  describe('isEqualTo', () => {
    const VALUE_A = { field: 'aaa' }
    const VALUE_B = { target: 'bbb' }

    it('deve validar corretamente igualdade de valores quando os valores forem iguais', () => {
      // Arrange
      const target = { ...VALUE_A }

      // Act
      new TestValidator(VALUE_A, failures).isEqualTo(target)

      // Assert
      expect(failures).toHaveLength(0)
    })

    it('deve falhar quando valores não forem iguais', () => {
      // Act
      new TestValidator(VALUE_A, failures).isEqualTo(VALUE_B)

      // Assert
      expect(failures).toHaveLength(1)
      expect(failures[0].code).toBe(FailureCode.VALUES_NOT_EQUAL)
    })

    it('deve falhar e retornar o código de erro alternativo', () => {
      // Act
      new TestValidator(VALUE_A, failures).isEqualTo(VALUE_B, () => FAILURE)

      // Assert
      expect(failures).toHaveLength(1)
      expect(failures[0]).toEqual(FAILURE)
    })
  })

  describe('isTrue', () => {
    it('não deve adicionar falha quando a expressão for verdadeira', () => {
      // Act
      new TestValidator(FIELD, failures).isTrue(true, () => FAILURE)

      // Assert
      expect(failures).toHaveLength(0)
    })

    it('deve adicionar falha quando a expressão for falsa', () => {
      // Act
      new TestValidator(FIELD, failures).isTrue(false, () => FAILURE)

      // Assert
      expect(failures).toHaveLength(1)
      expect(failures[0]).toEqual(FAILURE)
    })
  })

  describe('Fluxo de validação', () => {
    it('deve ignorar as validações quando if for false', () => {
      // Act
      new TestValidator(FIELD, failures).if(false).isRequired()

      //Assert
      expect(failures).toHaveLength(0)
    })

    it('deve parar a validação após a primeira falha quando o fluxo for stop', () => {
      // Act
      new TestValidator(FIELD, failures).isRequired().isRequired().isRequired()

      // Assert
      expect(failures).toHaveLength(1)
    })

    it('deve continuar a validação quando o fluxo for continue', () => {
      // Act
      new TestValidator(FIELD, failures).isRequired().continue().isRequired().isRequired()

      // Assert
      expect(failures).toHaveLength(2)
    })
  })
})
