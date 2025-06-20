import { HttpStatus } from '@nestjs/common'
import { isBlank, isNull } from '../validator/utils/validation'
import { SimpleFailure } from '../failure/simple.failure.type'
import { IFailureMapper } from '../failure/failure.mapper.interface'
import { FailureMapper } from '../failure/failure.mapper'
import { LoggerService } from '@shared/logging/logging.service'
import { JsonApiResponseLogMessage } from '@shared/response/json.api.response.log.messages.enum'
import { ResourceTypesEnum } from '@shared/constant/resource.types'
import { SupportedLanguageEnum } from '@shared/value-object/language-content/supported.language.enum'

export interface ICommonLinks {
  self?: string
  related?: string

  [key: string]: string | undefined
}

/**
 * Representa um identificador de recurso JSON:API (usado em relacionamentos).
 */
export type ResourceIdentifier = {
  id: string

  type: string

  /**
   * O campo 'meta' é opcional e pode conter metadados específicos do recurso.
   * como informações de versão, timestamps ou outros dados contextuais.
   * Exemplo: { "language": "pt" }
   */
  meta?: Record<string, any>
}

/**
 * Representa um objeto de relacionamento JSON:API.
 */
export type RelationshipObject = {
  data: ResourceIdentifier | ResourceIdentifier[] | null
  links?: ICommonLinks
  meta?: Record<string, any>
}

/**
 * Representa um objeto de recurso JSON:API completo.
 * é o nome do relacionamento e o valor é um objeto RelationshipObject.
 */
export type ResponseResource = {
  /**
   * @property O campo'type' é obrigatório e deve ser uma string que identifica o recurso.
   */
  id: string

  /**
   * @property O campo'type' é obrigatório e deve ser uma string que identifica o tipo do recurso.
   */
  type: string

  /**
   * @property contém os dados principais do recurso como pares chave-valor.
   */
  attributes?: Record<string, any>

  /**
   * @property O campo 'relationships' é opcional e contém informações sobre relacionamentos com outros recursos.
   * Cada chave é o nome do relacionamento e o valor é um objeto RelationshipObject.
   */
  relationships?: Record<string, RelationshipObject>

  /**
   * @property O campo'links' é opcional e contém links relacionados ao recurso.
   */
  links?: ICommonLinks

  /**
   * @property O campo'meta' é opcional e pode conter metadados específicos do recurso.
   * como informações de versão, timestamps ou outros dados contextuais.
   */
  meta?: Record<string, any>
}

/**
 * Representa um objeto de erro JSON:API.
 */
export type ResponseError = {
  links?: { about: string } // Um link que leva a mais detalhes sobre este problema específico.
  status?: string // O código de status HTTP aplicável a este problema, expresso como uma string.
  code?: string // Um código de erro específico da aplicação, expresso como uma string.
  title?: string // Uma explicação específica desta ocorrência do problema.
  source?: { pointer?: string; parameter?: string } // Um objeto contendo referências à fonte do erro.
  meta?: Record<string, any> // Um objeto meta contendo informações não padronizadas sobre o erro.
}

/**
 * Constrói uma resposta aderente ao padrão JSON:API (v1.1).
 * Fornece métodos fluentes para definir dados primários (singular ou plural),
 * erros, recursos incluídos, metadados e links.
 * Garante a exclusividade mútua entre 'data' e 'errors'.
 */
export class JsonApiResponse {
  private _data: ResponseResource | ResponseResource[] | null = null

  private _errors: ResponseError[] = []

  private _included: ResponseResource[] = []

  private _meta?: Record<string, any>

  private _links?: Record<string, string>

  private readonly _jsonapi = { version: '1.1' }

  private _httpStatus: number = HttpStatus.OK

  private _records: Map<string, Set<string>> = new Map()

  private readonly logger = LoggerService.getInstance(ResourceTypesEnum.JSON_API_RESPONSE)

  public constructor(private readonly _failureMapper: IFailureMapper = FailureMapper.getInstance()) {}

  public get status(): number {
    return this._httpStatus
  }

