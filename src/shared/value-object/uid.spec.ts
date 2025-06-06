import { UID } from './uid'
import { v4, v7 } from 'uuid'
import { TechnicalError } from '../error/technical.error'
import { FailureCode } from '../failure/failure.codes.enum'

const PREFIX = 'TEST'
const SEPARATOR = '.'

class TestUID extends UID {
  protected static readonly PREFIX: string = PREFIX

  protected static readonly SEPARATOR: string = SEPARATOR
}

describe('UID', () => {
  const UID_STRING = `${PREFIX}${SEPARATOR}${v7()}`

  describe('create', () => {
    it('deve criar um UID válido com UUID v7', () => {
      // Act
      const uid = TestUID.create()

      // Assert
      expect(uid).toBeInstanceOf(TestUID)
      expect(uid.value).toMatch(/^test\.[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
    })
  })

  describe('parse', () => {
    describe('deve criar um válido', () => {
      it('objeto UID a partir de uma string válida', () => {
        // Act
        const result = TestUID.parse(UID_STRING)

        // Assert
        expect(result).toBeValidResultMatching<UID>((uid) => uid.value === UID_STRING)
      })
    })

    describe('deve falhar ao usar valores nulos para criar um UID', () => {
      const failureCases = [
        {
          value: null as unknown as string,
          scenario: 'quando UID é nulo',
        },
        {
          value: undefined as unknown as string,
          scenario: 'quando UID é indefinido',
        },
      ]

      failureCases.forEach(({ value, scenario }) => {
        it(scenario, () => {
          // Act
          const result = TestUID.parse(value)

          // Assert
          expect(result).toBeInvalidResultWithSingleFailure(FailureCode.MISSING_REQUIRED_DATA)
        })
      })
    })

    it('deve falhar ao usar um valor vazio para criar um UID', () => {
      // Act
      const result = TestUID.parse('     ')

      // Assert
      expect(result).toBeInvalidResultWithSingleFailure(FailureCode.STRING_CANNOT_BE_EMPTY)
    })

    describe('deve falhar ao criar um UID com formato inválido', () => {
      const failureCases = [
        {
          value: `wrongprefix.${v7()}`,
          scenario: 'quando UID tem prefixo errado',
        },
        {
          value: `test.${v4()}`,
          scenario: 'quando UID tem parte uuid errada',
        },
        {
          value: 'test.invalid-uuid',
          scenario: 'quando parte UUID é inválida',
        },
        {
          value: 'test.1234',
          scenario: 'quando UID tem comprimento errado',
        },
      ]

      failureCases.forEach(({ value, scenario }) => {
        it(`objeto UID ${scenario}`, () => {
          // Act
          const result = TestUID.parse(value)

          // Assert
          expect(result).toBeInvalidResultWithSingleFailure(FailureCode.UID_WITH_INVALID_FORMAT)
        })
      })
    })
  })

  describe('hydrate', () => {
    it('deve criar um objeto UID sem validação', () => {
      // Act
      const hydratedUID = TestUID.hydrate(UID_STRING)

      // Assert
      expect(hydratedUID).toBeInstanceOf(TestUID)
      expect(hydratedUID.value).toBe(UID_STRING)
    })

    it('deve extrair a parte UUID corretamente mesmo com formato inválido', () => {
      // Arrange
      const invalidUuid = `TEST.invalid-uuid`

      // Act
      const hydratedUID = TestUID.hydrate(invalidUuid)

      // Assert
      expect(hydratedUID).toBeInstanceOf(TestUID)
      expect(hydratedUID.value).toBe(invalidUuid)
    })

    it('deve lançar erro', () => {
      expect(() => TestUID.hydrate(null as unknown as string)).toThrow(TechnicalError)
    })
  })

  describe('equal', () => {
    it('deve retornar verdadeiro quando UIDs são iguais', () => {
      // Arrange
      const uid1 = TestUID.hydrate(UID_STRING)
      const uid2 = TestUID.hydrate(UID_STRING)

      // Assert
      expect(uid1.equal(uid2)).toBe(true)
    })

    it('deve retornar falso quando UIDs são diferentes', () => {
      // Arrange
      const uid1 = TestUID.create()
      const uid2 = TestUID.create()

      // Assert
      expect(uid1.equal(uid2)).toBe(false)
    })

    it('deve retornar falso quando comparado com nulo', () => {
      // Arrange
      const uid = TestUID.create()

      // Assert
      expect(uid.equal(null as unknown as UID)).toBe(false)
    })

    it('deve retornar falso quando comparado com objeto não-UID', () => {
      // Arrange
      const uid = TestUID.create()
      const notUIDObject = { value: uid.value }

      // Assert
      expect(uid.equal(notUIDObject as any)).toBe(false)
    })
  })
})
