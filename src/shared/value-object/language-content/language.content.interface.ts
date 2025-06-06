import { SupportedLanguageEnum } from '@shared/value-object/language-content/supported.language.enum'

/**
 * Interface que define a estrutura de um conteúdo em um idioma específico
 * Exemplo:
 * ```ts
 * { text: "Hello World", language: SupportedLanguageEnum.EN }
 * ```
 */
export interface ILanguageContent {
  text: string
  language: SupportedLanguageEnum
}