  /**
   * Define o código de status HTTP para a resposta.
   * @param statusCode O código de status HTTP (ex: 200, 201, 204, etc.)
   * @returns {this} A própria instância do builder para encadeamento.
   */
  public HttpStatus(statusCode: HttpStatus): this {
    if (statusCode < 200 || statusCode > 599) {
      this.logger.error(JsonApiResponseLogMessage.INVALID_HTTP_STATUS)
      this._httpStatus = HttpStatus.INTERNAL_SERVER_ERROR
      return this
    }
    this._httpStatus = statusCode
    return this
  }

  /**
   * Define o recurso primário único da resposta.
   * @Param resource o recurso solicitado
   */
  public data(resource: ResponseResource): this {
    if (isNull(resource)) {
      this.logger.error(JsonApiResponseLogMessage.RESOURCE_NULL_SINGLE)
      return this
    }

    if (isBlank(resource.id)) {
      this.logger.error(JsonApiResponseLogMessage.RESOURCE_ID_EMPTY)
      return this
    }

    if (isBlank(resource.type)) {
      this.logger.error(JsonApiResponseLogMessage.RESOURCE_TYPE_REQUIRED)
      return this
    }

    this._data = resource
    return this
  }

  /**
   * Define uma coleção de recursos solicitados
   * @Param resources um único recurso ou uma lista de recursos solicitados
   */
  public datas(resources: ResponseResource | ResponseResource[]): this {
    if (isNull(resources)) {
      this.logger.error(JsonApiResponseLogMessage.RESOURCE_NULL_MULTIPLE)
      return this
    }

    const resourcesToAdd = Array.isArray(resources) ? resources : [resources]

    if (this._errors.length > 0) {
      this.logger.warn(JsonApiResponseLogMessage.ERRORS_ALREADY_PRESENT)
      return this
    }

    if (this._data !== null && !Array.isArray(this._data)) {
      this.logger.warn(JsonApiResponseLogMessage.DATA_ALREADY_SINGLE)
      return this
    }

    if (this._data === null) this._data = []

    const savedResourceIds = this._records.get('datas') || new Set<string>()
    if (this._records.has('datas')) this._records.set('datas', savedResourceIds)

    for (let i = 0; i < resourcesToAdd.length; i++) {
      const r = resourcesToAdd[i]
      if (!r || !r.id || !r.type) {
        this.logger.warn(JsonApiResponseLogMessage.RESOURCE_INVALID)
        continue
      }

      if (savedResourceIds.has(r.id)) {
        this.logger.warn(JsonApiResponseLogMessage.RESOURCE_DUPLICATE, { id: r.id })
        continue
      }

      savedResourceIds.add(r.id)
      this._data.push(r)
    }

    return this
  }

  /**
   * Define as falhas ocorridas a serem retornadas ao cliente
   * @Param failure um objeto do tipo failure ou uma lista de failure
   */
  public errors(failure: SimpleFailure | ReadonlyArray<SimpleFailure>): this {
    if (isNull(failure)) {
      this.logger.error(JsonApiResponseLogMessage.FAILURE_NULL)
      return this
    }

    const failures = this._failureMapper.toRichFailures(
      Array.isArray(failure) ? failure : [failure],
      SupportedLanguageEnum.PT
    )

    failures.forEach((f) => {
      const fail: ResponseError = {
        code: f.code,
        status: f.status.toString(),
        title: f.title,
      }
      this._errors.push(fail)
    })

    this._httpStatus = failures[0].status

    return this
  }

