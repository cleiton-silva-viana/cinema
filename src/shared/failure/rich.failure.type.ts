import { HttpStatus } from "@nestjs/common";

/**
 * Representa uma estrutura de erro detalhada e padronizada, projetada especificamente
 * para ser retornada em respostas de API ao cliente final.
 *
 * Esta estrutura é tipicamente montada em camadas de tratamento de erro (como
 * Error Filters ou Middlewares), utilizando o `code` de uma `SimpleFailure` interna
 * para buscar/construir os detalhes completos (status HTTP, título amigável, etc.).
 * Ela fornece informações suficientes para que o cliente compreenda e,
 * potencialmente, trate o erro adequadamente.
 */
export type RichFailureType = {
  /**
   * O código de erro único e padronizado que identifica o tipo específico da falha.
   * Este código é consistente entre a `SimpleFailure` interna e a `RichFailureType` externa,
   * servindo como chave para mapear e construir esta estrutura completa.
   * É útil para referência interna e, opcionalmente, para lógica de tratamento específica no cliente.
   * Exemplo: "VALIDATION_FIELD_REQUIRED", "AUTH_UNAUTHORIZED", "RESOURCE_NOT_FOUND".
   */
  code: string,

  /**
   * O código de status HTTP (conforme definido pelo `HttpStatus`, e.g., do @nestjs/common)
   * que melhor representa a natureza do erro ocorrido. Essencial para a correta
   * interpretação da resposta pelo cliente HTTP.
   * Exemplo: HttpStatus.BAD_REQUEST (400), HttpStatus.UNAUTHORIZED (401), HttpStatus.NOT_FOUND (404).
   */
  status: HttpStatus,

  /**
   * Um título curto e legível por humanos que resume a natureza geral do erro.
   * É adequado para ser exibido diretamente ao usuário final em interfaces gráficas
   * ou mensagens de erro concisas.
   * Exemplo: "Erro de Validação", "Autenticação Necessária", "Recurso Não Encontrado".
   */
  title: string,

  /**
   * Um objeto contendo detalhes contextuais específicos sobre a ocorrência do erro,
   * com valores restritos a `string` ou `number` para garantir fácil serialização
   * e consumo pelo cliente (e.g., em JSON).
   * Pode incluir informações como o campo específico que falhou na validação,
   * identificadores relevantes, limites violados, etc.
   * Exemplo: `{ "field": "email", "reason": "invalid_format" }`, `{ "productId": 123 }`.
   */
  details: Record<string, string | number>
}