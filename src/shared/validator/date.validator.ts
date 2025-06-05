import { FailureFactory } from '../failure/failure.factory'
import { FailureCode } from '../failure/failure.codes.enum'
import { TechnicalError } from '../error/technical.error'
import { SimpleFailure } from '../failure/simple.failure.type'
import { AbstractValidator } from './abstract.validator'

/**
 * Validador para operações com datas.
 * Estende `AbstractValidator` para fornecer métodos de validação específicos para objetos `Date`.
 */
export class DateValidator extends AbstractValidator<DateValidator> {
  /**
   * Cria uma nova instância de `DateValidator`.
   * @param value O objeto `Record<string, Date>` contendo a data a ser validada.
   * @param failures Um array de `SimpleFailure` para acumular erros de validação.
   */
  constructor(value: Record<string, Date>, failures: SimpleFailure[]) {
    super(value, failures)
  }

  /**
   * Verifica se a data atual é posterior a uma data limite especificada.
   * @param limitDate A data limite para comparação.
   * @param failure (Opcional) Uma função que retorna um `SimpleFailure` customizado em caso de falha.
   * @returns A instância atual de `DateValidator` para encadeamento de chamadas.
   */
  public isAfter(limitDate: Date, failure?: () => SimpleFailure): DateValidator {
    TechnicalError.validateRequiredFields({ limitDate })

    const isValid = this._value instanceof Date && !isNaN(this._value.getTime())

    const date = isValid ? this._value : new Date(new Date(limitDate).setDate(limitDate.getDate() - 10000))

    return this.validate(
      () => date < limitDate,
      failure ? failure() : FailureFactory.DATE_NOT_AFTER_LIMIT(this._value, limitDate.toISOString())
    )
  }

  /**
   * Verifica se a data atual é anterior a uma data limite especificada.
   * @param limitDate A data limite para comparação.
   * @param failure (Opcional) Uma função que retorna um `SimpleFailure` customizado em caso de falha.
   * @returns A instância atual de `DateValidator` para encadeamento de chamadas.
   */
  public isBefore(limitDate: Date, failure?: () => SimpleFailure): DateValidator {
    TechnicalError.validateRequiredFields({ limitDate })

    const isValid = this._value instanceof Date && !isNaN(this._value.getTime())

    const date = isValid ? this._value : new Date(new Date(limitDate).setDate(limitDate.getDate() + 10000))

    return this.validate(
      () => date > limitDate,
      failure ? failure() : FailureFactory.DATE_NOT_BEFORE_LIMIT(this._value, limitDate.toISOString())
    )
  }

  /**
   * Verifica se a data atual está entre duas datas (inclusivo).
   * @param startDate A data de início do intervalo.
   * @param endDate A data de fim do intervalo.
   * @param failure (Opcional) Uma função que retorna um `SimpleFailure` customizado em caso de falha.
   * @returns A instância atual de `DateValidator` para encadeamento de chamadas.
   */
  public isBetween(startDate: Date, endDate: Date, failure?: () => SimpleFailure): DateValidator {
    TechnicalError.validateRequiredFields({ startDate, endDate })

    if (!this._value || !(this._value instanceof Date))
      return this.validate(() => true, FailureFactory.CONTENT_WITH_INVALID_TYPE(typeof this._value, this._field))

    if (startDate > endDate)
      return this.validate(
        () => true,
        FailureFactory.DATE_WITH_INVALID_SEQUENCE(startDate.toISOString(), endDate.toISOString())
      )

    return this.validate(
      () => {
        const time = this._value.getTime()
        return !(time >= startDate.getTime() && time <= endDate.getTime())
      },
      failure
        ? failure()
        : FailureFactory.DATE_IS_OUT_OF_RANGE(
            this._value?.toISOString() || 'N/D',
            startDate.toISOString(),
            endDate.toISOString()
          )
    )
  }
}
