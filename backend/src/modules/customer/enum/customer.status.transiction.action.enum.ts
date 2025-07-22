/**
 * Enum que define os atores que podem realizar transições de status no sistema.
 *
 * @enum {string}
 * @property {string} CUSTOMER - Representa o próprio cliente/usuário do sistema
 * @property {string} ADMIN - Representa um administrador com privilégios elevados
 */
export enum CustomerStatusTransitionActorEnum {
  CUSTOMER = 'CUSTOMER',
  ADMIN = 'ADMIN',
}
