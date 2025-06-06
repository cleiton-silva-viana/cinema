import { SimpleFailure } from '../failure/simple.failure.type'
import { FailureCode } from '../failure/failure.codes.enum'
import { FailureMapper } from '../failure/failure.mapper'
import { RichFailure } from '../failure/rich.failure.type'
import { SupportedLanguageEnum } from '@shared/value-object/language-content/supported.language.enum'

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

    const richFailure: RichFailure = failureMapper.toRichFailure(failure, SupportedLanguageEnum.PT)

    const detailsString: string = failure.details ? '\n' + JSON.stringify(failure.details, null, 2) : ''

    const message = `${richFailure.code}: ${richFailure.title}${detailsString ? ` | ${JSON.stringify(failure.details)}` : ''}`

    super(message)
  }

  /**
   * Método estático helper para lançar um `TechnicalError` se uma condição for verdadeira.
   * Útil para verificações concisas de pré-condições ou estados inesperados.
   * @param condition Condição que, se verdadeira, dispara o lançamento do erro.
   * @param failure Função que retorna um `SimpleFailure`. Esta função será executada
   *                apenas se a `condition` for verdadeira, para criar o erro.
   * @throws {TechnicalError} Se a `condition` for `true`.
   *
   * @example
   * // Exemplo de uso correto:
   * TechnicalError.if(someCondition, () => FailureFactory.SOME_ERROR('detalhes'))
   */
  public static if(condition: boolean, failure: () => SimpleFailure): void {
    if (condition) throw new TechnicalError(failure())
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
    const nullFields: string[] = []

    for (const field in fields) {
      if (fields[field] === null || fields[field] === undefined) {
        nullFields.push(field)
      }
    }

    if (nullFields.length === 0) return

    throw new TechnicalError({
      code: failureCode || FailureCode.MISSING_REQUIRED_DATA,
      details: {
        resource: nullFields,
        ...additionalDetails,
      },
    })
  }
}
