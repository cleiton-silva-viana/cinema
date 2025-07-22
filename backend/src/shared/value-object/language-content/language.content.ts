import { SimpleFailure } from '../../failure/simple.failure.type'
import { failure, Result, success } from '../../result/result'
import { TechnicalError } from '../../error/technical.error'
import { FailureCode } from '../../failure/failure.codes.enum'
import { Validate } from '../../validator/validate'
import { FailureFactory } from '../../failure/failure.factory'
import { SupportedLanguageEnum } from './supported.language.enum'
import { ILanguageContentInput } from './language.content.input.interface'
import { ILanguageContent } from './language.content.interface'
import { parseToEnum } from '@shared/validator/utils/validation.helpers'

/**
 * Classe abstrata para representar conteúdo multilíngue com validações rigorosas.
 * Garante que:
 * - O conteúdo não seja vazio
 * - Os idiomas sejam válidos (suportados)
 * - Não haja idiomas duplicados
 * - Os idiomas obrigatórios estejam sempre presentes
 * - O texto siga regras de formato e tamanho
 */
export abstract class LanguageContent {
  /**
   * Configurações de validação que podem ser sobrescritas pelas classes derivadas
   */
  protected static readonly MIN_LENGTH: number = 1

  protected static readonly MAX_LENGTH: number = 500

  /**
   * Idiomas obrigatórios por padrão (ex: 'pt' e 'en')
   */
  protected static readonly REQUIRED_LANGUAGES: SupportedLanguageEnum[] = [
    SupportedLanguageEnum.PT,
    SupportedLanguageEnum.EN,
  ]

  /**
   * Expressão regular para validar o formato do texto:
   * - Permite letras (incluindo acentos), números, espaços e alguns símbolos
   * - Não permite caracteres especiais como @, #, etc.
   */
  protected static readonly FORMAT_REGEX: RegExp = /^[A-Za-zÀ-ÖØ-öø-ÿ\d\s\-._]+$/

  protected constructor(protected readonly contents: Map<SupportedLanguageEnum, string>) {}

  /**
   * Cria uma instância válida de conteúdo multilíngue com validações completas.
   * @param contents Array de objetos com texto e idioma
   * @returns Result<T> com falha nos seguintes casos:
   */
  public static create<T extends LanguageContent>(contents: ILanguageContentInput[]): Result<T> {
    const failures: SimpleFailure[] = []

    LanguageContent.validateContentArray(contents, failures)
    if (failures.length > 0) return failure(failures)

    const contentsParsed: ILanguageContent[] = []
    contents.forEach((content) => {
      const result = parseToEnum('language', content.language, SupportedLanguageEnum)
      if (result.isInvalid()) failures.push(...result.failures)
      else contentsParsed.push({ language: result.value, text: content.text })
    })
    if (failures.length > 0) return failure(failures)

    this.validateContents(contentsParsed, failures)
    if (failures.length > 0) return failure(failures)

    this.validateRequiredLanguages(contentsParsed, failures)
    if (failures.length > 0) return failure(failures)

    const contentsMap = new Map<SupportedLanguageEnum, string>()
    contentsParsed.forEach((content) => {
      contentsMap.set(content.language, content.text)
    })

    return success(new (this as any)(contentsMap))
  }

  /**
   * Cria uma nova instância de conteúdo com apenas um idioma.
   * Usado principalmente para reconstruir entidades a partir de dados persistentes.
   * @param lang Idioma do conteúdo
   * @param value Conteúdo textual
   * @returns Instância de conteúdo multilíngue
   * @throws TechnicalError se o idioma ou texto forem vazios
   * @throws TechnicalError se o idioma não for suportado
   */
  public static hydrate<T extends LanguageContent>(lang: string, value: string): T {
    TechnicalError.validateRequiredFields({ lang, value })
    const contentMap = new Map<SupportedLanguageEnum, string>()

    const langEnumResult = parseToEnum(lang, lang, SupportedLanguageEnum)
    if (langEnumResult.isInvalid()) throw new TechnicalError(FailureFactory.CONTENT_WITH_INVALID_LANGUAGE(lang))
    else contentMap.set(langEnumResult.value, value)

    return new (this as any)(contentMap)
  }

