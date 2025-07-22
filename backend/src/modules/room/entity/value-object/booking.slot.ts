import { v4 } from 'uuid'
import { ScreeningUID } from '../../../screening/aggregate/value-object/screening.uid'
import { failure, Result, success } from '@shared/result/result'
import { SimpleFailure } from '@shared/failure/simple.failure.type'
import { Validate } from '@shared/validator/validate'
import { TechnicalError } from '@shared/error/technical.error'
import { FailureFactory } from '@shared/failure/failure.factory'
import { isNullOrUndefined } from '@shared/validator/utils/validation'

/**
 * Define os tipos de agendamento possíveis para uma sala de cinema.
 */
export enum BookingType {
  SCREENING = 'SCREENING',
  CLEANING = 'CLEANING',
  MAINTENANCE = 'MAINTENANCE',
  EXIT_TIME = 'EXIT_TIME',
  ENTRY_TIME = 'ENTRY_TIME',
}

/**
 * Configurações de duração para cada tipo de agendamento.
 * Define os limites mínimos e máximos de duração em minutos.
 */
export const BookingDurationConfig = {
  [BookingType.SCREENING]: { min: 30, max: 360 }, // 30 min a 6 horas para exibições
  [BookingType.CLEANING]: { min: 20, max: 120 }, // Máximo de 2 horas para limpeza
  [BookingType.MAINTENANCE]: { min: 0, max: 3 * 24 * 60 }, // Máximo de 3 dias para manutenção
  [BookingType.EXIT_TIME]: { min: 15, max: 30 }, // Máximo de 30 minutos para saída dos clientes
  [BookingType.ENTRY_TIME]: { min: 15, max: 20 }, // Máximo de 20 minutos para saída dos clientes
}

/**
 * Representa um período de tempo reservado para uma atividade em uma sala de cinema.
 *
 * Este Value Object encapsula as informações essenciais de uma reserva:
 * - bookingUID: Identificador único do agendamento (UUID v4)
 * - screeningUID: Identificador único da exibição (apenas para agendamentos do tipo SCREENING)
 * - startTime: Data e hora de início do agendamento
 * - endTime: Data e hora de término do agendamento
 * - type: Tipo do agendamento (SCREENING, CLEANING ou MAINTENANCE)
 *
 * Características:
 * - Imutável: Todas as propriedades são readonly
 * - Auto-validado: Possui regras de validação para cada tipo de agendamento
 * - Identificável: Cada agendamento possui um UUID único
 */
export class BookingSlot {
  private constructor(
    public readonly bookingUID: string,
    public readonly screeningUID: ScreeningUID | null,
    public readonly startTime: Date,
    public readonly endTime: Date,
    public readonly type: BookingType
  ) {}

  /**
   * Calcula a duração do agendamento em minutos.
   * @returns number - Duração em minutos
   */
  public get durationInMinutes(): number {
    return (this.endTime.getTime() - this.startTime.getTime()) / (1000 * 60)
  }

  /**
   * Cria uma nova instância de BookingSlot com validação completa.
   *
   * @param screeningUID - O identificador único da exibição (obrigatório apenas para type=SCREENING)
   * @param startTime - A data e hora de início do agendamento
   * @param endTime - A data e hora de término do agendamento
   * @param type - O tipo de agendamento (SCREENING, CLEANING ou MAINTENANCE)
   *
   * @returns Result<BookingSlot> - Sucesso: nova instância de BookingSlot
   *                                Falha: lista de falhas de validação
   */
  public static create(
    screeningUID: ScreeningUID | null,
    startTime: Date,
    endTime: Date,
    type: BookingType
  ): Result<BookingSlot> {
    const failures: SimpleFailure[] = []

    if (!BookingSlot.validateBasicRequirements(screeningUID, startTime, endTime, type, failures))
      return failure(failures)

    if (!BookingSlot.validateDuration(startTime, endTime, type, failures)) return failure(failures)

    return success(new BookingSlot(v4(), screeningUID, startTime, endTime, type))
  }

  /**
   * Recria uma instância de BookingSlot a partir de dados existentes.
   * Usado principalmente para hidratação de dados do banco de dados.
   *
   * @param bookingUID - Identificador único do agendamento (UUID v4)
   * @param screeningUID - String do identificador único da exibição (pode ser null)
   * @param startTime - A data e hora de início do agendamento
   * @param endTime - A data e hora de término do agendamento
   * @param type - O tipo de agendamento
   *
   * @returns BookingSlot - Nova instância de BookingSlot
   * @throws TechnicalError - Quando os dados de hidratação são inválidos
   */
  public static hydrate(
    bookingUID: string,
    screeningUID: string | null,
    startTime: Date,
    endTime: Date,
    type: BookingType
  ): BookingSlot {
    TechnicalError.validateRequiredFields({ bookingUID, startTime, endTime, type })

    return new BookingSlot(
      bookingUID,
      screeningUID ? ScreeningUID.hydrate(screeningUID) : null,
      startTime,
      endTime,
      type
    )
  }

  /**
   * Valida os requisitos básicos para criação de um BookingSlot.
   */
  private static validateBasicRequirements(
    screeningUID: ScreeningUID | null,
    startTime: Date,
    endTime: Date,
    type: BookingType,
    failures: SimpleFailure[]
  ): boolean {
    const now = new Date()

    Validate.date({ startTime }, failures)
      .isRequired()
      .isAfter(now, () => FailureFactory.DATE_CANNOT_BE_PAST('startTime'))
      .then(() => {
        Validate.date({ endTime }, failures)
          .isRequired()
          .isAfter(startTime, () =>
            FailureFactory.DATE_WITH_INVALID_SEQUENCE(startTime.toISOString(), endTime?.toISOString() || 'N/D')
          )
      })

    Validate.string({ type }, failures)
      .isRequired()
      .isInEnum(BookingType)
      .when(type === BookingType.SCREENING || type === BookingType.EXIT_TIME || type === BookingType.ENTRY_TIME, () => {
        if (isNullOrUndefined(screeningUID)) failures.push(FailureFactory.MISSING_REQUIRED_DATA('screening'))
      })

    return failures.length === 0
  }

  /**
   * Valida a duração do agendamento com base no tipo.
   */
  private static validateDuration(
    startTime: Date,
    endTime: Date,
    type: BookingType,
    failures: SimpleFailure[]
  ): boolean {
    const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60)
    const { min, max } = BookingDurationConfig[type]

    if (duration < min || duration > max) {
      failures.push(FailureFactory.INVALID_OPERATION_DURATION(duration, min, max))
      return false
    }

    return true
  }

  public equals(other: BookingSlot): boolean {
    if (isNullOrUndefined(other)) return false
    if (!(other instanceof BookingSlot)) return false
    return other.bookingUID === this.bookingUID
  }
}
