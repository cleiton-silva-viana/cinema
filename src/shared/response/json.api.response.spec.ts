import { JsonApiResponse } from './json.api.response'
import { SimpleFailure } from '../failure/simple.failure.type'
import { IFailureMapper } from '../failure/failure.mapper.interface'
import { FailureCode } from '@shared/failure/failure.codes.enum'
import { JsonApiResponseLogMessage } from './json.api.response.log.messages.enum'
import { SupportedLanguageEnum } from '@shared/value-object/language-content/supported.language.enum'

const mockLoggerWarn = jest.fn()
const mockLoggerError = jest.fn()

jest.mock('@nestjs/common', () => ({
  Logger: jest.fn().mockImplementation(() => ({
    warn: mockLoggerWarn,
    error: mockLoggerError,
  })),
  HttpStatus: {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    INTERNAL_SERVER_ERROR: 500,
  },
}))

describe('JsonApiResponse', () => {
  const mockFailureMapper: IFailureMapper = {
    toRichFailures: jest.fn().mockImplementation((failures: SimpleFailure[], language = SupportedLanguageEnum.PT) => {
      return failures.map((failure) => ({
        code: failure.code,
        status: 400,
        title: `Error: ${failure.code}`,
        details: failure.details || {},
      }))
    }),
    toRichFailure: jest.fn().mockImplementation((failure: SimpleFailure, language = SupportedLanguageEnum.PT) => {
      return {
        code: failure.code,
        status: 400,
        title: `Error: ${failure.code}`,
        details: failure.details || {},
      }
    }),
  }

  let response: JsonApiResponse

  beforeEach(() => {
    jest.clearAllMocks()
    response = new JsonApiResponse(mockFailureMapper)
  })

  describe('Construção básica', () => {
    it('deve criar uma resposta vazia com valores padrão', () => {
      // Act
      const json = response.toJSON()

      // Assert
      expect(json.jsonapi).toEqual({ version: '1.1' })
      expect(json.data).toBeNull()
      expect(json.errors).toBeUndefined()
      expect(json.included).toBeUndefined()
      expect(json.meta).toBeUndefined()
      expect(json.links).toBeUndefined()
    })

    it('deve definir o status HTTP corretamente', () => {
      const status = [200, 201, 500, 599]

      // Act
      status.forEach((s) => {
        response.HttpStatus(s)

        // Assert
        expect((response as any)._httpStatus).toBe(s)
      })
    })

    it('deve ignorar status HTTP inválidos', () => {
      // Arrange
      const status = [0, 99, 600, 700, 999]

      // Act
      status.forEach((s) => {
        response.HttpStatus(s) // Inválido

        // Assert
        expect(response.status).not.toBe(s)
        expect(mockLoggerError).toHaveBeenCalledWith(JsonApiResponseLogMessage.INVALID_HTTP_STATUS, 'JSON_API_RESPONSE')
      })
    })

    it('deve construir a resposta com valor padrão para o status', () => {
      // Assert
      expect(response.status).toBe(200)
    })
  })

  describe('data', () => {
    it('deve adicionar um recurso único como data', () => {
      // Arrange
      const resource = {
        id: '1',
        type: 'users',
        attributes: { name: 'John Doe' },
      }

      // Act
      response.data(resource)

      // Assert
      expect(response.toJSON().data).toEqual(resource)
    })

    it('deve ignorar recurso sem id e registrar erro', () => {
      // Arrange
      const resource = {
        id: '',
        type: 'users',
      }

      // Act
      response.data(resource)

      // Assert
      expect(response.toJSON().data).toBeNull()
      expect(mockLoggerError).toHaveBeenCalledWith(JsonApiResponseLogMessage.RESOURCE_ID_EMPTY, 'JSON_API_RESPONSE')
    })

    it('deve ignorar recurso sem type e registrar erro', () => {
      // Arrange
      const resource = {
        id: '1',
        type: '',
      }

      // Act
      response.data(resource)

      // Assert
      expect(response.toJSON().data).toBeNull()
      expect(mockLoggerError).toHaveBeenCalledWith(
        JsonApiResponseLogMessage.RESOURCE_TYPE_REQUIRED,
        'JSON_API_RESPONSE'
      )
    })

    it('deve ignorar resource nulo e registrar erro', () => {
      // Act
      response.data(null as any)

      // Assert
      expect(response.toJSON().data).toBeNull()
      expect(mockLoggerError).toHaveBeenCalledWith(JsonApiResponseLogMessage.RESOURCE_NULL_SINGLE, 'JSON_API_RESPONSE')
    })
  })

  describe('datas', () => {
    it('deve adicionar múltiplos recursos como data', () => {
      // Arrange
      const resources = [
        { id: '1', type: 'users', attributes: { name: 'John' } },
        { id: '2', type: 'users', attributes: { name: 'Jane' } },
      ]

      // Act
      response.datas(resources)

      // Assert
      expect(response.toJSON().data).toEqual(resources)
    })

    it('deve adicionar um único recurso como array quando usando datas', () => {
      // Arrange
      const resource = { id: '1', type: 'users', attributes: { name: 'John' } }

      // Act
      response.datas(resource)

      // Assert
      expect(Array.isArray(response.toJSON().data)).toBe(true)
      expect((response.toJSON().data as any[])[0]).toEqual(resource)
    })

    it('deve ignorar recursos duplicados em datas e registrar aviso', () => {
      // Arrange
      const resources = [
        { id: '1', type: 'users', attributes: { name: 'John' } },
        { id: '1', type: 'users', attributes: { name: 'Duplicate' } },
      ]

      // Act
      response.datas(resources)

      // Assert
      expect(response.toJSON().data as any[]).toHaveLength(1)
      expect((response.toJSON().data as any[])[0].attributes.name).toBe('John')
      expect(mockLoggerWarn).toHaveBeenCalledWith(
        JsonApiResponseLogMessage.RESOURCE_DUPLICATE.replace('{id}', resources[0].id),
        'JSON_API_RESPONSE'
      )
    })

    it('deve ignorar recursos inválidos em datas e registrar aviso', () => {
      // Arrange
      const resources = [
        { id: '1', type: 'users' },
        { id: '', type: 'users' }, // ID inválido
        { id: '3', type: '' }, // Type inválido
        {} as any, // Totalmente inválido
      ]

      // Act
      response.datas(resources)

      // Assert
      expect(response.toJSON().data as any[]).toHaveLength(1)
      expect((response.toJSON().data as any[])[0].id).toBe('1')
      expect(mockLoggerWarn).toHaveBeenCalledWith(JsonApiResponseLogMessage.RESOURCE_INVALID, 'JSON_API_RESPONSE')
    })

    it('deve ignorar resource nulo e registrar erro', () => {
      // Act
      response.datas(null as any)

      // Assert
      expect(mockLoggerError).toHaveBeenCalledWith(
        JsonApiResponseLogMessage.RESOURCE_NULL_MULTIPLE,
        'JSON_API_RESPONSE'
      )
    })

    it('deve não adicionar data quando já existem erros', () => {
      // Arrange
      const failure: SimpleFailure = { code: FailureCode.MISSING_REQUIRED_DATA }
      const resource = { id: '1', type: 'users' }

      // Act
      response.errors(failure)
      response.datas(resource)

      // Assert
      expect(response.toJSON().data).toBeUndefined()
      expect(mockLoggerWarn).toHaveBeenCalledWith(JsonApiResponseLogMessage.ERRORS_ALREADY_PRESENT, 'JSON_API_RESPONSE')
    })

    it('deve não converter data single para array', () => {
      // Arrange
      const singleResource = { id: '1', type: 'users' }
      const arrayResource = [{ id: '2', type: 'users' }]

      // Act
      response.data(singleResource)
      response.datas(arrayResource)

      // Assert
      expect(Array.isArray(response.toJSON().data)).toBe(false)
      expect(response.toJSON().data).toEqual(singleResource)
      expect(mockLoggerWarn).toHaveBeenCalledWith(JsonApiResponseLogMessage.DATA_ALREADY_SINGLE, 'JSON_API_RESPONSE')
    })
  })

  describe('errors', () => {
    it('deve adicionar erros corretamente usando o mapper', () => {
      // Arrange
      const failure: SimpleFailure = {
        code: FailureCode.MISSING_REQUIRED_DATA,
        details: { field: 'name' },
      }

      // Act
      response.errors(failure)
      const json = response.toJSON()

      // Assert
      expect(mockFailureMapper.toRichFailures).toHaveBeenCalledWith([failure], SupportedLanguageEnum.PT)
      expect(json.errors).toHaveLength(1)
      expect(json.errors[0].code).toBe(FailureCode.MISSING_REQUIRED_DATA)
    })

    it('deve adicionar múltiplos erros', () => {
      // Arrange
      const failures: SimpleFailure[] = [
        { code: FailureCode.DATE_CANNOT_BE_PAST, details: { field: 'name' } },
        { code: FailureCode.DATE_NOT_AFTER_LIMIT, details: { field: 'email' } },
      ]

      // Act
      response.errors(failures)
      const json = response.toJSON()

      // Assert
      expect(mockFailureMapper.toRichFailures).toHaveBeenCalledWith(failures, SupportedLanguageEnum.PT)
      expect(json.errors).toHaveLength(2)
      expect(json.errors[0].code).toBe(FailureCode.DATE_CANNOT_BE_PAST)
      expect(json.errors[1].code).toBe(FailureCode.DATE_NOT_AFTER_LIMIT)
    })

    it('não deve chamar o mapper quando failure é null', () => {
      // Act
      response.errors(null as any)

      // Assert
      expect(mockFailureMapper.toRichFailures).not.toHaveBeenCalled()
      expect(mockLoggerError).toHaveBeenCalledWith(JsonApiResponseLogMessage.FAILURE_NULL, 'JSON_API_RESPONSE')
    })

    it('deve atualizar o status HTTP com base no primeiro erro', () => {
      // Arrange
      const failure: SimpleFailure = { code: FailureCode.DATE_CANNOT_BE_PAST }

      // Act
      response.errors(failure)

      // Assert
      expect(response.status).toBe(400) // Status do mockFailureMapper
    })
  })

  describe('included', () => {
    it('deve adicionar recursos incluídos', () => {
      // Arrange
      const mainResource = {
        id: '1',
        type: 'articles',
        attributes: { title: 'Hello World' },
      }
      const includedResource = {
        id: '101',
        type: 'authors',
        attributes: { name: 'John Doe' },
      }

      // Act
      response.data(mainResource).included(includedResource)
      const json = response.toJSON()

      // Assert
      expect(json.data).toEqual(mainResource)
      expect(json.included).toEqual([includedResource])
    })

    it('não deve adicionar recursos incluídos duplicados', () => {
      // Arrange
      const mainResource = { id: '1', type: 'articles' }
      const includedResource = {
        id: '101',
        type: 'authors',
        attributes: { name: 'John Doe' },
      }

      // Act
      response.data(mainResource).included(includedResource).included(includedResource)
      const json = response.toJSON()

      // Assert
      expect(json.included).toHaveLength(1)
      expect(json.included[0]).toEqual(includedResource)
      expect(mockLoggerWarn).toHaveBeenCalledWith(
        JsonApiResponseLogMessage.RESOURCE_DUPLICATE.replace('{id}', '101'),
        'JSON_API_RESPONSE'
      )
    })

    it('deve ignorar recursos incluídos inválidos', () => {
      // Arrange
      const mainResource = { id: '1', type: 'articles' }
      const validResource = { id: '101', type: 'authors' }
      const invalidResource1 = { id: '', type: 'comments' } // id inválido
      const invalidResource2 = { id: '102', type: '' } // type inválido

      // Act
      response.data(mainResource).included([validResource, invalidResource1, invalidResource2])
      const json = response.toJSON()

      // Assert
      expect(json.included).toHaveLength(1)
      expect(json.included[0]).toEqual(validResource)
      expect(mockLoggerWarn).toHaveBeenCalledWith(JsonApiResponseLogMessage.RESOURCE_INVALID, 'JSON_API_RESPONSE')
    })

    it('não deve incluir recursos já presentes no data', () => {
      // Arrange
      const mainResource = { id: '1', type: 'articles' }

      // Act
      response.data(mainResource).included(mainResource)

      // Assert
      expect(response.toJSON().included).toBeUndefined()
      expect(mockLoggerWarn).toHaveBeenCalledWith(
        JsonApiResponseLogMessage.RESOURCE_ALREADY_IN_DATA.replace(
          '{type}:{id}',
          `${mainResource.type}:${mainResource.id}`
        ),
        'JSON_API_RESPONSE'
      )
    })

    it('deve ignorar resource nulo e registrar erro', () => {
      // Act
      response.included(null as any)

      // Assert
      expect(mockLoggerError).toHaveBeenCalledWith(
        JsonApiResponseLogMessage.RESOURCE_NULL_INCLUDED,
        'JSON_API_RESPONSE'
      )
    })
  })

  describe('Manipulação de metadados e links', () => {
    it('deve adicionar metadados', () => {
      // Arrange
      const metaData = { totalCount: 100, page: 1 }

      // Act
      response.meta(metaData)
      const json = response.toJSON()

      // Assert
      expect(json.meta).toEqual(metaData)
    })

    it('deve mesclar metadados quando chamado múltiplas vezes', () => {
      // Act
      response.meta({ count: 100 }).meta({ page: 1 })

      // Assert
      expect(response.toJSON().meta).toEqual({ count: 100, page: 1 })
    })

    it('deve ignorar metadados inválidos e registrar erro', () => {
      // Act
      response.meta(null as any)

      // Assert
      expect(response.toJSON().meta).toBeUndefined()
      expect(mockLoggerError).toHaveBeenCalledWith(JsonApiResponseLogMessage.METADATA_NULL, 'JSON_API_RESPONSE')
    })

    it('deve validar que metadados são um objeto', () => {
      // Act
      response.meta([] as any) // Array não é um objeto válido

      // Assert
      expect(response.toJSON().meta).toBeUndefined()
      expect(mockLoggerError).toHaveBeenCalledWith(JsonApiResponseLogMessage.METADATA_INVALID_TYPE, 'JSON_API_RESPONSE')
    })
  })

  describe('links', () => {
    it('deve adicionar links', () => {
      // Arrange
      const links = { self: 'https://api.example.com/articles/1' }

      // Act
      response.links(links)
      const json = response.toJSON()

      // Assert
      expect(json.links).toEqual(links)
    })

    it('deve mesclar links quando chamado múltiplas vezes', () => {
      // Act
      response.links({ self: '/users/1' }).links({ related: '/users/1/posts' })

      // Assert
      expect(response.toJSON().links).toEqual({
        self: '/users/1',
        related: '/users/1/posts',
      })
    })

    it('deve ignorar links nulos e registrar erro', () => {
      // Act
      response.links(null as any)

      // Assert
      expect(response.toJSON().links).toBeUndefined()
      expect(mockLoggerError).toHaveBeenCalledWith(JsonApiResponseLogMessage.LINKS_NULL, 'JSON_API_RESPONSE')
    })

    it('deve validar que links é um objeto', () => {
      // Act
      response.links('invalid' as any)

      // Assert
      expect(response.toJSON().links).toBeUndefined()
      expect(mockLoggerError).toHaveBeenCalledWith(JsonApiResponseLogMessage.LINKS_INVALID_TYPE, 'JSON_API_RESPONSE')
    })
  })

  describe('Exclusividade entre data e errors', () => {
    it('deve priorizar errors sobre data na resposta final', () => {
      // Arrange
      const resource = { id: '1', type: 'users' }
      const failure: SimpleFailure = { code: FailureCode.STRING_WITH_INVALID_FORMAT }

      // Act
      response.data(resource).errors(failure)
      const json = response.toJSON()

      // Assert
      expect(json.errors).toBeDefined()
      expect(json.data).toBeUndefined()
      expect(mockLoggerError).toHaveBeenCalledWith(JsonApiResponseLogMessage.DATA_ERROR_CONFLICT, 'JSON_API_RESPONSE')
    })

    it('deve impedir a adição de data quando errors já existe', () => {
      // Arrange
      const failure: SimpleFailure = { code: FailureCode.DATE_NOT_AFTER_LIMIT }
      const resource = { id: '1', type: 'users' }

      // Act
      response.errors(failure)
      response.data(resource)

      // Assert
      expect(response.toJSON().data).toBeUndefined()
      expect(response.toJSON().errors).toBeDefined()
    })
  })

  describe('Serialização final', () => {
    it('deve omitir seções vazias na resposta final', () => {
      // Act
      const json = response.toJSON()

      // Assert
      expect(Object.keys(json)).toEqual(['jsonapi', 'data'])
    })

    it('deve incluir todas as seções não-vazias', () => {
      // Arrange
      const resource = { id: '1', type: 'users' }
      const includedResource = { id: '2', type: 'profiles' }
      const meta = { count: 1 }
      const links = { self: 'https://api.example.com/users/1' }

      // Act
      response.data(resource).included(includedResource).meta(meta).links(links)
      const json = response.toJSON()

      // Assert
      expect(Object.keys(json).sort()).toEqual(['jsonapi', 'data', 'included', 'meta', 'links'].sort())
    })
  })

  describe('getAllDatas', () => {
    it('deve retornar todos os dados internos', () => {
      // Arrange
      const resource = { id: '1', type: 'users' }
      const includedResource = { id: '2', type: 'profiles' }
      const meta = { count: 1 }
      const links = { self: '/users/1' }

      // Act
      response.data(resource).included(includedResource).meta(meta).links(links).HttpStatus(201)

      const allData = response.getAllDatas()

      // Assert
      expect(allData.data).toEqual(resource)
      expect(allData.included).toEqual([includedResource])
      expect(allData.meta).toEqual(meta)
      expect(allData.links).toEqual(links)
      expect(allData.status).toBe(201)
      expect(allData.jsonapi).toEqual({ version: '1.1' })
      expect(allData.errors).toEqual([])
      expect(allData.records).toBeInstanceOf(Map)
    })
  })

  describe('Cenários complexos', () => {
    it('deve construir uma resposta completa com todas as seções', () => {
      // Arrange
      const mainResource = {
        id: '1',
        type: 'articles',
        attributes: { title: 'Hello World', body: 'Lorem ipsum' },
        relationships: {
          author: {
            data: { id: '101', type: 'people' },
          },
          comments: {
            data: [
              { id: '5', type: 'comments' },
              { id: '6', type: 'comments' },
            ],
          },
        },
      }

      const includedResources = [
        { id: '101', type: 'people', attributes: { name: 'John Doe' } },
        { id: '5', type: 'comments', attributes: { body: 'Great article!' } },
        { id: '6', type: 'comments', attributes: { body: 'Thanks for sharing' } },
      ]

      const metadata = { totalComments: 2, publishedAt: '2023-06-12' }
      const links = { self: '/articles/1', next: '/articles/2', prev: '/articles/0' }

      // Act
      response.data(mainResource).included(includedResources).meta(metadata).links(links).HttpStatus(200)

      const json = response.toJSON()

      // Assert
      expect(json.data).toEqual(mainResource)
      expect(json.included).toEqual(includedResources)
      expect(json.meta).toEqual(metadata)
      expect(json.links).toEqual(links)
      expect(json.jsonapi).toEqual({ version: '1.1' })
      expect(response.status).toBe(200)
    })

    it('deve construir uma resposta de erro completa', () => {
      // Arrange
      const failures: SimpleFailure[] = [
        {
          code: FailureCode.VALIDATION_ERROR,
          details: { field: 'email', message: 'Invalid email format' },
        },
        {
          code: FailureCode.MISSING_REQUIRED_DATA,
          details: { field: 'name', message: 'Name is required' },
        },
      ]

      const metadata = { requestId: '123456', timestamp: '2023-06-12T10:00:00Z' }

      // Act
      response.errors(failures).meta(metadata).HttpStatus(422)

      const json = response.toJSON()

      // Assert
      expect(json.errors).toHaveLength(2)
      expect(json.meta).toBeFalsy() // metadados não podem ser anexados a erros
      expect(json.data).toBeUndefined() // deve ter dados nulos, não deve ser possível reotrnar um erro + dados
      expect(json.jsonapi).toEqual({ version: '1.1' })
      expect(response.status).toBe(422) // Status definido pelo mockFailureMapper
    })
  })
})
