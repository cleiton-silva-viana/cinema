import { failure, Result, success } from '@shared/result/result'
import { ensureNotNull } from '@shared/validator/common.validators'
import { FailureFactory } from '@shared/failure/failure.factory'
import {TechnicalError} from "@shared/error/technical.error";

/** Define os possíveis estados de exibição baseados no tempo. */
export enum ScreeningStatus {
  /** Pré-venda: ainda não iniciada. */
  PRESALE = 'PRESALE',

  /** Em exibição: já iniciada, mas não finalizada. */
  SHOWING = 'SHOWING',

  /** Finalizada: tempo de término já passou. */
  ENDED = 'ENDED',
}

/**
 * Value Object que representa o período de exibição de uma sessão.
 * Encapsula as datas de início e fim, além de calcular o status temporal da sessão.
 */
export class ScreeningDisplayPeriod {
  /**
   * @param startsIn Data e hora de início da exibição
   * @param endsIn Data e hora de término da exibição
   */
  private constructor(
    public readonly startsIn: Date,
    public readonly endsIn: Date
  ) {}

  private static readonly PAST_DATE_TOLERANCE_MS = 5 * 60 * 1000
  /**
   * Cria uma nova instância de ScreeningDisplayPeriod.
   */
  public static create(startsIn: Date, endsIn: Date): Result<ScreeningDisplayPeriod> {
    const failures = ensureNotNull({ startsIn, endsIn })
    if (failures.length > 0) return failure(failures)

    if (startsIn >= endsIn)
      return failure(FailureFactory.DATE_WITH_INVALID_SEQUENCE(startsIn.toString(), endsIn.toString()))

    // Validar se a data de início não é no passado (com margem de 5 minutos)
    const now = new Date()
    const fiveMinutesAgo = new Date(now.getTime() - ScreeningDisplayPeriod.PAST_DATE_TOLERANCE_MS)
    if (startsIn < fiveMinutesAgo) return failure(FailureFactory.SCREENING_START_DATE_IN_PAST())

    return success(new ScreeningDisplayPeriod(startsIn, endsIn))
  }

  /**
   * Hidrata uma instância a partir de dados primitivos.
   */
  public static hydrate(startsIn: Date, endsIn: Date): ScreeningDisplayPeriod {
    TechnicalError.validateRequiredFields({ startsIn, endsIn })
    return new ScreeningDisplayPeriod(startsIn, endsIn)
  }

  /**
   * Retorna o status atual da exibição baseado no tempo.
   */
  get screeningStatus(): ScreeningStatus {
    const now = new Date()

    if (now < this.startsIn) return ScreeningStatus.PRESALE
    if (now >= this.startsIn && now <= this.endsIn) return ScreeningStatus.SHOWING
    return ScreeningStatus.ENDED
  }

  /**
   * Retorna a duração da exibição em minutos.
   */
  get durationInMinutes(): number {
    return Math.floor((this.endsIn.getTime() - this.startsIn.getTime()) / (1000 * 60))
  }

  /**
   * Verifica se a exibição está disponível para reservas.
   * Só permite reservas durante o período de pré-venda.
   */
  get isAvailableForBooking(): boolean {
    return this.screeningStatus === ScreeningStatus.PRESALE
  }
}
