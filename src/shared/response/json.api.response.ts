import { isBlank, isNull } from "../validator/validator";
import { SimpleFailure } from "../failure/simple.failure.type";
import { Logger } from "@nestjs/common";
import { IFailureMapper } from "../failure/failure.mapper.interface";

const logger = new Logger("JsonApiResponse");

export interface CommonLinks {
  self?: string;
  related?: string;

  [key: string]: string | undefined;
}

/**
 * Representa um identificador de recurso JSON:API (usado em relacionamentos).
 */
export interface ResourceIdentifier {
  id: string;

  type: string;

  /**
   * O campo 'meta' é opcional e pode conter metadados específicos do recurso.
   * como informações de versão, timestamps ou outros dados contextuais.
   * Exemplo: { "language": "pt" }
   */
  meta?: Record<string, any>;
}

/**
 * Representa um objeto de relacionamento JSON:API.
 */
export interface RelationshipObject {
  data: ResourceIdentifier | ResourceIdentifier[] | null;
  links?: CommonLinks;
  meta?: Record<string, any>;
}

/**
 * Representa um objeto de recurso JSON:API completo.
 * é o nome do relacionamento e o valor é um objeto RelationshipObject.
 */
export interface ResponseResource {
  /**
   * @property O campo'type' é obrigatório e deve ser uma string que identifica o recurso.
   */
  id: string;

  /**
   * @property O campo'type' é obrigatório e deve ser uma string que identifica o tipo do recurso.
   */
  type: string;

  /**
   * @property contém os dados principais do recurso como pares chave-valor.
   */
  attributes?: Record<string, any>;

  /**
   * @property O campo 'relationships' é opcional e contém informações sobre relacionamentos com outros recursos.
   * Cada chave é o nome do relacionamento e o valor é um objeto RelationshipObject.
   */
  relationships?: Record<string, RelationshipObject>;

  /**
   * @property O campo'links' é opcional e contém links relacionados ao recurso.
   */
  links?: CommonLinks;

  /**
   * @property O campo'meta' é opcional e pode conter metadados específicos do recurso.
   * como informações de versão, timestamps ou outros dados contextuais.
   */
  meta?: Record<string, any>;
}

/**
 * Representa um objeto de erro JSON:API.
 */
export interface ResponseError {
  links?: { about: string }; // Um link que leva a mais detalhes sobre este problema específico.
  status?: string; // O código de status HTTP aplicável a este problema, expresso como uma string.
  code?: string; // Um código de erro específico da aplicação, expresso como uma string.
  title?: string; // Uma explicação específica desta ocorrência do problema.
  source?: { pointer?: string; parameter?: string }; // Um objeto contendo referências à fonte do erro.
  meta?: Record<string, any>; // Um objeto meta contendo informações não padronizadas sobre o erro.
}

/**
 * Constrói uma resposta aderente ao padrão JSON:API (v1.1).
 * Fornece métodos fluentes para definir dados primários (singular ou plural),
 * erros, recursos incluídos, metadados e links.
 * Garante a exclusividade mútua entre 'data' e 'errors'.
 */
export class JsonApiResponse {
  private _data: ResponseResource | ResponseResource[] | null = null;
  private _errors: ResponseError[] = [];
  private _included: ResponseResource[] = [];
  private _meta?: Record<string, any>;
  private _links?: Record<string, string>;
  private readonly _jsonapi = { version: "1.1" };
  private _httpStatus: number = 200;

  // Mapa auxiliar para rastrear recursos incluídos e evitar duplicatas
  // Estrutura: Map<type_do_recurso, Set<id_do_recurso>>
  private _records: Map<string, Set<string>> = new Map();

  public constructor(
    private readonly _failureMapper: IFailureMapper,
  ) {}

  /**
   * Define o código de status HTTP para a resposta.
   * @param statusCode O código de status HTTP (ex: 200, 201, 204, etc.)
   * @returns {this} A própria instância do builder para encadeamento.
   */
  public status(statusCode: number): this {
    if (statusCode < 100 || statusCode > 599) {
      this.logError("Invalid HTTP status code");
      return this;
    }

    this._httpStatus = statusCode;
    return this;
  }

  private logWarning(message: string, context?: Record<string, any>) {
    logger.warn(message, context);
  }

  private logError(message: string, context?: Record<string, any>) {
    logger.error(message, context);
  }

  /**
   * Define o recurso primário único da resposta.
   * @Param resource o recurso solicitado
   */
  public data(resource: ResponseResource): this {
    if (isNull(resource)) {
      this.logError("Resource cannot be null when setting single data");
      return this;
    }

    if (isBlank(resource.id)) {
      this.logError("Resource ID cannot be empty");
      return this;
    }

    if (isBlank(resource.type)) {
      this.logError("Resource type is required");
      return this;
    }

    this._data = resource;
    return this;
  }

