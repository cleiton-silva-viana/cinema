import { failure, success } from './result'
import { SimpleFailure } from '../failure/simple.failure.type'
import { FailureCode } from '../failure/failure.codes.enum'

describe('Result', () => {
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
})
