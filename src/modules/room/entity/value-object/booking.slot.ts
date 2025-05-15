import { ScreeningUID } from "../../../screening/aggregate/value-object/screening.uid";
import { failure, Result, success } from "../../../../shared/result/result";
import { SimpleFailure } from "../../../../shared/failure/simple.failure.type";
import { Validate } from "../../../../shared/validator/validate";
import { FailureCode } from "../../../../shared/failure/failure.codes.enum";
import { isNull } from "../../../../shared/validator/validator";
import { TechnicalError } from "../../../../shared/error/technical.error";
import { v4 } from "uuid";

/**
 * Define os tipos de agendamento possíveis para uma sala de cinema.
 */
export enum BookingType {
  SCREENING = "SCREENING", // Exibição de filme
  CLEANING = "CLEANING", // Limpeza da sala
  MAINTENANCE = "MAINTENANCE", // Manutenção da sala
}

/**
 * Configurações de duração para cada tipo de agendamento.
 * Define os limites mínimos e máximos de duração em minutos.
 */
export const BookingDurationConfig = {
  [BookingType.SCREENING]: { min: 30, max: 360 }, // 30 min a 6 horas para exibições
  [BookingType.CLEANING]: { min: 0, max: 120 }, // Máximo de 2 horas para limpeza
  [BookingType.MAINTENANCE]: { min: 0, max: 3 * 24 * 60 }, // Máximo de 3 dias para manutenção
};

/**
 * Mapeamento de tipos de agendamento para seus respectivos códigos de falha de duração.
 */
const DurationFailureCodes = {
  [BookingType.SCREENING]: FailureCode.INVALID_SCREENING_DURATION,
  [BookingType.CLEANING]: FailureCode.INVALID_CLEANING_DURATION,
  [BookingType.MAINTENANCE]: FailureCode.INVALID_MAINTENANCE_DURATION,
};

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
    public readonly type: BookingType,
  ) {}

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
    type: BookingType,
  ): Result<BookingSlot> {
    const failures: SimpleFailure[] = [];

    if (
      !BookingSlot.validateBasicRequirements(
        screeningUID,
        startTime,
        endTime,
        type,
        failures,
      )
    )
      return failure(failures);

    if (
      !BookingSlot.validateDuration(
        screeningUID,
        startTime,
        endTime,
        type,
        failures,
      )
    )
      return failure(failures);

    return success(
      new BookingSlot(v4(), screeningUID, startTime, endTime, type),
    );
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
    type: BookingType,
  ): BookingSlot {
    const fields = [];

    if (isNull(bookingUID)) fields.push("bookingUID");
    if (isNull(startTime)) fields.push("startTime");
    if (isNull(endTime)) fields.push("endTime");
    if (isNull(type) || !Object.values(BookingType).includes(type)) {
      fields.push("type");
    }

    TechnicalError.if(fields.length > 0, FailureCode.INVALID_HYDRATE_DATA, {
      fields,
    });

    return new BookingSlot(
      bookingUID,
      screeningUID ? ScreeningUID.hydrate(screeningUID) : null,
      startTime,
      endTime,
      type,
    );
  }

  /**
   * Calcula a duração do agendamento em minutos.
   * @returns number - Duração em minutos
   */
  public get durationInMinutes(): number {
    return (this.endTime.getTime() - this.startTime.getTime()) / (1000 * 60);
  }

  /**
   * Valida os requisitos básicos para criação de um BookingSlot.
   */
  private static validateBasicRequirements(
    screeningUID: ScreeningUID | null,
    startTime: Date,
    endTime: Date,
    type: BookingType,
    failures: SimpleFailure[],
  ): boolean {
    const now = new Date();

    // Não validamos screeningUID como obrigatório, pois pode ser null para CLEANING e MAINTENANCE

    Validate.date(startTime)
      .field("startTime")
      .failures(failures)
      .isRequired()
      .isAfter(now, FailureCode.DATE_CANNOT_BE_PAST)
      .then(() => {
        Validate.date(endTime)
          .field("endTime")
          .failures(failures)
          .isRequired()
          .isAfter(startTime, FailureCode.DATE_WITH_INVALID_SEQUENCE);
      });

    Validate.string(type)
      .field("type")
      .failures(failures)
      .isRequired()
      .isInEnum(BookingType, FailureCode.INVALID_BOOKING_TYPE)
      .when(type === BookingType.SCREENING, () => {
        if (isNull(screeningUID))
          failures.push({
            code: FailureCode.MISSING_REQUIRED_DATA,
            details: {
              field: "screeningUID",
            },
          });
      });

    return failures.length === 0;
  }

  /**
   * Valida a duração do agendamento com base no tipo.
   */
  private static validateDuration(
    screeningUID: ScreeningUID | null,
    startTime: Date,
    endTime: Date,
    type: BookingType,
    failures: SimpleFailure[],
  ): boolean {
    const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
    const config = BookingDurationConfig[type];

    if (duration < config.min || duration > config.max) {
      failures.push({
        code: DurationFailureCodes[type],
        details: {
          screeningUID: screeningUID?.value,
          startTime,
          endTime,
          duration: {
            provided: duration,
            ...(config.min > 0 ? { min: config.min } : {}),
            max: config.max,
          },
        },
      });
      return false;
    }

    return true;
  }

  public equals(other: BookingSlot): boolean {
    if (isNull(other) || !(other instanceof BookingSlot)) return false;
    return other.bookingUID === this.bookingUID;
  }
}
