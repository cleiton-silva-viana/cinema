import { ScreeningUID } from "../../../screening/aggregate/value-object/screening.uid";
import { failure, Result, success } from "../../../../shared/result/result";
import { SimpleFailure } from "../../../../shared/failure/simple.failure.type";
import { Validate } from "../../../../shared/validator/validate";
import { FailureCode } from "../../../../shared/failure/failure.codes.enum";
import { isNull } from "../../../../shared/validator/validator";
import { TechnicalError } from "../../../../shared/error/technical.error";

/**
 * Define os tipos de agendamento possíveis.
 */
export enum BookingType {
  SCREENING = "SCREENING",
  CLEANING = "CLEANING",
  MAINTENANCE = "MAINTENANCE",
}

/**
 * Configurações de duração para cada tipo de agendamento.
 */
export const BookingDurationConfig = {
  [BookingType.SCREENING]: { min: 30, max: 360 }, // 30 min a 6 horas
  [BookingType.CLEANING]: { min: 0, max: 120 }, // Máximo de 2 horas
  [BookingType.MAINTENANCE]: { min: 0, max: 3 * 24 * 60 }, // Máximo de 3 dias (em minutos)
};

/**
 * Mapeamento de tipos de agendamento para códigos de falha de duração.
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
 * - O identificador único da atividade (screeningUID)
 * - O horário de início (startTime)
 * - O horário de término (endTime)
 * - O tipo de agendamento (type)
 *
 * BookingSlot é imutável, garantindo a integridade dos dados durante todo o ciclo de vida.
 */
export class BookingSlot {
  private constructor(
    public readonly screeningUID: ScreeningUID,
    public readonly startTime: Date,
    public readonly endTime: Date,
    public readonly type: BookingType,
  ) {}

  /**
   * Cria uma nova instância de BookingSlot com validação completa.
   *
   * @param screeningUID - O identificador único da atividade
   * @param startTime - A data e hora de início da reserva
   * @param endTime - A data e hora de término da reserva
   * @param type - O tipo de agendamento
   *
   * @returns Result<BookingSlot> - Um objeto Result contendo o BookingSlot criado ou as falhas de validação
   */
  public static create(
    screeningUID: ScreeningUID,
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

    return success(new BookingSlot(screeningUID, startTime, endTime, type));
  }

  /**
   * Recria uma instância de BookingSlot a partir de dados existentes sem validação completa.
   *
   * @param screeningUID - String representando o identificador único da atividade
   * @param startTime - A data e hora de início da reserva
   * @param endTime - A data e hora de término da reserva
   * @param type - O tipo de agendamento
   *
   * @returns BookingSlot - Uma instância de BookingSlot
   *
   * @throws TechnicalError - Quando os dados de hidratação são inválidos
   */
  public static hydrate(
    screeningUID: string,
    startTime: Date,
    endTime: Date,
    type: BookingType,
  ): BookingSlot {
    const fields = [];

    if (isNull(screeningUID)) fields.push("screeningUID");
    if (isNull(startTime)) fields.push("startTime");
    if (isNull(endTime)) fields.push("endTime");
    if (isNull(type) || !Object.values(BookingType).includes(type)) {
      fields.push("type");
    }

    TechnicalError.if(fields.length > 0, FailureCode.INVALID_HYDRATE_DATA, {
      fields,
    });

    return new BookingSlot(
      ScreeningUID.hydrate(screeningUID),
      startTime,
      endTime,
      type,
    );
  }

  /**
   * Calcula a duração do agendamento em minutos.
   */
  public get durationInMinutes(): number {
    return (this.endTime.getTime() - this.startTime.getTime()) / (1000 * 60);
  }

  /**
   * Valida os requisitos básicos para criação de um BookingSlot.
   */
  private static validateBasicRequirements(
    screeningUID: ScreeningUID,
    startTime: Date,
    endTime: Date,
    type: BookingType,
    failures: SimpleFailure[],
  ): boolean {
    const now = new Date();

    Validate.object(screeningUID)
      .field("screeningUID")
      .failures(failures)
      .isRequired();

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
      .isInEnum(BookingType, FailureCode.INVALID_BOOKING_TYPE);

    return failures.length === 0;
  }

  /**
   * Valida a duração do agendamento com base no tipo.
   */
  private static validateDuration(
    screeningUID: ScreeningUID,
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
          screeningUID: screeningUID.value,
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
}
