import { FailureDetails, SimpleFailure } from '../failure/simple.failure.type'
import { FailureCode } from '../failure/failure.codes.enum'
import { FailureMapper } from '../failure/failure.mapper'
import { collectNullFields } from '../validator/common.validators'
import { RichFailure } from '@/shared/failure/rich.failure.type'
import { SupportedLanguage } from '@shared/value-object/multilingual-content'

/**
 * Representa um erro técnico inesperado na aplicação.
 * Deve ser usado para situações que indicam um problema no código ou infraestrutura,
 * não erros de validação de negócio ou de input do usuário.
 * Encapsula uma `SimpleFailure` para padronização.
 */
export class TechnicalError extends Error {
  /**
   * Cria uma instância de TechnicalError.
   * @param failure O objeto SimpleFailure que descreve o erro técnico.
   */
  constructor(failure: SimpleFailure) {
    const failureMapper: FailureMapper = FailureMapper.getInstance()

    const richFailure: RichFailure = failureMapper.toRichFailure(failure, SupportedLanguage.PT)

    const detailsString: string = failure.details ? '\n' + JSON.stringify(failure.details, null, 2) : ''

    const message =
      `TechnicalError: ${richFailure.code}\n` +
      `[${richFailure.title}]\n` +
      `[${richFailure.message}]\n` +
      `[DETAILS]${detailsString}`

    super(message)
  }

  /**
   * Método estático helper para lançar um `TechnicalError` se uma condição for verdadeira.
   * Útil para verificações concisas de pré-condições ou estados inesperados.
   * @param condition Condição que, se verdadeira, dispara o lançamento do erro.
   * @param code Código de erro único que identifica a falha técnica.
   * @param details Detalhes adicionais sobre o erro (opcional). Pode incluir contexto ou variáveis relevantes.
   * @throws {TechnicalError} Se a `condition` for `true`.
   */
  public static if(condition: boolean, code: FailureCode, details?: FailureDetails): void {
    if (condition) throw new TechnicalError({ code, details })
  }

  /**
   * Valida se todos os campos obrigatórios estão presentes em um objeto.
   * Se algum campo for nulo ou indefinido, lança um erro técnico.
   *
   * @param fields Objeto com os campos a serem validados
   * @param failureCode Código de falha a ser usado (padrão: MISSING_REQUIRED_DATA)
   * @param additionalDetails Detalhes adicionais para incluir na mensagem de erro
   * @throws TechnicalError se algum campo for nulo ou indefinido
   *
   * @example
   * // Valida se todos os campos obrigatórios estão presentes
   * TechnicalError.validateRequiredFields({
   *   sizes,
   *   small: sizes?.small,
   *   normal: sizes?.normal,
   *   large: sizes?.large
   * });
   */
  public static validateRequiredFields(
    fields: Record<string, any>,
    failureCode: FailureCode = FailureCode.MISSING_REQUIRED_DATA,
    additionalDetails: Record<string, any> = {}
  ): void {
    const nullFields: string[] = collectNullFields(fields)
    if (nullFields.length === 0) return

    const str = nullFields.reduce((field) => ` ${field}`)
    this.if(nullFields.length > 0, failureCode, {
      resource: str,
      ...additionalDetails,
    })
  }
}
