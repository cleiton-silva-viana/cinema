import { SeatReservation } from './seat.reservation'
import { CustomerUID } from '@modules/customer/entity/value-object/customer.uid'
import { FailureCode } from '@shared/failure/failure.codes.enum'
import { CreateTestSeatReservation } from '@test/builder/seat.reservation.builder'

describe('create', () => {
  describe('deve criar uma reserva de assento válida', () => {
    const customerUID = CustomerUID.create()

    it('objeto SeatReservation com customerUID válido', () => {
      // Arrange
      const date = new Date('2025-01-01T13:00:00.000')
      const expiresAt = new Date(date.getTime() + 15 * 60000)

      // Act
      const result = SeatReservation.create(customerUID, date)

      // Assert
      expect(result).toBeValidResultMatching<SeatReservation>((s) => {
        expect(s.customerUID.equal(customerUID)).toBe(true)
        expect(s.reservedAt.getTime()).toBe(date.getTime())
        expect(s.expiresAt).toEqual(expiresAt)
      })
    })

    it('objeto SeatReservation com tempo de expiração correto', () => {
      // Act
      const result = SeatReservation.create(customerUID)

      // Assert
      expect(result).toBeValidResultMatching<SeatReservation>((s) => {
        expect(s.expiresAt.getTime() - s.reservedAt.getTime()).toBe(15 * 60 * 1000)
      })
    })
  })

  describe('deve falhar ao criar uma reserva inválida', () => {
    const failureCases = [
      {
        scenario: 'quando o customerUID é nulo',
        customerUID: null as unknown as CustomerUID,
        code: FailureCode.MISSING_REQUIRED_DATA,
      },
      {
        scenario: 'quando o customerUID é indefinido',
        customerUID: undefined as unknown as CustomerUID,
        code: FailureCode.MISSING_REQUIRED_DATA,
      },
    ]

    failureCases.forEach(({ customerUID, scenario, code }) => {
      it(`objeto SeatReservation ${scenario}`, () => {
        // Act
        const result = SeatReservation.create(customerUID)

        // Assert
        expect(result).toBeInvalidResultWithSingleFailure(code)
      })
    })
  })
})

describe('hasExpired', () => {
  it('deve retornar false quando a reserva não expirou', () => {
    // Arrange
    const reservation = CreateTestSeatReservation(new Date(Date.now() + 10 * 60000))

    // Act
    const expired = reservation.hasExpired()

    // Assert
    expect(expired).toBe(false)
  })

  it('deve retornar true quando a reserva expirou', () => {
    // Arrange
    const reservation = CreateTestSeatReservation(new Date())
    // adiiconar sleep de 1 segundo

    // Act
    const expired = reservation.hasExpired()

    // Assert
    expect(expired).toBe(true)
  })

  it('deve retornar false quando a reserva expira exatamente agora', () => {
    // Arrange
    const reservation = CreateTestSeatReservation(new Date())

    // Act
    const expired = reservation.hasExpired()

    // Assert
    expect(expired).toBe(false)
  })

  it('deve retornar true quando a reserva expirou há muito tempo', () => {
    // Arrange
    const reservation = CreateTestSeatReservation(new Date(Date.now() - 150 * 60000))

    // Act
    const expired = reservation.hasExpired()

    // Assert
    expect(expired).toBe(true)
  })

  it('deve retornar false quando ainda falta tempo para expirar', () => {
    // Arrange
    const reservation = CreateTestSeatReservation(new Date(Date.now() + 2 + 60000))

    // Act
    const expired = reservation.hasExpired()

    // Assert
    expect(expired).toBe(false)
  })
})
