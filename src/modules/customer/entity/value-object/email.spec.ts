import { Email } from './email'
import { FailureCode } from '@shared/failure/failure.codes.enum'
import { SimpleFailure } from '@shared/failure/simple.failure.type'
import { validateAndCollect } from '@shared/validator/common.validators'
import { faker } from '@faker-js/faker'

describe('Email', () => {
  const EMAIL_STRING = faker.internet.email()

  describe('create', () => {
    let failures: SimpleFailure[]

    beforeEach(() => {
      failures = []
    })

    describe('deve criar um email válido', () => {
      const successCases = [
        { email: 'test@example.com', scenario: 'com formato padrão' },
        {
          email: 'user.name@domain.com',
          scenario: 'com pontos na parte local',
        },
        { email: 'user+tag@example.org', scenario: 'com tag de adição' },
        {
          email: 'user@subdomain.example.co.uk',
          scenario: 'com subdomínio e TLD de país',
        },
      ]

      successCases.forEach(({ email, scenario }) => {
        it(`objeto Email ${scenario}`, () => {
          // Act
          const result = validateAndCollect(Email.create(email), failures)

          // Assert
          expect(result).toBeDefined()
          expect(result.value).toBe(email)
        })
      })
    })

    it('deve falhar ao usar um valor vazio para criar um Email', () => {
      // Act
      const result = validateAndCollect(Email.create(''), failures)

      // Assert
      expect(result).toBeNull()
      expect(failures[0].code).toBe(FailureCode.MISSING_REQUIRED_DATA)
    })

    describe('deve falhar ao criar um Email com formato inválido', () => {
      const failureCases = [
        {
          email: 'plainaddress',
          scenario: 'quando email não tem símbolo @',
        },
        {
          email: '@missingusername.com',
          scenario: 'quando email não tem nome de usuário',
        },
        {
          email: 'user@',
          scenario: 'quando email não tem domínio',
        },
        {
          email: 'user@.com',
          scenario: 'quando email não tem nome de domínio',
        },
        {
          email: 'user@domain,com',
          scenario: 'quando email tem caractere inválido no domínio',
        },
      ]

      failureCases.forEach(({ email, scenario }) => {
        it(`objeto Email ${scenario}`, () => {
          // Act
          const result = validateAndCollect(Email.create(email), failures)

          // Assert
          expect(result).toBeNull()
          expect(failures.length).toBe(1)
          expect(failures[0].code).toBe(FailureCode.EMAIL_WITH_INVALID_FORMAT)
        })
      })
    })

    describe('deve falhar ao usar valores nulos para criar um Email', () => {
      const failureCases = [
        {
          email: null as unknown as string,
          scenario: 'quando email é nulo',
        },
        {
          email: undefined as unknown as string,
          scenario: 'quando email é indefinido',
        },
      ]

      failureCases.forEach(({ email, scenario }) => {
        it(scenario, () => {
          // Act
          const result = validateAndCollect(Email.create(email), failures)

          // Assert
          expect(result).toBeNull()
          expect(failures.length).toBe(1)
          expect(failures[0].code).toBe(FailureCode.MISSING_REQUIRED_DATA)
        })
      })
    })
  })

  describe('hydrate', () => {
    it('deve criar um objeto Email sem validação', () => {
      // Act
      const hydratedEmail = Email.hydrate(EMAIL_STRING)

      // Assert
      expect(hydratedEmail).toBeInstanceOf(Email)
      expect(hydratedEmail.value).toBe(EMAIL_STRING)
    })

    it('deve lançar TechnicalError quando email é nulo ou indefinido', () => {
      // Arrange
      const values: Array<any> = [null, undefined]

      // Act & Assert
      values.forEach((value) => {
        expect(() => {
          Email.hydrate(value)
        }).toThrow(FailureCode.MISSING_REQUIRED_DATA)
      })
    })
  })

  describe('equal', () => {
    it('deve retornar verdadeiro quando emails são iguais', () => {
      // Arrange
      const result1 = Email.hydrate(EMAIL_STRING)
      const result2 = Email.hydrate(EMAIL_STRING)

      // Assert
      expect(result1.equal(result2)).toBe(true)
    })

    it('deve retornar falso quando emails são diferentes', () => {
      // Arrange
      const result1 = Email.hydrate(EMAIL_STRING)
      const result2 = Email.hydrate(faker.internet.email())

      // Assert
      expect(result1.equal(result2)).toBe(false)
    })

    it('deve retornar falso quando comparado com nulo', () => {
      // Arrange
      const result = Email.hydrate(EMAIL_STRING)

      // Assert
      expect(result.equal(null as unknown as Email)).toBe(false)
    })

    it('deve retornar falso quando comparado com objeto não-Email', () => {
      // Arrange
      const result = Email.hydrate(EMAIL_STRING)
      const notEmailObject = { value: EMAIL_STRING }

      // Assert
      expect(result.equal(notEmailObject as unknown as Email)).toBe(false)
    })
  })
})
