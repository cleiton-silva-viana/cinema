import { HttpStatus } from '@nestjs/common'
import { SimpleFailure } from './simple.failure.type'
import { FailureMapper } from './failure.mapper'
import { FailureMessageConfig } from './failure.message.provider'
import { IFailureMessageProvider } from './failure.message.provider.interface'
import { FailureCode } from './failure.codes.enum'

const ERRO_PADRAO = 'VALIDATION_ERROR' as FailureCode
const ERRO_NAO_ENCONTRADO = 'RESOURCE_NOT_FOUND' as FailureCode
const ERRO_TEMPLATE = 'TEMPLATE_ERROR' as FailureCode
const ERRO_DESCONHECIDO = 'UNKNOWN_ERROR_CODE' as FailureCode

describe('FailureMapper', () => {
  const mockMessageProvider: IFailureMessageProvider = {
    getMessageConfig: jest.fn().mockImplementation((code: string): FailureMessageConfig => {
      const mockMessages: Record<string, FailureMessageConfig> = {
        [ERRO_PADRAO]: {
          title: {
            pt: 'Erro de validação',
            en: 'Validation error',
          },
          template: {
            pt: 'Os dados fornecidos falharam na validação.',
            en: 'The provided data failed validation.',
          },
          statusCode: HttpStatus.BAD_REQUEST,
        },
        [ERRO_NAO_ENCONTRADO]: {
          title: {
            pt: 'Recurso não encontrado',
            en: 'Resource not found',
          },
          template: {
            pt: 'O recurso solicitado não foi encontrado.',
            en: 'The requested resource was not found.',
          },
          statusCode: HttpStatus.NOT_FOUND,
        },
        [ERRO_TEMPLATE]: {
          title: {
            pt: 'Erro de template',
            en: 'Template error',
          },
          template: {
            pt: 'Erro no campo {field} com valor {value}.',
            en: 'Error in field {field} with value {value}.',
          },
          statusCode: HttpStatus.BAD_REQUEST,
        },
        [ERRO_DESCONHECIDO]: {
          title: {
            pt: 'Erro não catalogado',
            en: 'Uncatalogued error',
          },
          template: {
            pt: 'Ocorreu um erro não catalogado',
            en: 'An uncatalogued error occurred',
          },
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        },
      }

      return mockMessages[code] || mockMessages[ERRO_DESCONHECIDO]
    }),
  }

  let mapper: FailureMapper

  beforeEach(() => {
    FailureMapper.setMessageProvider(mockMessageProvider)
    mapper = FailureMapper.getInstance()
  })

  afterEach(() => {
    FailureMapper.reset()
    jest.clearAllMocks()
  })

  it('deve converter um SimpleFailure para RichFailureType com a estrutura correta', () => {
    // Arrange
    const simpleFailure: SimpleFailure = {
      code: ERRO_NAO_ENCONTRADO,
      details: {
        field: 'customer',
        value: '123',
      },
    }

    // Act
    const richFailure = mapper.toRichFailure(simpleFailure)

    // Assert
    expect(mockMessageProvider.getMessageConfig).toHaveBeenCalledWith(ERRO_NAO_ENCONTRADO)
    expect(richFailure).toHaveProperty('code', simpleFailure.code)
    expect(richFailure).toHaveProperty('status', HttpStatus.NOT_FOUND)
    expect(richFailure).toHaveProperty('title')
    expect(richFailure).toHaveProperty('message')
  })

  it('deve respeitar o parâmetro de idioma ao converter falhas', () => {
    // Arrange
    const simpleFailure: SimpleFailure = {
      code: ERRO_PADRAO,
      details: { field: 'email' },
    }

    // Act
    const ptFailure = mapper.toRichFailure(simpleFailure, 'pt')
    const enFailure = mapper.toRichFailure(simpleFailure, 'en')

    // Assert
    expect(ptFailure.title).toBeDefined()
    expect(enFailure.title).toBeDefined()
    expect(enFailure.title).not.toBe(ptFailure.title)
    expect(ptFailure.message).toBeDefined()
    expect(enFailure.message).toBeDefined()
    expect(enFailure.message).not.toBe(ptFailure.message)
  })

  it('deve fornecer um status e título padrão para códigos de erro desconhecidos', () => {
    // Arrange
    const simpleFailure: SimpleFailure = {
      code: 'CODIGO_INEXISTENTE' as FailureCode,
      details: { reason: 'Algo deu errado' },
    }

    // Act
    const richFailure = mapper.toRichFailure(simpleFailure)

    // Assert
    expect(richFailure.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR)
  })

  it('deve formatar corretamente mensagens com placeholders usando os detalhes fornecidos', () => {
    // Arrange
    const simpleFailure: SimpleFailure = {
      code: ERRO_TEMPLATE,
      details: {
        field: 'email',
        value: 'invalid@example',
      },
    }

    // Act
    const richFailure = mapper.toRichFailure(simpleFailure)

    // Assert
    expect(richFailure.message).toBe('Erro no campo email com valor invalid@example.')
  })

  it('deve converter múltiplas falhas preservando suas propriedades individuais', () => {
    // Arrange
    const failures: SimpleFailure[] = [
      {
        code: ERRO_PADRAO,
        details: { field: 'email' },
      },
      {
        code: ERRO_NAO_ENCONTRADO,
        details: { resource: 'user' },
      },
    ]

    // Act
    const richFailures = mapper.toRichFailures(failures)

    // Assert
    expect(richFailures).toHaveLength(2)
    expect(richFailures[0].code).toBe(failures[0].code)
    expect(richFailures[1].code).toBe(failures[1].code)
    expect(richFailures[0].status).toBe(HttpStatus.BAD_REQUEST)
    expect(richFailures[1].status).toBe(HttpStatus.NOT_FOUND)
  })

  it('deve retornar um array vazio ao converter um array vazio de falhas', () => {
    // Act
    const richFailures = mapper.toRichFailures([])

    // Assert
    expect(richFailures).toEqual([])
    expect(mockMessageProvider.getMessageConfig).not.toHaveBeenCalled()
  })

  it('deve garantir que a instância do singleton seja única', () => {
    // Act
    const instance1 = FailureMapper.getInstance()
    const instance2 = FailureMapper.getInstance()

    // Assert
    expect(instance1).toBe(instance2)
  })
})
