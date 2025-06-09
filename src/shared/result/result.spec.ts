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

describe('map', () => {
  it('deve transformar o valor de um resultado de sucesso', () => {
    // Arrange
    const result = success(5)
    const transform = (x: number) => x * 2

    // Act
    const mapped = result.map(transform)

    // Assert
    expect(mapped.isValid()).toBe(true)
    if (mapped.isValid()) {
      expect(mapped.value).toBe(10)
    }
  })

  it('deve preservar a falha sem aplicar a transformação', () => {
    // Arrange
    const failData: SimpleFailure = {
      code: FailureCode.MISSING_REQUIRED_DATA,
      details: { field: 'test' },
    }
    const result = failure(failData)
    const transform = (x: any) => x * 2

    // Act
    const mapped = result.map(transform)

    // Assert
    expect(mapped.isInvalid()).toBe(true)
    if (mapped.isInvalid()) {
      expect(mapped.failures).toEqual([failData])
    }
  })

  it('deve funcionar com transformações de tipo', () => {
    // Arrange
    const result = success(42)
    const transform = (x: number) => x.toString()

    // Act
    const mapped = result.map(transform)

    // Assert
    expect(mapped.isValid()).toBe(true)
    if (mapped.isValid()) {
      expect(mapped.value).toBe('42')
      expect(typeof mapped.value).toBe('string')
    }
  })
})

describe('flatMap', () => {
  it('deve aplicar uma função que retorna Result e achatar o resultado', () => {
    // Arrange
    const result = success(5)
    const transform = (x: number) => success(x * 2)

    // Act
    const flatMapped = result.flatMap(transform)

    // Assert
    expect(flatMapped).toBeValidResultWithValue(10)
  })

  it('deve retornar falha se a função de transformação retornar falha', () => {
    // Arrange
    const result = success(5)
    const failData: SimpleFailure = { code: FailureCode.INVALID_ENUM_VALUE }
    const transform = (x: number) => failure(failData)

    // Act
    const flatMapped = result.flatMap(transform)

    // Assert
    expect(flatMapped).toBeInvalidResultWithSingleFailure(failData.code)
  })

  it('deve preservar a falha original sem aplicar a transformação', () => {
    // Arrange
    const originalFailData: SimpleFailure = {
      code: FailureCode.MISSING_REQUIRED_DATA,
      details: { field: 'original' },
    }
    const result = failure(originalFailData)
    const transform = (x: any) => success(x * 2)

    // Act
    const flatMapped = result.flatMap(transform)

    // Assert
    expect(flatMapped).toBeInvalidResultWithSingleFailure(originalFailData.code)
  })

  it('deve funcionar com encadeamento de operações', () => {
    // Arrange
    const result = success(10)
    const divide = (x: number) =>
      x > 0
        ? success(x / 2)
        : failure({
            code: FailureCode.VALUE_NOT_POSITIVE,
            details: { value: x },
          })
    const toString = (x: number) => success(x.toString())

    // Act
    const chained = result.flatMap(divide).flatMap(toString)

    // Assert
    expect(chained).toBeValidResultWithValue('5')
  })
})

