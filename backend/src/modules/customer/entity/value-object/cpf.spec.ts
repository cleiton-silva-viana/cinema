import { CPF } from './cpf'
import { TechnicalError } from '@shared/error/technical.error'
import { FailureCode } from '@shared/failure/failure.codes.enum'

describe('CPF', () => {
  const VALID_CPF_1 = '123.456.789-90'
  const VALID_CPF_2 = '123.456.789-40'

  describe('create', () => {
    describe('deve criar um CPF válido', () => {
      const successCases = [
        { cpf: VALID_CPF_1, scenario: 'com formato válido' },
        { cpf: '987.654.321-23', scenario: 'com números válidos diferentes' },
      ]

      successCases.forEach(({ cpf, scenario }) => {
        it(`objeto CPF ${scenario}`, () => {
          // Act
          const result = CPF.create(cpf)

          // Assert
          expect(result).toBeValidResultMatching<CPF>((c) => {
            expect(c.value).toBe(cpf)
          })
        })
      })
    })

    it('deve falhar ao usar um valor vazio para criar um CPF', () => {
      // Act
      const result = CPF.create('    ')

      // Assert
      expect(result).toBeInvalidResultWithSingleFailure(FailureCode.MISSING_REQUIRED_DATA)
    })

    describe('deve falhar ao criar um CPF com valor inválido', () => {
      const failureCases = [
        {
          cpf: '123.456.789-0',
          scenario: 'quando CPF tem menos de 13 dígitos',
        },
        {
          cpf: '123.456.789.012-34',
          scenario: 'quando CPF tem mais de 13 dígitos',
        },
        {
          cpf: '123.456.789-bc',
          scenario: 'quando CPF contém caracteres não numéricos',
        },
        {
          cpf: '12345678990',
          scenario: 'quando CPF está sem formatação (apenas dígitos)',
        },
        {
          cpf: '123456789',
          scenario: 'quando CPF tem apenas 9 dígitos sem formatação',
        },
        {
          cpf: '123456789012',
          scenario: 'quando CPF tem 12 dígitos sem formatação',
        },
      ]

      failureCases.forEach(({ cpf, scenario }) => {
        it(`objeto CPF ${scenario}`, () => {
          // Act
          const result = CPF.create(cpf)

          // Assert
          expect(result).toBeInvalidResultWithSingleFailure(FailureCode.CPF_WITH_INVALID_FORMAT)
        })
      })
    })

    describe('deve falhar ao usar valores nulos para criar um criar um cpf', () => {
      const failureCases = [
        {
          cpf: null as unknown as string,
          scenario: 'quando CPF é nulo',
        },
        {
          cpf: undefined as unknown as string,
          scenario: 'quando CPF é indefinido',
        },
      ]

      failureCases.forEach(({ cpf, scenario }) => {
        it(scenario, () => {
          // Act
          const result = CPF.create(cpf)

          // Assert
          expect(result).toBeInvalidResultWithSingleFailure(FailureCode.MISSING_REQUIRED_DATA)
        })
      })
    })
  })

  describe('hydrate', () => {
    it('deve criar um objeto CPF sem validação com CPF formatado', () => {
      // Act
      const result = CPF.hydrate(VALID_CPF_1)

      // Assert
      expect(result).toBeInstanceOf(CPF)
      expect(result.value).toBe(VALID_CPF_1)
    })

    it('deve criar um objeto CPF e formatar um CPF sem formatação', () => {
      // Arrange
      const unformattedCpf = '12345678990'
      const expectedFormattedCpf = '123.456.789-90'

      // Act
      const result = CPF.hydrate(unformattedCpf)

      // Assert
      expect(result).toBeInstanceOf(CPF)
      expect(result.value).toBe(expectedFormattedCpf)
    })

    it('deve lançar um erro quando CPF é nulo ou indefinido', () => {
      // Arrange
      const values: Array<any> = [null, undefined]

      // Act & Assert
      values.forEach((value) => {
        expect(() => CPF.hydrate(value)).toThrow(TechnicalError)
      })
    })
  })

  describe('equal', () => {
    it('deve retornar verdadeiro quando CPFs são iguais', () => {
      // Arrange
      const result1 = CPF.hydrate(VALID_CPF_1)
      const result2 = CPF.hydrate(VALID_CPF_1)

      // Assert
      expect(result1.equal(result2)).toBe(true)
    })

    it('deve retornar falso quando CPFs são diferentes', () => {
      // Arrange
      const result1 = CPF.hydrate(VALID_CPF_1)
      const result2 = CPF.hydrate(VALID_CPF_2)

      // Assert
      expect(result1.equal(result2)).toBe(false)
    })

    it('deve retornar falso quando comparado com nulo', () => {
      // Arrange
      const result = CPF.hydrate(VALID_CPF_1)

      // Assert
      expect(result.equal(null as unknown as CPF)).toBe(false)
    })

    it('deve retornar falso quando comparado com objeto não-CPF', () => {
      // Arrange
      const result = CPF.hydrate(VALID_CPF_1)
      const notCPFObject = { value: VALID_CPF_1 }

      // Assert
      expect(result.equal(notCPFObject as unknown as CPF)).toBe(false)
    })
  })

  describe('unformattedValue', () => {
    it('deve retornar apenas os dígitos do CPF sem formatação', () => {
      // Arrange
      const cpf = CPF.hydrate('123.456.789-90')

      // Act
      const unformattedValue = cpf.unformattedValue

      // Assert
      expect(unformattedValue).toBe('12345678990')
    })

    it('deve retornar apenas dígitos mesmo com CPF diferente', () => {
      // Arrange
      const cpf = CPF.hydrate('987.654.321-23')

      // Act
      const unformattedValue = cpf.unformattedValue

      // Assert
      expect(unformattedValue).toBe('98765432123')
    })

    it('deve remover todos os caracteres não numéricos', () => {
      // Arrange
      const cpf = CPF.hydrate('000.000.000-00')

      // Act
      const unformattedValue = cpf.unformattedValue

      // Assert
      expect(unformattedValue).toBe('00000000000')
      expect(unformattedValue).toHaveLength(11)
    })
  })
})
