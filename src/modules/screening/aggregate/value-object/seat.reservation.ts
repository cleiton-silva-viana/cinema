import {CustomerUID} from "@modules/customer/entity/value-object/customer.uid";

/**
 * Representa uma reserva de assento em uma sessão de cinema.
 * 
 * Este objeto de valor encapsula as informações sobre a reserva de assento de um cliente,
 * incluindo quem fez a reserva, quando foi feita e quando expira.
 */
export class SeatReservation {
  /**
   * Cria uma nova reserva de assento.
   * 
   * @param customerUID - O identificador único do cliente que fez a reserva
   * @param reservedAt - A data e hora em que a reserva foi feita
   * @param expiresAt - A data e hora em que a reserva expira
   * 
   * @throws {Error} Se expiresAt for anterior a reservedAt
   */
  constructor(
    public readonly customerUID: CustomerUID,
    public readonly reservedAt: Date,
    public readonly expiresAt: Date 
  ) {}
}