describe('fold', () => {
  it('deve aplicar a função de sucesso quando o resultado é válido', () => {
    // Arrange
    const result = success(42)
    const onSuccess = (value: number) => `Success: ${value}`
    const onFailure = (failures: readonly SimpleFailure[]) => `Error: ${failures.length} failures`

    // Act
    const folded = result.fold(onSuccess, onFailure)

    // Assert
    expect(folded).toBe('Success: 42')
  })

  it('deve aplicar a função de falha quando o resultado é inválido', () => {
    // Arrange
    const failData: SimpleFailure = {
      code: FailureCode.MISSING_REQUIRED_DATA,
      details: { field: 'test' },
    }
    const result = failure(failData)
    const onSuccess = (value: any) => `Success: ${value}`
    const onFailure = (failures: readonly SimpleFailure[]) => `Error: ${failures.length} failures`

    // Act
    const folded = result.fold(onSuccess, onFailure)

    // Assert
    expect(folded).toBe('Error: 1 failures')
  })

  it('deve funcionar com diferentes tipos de retorno', () => {
    // Arrange
    const successResult = success('hello')
    const failureResult = failure({ code: FailureCode.INVALID_ENUM_VALUE, details: {} })
    const toLength = (value: string) => value.length
    const toZero = (failures: readonly SimpleFailure[]) => 0

    // Act
    const successFolded = successResult.fold(toLength, toZero)
    const failureFolded = failureResult.fold(toLength, toZero)

    // Assert
    expect(successFolded).toBe(5)
    expect(failureFolded).toBe(0)
  })

  it('deve permitir tratamento específico de múltiplas falhas', () => {
    // Arrange
    const failures: SimpleFailure[] = [
      { code: FailureCode.MISSING_REQUIRED_DATA, details: { field: 'name' } },
      { code: FailureCode.INVALID_ENUM_VALUE, details: { field: 'type' } },
    ]
    const result = failure(failures)
    const onSuccess = (value: any) => 'success'
    const onFailure = (failures: readonly SimpleFailure[]) => failures.map((f) => f.details?.field).join(', ')

    // Act
    const folded = result.fold(onSuccess, onFailure)

    // Assert
    expect(folded).toBe('name, type')
  })
})

describe('mapAsync', () => {
  it('deve aplicar transformação assíncrona quando o resultado é válido', async () => {
    // Arrange
    const result = success(5)
    const asyncTransform = async (value: number) => value * 2

    // Act
    const transformedResult = await result.mapAsync(asyncTransform)

    // Assert
    expect(transformedResult).toBeValidResultWithValue(10)
  })

  it('deve preservar a falha sem aplicar a transformação assíncrona', async () => {
    // Arrange
    const failData: SimpleFailure = {
      code: FailureCode.MISSING_REQUIRED_DATA,
      details: { field: 'test' },
    }
    const result = failure(failData)
    const asyncTransform = async (value: any) => value * 2

    // Act
    const transformedResult = await result.mapAsync(asyncTransform)

    // Assert
    expect(transformedResult).toBeInvalidResultWithSingleFailure(failData.code)
  })

  it('deve funcionar com transformações de tipo assíncronas', async () => {
    // Arrange
    const result = success(42)
    const asyncTransform = async (x: number) => {
      await new Promise((resolve) => setTimeout(resolve, 10))
      return x.toString()
    }

    // Act
    const transformedResult = await result.mapAsync(asyncTransform)

    // Assert
    expect(transformedResult).toBeValidResultWithValue('42')
  })

  it('deve lidar com erros na função assíncrona', async () => {
    // Arrange
    const result = success(5)
    const asyncTransform = async (value: number) => {
      throw new Error('Async error')
    }

    // Act & Assert
    await expect(result.mapAsync(asyncTransform)).rejects.toThrow('Async error')
  })
})