  /**
   * Adiciona um ou mais recursos relacionados à seção 'included'.
   * @param resource Um único recurso ou um array de recursos JSON:API para incluir.
   * @returns {this} A própria instância do builder para encadeamento.
   */
  public included(resource: ResponseResource | ResponseResource[]): this {
    if (isNull(resource)) {
      this.logger.error(JsonApiResponseLogMessage.RESOURCE_NULL_INCLUDED)
      return this
    }

    const resourcesToInclude = Array.isArray(resource) ? resource : [resource]

    const savedIncluded = this._records.get('included') || new Set<string>()
    if (!this._records.has('included')) this._records.set('included', savedIncluded)

    for (let i = 0; i < resourcesToInclude.length; i++) {
      const r = resourcesToInclude[i]

      if (!r || !r.id || !r.type) {
        this.logger.warn(JsonApiResponseLogMessage.RESOURCE_INVALID)
        continue
      }

      if (this._data && !Array.isArray(this._data) && this._data.id === r.id && this._data.type === r.type) {
        this.logger.warn(JsonApiResponseLogMessage.RESOURCE_ALREADY_IN_DATA, { type: r.type, id: r.id })
        continue
      }

      if (savedIncluded.has(r.id)) {
        this.logger.warn(JsonApiResponseLogMessage.RESOURCE_DUPLICATE, { id: r.id })
        continue
      }

      savedIncluded.add(r.id)
      this._included.push(r)
    }

    return this
  }

  /**
   * Define ou mescla o objeto 'meta' de nível superior da resposta.
   * Se chamado múltiplas vezes, as propriedades são mescladas (última chamada prevalece em conflitos).
   * @param metaData O objeto de metadados (deve conter apenas valores serializáveis).
   * @returns {this} A própria instância do builder para encadeamento.
   * @throws {TechnicalError} Se metaData for nulo.
   */
  public meta(metaData: Record<string, any>): this {
    if (isNull(metaData)) {
      this.logger.error(JsonApiResponseLogMessage.METADATA_NULL)
      return this
    }

    if (typeof metaData !== 'object' || Array.isArray(metaData)) {
      this.logger.error(JsonApiResponseLogMessage.METADATA_INVALID_TYPE)
      return this
    }
    this._meta = { ...(this._meta || {}), ...metaData }
    return this
  }

  /**
   * Define ou mescla o objeto 'links' de nível superior da resposta.
   * Se chamado múltiplas vezes, os links são mesclados (última chamada prevalece em conflitos).
   * @param link O objeto de links (chave: nome do link, valor: URL string).
   * @returns {this} A própria instância do builder para encadeamento.
   * @throws {TechnicalError} Se linkData for nulo ou contiver valores inválidos.
   * // TODO: Adicionar validação para garantir que linkData é um objeto e não nulo/undefined.
   */
  public links(link: Record<string, string>): this {
    if (isNull(link)) {
      this.logger.error(JsonApiResponseLogMessage.LINKS_NULL)
      return this
    }

    if (!(typeof link === 'object')) {
      this.logger.error(JsonApiResponseLogMessage.LINKS_INVALID_TYPE)
      return this
    }

    Object.entries(link).forEach(([key, url]) => {
      if (!isBlank(url)) {
        this.logger.error(JsonApiResponseLogMessage.LINK_INVALID_URL, { key })
        return this
      }
    })

    this._links = { ...(this._links || {}), ...link }
    return this
  }

  /**
   * Constrói e retorna o objeto final da resposta formatado conforme JSON:API.
   * Inclui os membros de nível superior (`jsonapi`, `data` OU `errors`, `included`, `meta`, `links`)
   * apenas se eles tiverem conteúdo relevante.
   * @returns {Record<string, any>} O objeto de resposta final, pronto para ser serializado.
   * // TODO: Validar o estado final antes de construir (ex: _data e _errors não podem coexistir). Embora as validações nos métodos de set ajudem, uma validação final é mais segura.
   */
  public toJSON(): Record<string, any> {
    if (this._data !== null && this._errors.length > 0) this.logger.error(JsonApiResponseLogMessage.DATA_ERROR_CONFLICT)

    const response: Record<string, any> = {
      jsonapi: this._jsonapi,
    }

    if (this._errors.length > 0) {
      response.errors = this._errors
      return response
    }

    response.data = this._data

    if (this._included && this._included.length > 0) response.included = this._included

    if (this._meta && Object.keys(this._meta).length > 0) response.meta = this._meta

    if (this._links && Object.keys(this._links).length > 0) response.links = this._links

    return response
  }

  public getAllDatas() {
    return {
      data: this._data,
      errors: this._errors,
      included: this._included,
      meta: this._meta,
      links: this._links,
      jsonapi: this._jsonapi,
      status: this._httpStatus,
      records: this._records,
    }
  }
}
