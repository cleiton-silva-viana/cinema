import { combine, failure, success } from './result'
import { SimpleFailure } from '../failure/simple.failure.type'
import { FailureCode } from '../failure/failure.codes.enum'

describe('success', () => {
  it('deve criar um objeto Result representando sucesso com o valor correto', () => {
    // Arrange
    const data: string = 'a simple data'

    // Act
    const result = success(data)

    // Assert
    expect(result.type).toBe('SUCCESS')
    if (result.isValid()) expect(result.value).toBe(data)
    else fail('Esperado que o resultado fosse um sucesso')
  })

  it("deve ter a propriedade 'failures' como indefinida em um resultado de sucesso (comportamento de objeto simples)", () => {
    // Arrange
    const data: string = 'successful data'
    const result = success(data)

    // Act & Assert
    expect((result as any).failures).toBeUndefined()
  })

  it('deve lidar com null ou undefined como um valor de sucesso', () => {
    // Arrange
    const datas: any[] = [null, undefined]

    // Act
    datas.forEach((data) => {
      const result = success(data)

      // Assert
      expect(result.type).toBe('SUCCESS')
      if (result.isValid()) expect(result.value).toBe(data)
      else fail('Esperado que o resultado fosse um sucesso')

      // Acessar (result as any).failures em um objeto de sucesso resultará em undefined.
      expect((result as any).failures).toBeUndefined()
    })
  })
})

describe('failure', () => {
  it('deve criar um objeto Result representando falha com um único erro', () => {
    // Arrange
    const failData: SimpleFailure = {
      code: FailureCode.ACTIVITY_DURATION_TOO_LONG,
      details: { field: 'field' },
    }

    // Act
    const result = failure(failData) // A função failure retorna Result<never>

    // Assert
    expect(result.type).toBe('FAILURE')
    if (result.isInvalid()) expect(result.failures).toEqual([failData])
    else fail('Esperado que o resultado fosse uma falha')
  })

  it("deve ter a propriedade 'value' como indefinida em um resultado de falha (comportamento de objeto simples)", () => {
    // Arrange
    const failData: SimpleFailure = { code: FailureCode.ACTIVITY_DURATION_TOO_LONG, details: {} } // Renomeado
    const result = failure(failData)

    // Act & Assert
    expect((result as any).value).toBeUndefined()
  })

  it('deve criar um objeto Result representando falha com múltiplos erros', () => {
    // Arrange
    const failsData: SimpleFailure[] = [
      // Renomeado
      { code: FailureCode.ACTIVITY_DURATION_TOO_LONG, details: { field: 'field1' } },
      { code: FailureCode.ACTIVITY_DURATION_TOO_SHORT, details: { reason: 'reason2' } },
    ]

    // Act
    const result = failure(failsData)

    // Assert
    expect(result.type).toBe('FAILURE')
    if (result.isInvalid()) expect(result.failures).toEqual(failsData)
    else fail('Esperado que o resultado fosse uma falha')

    // Acessar (result as any).value em um objeto de falha resultará em undefined.
    expect((result as any).value).toBeUndefined()
  })
})

describe('combine', () => {
  it('deve combinar resultados de sucesso de um array', () => {
    const r1 = success(1)
    const r2 = success('hello')
    const r3 = success(true)

    const combined = combine([r1, r2, r3])

    expect(combined.isValid()).toBe(true)
    if (combined.isValid()) {
      expect(combined.value).toEqual([1, 'hello', true])
    }
  })

  it('deve retornar uma falha se um dos resultados do array for falha', () => {
    const r1 = success(1)
    const r2 = failure({ code: FailureCode.MISSING_REQUIRED_DATA, details: { field: 'name' } })
    const r3 = success(true)

    const combined = combine([r1, r2, r3])

    expect(combined.isInvalid()).toBe(true)
    if (combined.isInvalid()) {
      expect(combined.failures).toEqual([{ code: FailureCode.MISSING_REQUIRED_DATA, details: { field: 'name' } }])
    }
  })

  it('deve retornar todas as falhas se múltiplos resultados do array forem falha', () => {
    const r1 = success(1)
    const r2 = failure({ code: FailureCode.INVALID_ENUM_VALUE_COUNT, details: { field: 'name' } })
    const r3 = failure({ code: FailureCode.INVALID_ENUM_VALUE, details: { id: '123' } })

    const combined = combine([r1, r2, r3])

    expect(combined.isInvalid()).toBe(true)
    if (combined.isInvalid()) {
      expect(combined.failures).toEqual([
        { code: FailureCode.INVALID_ENUM_VALUE_COUNT, details: { field: 'name' } },
        { code: FailureCode.INVALID_ENUM_VALUE, details: { id: '123' } },
      ])
    }
  })

  it('deve combinar resultados de sucesso de um objeto', () => {
    const r1 = success(1)
    const r2 = success('hello')
    const r3 = success(true)

    const combined = combine({ num: r1, str: r2, bool: r3 })

    expect(combined.isValid()).toBe(true)
    if (combined.isValid()) {
      expect(combined.value).toEqual({ num: 1, str: 'hello', bool: true })
    }
  })

  it('deve retornar uma falha se um dos resultados do objeto for falha', () => {
    const r1 = success(1)
    const r2 = failure({ code: FailureCode.MISSING_VALID_ITEM, details: { field: 'name' } })
    const r3 = success(true)

    const combined = combine({ num: r1, str: r2, bool: r3 })

    expect(combined.isInvalid()).toBe(true)
    if (combined.isInvalid()) {
      expect(combined.failures).toEqual([{ code: FailureCode.MISSING_VALID_ITEM, details: { field: 'name' } }])
    }
  })

  it('deve retornar todas as falhas se múltiplos resultados do objeto forem falha', () => {
    const r1 = success(1)
    const r2 = failure({ code: FailureCode.VALUE_MUST_BE_NEGATIVE, details: { field: 'name' } })
    const r3 = failure({ code: FailureCode.STRING_LENGTH_OUT_OF_RANGE, details: { id: '123' } })

    const combined = combine({ num: r1, str: r2, bool: r3 })

    expect(combined.isInvalid()).toBe(true)
    if (combined.isInvalid()) {
      expect(combined.failures).toEqual([
        { code: FailureCode.VALUE_MUST_BE_NEGATIVE, details: { field: 'name' } },
        { code: FailureCode.STRING_LENGTH_OUT_OF_RANGE, details: { id: '123' } },
      ])
    }
  })

  it('deve retornar um erro técnico se o parâmetro não for um objeto válido ou array', () => {
    expect(() => combine(undefined as any)).toThrow()
    expect(() => combine(123 as any)).toThrow()
    expect(() => combine('string' as any)).toThrow()
    expect(() => combine(true as any)).toThrow()
    expect(() => combine(null as any)).toThrow()
  })
})