  /**
   * Define uma coleção de recursos solicitados
   * @Param resources um único recurso ou uma lista de recursos solicitados
   */
  public datas(resources: ResponseResource | ResponseResource[]): this {
    if (isNull(resources)) {
      this.logError(
        "Resource cannot be null when setting single or multiple data",
      );
      return this;
    }

    const resourcesToAdd = Array.isArray(resources) ? resources : [resources];

    if (this._errors.length > 0) {
      this.logWarning("Cannot set data when errors is already present");
      return this;
    }

    if (this._data !== null && !Array.isArray(this._data)) {
      this.logWarning(
        "Cannot set multiple data when it is already configured as a single resource",
      );
      return this;
    }

    if (this._data === null) this._data = [];

    const savedResourceIds = this._records.get("datas") || new Set<string>();
    if (this._records.has("datas"))
      this._records.set("datas", savedResourceIds);

    for (let i = 0; i < resourcesToAdd.length; i++) {
      const r = resourcesToAdd[i];
      if (!r || !r.id || !r.type) {
        this.logWarning("Recurso inválido ignorado (sem id ou type)");
        continue;
      }

      if (savedResourceIds.has(r.id)) {
        this.logWarning(`Recurso duplicado ignorado: id:${r.id}`);
        continue;
      }

      savedResourceIds.add(r.id);
      (this._data as ResponseResource[]).push(r);
    }

    return this;
  }

  /**
   * Define as falhas ocorridas a serem retornadas ao cliente
   * @Param failure um objeto do tipo failure ou uma lista de failure
   */
  public errors(failure: SimpleFailure | SimpleFailure[]): this {
    if (isNull(failure)) {
      this.logError("Failure cannot be null");
      return this;
    }

    const failures = this._failureMapper.toRichFailures(
      Array.isArray(failure) ? failure : [failure],
    );

    failures.forEach((f) => {
      const fail: ResponseError = {
        code: f.code,
        status: f.status.toString(),
        title: f.title,
        meta: f.details,
      };
      this._errors.push(fail);
    });

    return this;
  }

  /**
   * Adiciona um ou mais recursos relacionados à seção 'included'.
   * @param resource Um único recurso ou um array de recursos JSON:API para incluir.
   * @returns {this} A própria instância do builder para encadeamento.
   */
  public included(resource: ResponseResource | ResponseResource[]): this {
    if (isNull(resource)) {
      this.logError("Resource cannot be null when setting included resources");
      return this;
    }

    const resourcesToInclude = Array.isArray(resource) ? resource : [resource];

    const savedIncluded = this._records.get("included") || new Set<string>();
    if (!this._records.has("included"))
      this._records.set("included", savedIncluded);

    for (let i = 0; i < resourcesToInclude.length; i++) {
      const r = resourcesToInclude[i];

      if (!r || !r.id || !r.type) {
        this.logWarning("Recurso inválido ignorado (sem id ou type)");
        continue;
      }

      if (
        this._data &&
        !Array.isArray(this._data) &&
        this._data.id === r.id &&
        this._data.type === r.type
      ) {
        logger.warn(`Recurso ${r.type}:${r.id} já está presente em data`);
        continue;
      }

      if (savedIncluded.has(r.id)) {
        this.logWarning(`Recurso duplicado ignorado: id:${r.id}`);
        continue;
      }

      savedIncluded.add(r.id);
      this._included.push(r);
    }

    return this;
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
      this.logError("metadata deve ser um valor não nulo.");
      return this;
    }

    if (typeof metaData !== "object" || Array.isArray(metaData)) {
      this.logError("metadata deve ser um objeto chave e valor.");
      return this;
    }
    this._meta = { ...(this._meta || {}), ...metaData };
    return this;
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
      this.logError("Links não podem ser nulo.");
      return this;
    }

    if (!(typeof link === "object")) {
      this.logError("link deve ser um objeto chave e valor");
      return this;
    }

    Object.entries(link).forEach(([key, url]) => {
      if (!isBlank(url)) {
        this.logError(
          `a url fornecida para o ${key} não contém um formato válido`,
        );
        return this;
      }
    });

    this._links = { ...(this._links || {}), ...link };
    return this;
  }

  /**
   * Constrói e retorna o objeto final da resposta formatado conforme JSON:API.
   * Inclui os membros de nível superior (`jsonapi`, `data` OU `errors`, `included`, `meta`, `links`)
   * apenas se eles tiverem conteúdo relevante.
   * @returns {Record<string, any>} O objeto de resposta final, pronto para ser serializado.
   * // TODO: Validar o estado final antes de construir (ex: _data e _errors não podem coexistir). Embora as validações nos métodos de set ajudem, uma validação final é mais segura.
   */
  public toJSON(): Record<string, any> {
    if (this._data !== null && this._errors.length > 0)
      this.logError("Cannot have both 'data' and 'errors' in response");

    const response: Record<string, any> = {
      jsonapi: this._jsonapi,
    };

    if (this._errors.length > 0) {
      response.errors = this._errors;
      return response;
    }

    response.data = this._data;

    if (this._included && this._included.length > 0)
      response.included = this._included;

    if (this._meta && Object.keys(this._meta).length > 0)
      response.meta = this._meta;

    if (this._links && Object.keys(this._links).length > 0)
      response.links = this._links;

    return response;
  }
}
