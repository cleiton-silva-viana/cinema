import { failure, Result, success } from '@/shared/result/result'
import { CustomerUID } from '@modules/customer/entity/value-object/customer.uid'
import { isNullOrUndefined } from '@shared/validator/utils/validation'
import { FailureFactory } from '@shared/failure/failure.factory'
import { da } from '@faker-js/faker'

/**
 * Representa uma reserva de assento em uma sessão de cinema.
 *
 * Este objeto de valor encapsula as informações sobre a reserva de assento de um cliente,
 * incluindo quem fez a reserva, quando foi feita e quando expira.
 */
export class SeatReservation {
  private static readonly EXPIRATION_TIME = 15 * 60 * 1000

  /**
   * Cria uma nova reserva de assento.
   *
   * @param customerUID - O identificador único do cliente que fez a reserva
   * @param reservedAt - A data e hora em que a reserva foi feita
   * @param expiresAt - A data e hora em que a reserva expira
   *
   * @throws {Error} Se expiresAt for anterior a reservedAt
   */
  private constructor(
    public readonly customerUID: CustomerUID,
    public readonly reservedAt: Date,
    public readonly expiresAt: Date
  ) {}

  /**
   * Cria uma nova reserva de assento.
   *
   * @param customerUID - O identificador único do cliente que está fazendo a reserva
   * @param date - Opcional. A data em que a reserva é feita. Por padrão usa a data/hora atual
   * @returns Um Result contendo ou uma nova instância de SeatReservation ou uma falha
   */
  public static create(customerUID: CustomerUID, date?: Date): Result<SeatReservation> {
    if (isNullOrUndefined(customerUID)) return failure(FailureFactory.MISSING_REQUIRED_DATA('customerUID'))

    const reservedAt = date ?? new Date()
    const expiresAt = new Date(reservedAt.getTime() + SeatReservation.EXPIRATION_TIME)

    return success(new SeatReservation(customerUID, reservedAt, expiresAt))
  }

  /**
   * Verifica se a reserva expirou.
   *
   * @returns true se o tempo atual ultrapassou o tempo de expiração, false caso contrário
   */
  public hasExpired(): boolean {
    return this.expiresAt.getTime() < Date.now()
  }
}
