import { ScreeningUID } from "../../../screening/aggregate/value-object/screening.uid";
import { failure, Result, success } from "../../../../shared/result/result";
import { SimpleFailure } from "../../../../shared/failure/simple.failure.type";
import { Validate } from "../../../../shared/validator/validate";
import { FailureCode } from "../../../../shared/failure/failure.codes.enum";
import { isNull } from "../../../../shared/validator/validator";
import { TechnicalError } from "../../../../shared/error/technical.error";

/**
 * Representa um período de tempo reservado para uma exibição de filme em uma sala de cinema.
 *
 * Este Value Object encapsula as informações essenciais de uma reserva:
 * - O identificador único da exibição (screeningUID)
 * - O horário de início (startTime)
 * - O horário de término (endTime)
 *
 * BookingSlot é imutável, garantindo a integridade dos dados durante todo o ciclo de vida.
 */
export class BookingSlot {
  private constructor(
    public readonly screeningUID: ScreeningUID,
    public readonly startTime: Date,
    public readonly endTime: Date,
  ) {}

  /**
   * Cria uma nova instância de BookingSlot com validação completa.
   *
   * @param screeningUID - O identificador único da exibição
   * @param startTime - A data e hora de início da reserva
   * @param endTime - A data e hora de término da reserva
   *
   * @returns Result<BookingSlot> - Um objeto Result contendo o BookingSlot criado ou as falhas de validação
   *
   * @validations
   * - screeningUID não pode ser nulo
   * - startTime não pode ser nulo
   * - startTime deve ser uma data futura (não pode estar no passado)
   * - endTime não pode ser nulo
   * - endTime deve ser posterior a startTime
   */
  public static create(
    screeningUID: ScreeningUID,
    startTime: Date,
    endTime: Date,
  ): Result<BookingSlot> {
    const failures: SimpleFailure[] = [];
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

    return failures.length > 0
      ? failure(failures)
      : success(new BookingSlot(screeningUID, startTime, endTime));
  }

  /**
   * Recria uma instância de BookingSlot a partir de dados existentes sem validação completa.
   *
   * @param screeningUID - String representando o identificador único da exibição
   * @param startTime - A data e hora de início da reserva
   * @param endTime - A data e hora de término da reserva
   *
   * @returns BookingSlot - Uma instância de BookingSlot
   *
   * @throws TechnicalError - Quando os dados de hidratação são inválidos
   */
  public static hydrate(
    screeningUID: string,
    startTime: Date,
    endTime: Date,
  ): BookingSlot {
    const fields = [];

    if (isNull(screeningUID)) fields.push("screeningUID");
    if (isNull(startTime)) fields.push("startTime");
    if (isNull(endTime)) fields.push("endTime");

    TechnicalError.if(fields.length > 0, FailureCode.INVALID_HYDRATE_DATA, {
      fields,
    });

    return new BookingSlot(
      ScreeningUID.hydrate(screeningUID),
      startTime,
      endTime,
    );
  }
}
