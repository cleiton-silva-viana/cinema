import { UID } from '@shared/value-object/uid'

/**
 * Representa o identificador único de um ingresso no sistema.
 *
 * Esta classe estende a classe base UID e define um prefixo específico
 * para identificadores de ingressos, garantindo que todos os IDs de ingressos
 * sejam facilmente identificáveis e distinguíveis de outros tipos de IDs.
 *
 * @example
 * // Criar um novo UID para um ingresso
 * const ticketId = TicketUID.create();
 *
 * // Hidratar um UID existente
 * const existingTicketId = TicketUID.hydrate("tckt_abc123");
 */
export class TicketUID extends UID {
  /**
   * Prefixo usado para todos os identificadores de ingressos.
   * Todos os IDs de ingressos começarão com "tckt_".
   */
  protected static readonly PREFIX: string = 'TCKT'
}
