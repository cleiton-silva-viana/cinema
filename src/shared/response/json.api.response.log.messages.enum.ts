export enum JsonApiResponseLogMessage {
  // Mensagens de erro para validação de status HTTP
  INVALID_HTTP_STATUS = 'Código de status HTTP inválido',

  // Mensagens para validação de recursos
  RESOURCE_NULL_SINGLE = 'O recurso não pode ser nulo ao definir dados únicos',
  RESOURCE_NULL_MULTIPLE = 'O recurso não pode ser nulo ao definir dados únicos ou múltiplos',
  RESOURCE_NULL_INCLUDED = 'O recurso não pode ser nulo ao definir recursos incluídos',
  RESOURCE_ID_EMPTY = 'O ID do recurso não pode estar vazio',
  RESOURCE_TYPE_REQUIRED = 'O tipo de recurso é obrigatório',
  RESOURCE_INVALID = 'Recurso inválido ignorado (sem id ou type)',
  RESOURCE_DUPLICATE = 'Recurso duplicado ignorado: id:{id}',
  RESOURCE_ALREADY_IN_DATA = 'Recurso {type}:{id} já está presente em data',

  // Mensagens para conflitos de estrutura
  DATA_ERROR_CONFLICT = "Não pode haver tanto 'data' quanto 'errors' na resposta",
  DATA_ALREADY_SINGLE = 'Não é possível definir múltiplos dados quando já está configurado como um recurso único',
  ERRORS_ALREADY_PRESENT = 'Não é possível definir dados quando erros já estão presentes',

  // Mensagens para metadados e links
  METADATA_NULL = 'metadata deve ser um valor não nulo.',
  METADATA_INVALID_TYPE = 'metadata deve ser um objeto chave e valor.',
  LINKS_NULL = 'Links não podem ser nulos.',
  LINKS_INVALID_TYPE = 'link deve ser um objeto chave e valor',
  LINK_INVALID_URL = 'a url fornecida para o {key} não contém um formato válido',

  // Mensagens para validação de falhas
  FAILURE_NULL = 'Failure não pode ser nulo',
}
