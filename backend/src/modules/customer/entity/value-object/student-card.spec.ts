import { StudentCard } from './student-card'
import { FailureCode } from '@shared/failure/failure.codes.enum'
import { TechnicalError } from '@shared/error/technical.error'
import { IStudentCardCommand } from '@modules/customer/interface/customer.command.interface'
import { faker } from '@faker-js/faker/.'
import { DateHelper } from '@shared/helper/date.helper'
import { CloneTestStudentCardWithOverrides, CreateTestStudentCard } from '@test/builder/student.card.builder'

describe('StudentCard', () => {
  const MIN_ID_LENGTH = 6
  const MAX_ID_LENGTH = 24
  const MAX_VALIDITY_DAY_IN_FUTURE = 360 * 2
  const MIN_INSTITUTION_LENGTH = 3
  const MAX_INSTITUTION_LENGTH = 100

  const createValidInput = (overrides: Partial<IStudentCardCommand> = {}): IStudentCardCommand => ({
    institution: faker.lorem.words(5),
    registrationNumber: 'VALID123',
    expirationDate: DateHelper.soon(30),
    ...overrides,
  })

  describe('create', () => {
    describe('deve criar um StudentCard válido', () => {
      const successCases = [
        {
          input: createValidInput(),
          scenario: 'com dados válidos padrão',
        },
        {
          input: createValidInput({ registrationNumber: 'A'.repeat(MIN_ID_LENGTH) }),
          scenario: 'com número de matrícula de comprimento mínimo',
        },
        {
          input: createValidInput({ registrationNumber: 'B'.repeat(MAX_ID_LENGTH) }),
          scenario: 'com número de matrícula de comprimento máximo',
        },
        {
          input: createValidInput({ expirationDate: DateHelper.soon(1) }),
          scenario: 'com data de expiração mínima no futuro',
        },
        {
          input: createValidInput({ expirationDate: DateHelper.soon(MAX_VALIDITY_DAY_IN_FUTURE - 1) }),
          scenario: 'com data de expiração próxima ao limite máximo no futuro',
        },
        {
          input: createValidInput({ institution: 'A'.repeat(MIN_INSTITUTION_LENGTH) }),
          scenario: 'com nome de instituição de comprimento mínimo',
        },
        {
          input: createValidInput({ institution: 'B'.repeat(MAX_INSTITUTION_LENGTH) }),
          scenario: 'com nome de instituição de comprimento máximo',
        },
      ]

      successCases.forEach(({ input, scenario }) => {
        it(`objeto StudentCard ${scenario}`, () => {
          // Act
          const result = StudentCard.create(input)

          // Assert
          expect(result).toBeValidResultMatching<StudentCard>((c) => {
            expect(c?.institution).toBe(input.institution)
            expect(c?.registrationNumber).toBe(input.registrationNumber)
            expect(c?.expirationDate.toISOString()).toBe(input.expirationDate.toISOString())
          })
        })
      })
    })

    describe('deve falhar ao criar um StudentCard inválido', () => {
      const failureCases = [
        {
          input: null as any,
          scenario: 'quando o input é nulo',
          errorCodeExpected: FailureCode.MISSING_REQUIRED_DATA,
        },
        {
          input: createValidInput({ institution: null as any }),
          scenario: 'quando a instituição é nula',
          errorCodeExpected: FailureCode.MISSING_REQUIRED_DATA,
        },
        {
          input: createValidInput({ registrationNumber: null as any }),
          scenario: 'quando o número de matrícula é nulo',
          errorCodeExpected: FailureCode.MISSING_REQUIRED_DATA,
        },
        {
          input: createValidInput({ expirationDate: null as any }),
          scenario: 'quando a data de expiração é nula',
          errorCodeExpected: FailureCode.MISSING_REQUIRED_DATA,
        },
        {
          input: createValidInput({
            registrationNumber: 'A'.repeat(MIN_ID_LENGTH - 1),
          }),
          scenario: 'quando o número de matrícula é muito curto',
          errorCodeExpected: FailureCode.STUDENT_CARD_ID_INVALID_FORMAT,
        },
        {
          input: createValidInput({ registrationNumber: 'B'.repeat(MAX_ID_LENGTH + 1) }),
          scenario: 'quando o número de matrícula é muito longo',
          errorCodeExpected: FailureCode.STUDENT_CARD_ID_INVALID_FORMAT,
        },
        {
          input: createValidInput({ expirationDate: DateHelper.recent(1) }),
          scenario: 'quando a data de expiração é no passado',
          errorCodeExpected: FailureCode.DATE_CANNOT_BE_PAST,
        },
        {
          input: createValidInput({ expirationDate: new Date() }),
          scenario: 'quando a data de expiração é hoje',
          errorCodeExpected: FailureCode.DATE_CANNOT_BE_PAST,
        },
        {
          input: createValidInput({ expirationDate: DateHelper.soon(MAX_VALIDITY_DAY_IN_FUTURE + 10) }),
          scenario: 'quando a data de expiração é muito distante no futuro',
          errorCodeExpected: FailureCode.DATE_NOT_AFTER_LIMIT,
        },
        {
          input: createValidInput({ institution: 'A'.repeat(MIN_INSTITUTION_LENGTH - 1) }),
          scenario: 'quando o nome da instituição é muito curto',
          errorCodeExpected: FailureCode.STRING_LENGTH_OUT_OF_RANGE,
        },
        {
          input: createValidInput({ institution: 'B'.repeat(MAX_INSTITUTION_LENGTH + 1) }),
          scenario: 'quando o nome da instituição é muito longo',
          errorCodeExpected: FailureCode.STRING_LENGTH_OUT_OF_RANGE,
        },
        {
          input: createValidInput({ institution: 'name with ä invalid chars' }),
          scenario: 'quando o nome da instituição contém caracteres inválidos',
          errorCodeExpected: FailureCode.STRING_WITH_INVALID_FORMAT,
        },
      ]

      failureCases.forEach(({ input, scenario, errorCodeExpected }) => {
        it(`falha ${scenario}`, () => {
          // Act
          const result = StudentCard.create(input)

          // Assert
          expect(result).toBeInvalidResultWithSingleFailure(errorCodeExpected)
        })
      })
    })
  })

  describe('hydrate', () => {
    it('deve hidratar um StudentCard com dados válidos', () => {
      // Arrange
      const input = createValidInput({
        institution: 'Instituto Tecnológico',
        registrationNumber: 'HYDRATE1',
        expirationDate: DateHelper.soon(60),
      })

      // Act
      const studentCard = StudentCard.hydrate(input)

      // Assert
      expect(studentCard).toBeInstanceOf(StudentCard)
      expect(studentCard.institution).toBe(input.institution)
      expect(studentCard.registrationNumber).toBe(input.registrationNumber)
      expect(studentCard.expirationDate.toISOString().split('T')[0]).toBe(
        input.expirationDate.toISOString().split('T')[0]
      )
    })

    it('deve lançar TechnicalError se o input for nulo', () => {
      expect(() => StudentCard.hydrate(null as any)).toThrow(TechnicalError)
    })

    it('deve lançar TechnicalError se a instituição for nula', () => {
      const input = createValidInput({ institution: null as any })
      expect(() => StudentCard.hydrate(input)).toThrow(TechnicalError)
    })

    it('deve lançar TechnicalError se o número de matrícula for nulo', () => {
      const input = createValidInput({ registrationNumber: null as any })
      expect(() => StudentCard.hydrate(input)).toThrow(TechnicalError)
    })

    it('deve lançar TechnicalError se a data de expiração for nula', () => {
      const input = createValidInput({ expirationDate: null as any })
      expect(() => StudentCard.hydrate(input)).toThrow(TechnicalError)
    })
  })

  describe('isValid', () => {
    it('deve retornar true para uma carteirinha com expiração futura', () => {
      // Arrange
      const studentCard = CreateTestStudentCard({ expirationDate: DateHelper.soon(5) })

      // Act & Assert
      expect(studentCard.isValid).toBe(true)
    })

    it('deve retornar false para uma carteirinha com expiração passada', () => {
      // Arrange
      const studentCard = CreateTestStudentCard({ expirationDate: DateHelper.recent(5) })

      // Act & Assert
      expect(studentCard.isValid).toBe(false)
    })

    it('deve retornar true para uma carteirinha com expiração hoje', () => {
      // Arrange
      const studentCard = CreateTestStudentCard({ expirationDate: new Date() })

      // Act & Assert
      expect(studentCard.isValid).toBe(true)
    })
  })

  describe('equals', () => {
    const card1 = CreateTestStudentCard({
      institution: 'Universidade A',
      registrationNumber: 'EQUALID1',
      expirationDate: DateHelper.soon(90),
    })

    it('deve retornar true para duas instâncias de StudentCard com mesmos dados', () => {
      // Arrange
      const card1Again = CloneTestStudentCardWithOverrides(card1, {})

      // Act
      expect(card1.equals(card1Again)).toBe(true)
    })

    it('deve retornar false para StudentCards com instituições diferentes', () => {
      // Arrange
      const cardDiffInstitution = CloneTestStudentCardWithOverrides(card1, { institution: 'Universidade B' })

      // Act & Assert
      expect(card1.equals(cardDiffInstitution)).toBe(false)
    })

    it('deve retornar false para StudentCards com números de matrícula diferentes', () => {
      // Arrange
      const cardDiffRegistration = CloneTestStudentCardWithOverrides(card1, { registrationNumber: 'EQUALID2' })

      // Act & Assert
      expect(card1.equals(cardDiffRegistration)).toBe(false)
    })

    it('deve retornar false para StudentCards com datas de expiração diferentes', () => {
      // Arrange
      const cardDiffExpiration = CloneTestStudentCardWithOverrides(card1, { expirationDate: DateHelper.soon(10) })

      // Act & Assert
      expect(card1.equals(cardDiffExpiration)).toBe(false)
    })

    it('deve retornar false ao comparar com null', () => {
      expect(card1.equals(null as any)).toBe(false)
    })

    it('deve retornar false ao comparar com undefined', () => {
      expect(card1.equals(undefined as any)).toBe(false)
    })

    it('deve retornar false ao comparar com um objeto de tipo diferente', () => {
      expect(
        card1.equals({
          institution: card1.institution,
          registrationNumber: card1.registrationNumber,
          expirationDate: card1.expirationDate,
        } as any)
      ).toBe(false)
    })
  })
})
