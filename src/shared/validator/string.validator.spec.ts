import { SimpleFailure } from '../failure/simple.failure.type'
import { FailureCode } from '../failure/failure.codes.enum'
import { StringValidator } from './string.validator'
import { faker } from '@faker-js/faker'
import { v4, v7 } from 'uuid'

describe('StringValidator', () => {
  const FIELD = 'field'
  const PERSONAL_CODE = FailureCode.CONTENT_WITH_INVALID_TYPE
  const PERSONAL_DETAILS = { message: 'mensagem personalizada...' }

  describe('isNotEmpty', () => {
    it('não deve adicionar falha quando a string não estiver vazia', () => {
      // Arrange
      const failures: SimpleFailure[] = []
      const value = 'teste'

      // Act
      new StringValidator({ test: value }, failures).isNotEmpty()

      // Assert
      expect(failures.length).toBe(0)
    })

    it('deve adicionar falha quando a string estiver vazia', () => {
      // Arrange
      const failures: SimpleFailure[] = []
      const value = ''

      // Act
      new StringValidator({ test: value }, failures).isNotEmpty()

      // Assert
      expect(failures.length).toBe(1)
      expect(failures[0].code).toBe(FailureCode.STRING_CANNOT_BE_EMPTY)
    })

    it('deve lidar com strings que contêm apenas espaços em branco', () => {
      // Arrange
      const failures: SimpleFailure[] = []
      const value = '   '

      // Act
      new StringValidator({ test: value }, failures).isNotEmpty()

      // Assert
      expect(failures.length).toBe(1)
      expect(failures[0].code).toBe(FailureCode.STRING_CANNOT_BE_EMPTY)
    })

    it('deve lidar com strings que contêm apenas caracteres de nova linha ou tabulação', () => {
      // Arrange
      const failures: SimpleFailure[] = []
      const value = '\n\t\r'

      // Act
      new StringValidator({ test: value }, failures).isNotEmpty()

      // Assert
      expect(failures.length).toBe(1)
      expect(failures[0].code).toBe(FailureCode.STRING_CANNOT_BE_EMPTY)
    })
  })

  describe('hasContent', () => {
    it('não deve adicionar falha quando a string tiver conteúdo', () => {
      // Arrange
      const failures: SimpleFailure[] = []
      const value = 'teste'

      // Act
      new StringValidator({ test: value }, failures).hasContent()

      // Assert
      expect(failures.length).toBe(0)
    })

    it('não deve adicionar falha quando a string contém caracteres especiais', () => {
      // Arrange
      const failures: SimpleFailure[] = []
      const value = "!@#$%^&*()_+{}|:<>?~`-=[]\\;',./"

      // Act
      new StringValidator({ test: value }, failures).hasContent()

      // Assert
      expect(failures.length).toBe(0)
    })

    it('deve adicionar falha quando a string estiver em branco', () => {
      // Arrange
      const failures: SimpleFailure[] = []
      const value = '   '

      // Act
      new StringValidator({ test: value }, failures).hasContent()

      // Assert
      expect(failures.length).toBe(1)
      expect(failures[0].code).toBe(FailureCode.STRING_CANNOT_BE_BLANK)
    })

    it('deve usar o código de erro personalizado', () => {
      // Arrange
      const failures: SimpleFailure[] = []
      const value = '   '
      const code = FailureCode.MISSING_REQUIRED_DATA

      // Act
      new StringValidator({ test: value }, failures).hasContent(code)

      // Assert
      expect(failures.length).toBe(1)
      expect(failures[0].code).toBe(code)
    })

    it('deve incluir detalhes na falha', () => {
      // Arrange
      const failures: SimpleFailure[] = []
      const value = '   '
      const details = { message: 'Campo não pode estar em branco' }

      // Act
      new StringValidator({ test: value }, failures).hasContent(FailureCode.STRING_CANNOT_BE_BLANK, details)

      // Assert
      expect(failures.length).toBe(1)
      expect(failures[0].details).toMatchObject(details)
    })
  })

  describe('matchesPattern', () => {
    it('não deve adicionar falha quando a string corresponder ao padrão', () => {
      // Arrange
      const failures: SimpleFailure[] = []
      const value = 'abc123'
      const pattern = /^[a-z0-9]+$/

      // Act
      new StringValidator({ valor: value }, failures).matchesPattern(pattern)

      // Assert
      expect(failures.length).toBe(0)
    })

    it('deve adicionar falha quando a string não corresponder ao padrão', () => {
      // Arrange
      const failures: SimpleFailure[] = []
      const value = 'abc@123'
      const pattern = /^[a-z0-9]+$/

      // Act
      new StringValidator({ valor: value }, failures).matchesPattern(pattern)

      // Assert
      expect(failures.length).toBe(1)
      expect(failures[0].code).toBe(FailureCode.STRING_INVALID_FORMAT)
    })

    it('deve usar o código de erro personalizado', () => {
      // Arrange
      const failures: SimpleFailure[] = []
      const value = 'abc@123'
      const pattern = /^[a-z0-9]+$/
      const code = FailureCode.CONTENT_WITH_INVALID_FORMAT

      // Act
      new StringValidator({ valor: value }, failures).matchesPattern(pattern, code)

      // Assert
      expect(failures.length).toBe(1)
      expect(failures[0].code).toBe(code)
    })

    it('deve incluir detalhes na falha', () => {
      // Arrange
      const failures: SimpleFailure[] = []
      const value = 'abc@123'
      const pattern = /^[a-z0-9]+$/
      const details = { message: 'Formato inválido' }

      // Act
      new StringValidator({ valor: value }, failures).matchesPattern(
        pattern,
        FailureCode.CONTENT_WITH_INVALID_FORMAT,
        details
      )

      // Assert
      expect(failures.length).toBe(1)
      expect(failures[0].details).toMatchObject(details)
    })
  })

  describe('isValidEmail', () => {
    it('não deve adicionar falha quando o email for válido', () => {
      // Arrange
      const failures: SimpleFailure[] = []
      const value = faker.internet.email()

      // Act
      new StringValidator({ email: value }, failures).isValidEmail()

      // Assert
      expect(failures.length).toBe(0)
    })

    it('deve adicionar falha quando o email for inválido', () => {
      // Arrange
      const failures: SimpleFailure[] = []
      const value = 'teste@example'

      // Act
      new StringValidator({ email: value }, failures).isValidEmail()

      // Assert
      expect(failures.length).toBe(1)
      expect(failures[0].code).toBe(FailureCode.EMAIL_WITH_INVALID_FORMAT)
    })

    it('deve usar o código de erro personalizado', () => {
      // Arrange
      const failures: SimpleFailure[] = []
      const value = 'teste@example'
      const code = FailureCode.UID_WITH_INVALID_FORMAT

      // Act
      new StringValidator({ email: value }, failures).isValidEmail(code)

      // Assert
      expect(failures.length).toBe(1)
      expect(failures[0].code).toBe(code)
    })

    it('deve incluir detalhes na falha', () => {
      // Arrange
      const failures: SimpleFailure[] = []
      const value = 'teste@example'
      const details = { message: 'Email inválido' }

      // Act
      new StringValidator({ email: value }, failures).isValidEmail(FailureCode.EMAIL_WITH_INVALID_FORMAT, details)

      // Assert
      expect(failures.length).toBe(1)
      expect(failures[0].details).toMatchObject(details)
    })
  })

  describe('isValidUUIDv4', () => {
    it('não deve adicionar falha quando o UUID v4 for válido', () => {
      // Arrange
      const failures: SimpleFailure[] = []
      const value = v4()

      // Act
      new StringValidator({ uuid: value }, failures).isValidUUIDv4()

      // Assert
      expect(failures.length).toBe(0)
    })

    it('deve adicionar falha quando o UUID v4 for inválido', () => {
      // Arrange
      const failures: SimpleFailure[] = []
      const value = v7()

      // Act
      new StringValidator({ uuid: value }, failures).isValidUUIDv4()

      // Assert
      expect(failures.length).toBe(1)
      expect(failures[0].code).toBe(FailureCode.UID_WITH_INVALID_FORMAT)
    })

    it('deve usar o código de erro personalizado', () => {
      // Arrange
      const failures: SimpleFailure[] = []
      const value = '123e4567-e89b-12d3-a456'
      const code = FailureCode.MISSING_REQUIRED_DATA

      // Act
      new StringValidator({ uuid: value }, failures).isValidUUIDv4(code)

      // Assert
      expect(failures.length).toBe(1)
      expect(failures[0].code).toBe(code)
    })

    it('deve incluir detalhes na falha', () => {
      // Arrange
      const failures: SimpleFailure[] = []
      const value = '123e4567-e89b-12d3-a456'
      const details = { message: 'UUID v4 inválido' }

      // Act
      new StringValidator({ uuid: value }, failures).isValidUUIDv4(FailureCode.UID_WITH_INVALID_FORMAT, details)

      // Assert
      expect(failures.length).toBe(1)
      expect(failures[0].details).toMatchObject(details)
    })
  })

  describe('isValidUUIDv7', () => {
    it('não deve adicionar falha quando o UUID v7 for válido', () => {
      // Arrange
      const failures: SimpleFailure[] = []
      const value = v7()

      // Act
      new StringValidator({ uuid: value }, failures).isValidUUIDv7()

      // Assert
      expect(failures.length).toBe(0)
    })

    it('deve adicionar falha quando o UUID v7 for inválido', () => {
      // Arrange
      const failures: SimpleFailure[] = []
      const value = v4()

      // Act
      new StringValidator({ uuid: value }, failures).isValidUUIDv7()

      // Assert
      expect(failures.length).toBe(1)
      expect(failures[0].code).toBe(FailureCode.UID_WITH_INVALID_FORMAT)
    })

    it('deve usar o código de erro personalizado', () => {
      // Arrange
      const failures: SimpleFailure[] = []
      const value = '123e4567-e89b-12d3-a456'
      const code = FailureCode.EMAIL_WITH_INVALID_FORMAT

      // Act
      new StringValidator({ id: value }, failures).isValidUUIDv7(code)

      // Assert
      expect(failures.length).toBe(1)
      expect(failures[0].code).toBe(code)
    })

    it('deve incluir detalhes na falha', () => {
      // Arrange
      const failures: SimpleFailure[] = []
      const value = '123e4567-e89b-12d3-a456'
      const details = { message: 'UUID v7 inválido' }

      // Act
      new StringValidator({ id: value }, failures).isValidUUIDv7(FailureCode.UID_WITH_INVALID_FORMAT, details)

      // Assert
      expect(failures.length).toBe(1)
      expect(failures[0].details).toMatchObject(details)
    })
  })

  describe('hasLengthBetween', () => {
    it('não deve adicionar falha quando o comprimento estiver dentro do intervalo', () => {
      // Arrange
      const failures: SimpleFailure[] = []
      const value = 'teste'
      const min = 3
      const max = 10

      // Act
      new StringValidator({ texto: value }, failures).hasLengthBetween(min, max)

      // Assert
      expect(failures.length).toBe(0)
    })

    it('deve adicionar falha quando o comprimento for menor que o mínimo', () => {
      // Arrange
      const failures: SimpleFailure[] = []
      const value = 'ab'
      const min = 3
      const max = 10

      // Act
      new StringValidator({ nome: value }, failures).hasLengthBetween(min, max)

      // Assert
      expect(failures.length).toBe(1)
      expect(failures[0].code).toBe(FailureCode.STRING_LENGTH_OUT_OF_RANGE)
      expect(failures[0].details?.length).toBe(value.length)
      expect(failures[0].details?.min).toBe(min)
      expect(failures[0].details?.max).toBe(max)
    })

    it('deve adicionar falha quando o comprimento for maior que o máximo', () => {
      // Arrange
      const failures: SimpleFailure[] = []
      const value = 'abcdefghijklmno'
      const min = 3
      const max = 10

      // Act
      new StringValidator({ texto: value }, failures).hasLengthBetween(min, max)

      // Assert
      expect(failures.length).toBe(1)
      expect(failures[0].code).toBe(FailureCode.STRING_LENGTH_OUT_OF_RANGE)
      expect(failures[0].details?.min).toBe(min)
      expect(failures[0].details?.max).toBe(max)
      expect(failures[0].details?.length).toBe(value.length)
    })

    it('deve usar o código de erro personalizado', () => {
      // Arrange
      const failures: SimpleFailure[] = []
      const value = 'ab'
      const min = 3
      const max = 10
      const code = FailureCode.MISSING_VALID_ITEM

      // Act
      new StringValidator({ nome: value }, failures).hasLengthBetween(min, max, code)

      // Assert
      expect(failures.length).toBe(1)
      expect(failures[0].code).toBe(code)
    })

    it('deve incluir detalhes adicionais na falha', () => {
      // Arrange
      const failures: SimpleFailure[] = []
      const value = 'ab'
      const min = 3
      const max = 10
      const details = { message: 'Tamanho inválido' }

      // Act
      new StringValidator({ nome: value }, failures).hasLengthBetween(
        min,
        max,
        FailureCode.STRING_LENGTH_OUT_OF_RANGE,
        details
      )

      // Assert
      expect(failures.length).toBe(1)
      expect(failures[0].details?.min).toBe(min)
      expect(failures[0].details?.max).toBe(max)
      expect(failures[0].details?.length).toBe(value.length)
    })
  })

  describe('isInEnum', () => {
    it('não deve adicionar falha quando o valor estiver no enum', () => {
      // Arrange
      const failures: SimpleFailure[] = []
      const enumType = { A: 'a', B: 'b', C: 'c' }
      const value = 'b'

      // Act
      new StringValidator({ valor: value }, failures).isInEnum(enumType)

      // Assert
      expect(failures.length).toBe(0)
    })

    it('deve adicionar falha quando o valor não estiver no enum', () => {
      // Arrange
      const failures: SimpleFailure[] = []
      const enumType = { A: 'a', B: 'b', C: 'c' }
      const value = 'd'

      // Act
      new StringValidator({ tipo: value }, failures).isInEnum(enumType)

      // Assert
      expect(failures.length).toBe(1)
      expect(failures[0].code).toBe(FailureCode.INVALID_ENUM_VALUE)
      expect(failures[0].details?.allowed_values).toEqual(Object.values(enumType))
    })

    it('deve usar o código de erro personalizado', () => {
      // Arrange
      const failures: SimpleFailure[] = []
      const enumType = { A: 'a', B: 'b', C: 'c' }
      const value = 'd'
      const code = FailureCode.CONTENT_WITH_INVALID_FORMAT

      // Act
      new StringValidator({ tipo: value }, failures).isInEnum(enumType, code)

      // Assert
      expect(failures.length).toBe(1)
      expect(failures[0].code).toBe(code)
    })

    it('deve incluir detalhes adicionais na falha', () => {
      // Arrange
      const failures: SimpleFailure[] = []
      const enumType = { A: 'a', B: 'b', C: 'c' }
      const value = 'd'
      const details = { message: 'Valor não permitido' }

      // Act
      new StringValidator({ tipo: value }, failures).isInEnum(enumType, FailureCode.INVALID_ENUM_VALUE, details)

      // Assert
      expect(failures.length).toBe(1)
      expect(failures[0].details?.allowed_values).toEqual(Object.values(enumType))
    })
  })

  describe('encadeamento de validações', () => {
    it('deve acumular falhas quando múltiplas validações falham', () => {
      // Arrange
      const failures: SimpleFailure[] = []
      const value = ''

      // Act
      new StringValidator({ test: value }, failures)
        .isNotEmpty()
        .continue()
        .hasContent()
        .continue()
        .hasLengthBetween(5, 10)

      // Assert
      expect(failures.length).toBe(3)
      expect(failures[0].code).toBe(FailureCode.STRING_CANNOT_BE_EMPTY)
      expect(failures[1].code).toBe(FailureCode.STRING_CANNOT_BE_BLANK)
      expect(failures[2].code).toBe(FailureCode.STRING_LENGTH_OUT_OF_RANGE)
    })

    it('deve parar de validar após o primeiro erro quando stopOnFirstFailure é usado', () => {
      // Arrange
      const failures: SimpleFailure[] = []
      const value = ''

      // Act
      new StringValidator({ test: value }, failures).isNotEmpty().hasContent().hasLengthBetween(5, 10)

      // Assert
      expect(failures.length).toBe(1)
      expect(failures[0].code).toBe(FailureCode.STRING_CANNOT_BE_EMPTY)
    })

    it('não deve lançar um erro quando um valor nulo é passado para um fluxo de validação', () => {
      // Arrange
      const failures: SimpleFailure[] = []
      const enumForTest = { A: 'a', B: 'b', C: 'c' }

      // Act
      new StringValidator({ test: null as any }, failures)
        .isNotEmpty()
        .hasContent()
        .isInEnum(enumForTest)
        .isValidEmail()
        .isValidUUIDv4()
        .isValidUUIDv7()
        .matchesPattern(/a-z/)
        .hasLengthBetween(5, 10)

      // Assert
      expect(failures.length).toBe(1)
      expect(failures[0].code).toBe(FailureCode.STRING_CANNOT_BE_EMPTY)
    })
  })

  describe('startsWith', () => {
    const PREFIX = 'APT'
    const VALUE_WITH_PREFIX = 'APTout'
    const VALUE_WITHOUT_PREFIX = 'out'

    it('não deve adicionar falha quando a string começa com o prefixo especificado', () => {
      // Arrange
      const failures: SimpleFailure[] = []

      // Act
      new StringValidator({ valor: VALUE_WITH_PREFIX }, failures).startsWith(PREFIX)

      // Assert
      expect(failures.length).toBe(0)
    })

    it('deve adicionar falha quando a string não começa com o prefixo especificado', () => {
      // Arrange
      const failures: SimpleFailure[] = []

      // Act
      new StringValidator({ [FIELD]: VALUE_WITHOUT_PREFIX }, failures).startsWith(PREFIX)

      // Assert
      expect(failures.length).toBe(1)
      expect(failures[0].code).toBe(FailureCode.STRING_INVALID_FORMAT)
      expect(failures[0].details?.field).toBe(FIELD)
    })

    it('deve usar o código de erro personalizado', () => {
      // Arrange
      const failures: SimpleFailure[] = []

      // Act
      new StringValidator({ [FIELD]: VALUE_WITHOUT_PREFIX }, failures).startsWith(PREFIX, PERSONAL_CODE)

      // Assert
      expect(failures.length).toBe(1)
      expect(failures[0].code).toBe(PERSONAL_CODE)
      expect(failures[0].details?.field).toBe(FIELD)
    })

    it('deve incluir detalhes adicionais na falha', () => {
      // Arrange
      const failures: SimpleFailure[] = []

      // Act
      new StringValidator({ [FIELD]: VALUE_WITHOUT_PREFIX }, failures).startsWith(
        PREFIX,
        FailureCode.STRING_INVALID_FORMAT,
        PERSONAL_DETAILS
      )

      // Assert
      expect(failures.length).toBe(1)
      expect(failures[0].details?.field).toBe(FIELD)
    })
  })
})