  /**
   * Obtém o conteúdo em um idioma específico
   * @param language Idioma a ser buscado
   * @returns Texto correspondente ou undefined se não existir
   */
  public content(language: SupportedLanguageEnum): string | undefined {
    return this.contents.get(language)
  }

  /**
   * Verifica se possui conteúdo em um idioma específico
   * @param language Idioma a ser verificado
   * @returns true se o idioma existir, false caso contrário
   */
  public hasLanguage(language: SupportedLanguageEnum): boolean {
    return this.contents.has(language)
  }

  /**
   * Obtém todos os idiomas disponíveis
   * @returns Array de idiomas presentes na instância atual
   */
  public languages(): SupportedLanguageEnum[] {
    return Array.from(this.contents.keys())
  }

  /**
   * Valida os inputs básicos do conteúdo
   * @param contents Array de conteúdos a ser validado
   * @param failures Array para armazenar os erros encontrados
   */
  private static validateContentArray(contents: any[], failures: SimpleFailure[]): void {
    Validate.array({ contents }, failures).isRequired().isNotEmpty()
  }

  /**
   * Valida um conteúdo individual quanto a:
   * - Não ser nulo
   * - Ter texto e idioma válidos
   * - Estar dentro do comprimento permitido (MIN_LENGTH - MAX_LENGTH)
   * - Seguir o formato permitido (expressão regular)
   * @param content Conteúdo a ser validado
   * @param failures Array para armazenar os erros encontrados
   * @returns true se válido, false se inválido
   */
  private static validateContent(content: ILanguageContent, failures: SimpleFailure[]): boolean {
    const flag = failures.length

    Validate.object({ content }, failures).isRequired().isNotEmpty().hasProperty('text').hasProperty('language')

    if (flag > failures.length) return false

    Validate.string({ text: content.text }, failures)
      .isRequired()
      .isNotEmpty()
      .hasLengthBetween(this.MIN_LENGTH, this.MAX_LENGTH)
      .matchesPattern(this.FORMAT_REGEX)

    Validate.string({ language: content.language }, failures).isRequired().isNotEmpty().isInEnum(SupportedLanguageEnum)

    return failures.length === flag
  }

  /**
   * Valida todos os conteúdos no array e verifica duplicatas de idioma.
   * @param contents Array de conteúdos a ser validado
   * @param failures Array para armazenar os erros encontrados
   */
  private static validateContents(contents: ILanguageContent[], failures: SimpleFailure[]): void {
    const seenLanguages = new Set<SupportedLanguageEnum>()

    for (const content of contents) {
      const isInvalid = !this.validateContent(content, failures)
      if (isInvalid) continue

      if (seenLanguages.has(content.language)) {
        failures.push({
          code: FailureCode.TEXT_DUPLICATED_FOR_LANGUAGE,
          details: { language: content.language },
        })
        continue
      }

      seenLanguages.add(content.language)
    }
  }

  /**
   * Valida se todos os idiomas obrigatórios estão presentes.
   * Por padrão, exige: 'pt' e 'en'
   * @param contents Array de conteúdos a ser validado
   * @param failures Array para armazenar os erros encontrados
   */
  private static validateRequiredLanguages(contents: ILanguageContent[], failures: SimpleFailure[]): void {
    const languages = new Set(contents.map((content) => content.language))

    for (const requiredLang of this.REQUIRED_LANGUAGES) {
      if (!languages.has(requiredLang)) failures.push(FailureFactory.TEXT_LANGUAGE_REQUIRED(requiredLang))
    }
  }
}