describe('flatMapAsync', () => {
  it('deve aplicar transformação assíncrona que retorna Result quando o resultado é válido', async () => {
    // Arrange
    const result = success(5)
    const asyncTransform = async (value: number) => success(value * 2)

    // Act
    const transformedResult = await result.flatMapAsync(asyncTransform)

    // Assert
    expect(transformedResult).toBeValidResultWithValue(10)
  })

  it('deve retornar falha se a função de transformação assíncrona retornar falha', async () => {
    // Arrange
    const result = success(5)
    const failData: SimpleFailure = { code: FailureCode.INVALID_ENUM_VALUE }
    const asyncTransform = async (value: number) => failure(failData)

    // Act
    const transformedResult = await result.flatMapAsync(asyncTransform)

    // Assert
    expect(transformedResult).toBeInvalidResultWithSingleFailure(failData.code)
  })

  it('deve preservar a falha original sem aplicar a transformação assíncrona', async () => {
    // Arrange
    const originalFailData: SimpleFailure = {
      code: FailureCode.MISSING_REQUIRED_DATA,
      details: { field: 'original' },
    }
    const result = failure(originalFailData)
    const asyncTransform = async (value: any) => success(value * 2)

    // Act
    const transformedResult = await result.flatMapAsync(asyncTransform)

    // Assert
    expect(transformedResult).toBeInvalidResultWithSingleFailure(originalFailData.code)
  })

  it('deve funcionar com encadeamento de operações assíncronas', async () => {
    // Arrange
    const result = success(10)
    const asyncDivide = async (x: number) => {
      await new Promise((resolve) => setTimeout(resolve, 10))
      return x > 0
        ? success(x / 2)
        : failure({
            code: FailureCode.VALUE_NOT_POSITIVE,
            details: { value: x },
          })
    }
    const asyncToString = async (x: number) => {
      await new Promise((resolve) => setTimeout(resolve, 10))
      return success(x.toString())
    }

    // Act
    const chainedResult = await result
      .flatMapAsync(asyncDivide)
      .then((intermediateResult) => intermediateResult.flatMapAsync(asyncToString))

    // Assert
    expect(chainedResult).toBeValidResultWithValue('5')
  })

  it('deve lidar com erros na função assíncrona', async () => {
    // Arrange
    const result = success(5)
    const asyncTransform = async (value: number) => {
      throw new Error('Async flatMap error')
    }

    // Act & Assert
    await expect(result.flatMapAsync(asyncTransform)).rejects.toThrow('Async flatMap error')
  })
})

describe('tap', () => {
  it('deve executar efeito colateral quando o resultado é válido e retornar o resultado original', () => {
    // Arrange
    const result = success(42)
    let sideEffectValue: number | null = null
    const sideEffect = (value: number) => {
      sideEffectValue = value
    }

    // Act
    const tappedResult = result.tap(sideEffect)

    // Assert
    expect(sideEffectValue).toBe(42)
    expect(tappedResult).toBe(result) // Deve retornar o mesmo objeto
    expect(tappedResult).toBeValidResultWithValue(42)
  })

  it('deve não executar efeito colateral quando o resultado é falha', () => {
    // Arrange
    const failData: SimpleFailure = {
      code: FailureCode.MISSING_REQUIRED_DATA,
      details: { field: 'test' },
    }
    const result = failure(failData)
    let sideEffectExecuted = false
    const sideEffect = (value: any) => {
      sideEffectExecuted = true
    }

    // Act
    const tappedResult = result.tap(sideEffect)

    // Assert
    expect(sideEffectExecuted).toBe(false)
    expect(tappedResult).toBe(result) // Deve retornar o mesmo objeto
    expect(tappedResult).toBeInvalidResultWithSingleFailure(failData.code)
  })

  it('deve permitir encadeamento de múltiplos taps', () => {
    // Arrange
    const data = { id: 1, name: 'Test User' }
    const result = success(data)
    const auditLog: string[] = []
    const metrics = { userProcessed: 0 }

    const auditEffect = (user: { id: number; name: string }) => {
      auditLog.push(`User ${user.id} processed at ${new Date().toISOString()}`)
    }

    const metricsEffect = (user: { id: number; name: string }) => {
      metrics.userProcessed++
    }

    // Act
    const tappedResult = result.tap(auditEffect).tap(metricsEffect)

    // Assert
    expect(auditLog).toHaveLength(1)
    expect(auditLog[0]).toContain('User 1 processed at')
    expect(metrics.userProcessed).toBe(1)
    expect(tappedResult).toBeValidResultWithValue(data)
  })

  it('deve funcionar em encadeamento com map e flatMap', () => {
    // Arrange
    const result = success(5)
    let tappedValue: number | null = null
    const sideEffect = (value: number) => {
      tappedValue = value
    }

    // Act
    const chainedResult = result
      .tap(sideEffect)
      .map((x) => x * 2)
      .tap((value) => (tappedValue = value + 100))

    // Assert
    expect(tappedValue).toBe(110) // (5 * 2) + 100
    expect(chainedResult).toBeValidResultWithValue(10)
  })
})
