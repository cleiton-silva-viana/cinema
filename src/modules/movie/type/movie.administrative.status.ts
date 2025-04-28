/**
 * Enum que representa os diferentes estados administrativos de um filme no sistema
 * 
 * @enum {string}
 * @property {string} DRAFT - Estado inicial do filme quando está sendo criado
 * @property {string} PENDING_REVIEW - Filme aguardando revisão administrativa
 * @property {string} APPROVED - Filme aprovado e pronto para exibição
 * @property {string} ARCHIVED - Filme arquivado e não mais em exibição ativa
 */
export enum MovieAdministrativeStatus {
  DRAFT = "DRAFT",
  PENDING_REVIEW = "PENDING_REVIEW",
  APPROVED = "APPROVED",           
  ARCHIVED = "ARCHIVED"
}