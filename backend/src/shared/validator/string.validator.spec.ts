import { SimpleFailure } from '../failure/simple.failure.type'
import { FailureFactory } from '../failure/failure.factory'
import { FailureCode } from '../failure/failure.codes.enum'
import { StringValidator } from './string.validator'
import { faker } from '@faker-js/faker'
import { v4, v7 } from 'uuid'
import { CaseSensitivityEnum } from '@shared/validator/enum/case.sensitivity.enum'

describe('StringValidator', () => {
  const VALUE = 'field'
  const FAILURE = FailureFactory.BOOKING_ALREADY_STARTED()

  let failures: SimpleFailure[]

  beforeEach(() => (failures = []))

  describe('isNotEmpty', () => {
    it('não deve adicionar falha quando a string não estiver vazia', () => {
      // Act
      new StringValidator({ VALUE }, failures).isNotEmpty()

      // Assert
      expect(failures).toHaveLength(0)
    })

    it('deve adicionar falha quando a string estiver vazia', () => {
      // Arrange
      const value = ''

      // Act
      new StringValidator({ test: value }, failures).isNotEmpty()

      // Assert
      expect(failures).toHaveLength(1)
      expect(failures[0].code).toBe(FailureCode.STRING_CANNOT_BE_EMPTY)
    })

    it('deve lidar com strings que contêm apenas espaços em branco', () => {
      // Arrange
      const value = '   '

      // Act
      new StringValidator({ value }, failures).isNotEmpty()

      // Assert
      expect(failures).toHaveLength(1)
      expect(failures[0].code).toBe(FailureCode.STRING_CANNOT_BE_EMPTY)
    })

    it('deve lidar com strings que contêm apenas caracteres de nova linha ou tabulação', () => {
      // Arrange
      const value = '\n\t\r'

      // Act
      new StringValidator({ test: value }, failures).isNotEmpty()

      // Assert
      expect(failures).toHaveLength(1)
      expect(failures[0].code).toBe(FailureCode.STRING_CANNOT_BE_EMPTY)
    })

    it('deve usar falha alternativa', () => {
      // Arrange
      const value = '  '

      // Act
      new StringValidator({ test: value }, failures).isNotEmpty(() => FAILURE)

      // Assert
      expect(failures).toHaveLength(1)
      expect(failures[0]).toBe(FAILURE)
    })
  })

  describe('hasContent', () => {
    it('não deve adicionar falha quando a string tiver conteúdo', () => {
      // Act
      new StringValidator({ VALUE }, failures).hasContent()

      // Assert
      expect(failures).toHaveLength(0)
    })

    it('não deve adicionar falha quando a string contém caracteres especiais', () => {
      // Arrange
      const value = "!@#$%^&*()_+{}|:<>?~`-=[]\\;',./"

      // Act
      new StringValidator({ value }, failures).hasContent()

      // Assert
      expect(failures).toHaveLength(0)
    })

    it('deve adicionar falha quando a string estiver em branco', () => {
      // Arrange
      const value = '   '

      // Act
      new StringValidator({ test: value }, failures).hasContent()

      // Assert
      expect(failures).toHaveLength(1)
      expect(failures[0].code).toBe(FailureCode.STRING_CANNOT_BE_BLANK)
    })

    it('deve usar falha personalizada', () => {
      // Arrange
      const value = '   '

      // Act
      new StringValidator({ test: value }, failures).hasContent(() => FAILURE)

      // Assert
      expect(failures).toHaveLength(1)
      expect(failures[0]).toEqual(FAILURE)
    })
  })

  describe('matchesPattern', () => {
    const PATTERN = /^[a-z0-9]+$/

    it('não deve adicionar falha quando a string corresponder ao padrão', () => {
      // Arrange
      const value = 'abc123'

      // Act
      new StringValidator({ valor: value }, failures).matchesPattern(PATTERN)

      // Assert
      expect(failures).toHaveLength(0)
    })

    it('deve adicionar falha quando a string não corresponder ao padrão', () => {
      // Arrange
      const value = 'abc@123'

      // Act
      new StringValidator({ value }, failures).matchesPattern(PATTERN)

      // Assert
      expect(failures).toHaveLength(1)
      expect(failures[0].code).toBe(FailureCode.STRING_WITH_INVALID_FORMAT)
    })

    it('deve usar falha personalizada', () => {
      // Arrange
      const value = 'abc@123'

      // Act
      new StringValidator({ valor: value }, failures).matchesPattern(PATTERN, () => FAILURE)

      // Assert
      expect(failures).toHaveLength(1)
      expect(failures[0]).toEqual(FAILURE)
    })
  })

  describe('isValidEmail', () => {
    it('não deve adicionar falha quando o email for válido', () => {
      // Arrange
      const email = faker.internet.email()

      // Act
      new StringValidator({ email }, failures).isValidEmail()

      // Assert
      expect(failures).toHaveLength(0)
    })

    it('deve adicionar falha quando o email for inválido', () => {
      // Arrange
      const email = 'email_invalido'

      // Act
      new StringValidator({ email }, failures).isValidEmail()

      // Assert
      expect(failures).toHaveLength(1)
      expect(failures[0].code).toBe(FailureCode.EMAIL_WITH_INVALID_FORMAT)
    })

    it('deve usar falha personalizada', () => {
      // Arrange
      const email = 'email_invalido'

      // Act
      new StringValidator({ email }, failures).isValidEmail(() => FAILURE)

      // Assert
      expect(failures).toHaveLength(1)
      expect(failures[0]).toEqual(FAILURE)
    })
  })

  describe('isValidUUIDv4', () => {
    it('não deve adicionar falha quando o UUID v4 for válido', () => {
      // Arrange
      const uid = v4()

      // Act
      new StringValidator({ uid }, failures).isValidUUIDv4()

      // Assert
      expect(failures).toHaveLength(0)
    })

    it('deve adicionar falha quando o UUID v4 for inválido', () => {
      // Arrange
      const uid = 'uuid_invalido'

      // Act
      new StringValidator({ uid }, failures).isValidUUIDv4()

      // Assert
      expect(failures).toHaveLength(1)
      expect(failures[0].code).toBe(FailureCode.UID_WITH_INVALID_FORMAT)
    })

    it('deve usar falha personalizada', () => {
      // Arrange
      const uid = 'uuid_invalido'

      // Act
      new StringValidator({ uid }, failures).isValidUUIDv4(() => FAILURE)

      // Assert
      expect(failures).toHaveLength(1)
      expect(failures[0]).toEqual(FAILURE)
    })
  })

  describe('isValidUUIDv7', () => {
    it('não deve adicionar falha quando o UUID v7 for válido', () => {
      // Arrange
      const uid = v7()

      // Act
      new StringValidator({ uid }, failures).isValidUUIDv7()

      // Assert
      expect(failures).toHaveLength(0)
    })

    it('deve adicionar falha quando o UUID v7 for inválido', () => {
      // Arrange
      const uid = 'uuid_invalido'

      // Act
      new StringValidator({ uid }, failures).isValidUUIDv7()

      // Assert
      expect(failures).toHaveLength(1)
      expect(failures[0].code).toBe(FailureCode.UID_WITH_INVALID_FORMAT)
    })

    it('deve usar o código de erro personalizado', () => {
      // Arrange
      const uid = 'uuid_invalido'

      // Act
      new StringValidator({ uid }, failures).isValidUUIDv7(() => FAILURE)

      // Assert
      expect(failures).toHaveLength(1)
      expect(failures[0]).toEqual(FAILURE)
    })
  })

  describe('hasLengthBetween', () => {
    it('não deve adicionar falha quando o comprimento da string estiver dentro do intervalo', () => {
      // Arrange
      const text = 'abcde'
      const min = 3
      const max = 7

      // Act
      new StringValidator({ text }, failures).hasLengthBetween(min, max)

      // Assert
      expect(failures).toHaveLength(0)
    })

    it('deve adicionar falha quando o comprimento da string for menor que o mínimo', () => {
      // Arrange
      const text = 'ab'
      const min = 3
      const max = 7

      // Act
      new StringValidator({ text }, failures).hasLengthBetween(min, max)

      // Assert
      expect(failures).toHaveLength(1)
      expect(failures[0].code).toBe(FailureCode.STRING_LENGTH_OUT_OF_RANGE)
    })

    it('deve adicionar falha quando o comprimento da string for maior que o máximo', () => {
      // Arrange
      const text = 'abcdefgh'
      const min = 3
      const max = 7

      // Act
      new StringValidator({ text }, failures).hasLengthBetween(min, max)

      // Assert
      expect(failures).toHaveLength(1)
      expect(failures[0].code).toBe(FailureCode.STRING_LENGTH_OUT_OF_RANGE)
    })

    it('deve usar falha personalizada', () => {
      // Arrange
      const text = 'ab'
      const min = 3
      const max = 7

      // Act
      new StringValidator({ text }, failures).hasLengthBetween(min, max, () => FAILURE)

      // Assert
      expect(failures).toHaveLength(1)
      expect(failures[0]).toEqual(FAILURE)
    })
  })

  describe('isInEnum', () => {
    enum ENUM {
      A = 'A',
      B = 'B',
      C = 'C',
    }

    it('não deve adicionar falha quando a string estiver não enum', () => {
      // Arrange
      const value = ENUM.A

      // Act
      new StringValidator({ enumValue: value }, failures).isInEnum(ENUM)

      // Assert
      expect(failures).toHaveLength(0)
    })

    it('não deve adicionar falha quando a string estiver no enum (case insensitive)', () => {
      // Arrange
      const value = 'a'

      // Act
      new StringValidator({ enumValue: value }, failures).isInEnum(ENUM, CaseSensitivityEnum.INSENSITIVE)

      // Assert
      expect(failures).toHaveLength(0)
    })

    it('deve adicionar falha quando a string não estiver no enum (case sensitive)', () => {
      // Arrange
      const value = 'a'

      // Act
      new StringValidator({ enumValue: value }, failures).isInEnum(ENUM, CaseSensitivityEnum.SENSITIVE)

      // Assert
      expect(failures).toHaveLength(1)
      expect(failures[0].code).toBe(FailureCode.INVALID_ENUM_VALUE)
    })

    it('deve adicionar falha quando a string não estiver no enum', () => {
      // Arrange
      const value = 'D'

      // Act
      new StringValidator({ enumValue: value }, failures).isInEnum(ENUM)

      // Assert
      expect(failures).toHaveLength(1)
      expect(failures[0].code).toBe(FailureCode.INVALID_ENUM_VALUE)
    })

    it('deve usar falha personalizada', () => {
      // Arrange
      const value = 'D'

      // Act
      new StringValidator({ enumValue: value }, failures).isInEnum(ENUM, CaseSensitivityEnum.INSENSITIVE, () => FAILURE)

      // Assert
      expect(failures).toHaveLength(1)
      expect(failures[0]).toEqual(FAILURE)
    })
  })

  describe('startsWith', () => {
    const PREFIX = 'test'

    it('não deve adicionar falha quando a string começa com o prefixo', () => {
      // Arrange
      const value = 'testtest'

      // Act
      new StringValidator({ value }, failures).startsWith(PREFIX)

      // Assert
      expect(failures).toHaveLength(0)
    })

    it('deve adicionar falha quando a string não começa com o prefixo', () => {
      // Arrange
      const value = 'prefix_test'
      // Act
      new StringValidator({ value }, failures).startsWith(PREFIX)

      // Assert
      expect(failures).toHaveLength(1)
      expect(failures[0].code).toBe(FailureCode.STRING_WITH_INVALID_FORMAT)
    })

    it('não deve adicionar falha quando a string começa com o prefixo (case insensitive)', () => {
      // Arrange
      const value = 'TESTE_prefixo'

      // Act
      new StringValidator({ value }, failures).startsWith(PREFIX, CaseSensitivityEnum.INSENSITIVE)

      // Assert
      expect(failures).toHaveLength(0)
    })

    it('deve adicionar falha quando a string não começa com o prefixo (case sensitive)', () => {
      // Arrange
      const value = 'TESTE_prefixo'

      // Act
      new StringValidator({ value }, failures).startsWith(PREFIX, CaseSensitivityEnum.SENSITIVE)

      // Assert
      expect(failures).toHaveLength(1)
      expect(failures[0].code).toBe(FailureCode.STRING_WITH_INVALID_FORMAT)
    })

    it('deve usar falha personalizada', () => {
      // Arrange
      const value = 'teste_prefixo'
      const prefix = 'prefixo'

      // Act
      new StringValidator({ text: value }, failures).startsWith(prefix, CaseSensitivityEnum.INSENSITIVE, () => FAILURE)

      // Assert
      expect(failures).toHaveLength(1)
      expect(failures[0]).toEqual(FAILURE)
    })
  })
})
