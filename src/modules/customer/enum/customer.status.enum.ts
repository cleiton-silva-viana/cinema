/**
 * Enum que representa os diferentes status de um cliente no sistema.
 * Define os possíveis estados que um cliente pode ter.
 *
 * @enum {string}
 * @property {string} ACTIVE - Cliente ativo no sistema
 * @property {string} INACTIVE - Cliente temporariamente inativo
 * @property {string} SUSPENDED - Cliente suspenso por violação de termos
 * @property {string} BLOCKED - Cliente bloqueado permanentemente
 * @property {string} PENDING_VERIFICATION - Cliente aguardando verificação de dados
 */
export enum CustomerStatusEnum {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  BLOCKED = 'BLOCKED',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
}
